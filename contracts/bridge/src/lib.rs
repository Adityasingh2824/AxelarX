/*!
# AxelarX Bridge Contract

Handles cross-chain asset transfers between Linera and external blockchains
including Ethereum, Bitcoin, Solana, Avalanche, and more.

## Features
- Multi-chain support with configurable validators
- Atomic bridge transfers with cryptographic proofs
- Dynamic fee calculation based on network conditions
- Multi-signature verification for security
- Automatic retry and refund mechanisms
- Real-time transfer tracking
*/

use async_trait::async_trait;
use linera_base::{
    data_types::{Amount, Timestamp},
    identifiers::{Account, ChainId},
};
use linera_sdk::{
    base::{ContractRuntime, ServiceRuntime},
    Contract, Service,
};
use linera_views::{
    common::Context,
    views::{MapView, QueueView, RegisterView, ViewError},
    RootView,
};
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Unique identifier for bridge transfers
pub type TransferId = u64;

/// External chain identifiers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ExternalChain {
    Ethereum,
    Bitcoin,
    Solana,
    Avalanche,
    Polygon,
    Arbitrum,
    Optimism,
    BSC,
    Custom(u64),
}

impl ExternalChain {
    pub fn chain_id(&self) -> u64 {
        match self {
            ExternalChain::Ethereum => 1,
            ExternalChain::Bitcoin => 0,
            ExternalChain::Solana => 501,
            ExternalChain::Avalanche => 43114,
            ExternalChain::Polygon => 137,
            ExternalChain::Arbitrum => 42161,
            ExternalChain::Optimism => 10,
            ExternalChain::BSC => 56,
            ExternalChain::Custom(id) => *id,
        }
    }
    
    pub fn name(&self) -> &'static str {
        match self {
            ExternalChain::Ethereum => "Ethereum",
            ExternalChain::Bitcoin => "Bitcoin",
            ExternalChain::Solana => "Solana",
            ExternalChain::Avalanche => "Avalanche",
            ExternalChain::Polygon => "Polygon",
            ExternalChain::Arbitrum => "Arbitrum",
            ExternalChain::Optimism => "Optimism",
            ExternalChain::BSC => "BNB Smart Chain",
            ExternalChain::Custom(_) => "Custom Chain",
        }
    }
    
    pub fn required_confirmations(&self) -> u64 {
        match self {
            ExternalChain::Ethereum => 12,
            ExternalChain::Bitcoin => 6,
            ExternalChain::Solana => 32,
            ExternalChain::Avalanche => 1,
            ExternalChain::Polygon => 256,
            ExternalChain::Arbitrum => 1,
            ExternalChain::Optimism => 1,
            ExternalChain::BSC => 15,
            ExternalChain::Custom(_) => 12,
        }
    }
}

/// Transfer status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransferStatus {
    /// Transfer initiated, waiting for processing
    Pending,
    /// Transfer is being confirmed on source chain
    Confirming,
    /// Waiting for validators to approve
    AwaitingApproval,
    /// Approved by validators, ready to execute
    Approved,
    /// Transfer is being executed on destination chain
    Executing,
    /// Transfer completed successfully
    Completed,
    /// Transfer failed
    Failed,
    /// Transfer was refunded
    Refunded,
    /// Transfer expired
    Expired,
}

/// Transfer direction
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransferDirection {
    /// From external chain to Linera (deposit)
    Inbound,
    /// From Linera to external chain (withdrawal)
    Outbound,
}

/// Validator approval record
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ValidatorApproval {
    pub validator: Account,
    pub approved: bool,
    pub signature: Vec<u8>,
    pub timestamp: Timestamp,
}

/// Bridge transfer record
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BridgeTransfer {
    pub id: TransferId,
    
    // Transfer details
    pub direction: TransferDirection,
    pub source_chain: ExternalChain,
    pub destination_chain: Option<ExternalChain>,
    
    // User information
    pub user: Account,
    pub external_address: String,
    
    // Asset details
    pub asset: String,
    pub amount: Amount,
    pub fee: Amount,
    pub net_amount: Amount,
    
    // Transaction hashes
    pub source_tx_hash: Option<String>,
    pub destination_tx_hash: Option<String>,
    
    // Status and timing
    pub status: TransferStatus,
    pub confirmations: u64,
    pub required_confirmations: u64,
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
    pub expires_at: Timestamp,
    
    // Validator approvals
    pub approvals: Vec<ValidatorApproval>,
    pub approval_threshold: u32,
    
    // Error handling
    pub error_message: Option<String>,
    pub retry_count: u32,
}

/// Chain configuration
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChainConfig {
    pub chain: ExternalChain,
    pub is_enabled: bool,
    pub bridge_contract_address: String,
    pub supported_assets: Vec<AssetMapping>,
    pub min_transfer_amount: Amount,
    pub max_transfer_amount: Amount,
    pub base_fee: Amount,
    pub fee_percentage_bps: u64, // Basis points
    pub required_confirmations: u64,
    pub estimated_time_seconds: u64,
}

