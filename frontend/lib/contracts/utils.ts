/**
 * Contract Utility Functions
 * Helper functions for working with contract data
 */

/**
 * Convert price from contract format (fixed point with 1e8 scaling) to display format
 */
export function fromContractPrice(price: string | number): number {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num / 1e8;
}

/**
 * Convert price from display format to contract format (fixed point with 1e8 scaling)
 */
export function toContractPrice(price: number): string {
  return Math.round(price * 1e8).toString();
}

/**
 * Convert quantity from contract format to display format
 */
export function fromContractQuantity(quantity: string | number): number {
  const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  return num / 1e8;
}

/**
 * Convert quantity from display format to contract format
 */
export function toContractQuantity(quantity: number): string {
  return Math.round(quantity * 1e8).toString();
}

/**
 * Format contract amount to human-readable string
 */
export function formatContractAmount(amount: string | number, decimals: number = 8): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const divisor = Math.pow(10, decimals);
  return (num / divisor).toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Parse order side from contract format to frontend format
 */
export function parseOrderSide(side: 'Buy' | 'Sell'): 'buy' | 'sell' {
  return side === 'Buy' ? 'buy' : 'sell';
}

/**
 * Parse order type from contract format to frontend format
 */
export function parseOrderType(type: 'Limit' | 'Market' | 'StopLoss' | 'TakeProfit'): 'limit' | 'market' | 'stop' {
  if (type === 'StopLoss' || type === 'TakeProfit') return 'stop';
  return type.toLowerCase() as 'limit' | 'market';
}

/**
 * Parse order status from contract format to frontend format
 */
export function parseOrderStatus(status: string): 'pending' | 'filled' | 'cancelled' {
  const statusMap: Record<string, 'pending' | 'filled' | 'cancelled'> = {
    'Pending': 'pending',
    'Open': 'pending',
    'PartiallyFilled': 'pending',
    'Filled': 'filled',
    'Cancelled': 'cancelled',
    'Expired': 'cancelled',
    'Rejected': 'cancelled',
  };
  return statusMap[status] || 'pending';
}













