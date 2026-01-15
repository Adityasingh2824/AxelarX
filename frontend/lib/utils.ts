import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string, options?: {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
}) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '$0.00';
  
  if (options?.compact && Math.abs(numValue) >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const tier = Math.floor(Math.log10(Math.abs(numValue)) / 3);
    const scaled = numValue / Math.pow(10, tier * 3);
    return `$${scaled.toFixed(1)}${suffixes[tier]}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: options?.currency || 'USD',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(numValue);
}

export function formatNumber(value: number | string, options?: {
  decimals?: number;
  compact?: boolean;
}) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  if (options?.compact && Math.abs(numValue) >= 1000) {
    const suffixes = ['', 'K', 'M', 'B', 'T'];
    const tier = Math.floor(Math.log10(Math.abs(numValue)) / 3);
    const scaled = numValue / Math.pow(10, tier * 3);
    return `${scaled.toFixed(1)}${suffixes[tier]}`;
  }
  
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: options?.decimals ?? 0,
    maximumFractionDigits: options?.decimals ?? 2,
  });
}

export function formatPercentage(value: number, options?: {
  decimals?: number;
  showSign?: boolean;
}) {
  const formatted = value.toFixed(options?.decimals ?? 2);
  const sign = options?.showSign && value > 0 ? '+' : '';
  return `${sign}${formatted}%`;
}

export function formatPrice(price: number | string, decimals = 2) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) return '$0.00';
  
  // Use more decimals for small prices
  if (numPrice < 1) decimals = 4;
  if (numPrice < 0.01) decimals = 6;
  
  return formatCurrency(numPrice, { maximumFractionDigits: decimals });
}

export function formatQuantity(quantity: number | string, decimals = 4) {
  const numQuantity = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  
  if (isNaN(numQuantity)) return '0';
  
  return numQuantity.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatAddress(address: string, chars = 4) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return then.toLocaleDateString();
}

export function formatDateTime(date: Date | string, options?: {
  includeTime?: boolean;
  includeSeconds?: boolean;
}) {
  const d = new Date(date);
  
  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
  
  if (!options?.includeTime) return dateStr;
  
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: options.includeSeconds ? '2-digit' : undefined,
  });
  
  return `${dateStr} ${timeStr}`;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  
  // Fallback
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  const success = document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve(success);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// Color utilities
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-green-400';
  if (change < 0) return 'text-red-400';
  return 'text-gray-400';
}

export function getPriceChangeBg(change: number): string {
  if (change > 0) return 'bg-green-500/10';
  if (change < 0) return 'bg-red-500/10';
  return 'bg-gray-500/10';
}