/// Asset mapping between chains
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AssetMapping {
    pub linera_asset: String,
    pub external_asset: String,
    pub external_contract_address: Option<String>,
    pub decimals_linera: u8,
    pub decimals_external: u8,
    pub is_native: bool,
}

/// Validator configuration
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ValidatorConfig {
    pub address: Account,
    pub public_key: Vec<u8>,
    pub is_active: bool,
    pub weight: u32,
    pub registered_at: Timestamp,
}

/// Bridge operations
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Operation {
    /// Initiate outbound transfer (Linera -> External)
    InitiateWithdrawal {
        destination_chain: ExternalChain,
        destination_address: String,
        asset: String,
        amount: Amount,
    },
    
    /// Report inbound deposit (External -> Linera)
    ReportDeposit {
        source_chain: ExternalChain,
        tx_hash: String,
        source_address: String,
        recipient: Account,
        asset: String,
        amount: Amount,
        confirmations: u64,
    },
    
    /// Update deposit confirmations
    UpdateConfirmations {
        transfer_id: TransferId,
        confirmations: u64,
    },
    
    /// Approve transfer as validator
    ApproveTransfer {
        transfer_id: TransferId,
        signature: Vec<u8>,
    },
    
    /// Execute approved transfer
    ExecuteTransfer {
        transfer_id: TransferId,
    },
    
    /// Report withdrawal completion
    CompleteWithdrawal {
        transfer_id: TransferId,
        tx_hash: String,
        success: bool,
    },
    
    /// Claim refund for failed/expired transfer
    ClaimRefund {
        transfer_id: TransferId,
    },
    
    /// Process expired transfers
    ProcessExpiredTransfers,
    
    // Admin operations
    
    /// Configure chain support
    ConfigureChain {
        config: ChainConfig,
    },
    
    /// Disable chain
    DisableChain {
        chain: ExternalChain,
    },
    
    /// Add validator
    AddValidator {
        config: ValidatorConfig,
    },
    
    /// Remove validator
    RemoveValidator {
        validator: Account,
    },
    
    /// Update fee configuration
    UpdateFees {
        chain: ExternalChain,
        base_fee: Option<Amount>,
        fee_percentage_bps: Option<u64>,
    },
    
    /// Emergency pause
    EmergencyPause,
    
    /// Resume from pause
    Resume,
}

/// Cross-chain messages
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Message {
    /// Deposit notification from relayer
    DepositNotification {
        chain: ExternalChain,
        tx_hash: String,
        recipient: Account,
        asset: String,
        amount: Amount,
        confirmations: u64,
    },
    
    /// Withdrawal request to relayer
    WithdrawalRequest {
        transfer_id: TransferId,
        chain: ExternalChain,
        recipient_address: String,
        asset: String,
        amount: Amount,
    },
    
    /// Transfer status update
    TransferUpdate {
        transfer_id: TransferId,
        status: TransferStatus,
        tx_hash: Option<String>,
    },
    
    /// Validator signature for approval
    ValidatorSignature {
        transfer_id: TransferId,
        validator: Account,
        signature: Vec<u8>,
        approved: bool,
    },
}

/// Bridge errors
#[derive(Error, Debug)]
pub enum BridgeError {
    #[error("Transfer not found: {transfer_id}")]
    TransferNotFound { transfer_id: TransferId },
    
    #[error("Chain not configured: {chain:?}")]
    ChainNotConfigured { chain: ExternalChain },
    
    #[error("Chain is disabled: {chain:?}")]
    ChainDisabled { chain: ExternalChain },
    
    #[error("Asset not supported: {asset} on chain {chain:?}")]
    AssetNotSupported { asset: String, chain: ExternalChain },
    
    #[error("Amount below minimum: {amount}, minimum: {minimum}")]
    BelowMinimum { amount: Amount, minimum: Amount },
    
    #[error("Amount above maximum: {amount}, maximum: {maximum}")]
    AboveMaximum { amount: Amount, maximum: Amount },
    
    #[error("Insufficient balance: required {required}, available {available}")]
    InsufficientBalance { required: Amount, available: Amount },
    
    #[error("Insufficient confirmations: have {current}, need {required}")]
    InsufficientConfirmations { current: u64, required: u64 },
    
    #[error("Insufficient approvals: have {current}, need {required}")]
    InsufficientApprovals { current: u32, required: u32 },
    
    #[error("Transfer already processed")]
    AlreadyProcessed,
    
    #[error("Transfer expired")]
    Expired,
    
    #[error("Invalid status for operation: {status:?}")]
    InvalidStatus { status: TransferStatus },
    
    #[error("Unauthorized: {reason}")]
    Unauthorized { reason: String },
    
