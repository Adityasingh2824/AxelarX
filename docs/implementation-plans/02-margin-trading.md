# Implementation Plan: Margin Trading

## Overview
Implement margin trading with leverage (2x-10x) to enable users to trade with borrowed funds, increasing market liquidity and trading volume.

## Priority: High | Effort: High | Timeline: 6-8 weeks

---

## Architecture Overview

```
┌─────────────────┐
│  Margin Account │
│  - Collateral   │
│  - Positions    │
│  - Borrowed     │
└────────┬────────┘
         │
         ├──► Isolated Margin (per position)
         └──► Cross Margin (shared)
              │
              ├──► Liquidation Engine
              └──► Interest Rate Model
```

---

## 1. Core Components

### 1.1 Margin Account System

#### Contract: `contracts/margin/src/lib.rs`

```rust
use linera_sdk::base::{ContractRuntime, ServiceRuntime};
use linera_views::views::{MapView, RegisterView, ViewError};
use serde::{Deserialize, Serialize};

/// Margin account for a user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarginAccount {
    pub owner: Account,
    pub collateral: MapView<String, Amount>, // asset -> amount
    pub borrowed: MapView<String, Amount>,   // asset -> amount
    pub positions: MapView<PositionId, Position>,
    pub margin_type: MarginType,
    pub total_equity: Amount,
    pub total_debt: Amount,
    pub maintenance_margin: Amount,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MarginType {
    Isolated, // Per-position margin
    Cross,    // Shared margin across positions
}

/// Individual position
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub position_id: PositionId,
    pub market: String,
    pub side: PositionSide,
    pub size: Quantity,
    pub entry_price: Price,
    pub current_price: Price,
    pub leverage: u8, // 2x, 5x, 10x
    pub margin: Amount,
    pub pnl: Amount,
    pub liquidation_price: Price,
    pub status: PositionStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PositionSide {
    Long,
    Short,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PositionStatus {
    Open,
    Closed,
    Liquidated,
}
```

### 1.2 Collateral Management

```rust
impl MarginAccount {
    /// Add collateral to margin account
    pub fn add_collateral(
        &mut self,
        asset: String,
        amount: Amount,
    ) -> Result<(), MarginError> {
        let current = self.collateral.get(&asset).unwrap_or_default();
        self.collateral.insert(asset, current + amount);
        self.update_equity();
        Ok(())
    }
    
    /// Remove collateral (if sufficient margin)
    pub fn remove_collateral(
        &mut self,
        asset: String,
        amount: Amount,
    ) -> Result<(), MarginError> {
        let current = self.collateral.get(&asset).unwrap_or_default();
        
        if amount > current {
            return Err(MarginError::InsufficientCollateral);
        }
        
        // Check margin requirements
        if !self.has_sufficient_margin() {
            return Err(MarginError::InsufficientMargin);
        }
        
        self.collateral.insert(asset, current - amount);
        self.update_equity();
        Ok(())
    }
    
    /// Calculate total equity
    fn update_equity(&mut self) {
        let collateral_value = self.calculate_collateral_value();
        let position_value = self.calculate_position_value();
        let debt = self.total_debt;
        
        self.total_equity = collateral_value + position_value - debt;
    }
    
    /// Calculate collateral value in USD
    fn calculate_collateral_value(&self) -> Amount {
        // Sum all collateral * price
        // Implementation depends on price oracle
    }
}
```

### 1.3 Leverage & Position Opening

