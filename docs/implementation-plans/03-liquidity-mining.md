# Implementation Plan: Liquidity Mining Program

## Overview
Implement a liquidity mining program to incentivize liquidity providers and market makers, increasing platform liquidity and trading volume.

## Priority: High | Effort: Medium | Timeline: 4-6 weeks

---

## 1. Core Components

### 1.1 Reward Distribution System

#### Contract: `contracts/liquidity-mining/src/lib.rs`

```rust
use linera_sdk::base::{ContractRuntime, ServiceRuntime};
use linera_views::views::{MapView, RegisterView};
use serde::{Deserialize, Serialize};

/// Liquidity mining pool for a market
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiquidityPool {
    pub market: String,
    pub total_rewards: Amount,
    pub distributed_rewards: Amount,
    pub reward_rate: Amount, // Rewards per block
    pub start_block: u64,
    pub end_block: u64,
    pub participants: MapView<Account, Participant>,
}

/// Participant in liquidity mining
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Participant {
    pub account: Account,
    pub liquidity_provided: Amount,
    pub reward_share: f64, // Percentage of pool
    pub claimed_rewards: Amount,
    pub pending_rewards: Amount,
    pub last_update_block: u64,
}

/// LP Token for liquidity providers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LPToken {
    pub token_id: String,
    pub market: String,
    pub total_supply: Amount,
    pub balances: MapView<Account, Amount>,
}
```

### 1.2 Reward Calculation

```rust
impl LiquidityPool {
    /// Calculate rewards for a participant
    pub fn calculate_rewards(
        &self,
        participant: &Participant,
        current_block: u64,
    ) -> Amount {
        if current_block < self.start_block || current_block > self.end_block {
            return Amount::ZERO;
        }
        
        let blocks_elapsed = current_block - participant.last_update_block;
        let total_pool_liquidity = self.get_total_liquidity();
        
        if total_pool_liquidity == 0 {
            return Amount::ZERO;
        }
        
        // Calculate share of rewards
        let share = participant.liquidity_provided as f64 / total_pool_liquidity as f64;
        
        // Calculate rewards for elapsed blocks
        let rewards = (self.reward_rate * blocks_elapsed as Amount) as f64 * share;
        
        rewards as Amount
    }
    
    /// Update participant rewards
    pub fn update_participant_rewards(
        &mut self,
        account: Account,
        current_block: u64,
    ) -> Result<(), LiquidityMiningError> {
        if let Some(mut participant) = self.participants.get_mut(&account) {
            let new_rewards = self.calculate_rewards(&participant, current_block);
            participant.pending_rewards += new_rewards;
            participant.last_update_block = current_block;
        }
        
        Ok(())
    }
}
```

### 1.3 LP Token System

```rust
impl LPToken {
    /// Mint LP tokens when liquidity is added
    pub fn mint(
        &mut self,
        account: Account,
        amount: Amount,
    ) -> Result<(), LPTokenError> {
        let current_balance = self.balances.get(&account).unwrap_or_default();
        self.balances.insert(account, current_balance + amount);
        self.total_supply += amount;
        Ok(())
    }
    
    /// Burn LP tokens when liquidity is removed
    pub fn burn(
        &mut self,
        account: Account,
        amount: Amount,
    ) -> Result<(), LPTokenError> {
        let current_balance = self.balances.get(&account).unwrap_or_default();
        
        if amount > current_balance {
            return Err(LPTokenError::InsufficientBalance);
        }
        
        self.balances.insert(account, current_balance - amount);
        self.total_supply -= amount;
        Ok(())
    }
    
    /// Calculate LP tokens to mint based on liquidity added
    pub fn calculate_mint_amount(
        &self,
        liquidity_added: Amount,
        total_liquidity: Amount,
    ) -> Amount {
        if self.total_supply == 0 {
            // First liquidity provider gets tokens equal to liquidity
            return liquidity_added;
        }
        
        // Proportional minting
        (liquidity_added * self.total_supply) / total_liquidity
    }
}
```

---

## 2. Frontend Implementation

### 2.1 Liquidity Mining Dashboard

```typescript
// frontend/components/liquidity/LiquidityMining.tsx

export const LiquidityMining = () => {
  const { pools, userParticipation, claimRewards, addLiquidity } = useLiquidityMining();
  
  return (
    <div className="space-y-6">
      <h1>Liquidity Mining</h1>
      
      {/* Pool List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pools.map(pool => (
          <div key={pool.id} className="card-glass p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{pool.market}</h3>
                <p className="text-sm text-gray-400">
                  APR: {pool.apr}%
                </p>
              </div>
              <Badge>{pool.status}</Badge>
            </div>
            
            {/* Pool Stats */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Total Liquidity:</span>
                <span>{formatCurrency(pool.totalLiquidity)}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Liquidity:</span>
                <span>{formatCurrency(pool.userLiquidity)}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Rewards:</span>
                <span className="text-green-400">
                  {formatCurrency(pool.pendingRewards)}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => addLiquidity(pool.id)}
                className="btn-primary flex-1"
              >
                Add Liquidity
              </button>
              {pool.pendingRewards > 0 && (
                <button
                  onClick={() => claimRewards(pool.id)}
                  className="btn-secondary"
                >
                  Claim
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2.2 Add Liquidity Modal

```typescript
// frontend/components/liquidity/AddLiquidityModal.tsx