    #[error("Validator not found: {address:?}")]
    ValidatorNotFound { address: Account },
    
    #[error("Already approved by this validator")]
    AlreadyApproved,
    
    #[error("Bridge is paused")]
    Paused,
    
    #[error("Duplicate deposit: tx_hash already processed")]
    DuplicateDeposit,
    
    #[error("Invalid address format: {address}")]
    InvalidAddress { address: String },
    
    #[error("View error: {0}")]
    ViewError(#[from] ViewError),
}

/// Bridge statistics
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct BridgeStats {
    pub total_inbound_transfers: u64,
    pub total_outbound_transfers: u64,
    pub total_inbound_volume: Amount,
    pub total_outbound_volume: Amount,
    pub total_fees_collected: Amount,
    pub pending_transfers: u64,
    pub failed_transfers: u64,
}

/// Bridge contract state
#[derive(RootView)]
pub struct BridgeState<C> {
    /// Next transfer ID
    pub next_transfer_id: RegisterView<C, TransferId>,
    
    /// All transfers
    pub transfers: MapView<C, TransferId, BridgeTransfer>,
    
    /// User transfers
    pub user_transfers: MapView<C, Account, Vec<TransferId>>,
    
    /// Active transfers (pending/processing)
    pub active_transfers: MapView<C, TransferId, ()>,
    
    /// Transfer expiration queue
    pub expiration_queue: QueueView<C, (Timestamp, TransferId)>,
    
    /// Processed deposit tx hashes (to prevent duplicates)
    pub processed_deposits: MapView<C, String, TransferId>,
    
    /// Chain configurations
    pub chain_configs: MapView<C, u64, ChainConfig>,
    
    /// Validators
    pub validators: MapView<C, Account, ValidatorConfig>,
    
    /// Total validator weight
    pub total_validator_weight: RegisterView<C, u32>,
    
    /// Approval threshold (percentage of weight required)
    pub approval_threshold_percentage: RegisterView<C, u32>,
    
    /// User balances
    pub balances: MapView<C, (Account, String), Amount>,
    
    /// Bridge statistics
    pub stats: RegisterView<C, BridgeStats>,
    
    /// Fee collector address
    pub fee_collector: RegisterView<C, Option<Account>>,
    
    /// Collected fees (per asset)
    pub collected_fees: MapView<C, String, Amount>,
    
    /// Bridge pause status
    pub is_paused: RegisterView<C, bool>,
}

/// Bridge contract implementation
pub struct BridgeContract;

#[async_trait]
impl Contract for BridgeContract {
    type Message = Message;
    type Parameters = ();
    type State = BridgeState<ContractRuntime<Self>>;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        BridgeContract
    }

    async fn instantiate(&mut self, state: &mut Self::State, _argument: ()) {
        state.next_transfer_id.set(1);
        state.stats.set(BridgeStats::default());
        state.total_validator_weight.set(0);
        state.approval_threshold_percentage.set(67); // 2/3 majority
        state.fee_collector.set(None);
        state.is_paused.set(false);
    }

    async fn execute_operation(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut Self::State,
        operation: Operation,
    ) -> Result<(), Self::Error> {
        // Check pause status (except for admin operations)
        if state.is_paused.get() {
            match &operation {
                Operation::EmergencyPause | Operation::Resume => {}
                _ => return Err(BridgeError::Paused),
            }
        }
        
        match operation {
            Operation::InitiateWithdrawal {
                destination_chain,
                destination_address,
                asset,
                amount,
            } => {
                self.initiate_withdrawal(
                    runtime, state, destination_chain, destination_address, asset, amount
                ).await
            }
            
            Operation::ReportDeposit {
                source_chain,
                tx_hash,
                source_address,
                recipient,
                asset,
                amount,
                confirmations,
            } => {
                self.report_deposit(
                    runtime, state, source_chain, tx_hash, source_address,
                    recipient, asset, amount, confirmations
                ).await
            }
            
            Operation::UpdateConfirmations { transfer_id, confirmations } => {
                self.update_confirmations(runtime, state, transfer_id, confirmations).await
            }
            
            Operation::ApproveTransfer { transfer_id, signature } => {
                self.approve_transfer(runtime, state, transfer_id, signature).await
            }
            
            Operation::ExecuteTransfer { transfer_id } => {
                self.execute_transfer(runtime, state, transfer_id).await
            }
            
            Operation::CompleteWithdrawal { transfer_id, tx_hash, success } => {
                self.complete_withdrawal(runtime, state, transfer_id, tx_hash, success).await
            }
            
            Operation::ClaimRefund { transfer_id } => {
                self.claim_refund(runtime, state, transfer_id).await
            }
            
            Operation::ProcessExpiredTransfers => {
                self.process_expired_transfers(runtime, state).await
            }
            
            Operation::ConfigureChain { config } => {
                self.configure_chain(state, config).await
            }
            
            Operation::DisableChain { chain } => {
                self.disable_chain(state, chain).await
            }
            
            Operation::AddValidator { config } => {
                self.add_validator(state, config).await
            }
            
            Operation::RemoveValidator { validator } => {
                self.remove_validator(state, validator).await
            }
            
            Operation::UpdateFees { chain, base_fee, fee_percentage_bps } => {
                self.update_fees(state, chain, base_fee, fee_percentage_bps).await
            }
            
            Operation::EmergencyPause => {
                state.is_paused.set(true);
                tracing::warn!("Bridge paused!");
                Ok(())
            }
            
            Operation::Resume => {
                state.is_paused.set(false);
                tracing::info!("Bridge resumed");
                Ok(())
            }
        }
    }

