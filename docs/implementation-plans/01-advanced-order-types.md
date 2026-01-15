# Implementation Plan: Advanced Order Types

## Overview
Implement advanced order types (Iceberg, TWAP, Trailing Stop, OCO) to provide professional trading capabilities and attract institutional traders.

## Priority: High | Effort: Medium | Timeline: 4-6 weeks

---

## 1. Iceberg Orders

### Description
Large orders split into smaller visible portions to prevent market impact.

### Requirements
- Configurable visible quantity
- Automatic replenishment when visible portion is filled
- Total quantity hidden from order book
- Only visible portion shown in order book

### Implementation Steps

#### Contract Layer (`contracts/orderbook/src/lib.rs`)

**Step 1: Add Iceberg Order Structure**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IcebergOrder {
    pub order_id: OrderId,
    pub total_quantity: Quantity,
    pub visible_quantity: Quantity,
    pub remaining_quantity: Quantity,
    pub base_order: Order, // The visible order
}

// Add to Order struct
pub enum OrderType {
    Limit,
    Market,
    StopLoss { trigger_price: Price },
    TakeProfit { trigger_price: Price },
    Iceberg { visible_quantity: Quantity }, // NEW
}
```

**Step 2: Modify Order Placement Logic**
```rust
pub fn place_order(
    &mut self,
    order: Order,
) -> Result<OrderId, OrderBookError> {
    match order.order_type {
        OrderType::Iceberg { visible_quantity } => {
            // Validate visible quantity < total quantity
            if visible_quantity >= order.quantity {
                return Err(OrderBookError::InvalidIcebergQuantity);
            }
            
            // Create iceberg order
            let iceberg = IcebergOrder {
                order_id: self.next_order_id,
                total_quantity: order.quantity,
                visible_quantity,
                remaining_quantity: order.quantity - visible_quantity,
                base_order: Order {
                    quantity: visible_quantity,
                    ..order
                },
            };
            
            // Store iceberg order
            self.iceberg_orders.insert(iceberg.order_id, iceberg.clone());
            
            // Place visible portion
            self.place_limit_order(iceberg.base_order)?;
            
            Ok(iceberg.order_id)
        }
        // ... other order types
    }
}
```

**Step 3: Implement Replenishment Logic**
```rust
pub fn handle_order_fill(
    &mut self,
    order_id: OrderId,
    filled_quantity: Quantity,
) -> Result<(), OrderBookError> {
    // Check if this is an iceberg order
    if let Some(mut iceberg) = self.iceberg_orders.get_mut(&order_id) {
        iceberg.remaining_quantity -= filled_quantity;
        
        // Replenish if needed
        if iceberg.remaining_quantity > 0 {
            let replenish_quantity = min(
                iceberg.visible_quantity,
                iceberg.remaining_quantity,
            );
            
            // Place new visible order
            let mut new_order = iceberg.base_order.clone();
            new_order.quantity = replenish_quantity;
            self.place_limit_order(new_order)?;
        } else {
            // Iceberg order fully filled
            self.iceberg_orders.remove(&order_id);
        }
    }
    
    Ok(())
}
```

#### Frontend Layer

**Step 1: Update TradeForm Component**
```typescript
// frontend/components/trading/TradeForm.tsx

interface OrderFormData {
  // ... existing fields
  orderType: 'limit' | 'market' | 'iceberg' | 'twap' | 'trailing-stop' | 'oco';
  visibleQuantity?: number; // For iceberg orders
}

const IcebergOrderSection = () => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        Visible Quantity
        <input
          type="number"
          min={0.0001}
          step={0.0001}
          placeholder="Visible portion"
          className="mt-1 block w-full"
        />
      </label>
      <p className="text-xs text-gray-400">
        Only this amount will be visible in the order book
      </p>
    </div>
  );
};
```

**Step 2: Add Order Type Selector**
```typescript
<select
  value={orderType}
  onChange={(e) => setOrderType(e.target.value)}
  className="w-full"
>
  <option value="limit">Limit Order</option>
  <option value="market">Market Order</option>
  <option value="iceberg">Iceberg Order</option>
  <option value="twap">TWAP Order</option>
  <option value="trailing-stop">Trailing Stop</option>
  <option value="oco">OCO Order</option>