```rust
impl MarginAccount {
    /// Open leveraged position
    pub fn open_position(
        &mut self,
        market: String,
        side: PositionSide,
        size: Quantity,
        leverage: u8,
        entry_price: Price,
    ) -> Result<PositionId, MarginError> {
        // Validate leverage
        if leverage < 2 || leverage > 10 {
            return Err(MarginError::InvalidLeverage);
        }
        
        // Calculate required margin
        let position_value = size * entry_price;
        let required_margin = position_value / leverage as Amount;
        
        // Check if sufficient margin
        if self.total_equity < required_margin {
            return Err(MarginError::InsufficientMargin);
        }
        
        // Calculate liquidation price
        let liquidation_price = self.calculate_liquidation_price(
            entry_price,
            leverage,
            side,
        );
        
        // Create position
        let position = Position {
            position_id: self.next_position_id,
            market,
            side,
            size,
            entry_price,
            current_price: entry_price,
            leverage,
            margin: required_margin,
            pnl: Amount::ZERO,
            liquidation_price,
            status: PositionStatus::Open,
        };
        
        // Deduct margin
        match self.margin_type {
            MarginType::Isolated => {
                // Reserve margin for this position only
                self.available_margin -= required_margin;
            }
            MarginType::Cross => {
                // Margin shared across all positions
                self.total_equity -= required_margin;
            }
        }
        
        self.positions.insert(position.position_id, position);
        self.next_position_id += 1;
        
        Ok(position.position_id)
    }
    
    /// Calculate liquidation price
    fn calculate_liquidation_price(
        &self,
        entry_price: Price,
        leverage: u8,
        side: PositionSide,
    ) -> Price {
        let maintenance_margin_ratio = 0.05; // 5% maintenance margin
        
        match side {
            PositionSide::Long => {
                // For long: liquidation when price drops
                entry_price * (1 - (1.0 / leverage as f64) + maintenance_margin_ratio)
            }
            PositionSide::Short => {
                // For short: liquidation when price rises
                entry_price * (1 + (1.0 / leverage as f64) - maintenance_margin_ratio)
            }
        }
    }
}
```

### 1.4 Liquidation Engine

```rust
impl MarginAccount {
    /// Check and liquidate positions if needed
    pub fn check_liquidations(
        &mut self,
        current_prices: MapView<String, Price>,
    ) -> Result<Vec<PositionId>, MarginError> {
        let mut liquidated = Vec::new();
        
        for (position_id, mut position) in self.positions.iter_mut() {
            if position.status != PositionStatus::Open {
                continue;
            }
            
            // Update current price
            if let Some(price) = current_prices.get(&position.market) {
                position.current_price = *price;
            }
            
            // Check if liquidated
            let should_liquidate = match position.side {
                PositionSide::Long => {
                    position.current_price <= position.liquidation_price
                }
                PositionSide::Short => {
                    position.current_price >= position.liquidation_price
                }
            };
            
            if should_liquidate {
                self.liquidate_position(position_id, &mut position)?;
                liquidated.push(position_id);
            }
        }
        
        Ok(liquidated)
    }
    
    /// Liquidate a position
    fn liquidate_position(
        &mut self,
        position_id: PositionId,
        position: &mut Position,
    ) -> Result<(), MarginError> {
        // Close position at current price
        let pnl = self.calculate_pnl(position);
        
        // Deduct from equity
        self.total_equity -= pnl;
        
        // Mark as liquidated
        position.status = PositionStatus::Liquidated;
        
        // Emit liquidation event
        // ...
        
        Ok(())
    }
    
    /// Calculate P&L for position
    fn calculate_pnl(&self, position: &Position) -> Amount {
        match position.side {
            PositionSide::Long => {
                (position.current_price - position.entry_price) * position.size
            }
            PositionSide::Short => {
                (position.entry_price - position.current_price) * position.size
            }
        }
    }
}
```

---

## 2. Lending Pool Integration

### 2.1 Lending Pool Contract