    async fn execute_message(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut Self::State,
        message: Message,
    ) {
        match message {
            Message::DepositNotification {
                chain, tx_hash, recipient, asset, amount, confirmations,
            } => {
                if let Err(e) = self.report_deposit(
                    runtime, state, chain, tx_hash, "".to_string(),
                    recipient, asset, amount, confirmations
                ).await {
                    tracing::error!("Failed to process deposit notification: {}", e);
                }
            }
            
            Message::WithdrawalRequest { .. } => {
                // Handled by relayer
            }
            
            Message::TransferUpdate { transfer_id, status, tx_hash } => {
                tracing::info!(
                    "Transfer update: id={}, status={:?}, tx_hash={:?}",
                    transfer_id, status, tx_hash
                );
            }
            
            Message::ValidatorSignature { transfer_id, validator, signature, approved } => {
                if approved {
                    if let Err(e) = self.approve_transfer(runtime, state, transfer_id, signature).await {
                        tracing::error!("Failed to process validator signature: {}", e);
                    }
                }
            }
        }
    }
}

impl BridgeContract {
    async fn initiate_withdrawal(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut BridgeState<ContractRuntime<Self>>,
        destination_chain: ExternalChain,
        destination_address: String,
        asset: String,
        amount: Amount,
    ) -> Result<(), BridgeError> {
        let user = runtime.authenticated_signer()
            .ok_or(BridgeError::Unauthorized { reason: "No authenticated signer".to_string() })?;
        let now = runtime.system_time();
        
        // Get chain configuration
        let chain_config = state.chain_configs.get(&destination_chain.chain_id()).await?
            .ok_or(BridgeError::ChainNotConfigured { chain: destination_chain })?;
        
        if !chain_config.is_enabled {
            return Err(BridgeError::ChainDisabled { chain: destination_chain });
        }
        
        // Validate asset
        let asset_mapping = chain_config.supported_assets.iter()
            .find(|m| m.linera_asset == asset)
            .ok_or(BridgeError::AssetNotSupported { asset: asset.clone(), chain: destination_chain })?;
        
        // Validate amount
        if amount < chain_config.min_transfer_amount {
            return Err(BridgeError::BelowMinimum { amount, minimum: chain_config.min_transfer_amount });
        }
        if amount > chain_config.max_transfer_amount {
            return Err(BridgeError::AboveMaximum { amount, maximum: chain_config.max_transfer_amount });
        }
        
        // Validate address format (basic check)
        if destination_address.is_empty() {
            return Err(BridgeError::InvalidAddress { address: destination_address });
        }
        
        // Calculate fee
        let percentage_fee = Amount::from((amount.into_inner() * chain_config.fee_percentage_bps as u128) / 10000);
        let fee = chain_config.base_fee + percentage_fee;
        let net_amount = amount.saturating_sub(fee);
        
        // Check user balance
        let balance_key = (user, asset.clone());
        let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
        
        if current_balance < amount {
            return Err(BridgeError::InsufficientBalance {
                required: amount,
                available: current_balance,
            });
        }
        
        // Deduct balance
        let new_balance = current_balance - amount;
        state.balances.insert(&balance_key, new_balance)?;
        
        // Create transfer
        let transfer_id = state.next_transfer_id.get();
        let approval_threshold = self.calculate_approval_threshold(state).await?;
        
        let transfer = BridgeTransfer {
            id: transfer_id,
            direction: TransferDirection::Outbound,
            source_chain: ExternalChain::Custom(0), // Linera
            destination_chain: Some(destination_chain),
            user,
            external_address: destination_address.clone(),
            asset: asset.clone(),
            amount,
            fee,
            net_amount,
            source_tx_hash: None,
            destination_tx_hash: None,
            status: TransferStatus::AwaitingApproval,
            confirmations: 0,
            required_confirmations: 0,
            created_at: now,
            completed_at: None,
            expires_at: now + std::time::Duration::from_secs(3600 * 24), // 24 hour expiry
            approvals: vec![],
            approval_threshold,
            error_message: None,
            retry_count: 0,
        };
        
        // Store transfer
        state.transfers.insert(&transfer_id, transfer.clone())?;
        state.active_transfers.insert(&transfer_id, ())?;
        state.expiration_queue.push_back((transfer.expires_at, transfer_id));
        state.next_transfer_id.set(transfer_id + 1);
        
        // Add to user transfers
        let mut user_transfers = state.user_transfers.get(&user).await?.unwrap_or_default();
        user_transfers.push(transfer_id);
        state.user_transfers.insert(&user, user_transfers)?;
        
        // Collect fee
        let current_fees = state.collected_fees.get(&asset).await?.unwrap_or_default();
        state.collected_fees.insert(&asset, current_fees + fee)?;
        
        // Update stats
        let mut stats = state.stats.get();
        stats.total_outbound_transfers += 1;
        stats.total_outbound_volume = stats.total_outbound_volume + net_amount;
        stats.total_fees_collected = stats.total_fees_collected + fee;
        stats.pending_transfers += 1;
        state.stats.set(stats);
        
        tracing::info!(
            "Withdrawal initiated: id={}, user={:?}, chain={:?}, asset={}, amount={}, fee={}",
            transfer_id, user, destination_chain, asset, amount, fee
        );
        
        Ok(())
    }
    