</select>
```

---

## 2. TWAP (Time-Weighted Average Price) Orders

### Description
Split large orders over time to minimize market impact.

### Requirements
- Configurable time window
- Configurable number of intervals
- Automatic execution at intervals
- Cancellation support

### Implementation Steps

#### Contract Layer

**Step 1: Add TWAP Order Structure**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TWAPOrder {
    pub order_id: OrderId,
    pub total_quantity: Quantity,
    pub remaining_quantity: Quantity,
    pub time_window: u64, // seconds
    pub intervals: u32,
    pub interval_quantity: Quantity,
    pub start_time: Timestamp,
    pub next_execution_time: Timestamp,
    pub base_order: Order,
}

// Add to state
pub struct OrderBookState {
    // ... existing fields
    pub twap_orders: MapView<OrderId, TWAPOrder>,
}
```

**Step 2: Implement TWAP Execution**
```rust
pub fn execute_twap_orders(&mut self) -> Result<(), OrderBookError> {
    let current_time = self.runtime.current_application_block().timestamp;
    
    for (order_id, mut twap) in self.twap_orders.iter_mut() {
        if current_time >= twap.next_execution_time {
            // Execute interval order
            let mut interval_order = twap.base_order.clone();
            interval_order.quantity = twap.interval_quantity;
            
            self.place_limit_order(interval_order)?;
            
            // Update TWAP order
            twap.remaining_quantity -= twap.interval_quantity;
            twap.next_execution_time = current_time + (twap.time_window / twap.intervals);
            
            // Remove if complete
            if twap.remaining_quantity == 0 {
                self.twap_orders.remove(&order_id);
            }
        }
    }
    
    Ok(())
}
```

**Step 3: Add TWAP Placement**
```rust
pub fn place_twap_order(
    &mut self,
    order: Order,
    time_window: u64,
    intervals: u32,
) -> Result<OrderId, OrderBookError> {
    let interval_quantity = order.quantity / intervals as Quantity;
    let interval_duration = time_window / intervals as u64;
    
    let twap = TWAPOrder {
        order_id: self.next_order_id,
        total_quantity: order.quantity,
        remaining_quantity: order.quantity,
        time_window,
        intervals,
        interval_quantity,
        start_time: self.runtime.current_application_block().timestamp,
        next_execution_time: self.runtime.current_application_block().timestamp + interval_duration,
        base_order: order,
    };
    
    self.twap_orders.insert(twap.order_id, twap);
    self.next_order_id += 1;
    
    Ok(twap.order_id)
}
```

#### Frontend Layer

**Step 1: TWAP Configuration UI**
```typescript
const TWAPOrderSection = () => {
  const [timeWindow, setTimeWindow] = useState(3600); // 1 hour default
  const [intervals, setIntervals] = useState(12); // 12 intervals
  
  return (
    <div className="space-y-4">
      <div>
        <label>Time Window (seconds)</label>
        <input
          type="number"
          value={timeWindow}
          onChange={(e) => setTimeWindow(Number(e.target.value))}
          min={60}
          step={60}
        />
        <p className="text-xs text-gray-400">
          Total time to execute: {timeWindow / 60} minutes
        </p>
      </div>
      
      <div>
        <label>Number of Intervals</label>
        <input
          type="number"
          value={intervals}
          onChange={(e) => setIntervals(Number(e.target.value))}
          min={2}
          max={100}
        />
        <p className="text-xs text-gray-400">
          Order will be split into {intervals} equal parts
        </p>
      </div>
    </div>
  );
};
```

---

## 3. Trailing Stop Orders

### Description
Dynamic stop-loss that follows price movement.

### Requirements
- Configurable trailing amount (fixed or percentage)
- Update stop price as favorable price moves
- Execute when stop price is hit
- Support for both buy and sell orders

### Implementation Steps

#### Contract Layer

**Step 1: Add Trailing Stop Structure**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrailingStopOrder {
    pub order_id: OrderId,
    pub side: OrderSide,
    pub quantity: Quantity,
    pub trailing_amount: Price, // Fixed amount
    pub trailing_percent: u8, // Percentage (0-100)
    pub current_stop_price: Price,
    pub best_price_seen: Price, // Track best price for trailing
    pub base_order: Order,
}