```rust
// contracts/lending/src/lib.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LendingPool {
    pub asset: String,
    pub total_supplied: Amount,
    pub total_borrowed: Amount,
    pub interest_rate: InterestRate,
    pub utilization_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterestRate {
    pub base_rate: f64,      // Base interest rate
    pub slope1: f64,         // Slope before optimal utilization
    pub slope2: f64,         // Slope after optimal utilization
    pub optimal_utilization: f64, // Optimal utilization rate (e.g., 80%)
}

impl LendingPool {
    /// Calculate dynamic interest rate
    pub fn calculate_interest_rate(&self) -> f64 {
        let utilization = self.utilization_rate;
        let optimal = self.interest_rate.optimal_utilization;
        
        if utilization < optimal {
            // Linear increase
            self.interest_rate.base_rate + 
            (utilization / optimal) * self.interest_rate.slope1
        } else {
            // Steeper increase
            self.interest_rate.base_rate + 
            self.interest_rate.slope1 +
            ((utilization - optimal) / (1.0 - optimal)) * self.interest_rate.slope2
        }
    }
    
    /// Supply assets to pool
    pub fn supply(
        &mut self,
        amount: Amount,
    ) -> Result<(), LendingError> {
        self.total_supplied += amount;
        self.update_utilization_rate();
        Ok(())
    }
    
    /// Borrow from pool
    pub fn borrow(
        &mut self,
        amount: Amount,
    ) -> Result<(), LendingError> {
        if self.available_liquidity() < amount {
            return Err(LendingError::InsufficientLiquidity);
        }
        
        self.total_borrowed += amount;
        self.update_utilization_rate();
        Ok(())
    }
    
    fn update_utilization_rate(&mut self) {
        if self.total_supplied > 0 {
            self.utilization_rate = 
                self.total_borrowed as f64 / self.total_supplied as f64;
        } else {
            self.utilization_rate = 0.0;
        }
    }
}
```

---

## 3. Frontend Implementation

### 3.1 Margin Trading Interface

```typescript
// frontend/components/trading/MarginTrading.tsx

interface MarginTradingProps {
  market: string;
  leverage: number;
  marginType: 'isolated' | 'cross';
}

export const MarginTrading = ({ market, leverage, marginType }: MarginTradingProps) => {
  const [positionSize, setPositionSize] = useState('');
  const [positionSide, setPositionSide] = useState<'long' | 'short'>('long');
  const [collateral, setCollateral] = useState<Record<string, number>>({});
  
  const { marginAccount, openPosition, addCollateral } = useMargin();
  
  const requiredMargin = useMemo(() => {
    if (!positionSize) return 0;
    const positionValue = parseFloat(positionSize) * currentPrice;
    return positionValue / leverage;
  }, [positionSize, leverage, currentPrice]);
  
  const liquidationPrice = useMemo(() => {
    // Calculate based on entry price and leverage
    return calculateLiquidationPrice(entryPrice, leverage, positionSide);
  }, [entryPrice, leverage, positionSide]);
  
  return (
    <div className="space-y-6">
      {/* Leverage Selector */}
      <div>
        <label>Leverage</label>
        <select value={leverage} onChange={(e) => setLeverage(Number(e.target.value))}>
          <option value={2}>2x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
        </select>
      </div>
      
      {/* Position Side */}
      <div>
        <button
          onClick={() => setPositionSide('long')}
          className={positionSide === 'long' ? 'active' : ''}
        >
          Long
        </button>
        <button
          onClick={() => setPositionSide('short')}
          className={positionSide === 'short' ? 'active' : ''}
        >
          Short
        </button>
      </div>
      
      {/* Position Size */}
      <div>
        <label>Position Size</label>
        <input
          type="number"
          value={positionSize}
          onChange={(e) => setPositionSize(e.target.value)}
        />
      </div>
      
      {/* Margin Info */}
      <div className="bg-gray-800 p-4 rounded">
        <div className="flex justify-between">
          <span>Required Margin:</span>
          <span>{formatCurrency(requiredMargin)}</span>
        </div>
        <div className="flex justify-between">
          <span>Available Margin:</span>
          <span>{formatCurrency(marginAccount.availableMargin)}</span>
        </div>
        <div className="flex justify-between">
          <span>Liquidation Price:</span>
          <span className={isNearLiquidation ? 'text-red-400' : ''}>
            {formatPrice(liquidationPrice)}
          </span>
        </div>
      </div>
      
      {/* Open Position Button */}
      <button
        onClick={() => openPosition({
          market,
          side: positionSide,
          size: parseFloat(positionSize),
          leverage,
        })}
        disabled={requiredMargin > marginAccount.availableMargin}
        className="btn-primary w-full"
      >
        Open {positionSide === 'long' ? 'Long' : 'Short'} Position
      </button>
    </div>
  );
};
```