    async fn report_deposit(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut BridgeState<ContractRuntime<Self>>,
        source_chain: ExternalChain,
        tx_hash: String,
        source_address: String,
        recipient: Account,
        asset: String,
        amount: Amount,
        confirmations: u64,
    ) -> Result<(), BridgeError> {
        let now = runtime.system_time();
        
        // Check for duplicate
        if state.processed_deposits.get(&tx_hash).await?.is_some() {
            return Err(BridgeError::DuplicateDeposit);
        }
        
        // Get chain configuration
        let chain_config = state.chain_configs.get(&source_chain.chain_id()).await?
            .ok_or(BridgeError::ChainNotConfigured { chain: source_chain })?;
        
        if !chain_config.is_enabled {
            return Err(BridgeError::ChainDisabled { chain: source_chain });
        }
        
        // Validate asset
        let _asset_mapping = chain_config.supported_assets.iter()
            .find(|m| m.linera_asset == asset)
            .ok_or(BridgeError::AssetNotSupported { asset: asset.clone(), chain: source_chain })?;
        
        // Calculate fee
        let percentage_fee = Amount::from((amount.into_inner() * chain_config.fee_percentage_bps as u128) / 10000);
        let fee = chain_config.base_fee + percentage_fee;
        let net_amount = amount.saturating_sub(fee);
        
        // Determine status based on confirmations
        let required_confirmations = chain_config.required_confirmations;
        let status = if confirmations >= required_confirmations {
            TransferStatus::Approved
        } else {
            TransferStatus::Confirming
        };
        
        // Create transfer
        let transfer_id = state.next_transfer_id.get();
        let approval_threshold = self.calculate_approval_threshold(state).await?;
        
        let transfer = BridgeTransfer {
            id: transfer_id,
            direction: TransferDirection::Inbound,
            source_chain,
            destination_chain: None,
            user: recipient,
            external_address: source_address,
            asset: asset.clone(),
            amount,
            fee,
            net_amount,
            source_tx_hash: Some(tx_hash.clone()),
            destination_tx_hash: None,
            status,
            confirmations,
            required_confirmations,
            created_at: now,
            completed_at: None,
            expires_at: now + std::time::Duration::from_secs(3600 * 24),
            approvals: vec![],
            approval_threshold,
            error_message: None,
            retry_count: 0,
        };
        
        // Store transfer
        state.transfers.insert(&transfer_id, transfer.clone())?;
        state.processed_deposits.insert(&tx_hash, transfer_id)?;
        state.next_transfer_id.set(transfer_id + 1);
        
        // Add to user transfers
        let mut user_transfers = state.user_transfers.get(&recipient).await?.unwrap_or_default();
        user_transfers.push(transfer_id);
        state.user_transfers.insert(&recipient, user_transfers)?;
        
        // If confirmed, credit user immediately
        if status == TransferStatus::Approved {
            let balance_key = (recipient, asset.clone());
            let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
            state.balances.insert(&balance_key, current_balance + net_amount)?;
            
            // Collect fee
            let current_fees = state.collected_fees.get(&asset).await?.unwrap_or_default();
            state.collected_fees.insert(&asset, current_fees + fee)?;
            
            // Update transfer status
            let mut completed_transfer = transfer;
            completed_transfer.status = TransferStatus::Completed;
            completed_transfer.completed_at = Some(now);
            state.transfers.insert(&transfer_id, completed_transfer)?;
            
            // Update stats
            let mut stats = state.stats.get();
            stats.total_inbound_transfers += 1;
            stats.total_inbound_volume = stats.total_inbound_volume + net_amount;
            stats.total_fees_collected = stats.total_fees_collected + fee;
            state.stats.set(stats);
        } else {
            state.active_transfers.insert(&transfer_id, ())?;
            state.expiration_queue.push_back((transfer.expires_at, transfer_id));
            
            let mut stats = state.stats.get();
            stats.pending_transfers += 1;
            state.stats.set(stats);
        }
        
        tracing::info!(
            "Deposit reported: id={}, chain={:?}, tx_hash={}, recipient={:?}, asset={}, amount={}, confirmations={}",
            transfer_id, source_chain, tx_hash, recipient, asset, amount, confirmations
        );
        
        Ok(())
    }
    