// Add to state
pub struct OrderBookState {
    // ... existing fields
    pub trailing_stop_orders: MapView<OrderId, TrailingStopOrder>,
}
```

**Step 2: Update Trailing Stop on Price Change**
```rust
pub fn update_trailing_stops(
    &mut self,
    current_price: Price,
) -> Result<(), OrderBookError> {
    for (order_id, mut trailing) in self.trailing_stop_orders.iter_mut() {
        match trailing.side {
            OrderSide::Buy => {
                // For buy orders, trail upward
                if current_price > trailing.best_price_seen {
                    trailing.best_price_seen = current_price;
                    
                    // Calculate new stop price
                    let new_stop = if trailing.trailing_percent > 0 {
                        current_price - (current_price * trailing.trailing_percent as Price / 10000)
                    } else {
                        current_price - trailing.trailing_amount
                    };
                    
                    trailing.current_stop_price = new_stop;
                }
                
                // Check if stop triggered
                if current_price <= trailing.current_stop_price {
                    // Execute stop order
                    self.execute_trailing_stop(&trailing)?;
                    self.trailing_stop_orders.remove(&order_id);
                }
            }
            OrderSide::Sell => {
                // For sell orders, trail downward
                if current_price < trailing.best_price_seen || trailing.best_price_seen == 0 {
                    trailing.best_price_seen = current_price;
                    
                    // Calculate new stop price
                    let new_stop = if trailing.trailing_percent > 0 {
                        current_price + (current_price * trailing.trailing_percent as Price / 10000)
                    } else {
                        current_price + trailing.trailing_amount
                    };
                    
                    trailing.current_stop_price = new_stop;
                }
                
                // Check if stop triggered
                if current_price >= trailing.current_stop_price {
                    // Execute stop order
                    self.execute_trailing_stop(&trailing)?;
                    self.trailing_stop_orders.remove(&order_id);
                }
            }
        }
    }
    
    Ok(())
}
```

#### Frontend Layer

**Step 1: Trailing Stop Configuration**
```typescript
const TrailingStopSection = () => {
  const [trailingType, setTrailingType] = useState<'amount' | 'percent'>('percent');
  const [trailingValue, setTrailingValue] = useState(5); // 5%
  
  return (
    <div className="space-y-4">
      <div>
        <label>Trailing Type</label>
        <select
          value={trailingType}
          onChange={(e) => setTrailingType(e.target.value as 'amount' | 'percent')}
        >
          <option value="percent">Percentage</option>
          <option value="amount">Fixed Amount</option>
        </select>
      </div>
      
      <div>
        <label>
          {trailingType === 'percent' ? 'Trailing Percentage' : 'Trailing Amount'}
        </label>
        <input
          type="number"
          value={trailingValue}
          onChange={(e) => setTrailingValue(Number(e.target.value))}
          min={0.01}
          step={0.01}
        />
        {trailingType === 'percent' && (
          <p className="text-xs text-gray-400">
            Stop will trail {trailingValue}% behind best price
          </p>
        )}
      </div>
    </div>
  );
};
```

---

## 4. OCO (One-Cancels-Other) Orders

### Description
Place two orders simultaneously; when one executes, cancel the other.

### Requirements
- Link two orders together
- Automatic cancellation on execution
- Support for limit/stop combinations
- Both orders must be same side (both buy or both sell)

### Implementation Steps

#### Contract Layer

**Step 1: Add OCO Order Structure**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OCOOrder {
    pub oco_id: OrderId,
    pub primary_order_id: OrderId,
    pub secondary_order_id: OrderId,
    pub status: OCOStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OCOStatus {
    Active,
    PrimaryFilled,
    SecondaryFilled,
    Cancelled,
}

// Add to state
pub struct OrderBookState {
    // ... existing fields
    pub oco_orders: MapView<OrderId, OCOOrder>,
    pub order_to_oco: MapView<OrderId, OrderId>, // Map order_id -> oco_id
}
```

**Step 2: Implement OCO Placement**
```rust
pub fn place_oco_order(
    &mut self,
    primary_order: Order,
    secondary_order: Order,
) -> Result<OrderId, OrderBookError> {
    // Validate both orders are same side
    if primary_order.side != secondary_order.side {
        return Err(OrderBookError::InvalidOCOSide);
    }
    
    // Place both orders
    let primary_id = self.place_order(primary_order)?;
    let secondary_id = self.place_order(secondary_order)?;
    
    // Create OCO relationship
    let oco = OCOOrder {
        oco_id: self.next_order_id,
        primary_order_id: primary_id,
        secondary_order_id: secondary_id,
        status: OCOStatus::Active,
    };
    
    self.oco_orders.insert(oco.oco_id, oco.clone());
    self.order_to_oco.insert(primary_id, oco.oco_id);
    self.order_to_oco.insert(secondary_id, oco.oco_id);
    
    Ok(oco.oco_id)
}
```

**Step 3: Handle OCO Execution**
```rust
pub fn handle_order_fill(
    &mut self,
    order_id: OrderId,
    filled_quantity: Quantity,
) -> Result<(), OrderBookError> {
    // Check if this order is part of an OCO
    if let Some(oco_id) = self.order_to_oco.get(&order_id) {
        if let Some(mut oco) = self.oco_orders.get_mut(&oco_id) {
            // Determine which order was filled
            let other_order_id = if order_id == oco.primary_order_id {
                oco.status = OCOStatus::PrimaryFilled;
                oco.secondary_order_id
            } else {
                oco.status = OCOStatus::SecondaryFilled;
                oco.primary_order_id
            };
            
            // Cancel the other order
            self.cancel_order(other_order_id)?;
            
            // Clean up OCO
            self.order_to_oco.remove(&order_id);
            self.order_to_oco.remove(&other_order_id);
        }
    }
    
    // ... rest of fill handling
    Ok(())
}
```