### 3.2 Position Management

```typescript
// frontend/components/margin/PositionManager.tsx

export const PositionManager = () => {
  const { positions, closePosition, updatePrices } = useMargin();
  
  return (
    <div className="space-y-4">
      <h2>Open Positions</h2>
      
      {positions.map(position => (
        <div key={position.id} className="card-glass p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold">
                {position.market} {position.side.toUpperCase()}
              </div>
              <div className="text-sm text-gray-400">
                Size: {position.size} | Leverage: {position.leverage}x
              </div>
            </div>
            
            <div className="text-right">
              <div className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                P&L: {formatCurrency(position.pnl)}
              </div>
              <div className="text-sm text-gray-400">
                Entry: {formatPrice(position.entryPrice)}
              </div>
              <div className="text-sm text-red-400">
                Liq: {formatPrice(position.liquidationPrice)}
              </div>
            </div>
            
            <button
              onClick={() => closePosition(position.id)}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
          
          {/* Progress bar showing distance to liquidation */}
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-400 h-2 rounded-full"
                style={{
                  width: `${calculateLiquidationDistance(position)}%`
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 4. Testing Strategy

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_open_long_position() {
        // Test opening long position with leverage
    }
    
    #[test]
    fn test_liquidation_calculation() {
        // Test liquidation price calculation
    }
    
    #[test]
    fn test_margin_requirements() {
        // Test margin requirement validation
    }
    
    #[test]
    fn test_interest_rate_calculation() {
        // Test dynamic interest rate
    }
}
```

### Integration Tests

- Test position opening/closing flow
- Test liquidation process
- Test margin calculations
- Test interest accrual

---

## 5. Security Considerations

### Risk Management

1. **Position Limits**: Max position size per user
2. **Leverage Limits**: Maximum allowed leverage
3. **Liquidation Threshold**: Minimum margin before liquidation
4. **Circuit Breakers**: Pause trading during extreme volatility
5. **Oracle Security**: Multiple price feeds

### Implementation

```rust
pub struct RiskParameters {
    pub max_position_size: Quantity,
    pub max_leverage: u8,
    pub maintenance_margin_ratio: f64, // e.g., 0.05 (5%)
    pub liquidation_penalty: f64,       // e.g., 0.05 (5%)
    pub max_utilization_rate: f64,      // e.g., 0.95 (95%)
}
```

---

## 6. API Design

### GraphQL Schema

```graphql
type MarginAccount {
  owner: Account!
  collateral: [Collateral!]!
  borrowed: [Borrowed!]!
  positions: [Position!]!
  marginType: MarginType!
  totalEquity: String!
  availableMargin: String!
  marginRatio: Float!
}

type Position {
  id: ID!
  market: String!
  side: PositionSide!
  size: String!
  entryPrice: String!
  currentPrice: String!
  leverage: Int!
  margin: String!
  pnl: String!
  liquidationPrice: String!
  status: PositionStatus!
}

type Mutation {
  openPosition(
    market: String!
    side: PositionSide!
    size: String!
    leverage: Int!
  ): Position!
  
  closePosition(positionId: ID!): Boolean!
  
  addCollateral(asset: String!, amount: String!): Boolean!
  
  removeCollateral(asset: String!, amount: String!): Boolean!
}
```

---

## 7. Migration Plan

### Phase 1: Core Infrastructure (Weeks 1-2)
- Implement margin account system
- Implement position management
- Basic liquidation logic

### Phase 2: Lending Integration (Weeks 3-4)
- Lending pool contract
- Interest rate model
- Borrowing/lending logic

### Phase 3: Frontend (Weeks 5-6)
- Margin trading UI
- Position management UI
- Real-time updates

### Phase 4: Testing & Security (Weeks 7-8)
- Comprehensive testing
- Security audit
- Performance optimization

---

## 8. Success Metrics

- **Adoption**: % of users using margin trading
- **Volume**: Trading volume from margin positions
- **Liquidation Rate**: % of positions liquidated
- **Revenue**: Interest income from lending

---

*Implementation Plan Version: 1.0*  
*Last Updated: 2024*