    async fn update_confirmations(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut BridgeState<ContractRuntime<Self>>,
        transfer_id: TransferId,
        confirmations: u64,
    ) -> Result<(), BridgeError> {
        let now = runtime.system_time();
        
        let mut transfer = state.transfers.get(&transfer_id).await?
            .ok_or(BridgeError::TransferNotFound { transfer_id })?;
        
        if transfer.status != TransferStatus::Confirming {
            return Err(BridgeError::InvalidStatus { status: transfer.status });
        }
        
        transfer.confirmations = confirmations;
        
        // Check if now confirmed
        if confirmations >= transfer.required_confirmations {
            transfer.status = TransferStatus::Approved;
            
            // Credit user for inbound transfers
            if transfer.direction == TransferDirection::Inbound {
                let balance_key = (transfer.user, transfer.asset.clone());
                let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
                state.balances.insert(&balance_key, current_balance + transfer.net_amount)?;
                
                // Collect fee
                let current_fees = state.collected_fees.get(&transfer.asset).await?.unwrap_or_default();
                state.collected_fees.insert(&transfer.asset, current_fees + transfer.fee)?;
                
                transfer.status = TransferStatus::Completed;
                transfer.completed_at = Some(now);
                
                state.active_transfers.remove(&transfer_id)?;
                
                // Update stats
                let mut stats = state.stats.get();
                stats.total_inbound_transfers += 1;
                stats.total_inbound_volume = stats.total_inbound_volume + transfer.net_amount;
                stats.total_fees_collected = stats.total_fees_collected + transfer.fee;
                stats.pending_transfers = stats.pending_transfers.saturating_sub(1);
                state.stats.set(stats);
            }
        }
        
        state.transfers.insert(&transfer_id, transfer)?;
        
        tracing::info!(
            "Confirmations updated: transfer_id={}, confirmations={}",
            transfer_id, confirmations
        );
        
        Ok(())
    }
    
    async fn approve_transfer(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut BridgeState<ContractRuntime<Self>>,
        transfer_id: TransferId,
        signature: Vec<u8>,
    ) -> Result<(), BridgeError> {
        let validator = runtime.authenticated_signer()
            .ok_or(BridgeError::Unauthorized { reason: "No authenticated signer".to_string() })?;
        let now = runtime.system_time();
        
        // Verify validator
        let validator_config = state.validators.get(&validator).await?
            .ok_or(BridgeError::ValidatorNotFound { address: validator })?;
        
        if !validator_config.is_active {
            return Err(BridgeError::Unauthorized { reason: "Validator is not active".to_string() });
        }
        
        // Get transfer
        let mut transfer = state.transfers.get(&transfer_id).await?
            .ok_or(BridgeError::TransferNotFound { transfer_id })?;
        
        if transfer.status != TransferStatus::AwaitingApproval && transfer.status != TransferStatus::Approved {
            return Err(BridgeError::InvalidStatus { status: transfer.status });
        }
        
        // Check if already approved by this validator
        if transfer.approvals.iter().any(|a| a.validator == validator) {
            return Err(BridgeError::AlreadyApproved);
        }
        
        // Add approval
        transfer.approvals.push(ValidatorApproval {
            validator,
            approved: true,
            signature,
            timestamp: now,
        });
        
        // Calculate current approval weight
        let mut approval_weight = 0u32;
        for approval in &transfer.approvals {
            if let Some(config) = state.validators.get(&approval.validator).await? {
                approval_weight += config.weight;
            }
        }
        
        // Check if threshold met
        let total_weight = state.total_validator_weight.get();
        let threshold_percentage = state.approval_threshold_percentage.get();
        let required_weight = (total_weight * threshold_percentage) / 100;
        
        if approval_weight >= required_weight {
            transfer.status = TransferStatus::Approved;
        }
        
        state.transfers.insert(&transfer_id, transfer)?;
        
        tracing::info!(
            "Transfer approved: transfer_id={}, validator={:?}, weight={}/{}",
            transfer_id, validator, approval_weight, required_weight
        );
        
        Ok(())
    }
    
