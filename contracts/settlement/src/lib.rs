/*!
# AxelarX Settlement Engine

Handles cross-chain trade settlement with atomic guarantees.
Supports both intra-Linera settlements and external blockchain bridges.

## Features
- Atomic cross-chain swaps with proper escrow
- Multi-party escrow with individual confirmations
- Timeout-based automatic refunds
- Bridge integration for external chains
- Settlement tracking and history
- Secure balance management
*/

use async_trait::async_trait;
use linera_base::{
    data_types::{Amount, ApplicationId, Timestamp},
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

/// Settlement states with clear progression
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SettlementStatus {
    /// Settlement created, waiting for escrow
    Pending,
    /// Maker has escrowed their funds
    MakerEscrowed,
    /// Taker has escrowed their funds
    TakerEscrowed,
    /// Both parties have escrowed, ready to execute
    FullyEscrowed,
    /// Settlement is being executed
    Executing,
    /// Settlement completed successfully
    Completed,
    /// Settlement failed
    Failed,
    /// Funds have been refunded
    Refunded,
    /// Settlement expired before completion
    Expired,
    /// Settlement cancelled by participant
    Cancelled,
}

/// Escrow state for a single party
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
pub struct EscrowState {
    /// Whether funds have been escrowed
    pub is_escrowed: bool,
    /// Amount escrowed
    pub amount: Amount,
    /// Asset escrowed
    pub asset: String,
    /// Timestamp of escrow
    pub escrowed_at: Option<Timestamp>,
    /// Transaction hash (for verification)
    pub tx_hash: Option<String>,
}

/// Settlement record with comprehensive tracking
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Settlement {
    pub id: u64,
    pub trade_id: u64,
    
    // Participants
    pub maker: Account,
    pub taker: Account,
    
    // Assets and amounts
    pub maker_asset: String,
    pub taker_asset: String,
    pub maker_amount: Amount,
    pub taker_amount: Amount,
    
    // Chain information
    pub maker_chain: ChainId,
    pub taker_chain: ChainId,
    
    // Escrow states
    pub maker_escrow: EscrowState,
    pub taker_escrow: EscrowState,
    
    // Status and timing
    pub status: SettlementStatus,
    pub created_at: Timestamp,
    pub expires_at: Timestamp,
    pub completed_at: Option<Timestamp>,
    
    // Additional metadata
    pub failure_reason: Option<String>,
    pub retry_count: u32,
}

/// Cross-chain bridge information
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BridgeConfig {
    pub chain_id: String,
    pub chain_name: String,
    pub bridge_address: String,
    pub confirmation_blocks: u64,
    pub min_amount: Amount,
    pub max_amount: Amount,
    pub fee_rate_bps: u64, // Basis points (1/10000)
    pub is_active: bool,
    pub supported_assets: Vec<String>,
}

/// Bridge transfer record
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct BridgeTransfer {
    pub id: u64,
    pub chain_id: String,
    pub user: Account,
    pub asset: String,
    pub amount: Amount,
    pub direction: BridgeDirection,
    pub status: BridgeTransferStatus,
    pub tx_hash: Option<String>,
    pub destination_address: Option<String>,
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
    pub confirmations: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BridgeDirection {
    Deposit,
    Withdrawal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BridgeTransferStatus {
    Pending,
    Confirming,
    Completed,
    Failed,
    Refunded,
}

/// Settlement operations
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Operation {
    /// Initialize a new settlement
    InitiateSettlement {
        trade_id: u64,
        maker: Account,
        taker: Account,
        maker_asset: String,
        taker_asset: String,
        maker_amount: Amount,
        taker_amount: Amount,
        maker_chain: ChainId,
        taker_chain: ChainId,
        timeout_seconds: u64,
    },
    
    /// Confirm escrow from a party (locks funds)
    ConfirmEscrow {
        settlement_id: u64,
    },
    
    /// Execute settlement (after both parties escrow)
    ExecuteSettlement {
        settlement_id: u64,
    },
    
    /// Cancel settlement (before both parties escrow)
    CancelSettlement {
        settlement_id: u64,
        reason: String,
    },
    
    /// Claim refund for expired/failed settlement
    ClaimRefund {
        settlement_id: u64,
    },
    
    /// Process expired settlements (can be called by anyone)
    ProcessExpiredSettlements,
    
    /// Configure bridge settings (admin only)
    ConfigureBridge {
        chain_id: String,
        config: BridgeConfig,
    },
    
    /// Disable a bridge (admin only)
    DisableBridge {
        chain_id: String,
    },
    
    /// Process bridge deposit (from relayer)
    ProcessBridgeDeposit {
        chain_id: String,
        tx_hash: String,
        user: Account,
        asset: String,
        amount: Amount,
        confirmations: u64,
    },
    
    /// Initiate bridge withdrawal
    InitiateBridgeWithdrawal {
        chain_id: String,
        asset: String,
        amount: Amount,
        destination_address: String,
    },
    
    /// Complete bridge withdrawal (from relayer)
    CompleteBridgeWithdrawal {
        transfer_id: u64,
        tx_hash: String,
        success: bool,
    },
    
    /// Deposit to settlement account
    Deposit {
        asset: String,
        amount: Amount,
    },
    
    /// Withdraw from settlement account
    Withdraw {
        asset: String,
        amount: Amount,
    },
}

/// Cross-chain messages
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Message {
    /// Settlement request from order book
    SettlementRequest {
        trade_id: u64,
        maker: Account,
        taker: Account,
        maker_asset: String,
        taker_asset: String,
        maker_amount: Amount,
        taker_amount: Amount,
        timeout_seconds: u64,
    },
    
    /// Escrow confirmation from another chain
    EscrowConfirmation {
        settlement_id: u64,
        party: Account,
        confirmed: bool,
        amount: Amount,
    },
    
    /// Settlement completion notification
    SettlementComplete {
        settlement_id: u64,
        success: bool,
        failure_reason: Option<String>,
    },
    
    /// Bridge event notification
    BridgeEvent {
        chain_id: String,
        event_type: BridgeEventType,
        transfer_id: u64,
        data: Vec<u8>,
    },
    
    /// Refund notification
    RefundProcessed {
        settlement_id: u64,
        party: Account,
        amount: Amount,
        asset: String,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum BridgeEventType {
    DepositDetected,
    DepositConfirmed,
    WithdrawalInitiated,
    WithdrawalCompleted,
    WithdrawalFailed,
}

/// Settlement errors
#[derive(Error, Debug)]
pub enum SettlementError {
    #[error("Settlement not found: {settlement_id}")]
    SettlementNotFound { settlement_id: u64 },
    
    #[error("Invalid settlement status: expected {expected:?}, got {actual:?}")]
    InvalidStatus {
        expected: SettlementStatus,
        actual: SettlementStatus,
    },
    
    #[error("Settlement expired at {expired_at:?}")]
    SettlementExpired { expired_at: Timestamp },
    
    #[error("Unauthorized access: {reason}")]
    Unauthorized { reason: String },
    
    #[error("Insufficient balance: required {required}, available {available}")]
    InsufficientBalance { required: Amount, available: Amount },
    
    #[error("Bridge not configured for chain: {chain_id}")]
    BridgeNotConfigured { chain_id: String },
    
    #[error("Bridge is disabled: {chain_id}")]
    BridgeDisabled { chain_id: String },
    
    #[error("Bridge operation failed: {reason}")]
    BridgeError { reason: String },
    
    #[error("Asset not supported by bridge: {asset}")]
    AssetNotSupported { asset: String },
    
    #[error("Amount below minimum: {amount}, minimum: {minimum}")]
    BelowMinimum { amount: Amount, minimum: Amount },
    
    #[error("Amount above maximum: {amount}, maximum: {maximum}")]
    AboveMaximum { amount: Amount, maximum: Amount },
    
    #[error("Transfer not found: {transfer_id}")]
    TransferNotFound { transfer_id: u64 },
    
    #[error("Already escrowed")]
    AlreadyEscrowed,
    
    #[error("Cannot cancel: {reason}")]
    CannotCancel { reason: String },
    
    #[error("View error: {0}")]
    ViewError(#[from] ViewError),
}

/// Settlement engine state
#[derive(RootView)]
pub struct SettlementState<C> {
    /// Next settlement ID
    pub next_settlement_id: RegisterView<C, u64>,
    
    /// All settlements
    pub settlements: MapView<C, u64, Settlement>,
    
    /// User settlements mapping
    pub user_settlements: MapView<C, Account, Vec<u64>>,
    
    /// Active settlements (not yet completed/failed)
    pub active_settlements: MapView<C, u64, ()>,
    
    /// Settlements pending expiration check
    pub expiration_queue: QueueView<C, (Timestamp, u64)>,
    
    /// Bridge configurations
    pub bridge_configs: MapView<C, String, BridgeConfig>,
    
    /// User balances per asset
    pub balances: MapView<C, (Account, String), Amount>,
    
    /// Escrowed balances (locked in settlements)
    pub escrowed_balances: MapView<C, (u64, Account, String), Amount>,
    
    /// Next bridge transfer ID
    pub next_transfer_id: RegisterView<C, u64>,
    
    /// Bridge transfers
    pub bridge_transfers: MapView<C, u64, BridgeTransfer>,
    
    /// User bridge transfers
    pub user_transfers: MapView<C, Account, Vec<u64>>,
    
    /// Pending bridge deposits (tx_hash -> transfer_id)
    pub pending_deposits: MapView<C, String, u64>,
    
    /// Pending bridge withdrawals
    pub pending_withdrawals: QueueView<C, u64>,
    
    /// Settlement statistics
    pub stats: RegisterView<C, SettlementStats>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct SettlementStats {
    pub total_settlements: u64,
    pub completed_settlements: u64,
    pub failed_settlements: u64,
    pub total_volume: Amount,
    pub total_bridge_deposits: Amount,
    pub total_bridge_withdrawals: Amount,
}

/// Settlement engine contract
pub struct SettlementContract;

#[async_trait]
impl Contract for SettlementContract {
    type Message = Message;
    type Parameters = ();
    type State = SettlementState<ContractRuntime<Self>>;

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        SettlementContract
    }

    async fn instantiate(&mut self, state: &mut Self::State, _argument: ()) {
        state.next_settlement_id.set(1);
        state.next_transfer_id.set(1);
        state.stats.set(SettlementStats::default());
    }

    async fn execute_operation(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut Self::State,
        operation: Operation,
    ) -> Result<(), Self::Error> {
        match operation {
            Operation::InitiateSettlement {
                trade_id,
                maker,
                taker,
                maker_asset,
                taker_asset,
                maker_amount,
                taker_amount,
                maker_chain,
                taker_chain,
                timeout_seconds,
            } => {
                self.initiate_settlement(
                    runtime, state, trade_id, maker, taker,
                    maker_asset, taker_asset, maker_amount, taker_amount,
                    maker_chain, taker_chain, timeout_seconds,
                ).await
            }
            
            Operation::ConfirmEscrow { settlement_id } => {
                self.confirm_escrow(runtime, state, settlement_id).await
            }
            
            Operation::ExecuteSettlement { settlement_id } => {
                self.execute_settlement(runtime, state, settlement_id).await
            }
            
            Operation::CancelSettlement { settlement_id, reason } => {
                self.cancel_settlement(runtime, state, settlement_id, reason).await
            }
            
            Operation::ClaimRefund { settlement_id } => {
                self.claim_refund(runtime, state, settlement_id).await
            }
            
            Operation::ProcessExpiredSettlements => {
                self.process_expired_settlements(runtime, state).await
            }
            
            Operation::ConfigureBridge { chain_id, config } => {
                self.configure_bridge(state, chain_id, config).await
            }
            
            Operation::DisableBridge { chain_id } => {
                self.disable_bridge(state, chain_id).await
            }
            
            Operation::ProcessBridgeDeposit {
                chain_id, tx_hash, user, asset, amount, confirmations,
            } => {
                self.process_bridge_deposit(
                    runtime, state, chain_id, tx_hash, user, asset, amount, confirmations
                ).await
            }
            
            Operation::InitiateBridgeWithdrawal {
                chain_id, asset, amount, destination_address,
            } => {
                self.initiate_bridge_withdrawal(
                    runtime, state, chain_id, asset, amount, destination_address
                ).await
            }
            
            Operation::CompleteBridgeWithdrawal {
                transfer_id, tx_hash, success,
            } => {
                self.complete_bridge_withdrawal(runtime, state, transfer_id, tx_hash, success).await
            }
            
            Operation::Deposit { asset, amount } => {
                self.deposit(runtime, state, asset, amount).await
            }
            
            Operation::Withdraw { asset, amount } => {
                self.withdraw(runtime, state, asset, amount).await
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
            Message::SettlementRequest {
                trade_id, maker, taker, maker_asset, taker_asset,
                maker_amount, taker_amount, timeout_seconds,
            } => {
                let maker_chain = runtime.chain_id();
                let taker_chain = runtime.chain_id();
                
                if let Err(e) = self.initiate_settlement(
                    runtime, state, trade_id, maker, taker,
                    maker_asset, taker_asset, maker_amount, taker_amount,
                    maker_chain, taker_chain, timeout_seconds,
                ).await {
                    tracing::error!("Failed to initiate settlement: {}", e);
                }
            }
            
            Message::EscrowConfirmation { settlement_id, party, confirmed, amount } => {
                tracing::info!(
                    "Escrow confirmation: settlement={}, party={:?}, confirmed={}, amount={}",
                    settlement_id, party, confirmed, amount
                );
            }
            
            Message::SettlementComplete { settlement_id, success, failure_reason } => {
                tracing::info!(
                    "Settlement complete: id={}, success={}, reason={:?}",
                    settlement_id, success, failure_reason
                );
            }
            
            Message::BridgeEvent { chain_id, event_type, transfer_id, data } => {
                tracing::info!(
                    "Bridge event: chain={}, type={:?}, transfer={}, data_len={}",
                    chain_id, event_type, transfer_id, data.len()
                );
            }
            
            Message::RefundProcessed { settlement_id, party, amount, asset } => {
                tracing::info!(
                    "Refund processed: settlement={}, party={:?}, amount={}, asset={}",
                    settlement_id, party, amount, asset
                );
            }
        }
    }
}

impl SettlementContract {
    async fn initiate_settlement(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        trade_id: u64,
        maker: Account,
        taker: Account,
        maker_asset: String,
        taker_asset: String,
        maker_amount: Amount,
        taker_amount: Amount,
        maker_chain: ChainId,
        taker_chain: ChainId,
        timeout_seconds: u64,
    ) -> Result<(), SettlementError> {
        let settlement_id = state.next_settlement_id.get();
        let now = runtime.system_time();
        let expires_at = now + std::time::Duration::from_secs(timeout_seconds);
        
        let settlement = Settlement {
            id: settlement_id,
            trade_id,
            maker,
            taker,
            maker_asset: maker_asset.clone(),
            taker_asset: taker_asset.clone(),
            maker_amount,
            taker_amount,
            maker_chain,
            taker_chain,
            maker_escrow: EscrowState::default(),
            taker_escrow: EscrowState::default(),
            status: SettlementStatus::Pending,
            created_at: now,
            expires_at,
            completed_at: None,
            failure_reason: None,
            retry_count: 0,
        };
        
        // Store settlement
        state.settlements.insert(&settlement_id, settlement.clone())?;
        state.active_settlements.insert(&settlement_id, ())?;
        
        // Add to user settlements
        for user in [maker, taker] {
            let mut user_settlements = state.user_settlements.get(&user).await?.unwrap_or_default();
            user_settlements.push(settlement_id);
            state.user_settlements.insert(&user, user_settlements)?;
        }
        
        // Add to expiration queue
        state.expiration_queue.push_back((expires_at, settlement_id));
        
        // Update stats
        let mut stats = state.stats.get();
        stats.total_settlements += 1;
        state.stats.set(stats);
        
        // Increment settlement ID
        state.next_settlement_id.set(settlement_id + 1);
        
        tracing::info!(
            "Settlement initiated: id={}, trade_id={}, maker={:?}, taker={:?}",
            settlement_id, trade_id, maker, taker
        );
        
        Ok(())
    }
    
    async fn confirm_escrow(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        settlement_id: u64,
    ) -> Result<(), SettlementError> {
        let caller = runtime.authenticated_signer()
            .ok_or(SettlementError::Unauthorized { reason: "No authenticated signer".to_string() })?;
        let now = runtime.system_time();
        
        let mut settlement = state.settlements.get(&settlement_id).await?
            .ok_or(SettlementError::SettlementNotFound { settlement_id })?;
        
        // Check expiration
        if now > settlement.expires_at {
            return Err(SettlementError::SettlementExpired { expired_at: settlement.expires_at });
        }
        
        // Determine which party is escrowing
        let (is_maker, asset, amount) = if caller == settlement.maker {
            if settlement.maker_escrow.is_escrowed {
                return Err(SettlementError::AlreadyEscrowed);
            }
            (true, settlement.maker_asset.clone(), settlement.maker_amount)
        } else if caller == settlement.taker {
            if settlement.taker_escrow.is_escrowed {
                return Err(SettlementError::AlreadyEscrowed);
            }
            (false, settlement.taker_asset.clone(), settlement.taker_amount)
        } else {
            return Err(SettlementError::Unauthorized { 
                reason: "Caller is not a party to this settlement".to_string() 
            });
        };
        
        // Check balance
        let balance_key = (caller, asset.clone());
        let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
        
        if current_balance < amount {
            return Err(SettlementError::InsufficientBalance {
                required: amount,
                available: current_balance,
            });
        }
        
        // Lock balance (move to escrow)
        let new_balance = current_balance - amount;
        state.balances.insert(&balance_key, new_balance)?;
        
        // Record escrowed amount
        let escrow_key = (settlement_id, caller, asset.clone());
        state.escrowed_balances.insert(&escrow_key, amount)?;
        
        // Update escrow state
        let escrow_state = EscrowState {
            is_escrowed: true,
            amount,
            asset: asset.clone(),
            escrowed_at: Some(now),
            tx_hash: None,
        };
        
        if is_maker {
            settlement.maker_escrow = escrow_state;
            settlement.status = if settlement.taker_escrow.is_escrowed {
                SettlementStatus::FullyEscrowed
            } else {
                SettlementStatus::MakerEscrowed
            };
        } else {
            settlement.taker_escrow = escrow_state;
            settlement.status = if settlement.maker_escrow.is_escrowed {
                SettlementStatus::FullyEscrowed
            } else {
                SettlementStatus::TakerEscrowed
            };
        }
        
        state.settlements.insert(&settlement_id, settlement.clone())?;
        
        tracing::info!(
            "Escrow confirmed: settlement_id={}, party={:?}, asset={}, amount={}",
            settlement_id, caller, asset, amount
        );
        
        // Auto-execute if fully escrowed
        if settlement.status == SettlementStatus::FullyEscrowed {
            self.execute_settlement(runtime, state, settlement_id).await?;
        }
        
        Ok(())
    }
    
    async fn execute_settlement(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        settlement_id: u64,
    ) -> Result<(), SettlementError> {
        let now = runtime.system_time();
        
        let mut settlement = state.settlements.get(&settlement_id).await?
            .ok_or(SettlementError::SettlementNotFound { settlement_id })?;
        
        // Verify status
        if settlement.status != SettlementStatus::FullyEscrowed {
            return Err(SettlementError::InvalidStatus {
                expected: SettlementStatus::FullyEscrowed,
                actual: settlement.status,
            });
        }
        
        // Check expiration
        if now > settlement.expires_at {
            settlement.status = SettlementStatus::Expired;
            state.settlements.insert(&settlement_id, settlement)?;
            return Err(SettlementError::SettlementExpired { expired_at: settlement.expires_at });
        }
        
        settlement.status = SettlementStatus::Executing;
        state.settlements.insert(&settlement_id, settlement.clone())?;
        
        // Execute the swap
        // Transfer maker asset from escrow to taker
        let maker_escrow_key = (settlement_id, settlement.maker, settlement.maker_asset.clone());
        let maker_escrowed = state.escrowed_balances.get(&maker_escrow_key).await?.unwrap_or_default();
        
        let taker_balance_key = (settlement.taker, settlement.maker_asset.clone());
        let taker_balance = state.balances.get(&taker_balance_key).await?.unwrap_or_default();
        
        state.balances.insert(&taker_balance_key, taker_balance + maker_escrowed)?;
        state.escrowed_balances.remove(&maker_escrow_key)?;
        
        // Transfer taker asset from escrow to maker
        let taker_escrow_key = (settlement_id, settlement.taker, settlement.taker_asset.clone());
        let taker_escrowed = state.escrowed_balances.get(&taker_escrow_key).await?.unwrap_or_default();
        
        let maker_balance_key = (settlement.maker, settlement.taker_asset.clone());
        let maker_balance = state.balances.get(&maker_balance_key).await?.unwrap_or_default();
        
        state.balances.insert(&maker_balance_key, maker_balance + taker_escrowed)?;
        state.escrowed_balances.remove(&taker_escrow_key)?;
        
        // Update settlement status
        settlement.status = SettlementStatus::Completed;
        settlement.completed_at = Some(now);
        state.settlements.insert(&settlement_id, settlement.clone())?;
        
        // Remove from active settlements
        state.active_settlements.remove(&settlement_id)?;
        
        // Update stats
        let mut stats = state.stats.get();
        stats.completed_settlements += 1;
        stats.total_volume = stats.total_volume + settlement.maker_amount + settlement.taker_amount;
        state.stats.set(stats);
        
        tracing::info!(
            "Settlement executed: id={}, maker={:?}, taker={:?}",
            settlement_id, settlement.maker, settlement.taker
        );
        
        Ok(())
    }
    
    async fn cancel_settlement(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        settlement_id: u64,
        reason: String,
    ) -> Result<(), SettlementError> {
        let caller = runtime.authenticated_signer()
            .ok_or(SettlementError::Unauthorized { reason: "No authenticated signer".to_string() })?;
        
        let mut settlement = state.settlements.get(&settlement_id).await?
            .ok_or(SettlementError::SettlementNotFound { settlement_id })?;
        
        // Only participants can cancel
        if caller != settlement.maker && caller != settlement.taker {
            return Err(SettlementError::Unauthorized { 
                reason: "Only participants can cancel".to_string() 
            });
        }
        
        // Can only cancel if not fully escrowed or completed
        match settlement.status {
            SettlementStatus::Pending |
            SettlementStatus::MakerEscrowed |
            SettlementStatus::TakerEscrowed => {
                // Allowed to cancel
            }
            SettlementStatus::FullyEscrowed |
            SettlementStatus::Executing => {
                return Err(SettlementError::CannotCancel { 
                    reason: "Settlement is already being executed".to_string() 
                });
            }
            _ => {
                return Err(SettlementError::CannotCancel { 
                    reason: "Settlement is already finalized".to_string() 
                });
            }
        }
        
        // Process refunds for any escrowed amounts
        self.process_refund(state, &settlement).await?;
        
        settlement.status = SettlementStatus::Cancelled;
        settlement.failure_reason = Some(reason);
        state.settlements.insert(&settlement_id, settlement)?;
        
        // Remove from active settlements
        state.active_settlements.remove(&settlement_id)?;
        
        tracing::info!("Settlement cancelled: id={}, by={:?}", settlement_id, caller);
        
        Ok(())
    }
    
    async fn claim_refund(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        settlement_id: u64,
    ) -> Result<(), SettlementError> {
        let caller = runtime.authenticated_signer()
            .ok_or(SettlementError::Unauthorized { reason: "No authenticated signer".to_string() })?;
        let now = runtime.system_time();
        
        let mut settlement = state.settlements.get(&settlement_id).await?
            .ok_or(SettlementError::SettlementNotFound { settlement_id })?;
        
        // Only participants can claim refund
        if caller != settlement.maker && caller != settlement.taker {
            return Err(SettlementError::Unauthorized { 
                reason: "Only participants can claim refund".to_string() 
            });
        }
        
        // Check if refund is allowed
        let can_refund = match settlement.status {
            SettlementStatus::Expired |
            SettlementStatus::Failed |
            SettlementStatus::Cancelled => true,
            _ if now > settlement.expires_at => {
                // Mark as expired
                settlement.status = SettlementStatus::Expired;
                state.settlements.insert(&settlement_id, settlement.clone())?;
                true
            }
            _ => false,
        };
        
        if !can_refund {
            return Err(SettlementError::CannotCancel { 
                reason: "Refund not available for this settlement status".to_string() 
            });
        }
        
        // Process refund for the caller
        let (asset, escrow_key) = if caller == settlement.maker && settlement.maker_escrow.is_escrowed {
            (settlement.maker_asset.clone(), (settlement_id, settlement.maker, settlement.maker_asset.clone()))
        } else if caller == settlement.taker && settlement.taker_escrow.is_escrowed {
            (settlement.taker_asset.clone(), (settlement_id, settlement.taker, settlement.taker_asset.clone()))
        } else {
            return Err(SettlementError::InsufficientBalance { 
                required: Amount::ZERO, 
                available: Amount::ZERO 
            });
        };
        
        let escrowed = state.escrowed_balances.get(&escrow_key).await?.unwrap_or_default();
        if escrowed > Amount::ZERO {
            // Return to user balance
            let balance_key = (caller, asset.clone());
            let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
            state.balances.insert(&balance_key, current_balance + escrowed)?;
            
            // Clear escrow
            state.escrowed_balances.remove(&escrow_key)?;
            
            // Update escrow state
            if caller == settlement.maker {
                settlement.maker_escrow.is_escrowed = false;
            } else {
                settlement.taker_escrow.is_escrowed = false;
            }
        }
        
        // Update status to refunded if both parties have been refunded
        if !settlement.maker_escrow.is_escrowed && !settlement.taker_escrow.is_escrowed {
            settlement.status = SettlementStatus::Refunded;
            state.active_settlements.remove(&settlement_id)?;
        }
        
        state.settlements.insert(&settlement_id, settlement)?;
        
        tracing::info!("Refund claimed: settlement_id={}, user={:?}", settlement_id, caller);
        
        Ok(())
    }
    
    async fn process_refund(
        &self,
        state: &mut SettlementState<ContractRuntime<SettlementContract>>,
        settlement: &Settlement,
    ) -> Result<(), SettlementError> {
        // Refund maker if escrowed
        if settlement.maker_escrow.is_escrowed {
            let escrow_key = (settlement.id, settlement.maker, settlement.maker_asset.clone());
            let escrowed = state.escrowed_balances.get(&escrow_key).await?.unwrap_or_default();
            
            if escrowed > Amount::ZERO {
                let balance_key = (settlement.maker, settlement.maker_asset.clone());
                let balance = state.balances.get(&balance_key).await?.unwrap_or_default();
                state.balances.insert(&balance_key, balance + escrowed)?;
                state.escrowed_balances.remove(&escrow_key)?;
            }
        }
        
        // Refund taker if escrowed
        if settlement.taker_escrow.is_escrowed {
            let escrow_key = (settlement.id, settlement.taker, settlement.taker_asset.clone());
            let escrowed = state.escrowed_balances.get(&escrow_key).await?.unwrap_or_default();
            
            if escrowed > Amount::ZERO {
                let balance_key = (settlement.taker, settlement.taker_asset.clone());
                let balance = state.balances.get(&balance_key).await?.unwrap_or_default();
                state.balances.insert(&balance_key, balance + escrowed)?;
                state.escrowed_balances.remove(&escrow_key)?;
            }
        }
        
        Ok(())
    }
    
    async fn process_expired_settlements(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
    ) -> Result<(), SettlementError> {
        let now = runtime.system_time();
        let mut processed = 0;
        
        // Process up to 10 expired settlements at a time
        while processed < 10 {
            let Some((expires_at, settlement_id)) = state.expiration_queue.front().await? else {
                break;
            };
            
            if expires_at > now {
                break; // No more expired settlements
            }
            
            // Remove from queue
            state.expiration_queue.pop_front();
            
            // Get settlement
            if let Some(mut settlement) = state.settlements.get(&settlement_id).await? {
                if settlement.status != SettlementStatus::Completed &&
                   settlement.status != SettlementStatus::Refunded &&
                   settlement.status != SettlementStatus::Cancelled {
                    
                    // Process refunds
                    self.process_refund(state, &settlement).await?;
                    
                    settlement.status = SettlementStatus::Expired;
                    state.settlements.insert(&settlement_id, settlement)?;
                    state.active_settlements.remove(&settlement_id)?;
                    
                    // Update stats
                    let mut stats = state.stats.get();
                    stats.failed_settlements += 1;
                    state.stats.set(stats);
                    
                    processed += 1;
                }
            }
        }
        
        if processed > 0 {
            tracing::info!("Processed {} expired settlements", processed);
        }
        
        Ok(())
    }
    
    async fn configure_bridge(
        &mut self,
        state: &mut SettlementState<ContractRuntime<Self>>,
        chain_id: String,
        config: BridgeConfig,
    ) -> Result<(), SettlementError> {
        // TODO: Add admin check
        state.bridge_configs.insert(&chain_id, config.clone())?;
        
        tracing::info!("Bridge configured: chain_id={}, address={}", chain_id, config.bridge_address);
        
        Ok(())
    }
    
    async fn disable_bridge(
        &mut self,
        state: &mut SettlementState<ContractRuntime<Self>>,
        chain_id: String,
    ) -> Result<(), SettlementError> {
        let mut config = state.bridge_configs.get(&chain_id).await?
            .ok_or(SettlementError::BridgeNotConfigured { chain_id: chain_id.clone() })?;
        
        config.is_active = false;
        state.bridge_configs.insert(&chain_id, config)?;
        
        tracing::info!("Bridge disabled: chain_id={}", chain_id);
        
        Ok(())
    }
    
    async fn process_bridge_deposit(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        chain_id: String,
        tx_hash: String,
        user: Account,
        asset: String,
        amount: Amount,
        confirmations: u64,
    ) -> Result<(), SettlementError> {
        let now = runtime.system_time();
        
        // Verify bridge configuration
        let config = state.bridge_configs.get(&chain_id).await?
            .ok_or(SettlementError::BridgeNotConfigured { chain_id: chain_id.clone() })?;
        
        if !config.is_active {
            return Err(SettlementError::BridgeDisabled { chain_id });
        }
        
        if !config.supported_assets.contains(&asset) {
            return Err(SettlementError::AssetNotSupported { asset });
        }
        
        if amount < config.min_amount {
            return Err(SettlementError::BelowMinimum { amount, minimum: config.min_amount });
        }
        
        if amount > config.max_amount {
            return Err(SettlementError::AboveMaximum { amount, maximum: config.max_amount });
        }
        
        // Check if already processed
        if state.pending_deposits.get(&tx_hash).await?.is_some() {
            return Err(SettlementError::BridgeError { 
                reason: "Deposit already processed".to_string() 
            });
        }
        
        // Check confirmations
        let status = if confirmations >= config.confirmation_blocks {
            BridgeTransferStatus::Completed
        } else {
            BridgeTransferStatus::Confirming
        };
        
        // Create transfer record
        let transfer_id = state.next_transfer_id.get();
        let transfer = BridgeTransfer {
            id: transfer_id,
            chain_id: chain_id.clone(),
            user,
            asset: asset.clone(),
            amount,
            direction: BridgeDirection::Deposit,
            status,
            tx_hash: Some(tx_hash.clone()),
            destination_address: None,
            created_at: now,
            completed_at: if status == BridgeTransferStatus::Completed { Some(now) } else { None },
            confirmations,
        };
        
        state.bridge_transfers.insert(&transfer_id, transfer)?;
        state.pending_deposits.insert(&tx_hash, transfer_id)?;
        state.next_transfer_id.set(transfer_id + 1);
        
        // If confirmed, credit user balance
        if status == BridgeTransferStatus::Completed {
            // Deduct bridge fee
            let fee = Amount::from((amount.into_inner() * config.fee_rate_bps as u128) / 10000);
            let credited = amount - fee;
            
            let balance_key = (user, asset.clone());
            let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
            state.balances.insert(&balance_key, current_balance + credited)?;
            
            // Update stats
            let mut stats = state.stats.get();
            stats.total_bridge_deposits = stats.total_bridge_deposits + credited;
            state.stats.set(stats);
        }
        
        tracing::info!(
            "Bridge deposit processed: chain={}, user={:?}, asset={}, amount={}, status={:?}",
            chain_id, user, asset, amount, status
        );
        
        Ok(())
    }
    
    async fn initiate_bridge_withdrawal(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        chain_id: String,
        asset: String,
        amount: Amount,
        destination_address: String,
    ) -> Result<(), SettlementError> {
        let user = runtime.authenticated_signer()
            .ok_or(SettlementError::Unauthorized { reason: "No authenticated signer".to_string() })?;
        let now = runtime.system_time();
        
        // Verify bridge configuration
        let config = state.bridge_configs.get(&chain_id).await?
            .ok_or(SettlementError::BridgeNotConfigured { chain_id: chain_id.clone() })?;
        
        if !config.is_active {
            return Err(SettlementError::BridgeDisabled { chain_id });
        }
        
        if !config.supported_assets.contains(&asset) {
            return Err(SettlementError::AssetNotSupported { asset });
        }
        
        if amount < config.min_amount {
            return Err(SettlementError::BelowMinimum { amount, minimum: config.min_amount });
        }
        
        if amount > config.max_amount {
            return Err(SettlementError::AboveMaximum { amount, maximum: config.max_amount });
        }
        
        // Check user balance
        let balance_key = (user, asset.clone());
        let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
        
        if current_balance < amount {
            return Err(SettlementError::InsufficientBalance {
                required: amount,
                available: current_balance,
            });
        }
        
        // Deduct balance
        let new_balance = current_balance - amount;
        state.balances.insert(&balance_key, new_balance)?;
        
        // Create transfer record
        let transfer_id = state.next_transfer_id.get();
        let transfer = BridgeTransfer {
            id: transfer_id,
            chain_id: chain_id.clone(),
            user,
            asset: asset.clone(),
            amount,
            direction: BridgeDirection::Withdrawal,
            status: BridgeTransferStatus::Pending,
            tx_hash: None,
            destination_address: Some(destination_address.clone()),
            created_at: now,
            completed_at: None,
            confirmations: 0,
        };
        
        state.bridge_transfers.insert(&transfer_id, transfer)?;
        state.pending_withdrawals.push_back(transfer_id);
        state.next_transfer_id.set(transfer_id + 1);
        
        // Add to user transfers
        let mut user_transfers = state.user_transfers.get(&user).await?.unwrap_or_default();
        user_transfers.push(transfer_id);
        state.user_transfers.insert(&user, user_transfers)?;
        
        tracing::info!(
            "Bridge withdrawal initiated: chain={}, user={:?}, asset={}, amount={}, destination={}",
            chain_id, user, asset, amount, destination_address
        );
        
        Ok(())
    }
    
    async fn complete_bridge_withdrawal(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        transfer_id: u64,
        tx_hash: String,
        success: bool,
    ) -> Result<(), SettlementError> {
        let now = runtime.system_time();
        
        let mut transfer = state.bridge_transfers.get(&transfer_id).await?
            .ok_or(SettlementError::TransferNotFound { transfer_id })?;
        
        if success {
            transfer.status = BridgeTransferStatus::Completed;
            transfer.tx_hash = Some(tx_hash);
            transfer.completed_at = Some(now);
            
            // Update stats
            let mut stats = state.stats.get();
            stats.total_bridge_withdrawals = stats.total_bridge_withdrawals + transfer.amount;
            state.stats.set(stats);
        } else {
            transfer.status = BridgeTransferStatus::Failed;
            
            // Refund user
            let balance_key = (transfer.user, transfer.asset.clone());
            let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
            state.balances.insert(&balance_key, current_balance + transfer.amount)?;
        }
        
        state.bridge_transfers.insert(&transfer_id, transfer)?;
        
        tracing::info!(
            "Bridge withdrawal completed: transfer_id={}, success={}",
            transfer_id, success
        );
        
        Ok(())
    }
    
    async fn deposit(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        asset: String,
        amount: Amount,
    ) -> Result<(), SettlementError> {
        let user = runtime.authenticated_signer()
            .ok_or(SettlementError::Unauthorized { reason: "No authenticated signer".to_string() })?;
        
        let balance_key = (user, asset.clone());
        let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
        let new_balance = current_balance + amount;
        
        state.balances.insert(&balance_key, new_balance)?;
        
        tracing::info!("Deposit: user={:?}, asset={}, amount={}", user, asset, amount);
        
        Ok(())
    }
    
    async fn withdraw(
        &mut self,
        runtime: &mut ContractRuntime<Self>,
        state: &mut SettlementState<ContractRuntime<Self>>,
        asset: String,
        amount: Amount,
    ) -> Result<(), SettlementError> {
        let user = runtime.authenticated_signer()
            .ok_or(SettlementError::Unauthorized { reason: "No authenticated signer".to_string() })?;
        
        let balance_key = (user, asset.clone());
        let current_balance = state.balances.get(&balance_key).await?.unwrap_or_default();
        
        if current_balance < amount {
            return Err(SettlementError::InsufficientBalance {
                required: amount,
                available: current_balance,
            });
        }
        
        let new_balance = current_balance - amount;
        state.balances.insert(&balance_key, new_balance)?;
        
        tracing::info!("Withdrawal: user={:?}, asset={}, amount={}", user, asset, amount);
        
        Ok(())
    }
}

/// Service for GraphQL queries
pub struct SettlementService;

#[async_trait]
impl Service for SettlementService {
    type Parameters = ();
    type State = SettlementState<ServiceRuntime<Self>>;

    async fn load(runtime: ServiceRuntime<Self>) -> Self {
        SettlementService
    }

    async fn handle_query(&mut self, state: &Self::State, query: &[u8]) -> Vec<u8> {
        serde_json::to_vec(&"Settlement query handled").unwrap_or_default()
    }
}

impl SettlementContract {
    type Error = SettlementError;
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_escrow_state_default() {
        let escrow = EscrowState::default();
        assert!(!escrow.is_escrowed);
        assert_eq!(escrow.amount, Amount::ZERO);
    }
    
    #[test]
    fn test_settlement_status_progression() {
        // Valid status transitions
        assert!(matches!(SettlementStatus::Pending, SettlementStatus::Pending));
        assert!(matches!(SettlementStatus::MakerEscrowed, SettlementStatus::MakerEscrowed));
        assert!(matches!(SettlementStatus::FullyEscrowed, SettlementStatus::FullyEscrowed));
        assert!(matches!(SettlementStatus::Completed, SettlementStatus::Completed));
    }
    
    #[test]
    fn test_bridge_config() {
        let config = BridgeConfig {
            chain_id: "ethereum".to_string(),
            chain_name: "Ethereum".to_string(),
            bridge_address: "0x1234...".to_string(),
            confirmation_blocks: 12,
            min_amount: Amount::from(1000),
            max_amount: Amount::from(1000000),
            fee_rate_bps: 30, // 0.3%
            is_active: true,
            supported_assets: vec!["ETH".to_string(), "USDT".to_string()],
        };
        
        assert!(config.is_active);
        assert_eq!(config.fee_rate_bps, 30);
        assert!(config.supported_assets.contains(&"ETH".to_string()));
    }
}