#### Frontend Layer

**Step 1: OCO Order Form**
```typescript
const OCOOrderSection = () => {
  const [primaryPrice, setPrimaryPrice] = useState('');
  const [secondaryPrice, setSecondaryPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  
  return (
    <div className="space-y-4">
      <div>
        <label>Primary Order Price (Limit)</label>
        <input
          type="number"
          value={primaryPrice}
          onChange={(e) => setPrimaryPrice(e.target.value)}
          placeholder="e.g., 50000"
        />
      </div>
      
      <div>
        <label>Secondary Order Price (Stop)</label>
        <input
          type="number"
          value={secondaryPrice}
          onChange={(e) => setSecondaryPrice(e.target.value)}
          placeholder="e.g., 48000"
        />
      </div>
      
      <div>
        <label>Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      
      <p className="text-xs text-gray-400">
        When one order executes, the other will be automatically cancelled
      </p>
    </div>
  );
};
```

---

## Testing Strategy

### Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_iceberg_order_placement() {
        // Test iceberg order creation
    }
    
    #[test]
    fn test_iceberg_replenishment() {
        // Test automatic replenishment
    }
    
    #[test]
    fn test_twap_execution() {
        // Test TWAP interval execution
    }
    
    #[test]
    fn test_trailing_stop_update() {
        // Test trailing stop price updates
    }
    
    #[test]
    fn test_oco_cancellation() {
        // Test OCO automatic cancellation
    }
}
```

### Integration Tests
- Test order execution flow
- Test order cancellation
- Test order matching with advanced orders
- Test error handling

---

## Frontend Integration

### Update Order Book Display
```typescript
// Show iceberg orders with special indicator
const OrderBookRow = ({ order }) => {
  const isIceberg = order.type === 'iceberg';
  
  return (
    <tr>
      <td>
        {order.price}
        {isIceberg && <span className="text-xs text-blue-400">(Iceberg)</span>}
      </td>
      <td>{order.visibleQuantity || order.quantity}</td>
    </tr>
  );
};
```

### Update Order History
```typescript
// Show advanced order types in history
const OrderHistoryRow = ({ order }) => {
  return (
    <tr>
      <td>{order.id}</td>
      <td>{order.type}</td>
      <td>{order.status}</td>
      {order.type === 'iceberg' && (
        <td className="text-xs">
          {order.filledQuantity} / {order.totalQuantity}
        </td>
      )}
    </tr>
  );
};
```

---

## API Changes

### GraphQL Schema Updates
```graphql
type Order {
  id: ID!
  type: OrderType!
  # ... existing fields
  icebergConfig: IcebergConfig
  twapConfig: TWAPConfig
  trailingStopConfig: TrailingStopConfig
  ocoConfig: OCOConfig
}

type IcebergConfig {
  visibleQuantity: String!
  totalQuantity: String!
  remainingQuantity: String!
}

type TWAPConfig {
  timeWindow: Int!
  intervals: Int!
  intervalQuantity: String!
  nextExecutionTime: Int!
}

type TrailingStopConfig {
  trailingAmount: String
  trailingPercent: Int
  currentStopPrice: String!
  bestPriceSeen: String!
}

type OCOConfig {
  primaryOrderId: ID!
  secondaryOrderId: ID!
  status: OCOStatus!
}
```

---

## Migration Plan

1. **Week 1-2**: Contract implementation
   - Add data structures
   - Implement core logic
   - Write unit tests

2. **Week 3**: Frontend UI
   - Create order form components
   - Update order book display
   - Add order history views

3. **Week 4**: Integration & Testing
   - End-to-end testing
   - Performance testing
   - Security review

4. **Week 5-6**: Documentation & Deployment
   - User documentation
   - API documentation
   - Deployment to testnet
   - Production deployment

---

## Success Metrics

- **Adoption**: % of orders using advanced types
- **Performance**: Order execution time
- **User Satisfaction**: User feedback
- **Error Rate**: Failed advanced orders

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex logic bugs | High | Comprehensive testing, code review |
| Gas cost increase | Medium | Optimize contract code |
| Frontend complexity | Medium | Component-based architecture |
| User confusion | Low | Clear UI, tooltips, documentation |

---

*Implementation Plan Version: 1.0*  
*Last Updated: 2024*