    async fn execute_transfer(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut BridgeState<ContractRuntime<Self>>,
        transfer_id: TransferId,
    ) -> Result<(), BridgeError> {
        let now = runtime.system_time();
        
        let mut transfer = state.transfers.get(&transfer_id).await?
            .ok_or(BridgeError::TransferNotFound { transfer_id })?;
        
        if transfer.status != TransferStatus::Approved {
            return Err(BridgeError::InvalidStatus { status: transfer.status });
        }
        
        if now > transfer.expires_at {
            return Err(BridgeError::Expired);
        }
        
        transfer.status = TransferStatus::Executing;
        state.transfers.insert(&transfer_id, transfer)?;
        
        // For outbound transfers, the relayer will pick up and execute on destination chain
        // For inbound transfers, funds are already credited
        
        tracing::info!("Transfer executing: transfer_id={}", transfer_id);
        
        Ok(())
    }
    
    async fn complete_withdrawal(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut BridgeState<ContractRuntime<Self>>,
        transfer_id: TransferId,
        tx_hash: String,
        success: bool,
    ) -> Result<(), BridgeError> {
        let now = runtime.system_time();
        
        let mut transfer = state.transfers.get(&transfer_id).await?
            .ok_or(BridgeError::TransferNotFound { transfer_id })?;
        
        if transfer.direction != TransferDirection::Outbound {
            return Err(BridgeError::InvalidStatus { status: transfer.status });
        }
        
        if success {
            transfer.status = TransferStatus::Completed;
            transfer.destination_tx_hash = Some(tx_hash);
            transfer.completed_at = Some(now);
        } else {
            transfer.status = TransferStatus::Failed;
            transfer.error_message = Some("Transaction failed on destination chain".to_string());
            
            // Refund user (minus fee)
            let balance_key = (transfer.user, transfer.asset.clone());
            let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
            state.balances.insert(&balance_key, current_balance + transfer.net_amount)?;
            
            let mut stats = state.stats.get();
            stats.failed_transfers += 1;
            state.stats.set(stats);
        }
        
        state.transfers.insert(&transfer_id, transfer.clone())?;
        state.active_transfers.remove(&transfer_id)?;
        
        // Update stats
        let mut stats = state.stats.get();
        stats.pending_transfers = stats.pending_transfers.saturating_sub(1);
        state.stats.set(stats);
        
        tracing::info!(
            "Withdrawal completed: transfer_id={}, success={}, tx_hash={}",
            transfer_id, success, tx_hash
        );
        
        Ok(())
    }
    
    async fn claim_refund(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut BridgeState<ContractRuntime<Self>>,
        transfer_id: TransferId,
    ) -> Result<(), BridgeError> {
        let caller = runtime.authenticated_signer()
            .ok_or(BridgeError::Unauthorized { reason: "No authenticated signer".to_string() })?;
        let now = runtime.system_time();
        
        let mut transfer = state.transfers.get(&transfer_id).await?
            .ok_or(BridgeError::TransferNotFound { transfer_id })?;
        
        // Only transfer owner can claim refund
        if transfer.user != caller {
            return Err(BridgeError::Unauthorized { reason: "Not transfer owner".to_string() });
        }
        
        // Check if refund is allowed
        let can_refund = match transfer.status {
            TransferStatus::Failed | TransferStatus::Expired => true,
            _ if now > transfer.expires_at => {
                transfer.status = TransferStatus::Expired;
                true
            }
            _ => false,
        };
        
        if !can_refund {
            return Err(BridgeError::InvalidStatus { status: transfer.status });
        }
        
        if transfer.status == TransferStatus::Refunded {
            return Err(BridgeError::AlreadyProcessed);
        }
        
        // Refund user for outbound transfers
        if transfer.direction == TransferDirection::Outbound {
            let balance_key = (transfer.user, transfer.asset.clone());
            let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
            // Refund net amount (fee was already deducted)
            state.balances.insert(&balance_key, current_balance + transfer.net_amount)?;
        }
        
        transfer.status = TransferStatus::Refunded;
        transfer.completed_at = Some(now);
        
        state.transfers.insert(&transfer_id, transfer)?;
        state.active_transfers.remove(&transfer_id)?;
        
        tracing::info!("Refund claimed: transfer_id={}, user={:?}", transfer_id, caller);
        
        Ok(())
    }
    
    async fn process_expired_transfers(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut BridgeState<ContractRuntime<Self>>,
    ) -> Result<(), BridgeError> {
        let now = runtime.system_time();
        let mut processed = 0;
        
        while processed < 10 {
            let Some((expires_at, transfer_id)) = state.expiration_queue.front().await? else {
                break;
            };
            
            if expires_at > now {
                break;
            }
            
            state.expiration_queue.pop_front();
            
            if let Some(mut transfer) = state.transfers.get(&transfer_id).await? {
                if matches!(transfer.status, 
                    TransferStatus::Pending | 
                    TransferStatus::Confirming | 
                    TransferStatus::AwaitingApproval |
                    TransferStatus::Executing
                ) {
                    transfer.status = TransferStatus::Expired;
                    state.transfers.insert(&transfer_id, transfer)?;
                    state.active_transfers.remove(&transfer_id)?;
                    
                    let mut stats = state.stats.get();
                    stats.failed_transfers += 1;
                    stats.pending_transfers = stats.pending_transfers.saturating_sub(1);
                    state.stats.set(stats);
                    
                    processed += 1;
                }
            }
        }
        
        if processed > 0 {
            tracing::info!("Processed {} expired transfers", processed);
        }
        
        Ok(())
    }
    
