/**
 * Utility functions for formatting numbers, prices, and volumes
 */

export function formatPrice(price: number, decimals: number = 2): string {
  if (price === 0) return '0.00';
  
  // For very small prices, show more decimals
  if (price < 0.01) {
    return price.toFixed(6);
  }
  
  // For normal prices
  if (price < 1) {
    return price.toFixed(4);
  }
  
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`;
  }
  
  if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  }
  
  if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  }
  
  return volume.toFixed(2);
}

export function formatPercent(percent: number, decimals: number = 2): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(decimals)}%`;
}

export function formatCurrency(
  amount: number, 
  currency: string = 'USD',
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatCompactNumber(num: number): string {
  if (num === 0) return '0';
  
  const units = ['', 'K', 'M', 'B', 'T'];
  const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3);
  const unitValue = Math.pow(10, unitIndex * 3);
  const unitName = units[unitIndex] || '';
  
  const value = num / unitValue;
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  
  return `${value.toFixed(decimals)}${unitName}`;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) { // Less than 1 minute
    return `${Math.floor(diff / 1000)}s ago`;
  }
  
  if (diff < 3600000) { // Less than 1 hour
    return `${Math.floor(diff / 60000)}m ago`;
  }
  
  if (diff < 86400000) { // Less than 1 day
    return `${Math.floor(diff / 3600000)}h ago`;
  }
  
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function formatTokenAmount(
  amount: number, 
  decimals: number = 18, 
  displayDecimals: number = 4
): string {
  const value = amount / Math.pow(10, decimals);
  
  if (value === 0) return '0';
  
  if (value < 0.0001) {
    return '< 0.0001';
  }
  
  return value.toFixed(displayDecimals);
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`;
  }
  
  if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`;
  }
  
  if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`;
  }
  
  return `$${formatCompactNumber(marketCap)}`;
}

export function formatOrderSize(size: number, asset: string): string {
  if (size === 0) return `0 ${asset}`;
  
  if (size < 0.0001) {
    return `< 0.0001 ${asset}`;
  }
  
  if (size >= 1000) {
    return `${formatCompactNumber(size)} ${asset}`;
  }
  
  return `${size.toFixed(4)} ${asset}`;
}

export function formatPriceChange(current: number, previous: number): {
  absolute: string;
  percent: string;
  isPositive: boolean;
} {
  const absolute = current - previous;
  const percent = previous !== 0 ? (absolute / previous) * 100 : 0;
  
  return {
    absolute: `${absolute >= 0 ? '+' : ''}${formatPrice(absolute)}`,
    percent: formatPercent(percent),
    isPositive: absolute >= 0,
  };
}

export function formatTradingPair(base: string, quote: string): string {
  return `${base.toUpperCase()}/${quote.toUpperCase()}`;
}

export function parseTradingPair(pair: string): { base: string; quote: string } {
  const [base, quote] = pair.split('/');
  return { base: base.toLowerCase(), quote: quote.toLowerCase() };
}

export function formatLatency(latency: number): string {
  if (latency < 1) {
    return `${(latency * 1000).toFixed(1)}μs`;
  }
  
  if (latency < 1000) {
    return `${latency.toFixed(1)}ms`;
  }
  
  return `${(latency / 1000).toFixed(2)}s`;
}

export function formatThroughput(tps: number): string {
  if (tps >= 1e6) {
    return `${(tps / 1e6).toFixed(1)}M TPS`;
  }
  
  if (tps >= 1e3) {
    return `${(tps / 1e3).toFixed(1)}K TPS`;
  }
  
  return `${tps.toFixed(0)} TPS`;
}

export function formatGasPrice(gwei: number): string {
  if (gwei < 1) {
    return `${(gwei * 1000).toFixed(0)} mwei`;
  }
  
  return `${gwei.toFixed(1)} gwei`;
}

export function formatBlockNumber(blockNumber: number): string {
  return `#${blockNumber.toLocaleString()}`;
}

export function formatTransactionHash(hash: string): string {
  return formatAddress(hash, 8, 8);
}