export const AddLiquidityModal = ({ pool, onClose }) => {
  const [baseAmount, setBaseAmount] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  
  const { addLiquidity, calculateLPTokens } = useLiquidityMining();
  
  const lpTokensToReceive = useMemo(() => {
    if (!baseAmount || !quoteAmount) return 0;
    return calculateLPTokens(pool.id, parseFloat(baseAmount), parseFloat(quoteAmount));
  }, [baseAmount, quoteAmount, pool]);
  
  return (
    <Modal onClose={onClose}>
      <div className="space-y-4">
        <h2>Add Liquidity to {pool.market}</h2>
        
        {/* Base Asset */}
        <div>
          <label>Base Amount</label>
          <input
            type="number"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
            placeholder="0.0"
          />
        </div>
        
        {/* Quote Asset */}
        <div>
          <label>Quote Amount</label>
          <input
            type="number"
            value={quoteAmount}
            onChange={(e) => setQuoteAmount(e.target.value)}
            placeholder="0.0"
          />
        </div>
        
        {/* LP Tokens Preview */}
        <div className="bg-gray-800 p-4 rounded">
          <div className="flex justify-between">
            <span>LP Tokens to Receive:</span>
            <span className="font-bold">{lpTokensToReceive}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Share of Pool:</span>
            <span>{calculateShare(pool, lpTokensToReceive)}%</span>
          </div>
        </div>
        
        {/* Slippage */}
        <div>
          <label>Slippage Tolerance</label>
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(Number(e.target.value))}
            min={0.1}
            max={5}
            step={0.1}
          />
          <span className="text-sm text-gray-400">%</span>
        </div>
        
        <button
          onClick={() => addLiquidity({
            poolId: pool.id,
            baseAmount: parseFloat(baseAmount),
            quoteAmount: parseFloat(quoteAmount),
            slippage,
          })}
          className="btn-primary w-full"
        >
          Add Liquidity
        </button>
      </div>
    </Modal>
  );
};
```

---

## 3. Reward Tiers

### 3.1 Tiered Rewards System

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RewardTier {
    pub min_liquidity: Amount,
    pub max_liquidity: Amount,
    pub multiplier: f64, // Reward multiplier (e.g., 1.5x)
}

impl LiquidityPool {
    /// Calculate tiered rewards
    pub fn calculate_tiered_rewards(
        &self,
        participant: &Participant,
    ) -> Amount {
        let base_rewards = self.calculate_rewards(participant, current_block);
        let tier = self.get_tier_for_liquidity(participant.liquidity_provided);
        base_rewards * tier.multiplier as Amount
    }
    
    fn get_tier_for_liquidity(&self, liquidity: Amount) -> RewardTier {
        // Bronze: 0-10k
        // Silver: 10k-50k (1.2x)
        // Gold: 50k-100k (1.5x)
        // Platinum: 100k+ (2.0x)
        // Implementation...
    }
}
```

---

## 4. API Design

### GraphQL Schema

```graphql
type LiquidityPool {
  id: ID!
  market: String!
  totalLiquidity: String!
  totalRewards: String!
  distributedRewards: String!
  rewardRate: String!
  apr: Float!
  startBlock: Int!
  endBlock: Int!
  participants: [Participant!]!
  userParticipation: Participant
}

type Participant {
  account: Account!
  liquidityProvided: String!
  rewardShare: Float!
  claimedRewards: String!
  pendingRewards: String!
  lpTokens: String!
}

type Mutation {
  addLiquidity(
    poolId: ID!
    baseAmount: String!
    quoteAmount: String!
  ): Transaction!
  
  removeLiquidity(
    poolId: ID!
    lpTokens: String!
  ): Transaction!
  
  claimRewards(poolId: ID!): Transaction!
}
```

---

## 5. Migration Plan

### Week 1-2: Contract Development
- Implement liquidity pool contract
- LP token system
- Reward calculation logic

### Week 3: Frontend Development
- Liquidity mining dashboard
- Add/remove liquidity UI
- Reward claiming UI

### Week 4-5: Testing & Integration
- Unit tests
- Integration tests
- Security review

### Week 6: Launch
- Deploy to testnet
- Community testing
- Production launch

---

*Implementation Plan Version: 1.0*  
*Last Updated: 2024*