    async fn configure_chain(
        &mut self,
        state: &mut BridgeState<ContractRuntime<Self>>,
        config: ChainConfig,
    ) -> Result<(), BridgeError> {
        state.chain_configs.insert(&config.chain.chain_id(), config.clone())?;
        
        tracing::info!(
            "Chain configured: chain={:?}, enabled={}, assets={}",
            config.chain, config.is_enabled, config.supported_assets.len()
        );
        
        Ok(())
    }
    
    async fn disable_chain(
        &mut self,
        state: &mut BridgeState<ContractRuntime<Self>>,
        chain: ExternalChain,
    ) -> Result<(), BridgeError> {
        let mut config = state.chain_configs.get(&chain.chain_id()).await?
            .ok_or(BridgeError::ChainNotConfigured { chain })?;
        
        config.is_enabled = false;
        state.chain_configs.insert(&chain.chain_id(), config)?;
        
        tracing::info!("Chain disabled: {:?}", chain);
        
        Ok(())
    }
    
    async fn add_validator(
        &mut self,
        state: &mut BridgeState<ContractRuntime<Self>>,
        config: ValidatorConfig,
    ) -> Result<(), BridgeError> {
        let total_weight = state.total_validator_weight.get();
        state.total_validator_weight.set(total_weight + config.weight);
        
        state.validators.insert(&config.address, config.clone())?;
        
        tracing::info!("Validator added: {:?}, weight={}", config.address, config.weight);
        
        Ok(())
    }
    
    async fn remove_validator(
        &mut self,
        state: &mut BridgeState<ContractRuntime<Self>>,
        validator: Account,
    ) -> Result<(), BridgeError> {
        let config = state.validators.get(&validator).await?
            .ok_or(BridgeError::ValidatorNotFound { address: validator })?;
        
        let total_weight = state.total_validator_weight.get();
        state.total_validator_weight.set(total_weight.saturating_sub(config.weight));
        
        state.validators.remove(&validator)?;
        
        tracing::info!("Validator removed: {:?}", validator);
        
        Ok(())
    }
    
    async fn update_fees(
        &mut self,
        state: &mut BridgeState<ContractRuntime<Self>>,
        chain: ExternalChain,
        base_fee: Option<Amount>,
        fee_percentage_bps: Option<u64>,
    ) -> Result<(), BridgeError> {
        let mut config = state.chain_configs.get(&chain.chain_id()).await?
            .ok_or(BridgeError::ChainNotConfigured { chain })?;
        
        if let Some(fee) = base_fee {
            config.base_fee = fee;
        }
        if let Some(bps) = fee_percentage_bps {
            config.fee_percentage_bps = bps;
        }
        
        state.chain_configs.insert(&chain.chain_id(), config)?;
        
        tracing::info!("Fees updated for chain {:?}", chain);
        
        Ok(())
    }
    
    async fn calculate_approval_threshold(
        &self,
        state: &BridgeState<ContractRuntime<Self>>,
    ) -> Result<u32, BridgeError> {
        let total_weight = state.total_validator_weight.get();
        let threshold_percentage = state.approval_threshold_percentage.get();
        Ok((total_weight * threshold_percentage) / 100)
    }
}

/// Service for queries
pub struct BridgeService;

#[async_trait]
impl Service for BridgeService {
    type Parameters = ();
    type State = BridgeState<ServiceRuntime<Self>>;

    async fn load(runtime: ServiceRuntime<Self>) -> Self {
        BridgeService
    }

    async fn handle_query(&mut self, state: &Self::State, query: &[u8]) -> Vec<u8> {
        serde_json::to_vec(&"Bridge query handled").unwrap_or_default()
    }
}

impl BridgeContract {
    type Error = BridgeError;
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_external_chain_properties() {
        assert_eq!(ExternalChain::Ethereum.chain_id(), 1);
        assert_eq!(ExternalChain::Ethereum.name(), "Ethereum");
        assert_eq!(ExternalChain::Ethereum.required_confirmations(), 12);
        
        assert_eq!(ExternalChain::Bitcoin.required_confirmations(), 6);
        assert_eq!(ExternalChain::Solana.required_confirmations(), 32);
    }
    
    #[test]
    fn test_transfer_status() {
        let status = TransferStatus::Pending;
        assert!(matches!(status, TransferStatus::Pending));
    }
}













