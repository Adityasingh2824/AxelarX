'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/utils';

interface Trade {
  id: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: Date;
}

interface RecentTradesEnhancedProps {
  trades: Trade[];
  lastPrice: number;
  className?: string;
}

export function RecentTradesEnhanced({
  trades,
  lastPrice,
  className,
}: RecentTradesEnhancedProps) {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTradeCount = useRef(trades.length);

  // Animate when new trades come in
  useEffect(() => {
    if (trades.length > prevTradeCount.current) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
    prevTradeCount.current = trades.length;
  }, [trades.length]);

  const filteredTrades = useMemo(() => {
    if (filter === 'all') return trades;
    return trades.filter((t) => t.side === filter);
  }, [trades, filter]);

  // Calculate volume by side
  const volumeStats = useMemo(() => {
    const buyVolume = trades
      .filter((t) => t.side === 'buy')
      .reduce((sum, t) => sum + t.quantity * t.price, 0);
    const sellVolume = trades
      .filter((t) => t.side === 'sell')
      .reduce((sum, t) => sum + t.quantity * t.price, 0);
    const total = buyVolume + sellVolume;
    return {
      buyVolume,
      sellVolume,
      total,
      buyPercentage: total > 0 ? (buyVolume / total) * 100 : 50,
      sellPercentage: total > 0 ? (sellVolume / total) * 100 : 50,
    };
  }, [trades]);

  return (
    <div className={cn('bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Recent Trades</h3>
          {isAnimating && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 bg-cyan-500 rounded-full"
            />
          )}
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-gray-800/50 rounded-lg p-0.5">
          {(['all', 'buy', 'sell'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 text-xs rounded transition-colors capitalize',
                filter === f
                  ? f === 'buy'
                    ? 'bg-green-500/20 text-green-400'
                    : f === 'sell'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Volume Bar */}
      <div className="px-4 py-2 border-b border-gray-800/50">
        <div className="flex items-center gap-2 text-xs mb-1.5">
          <span className="text-green-400">Buy: ${(volumeStats.buyVolume / 1000).toFixed(1)}K</span>
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${volumeStats.buyPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-green-500 h-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${volumeStats.sellPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-red-500 h-full"
            />
          </div>
          <span className="text-red-400">Sell: ${(volumeStats.sellVolume / 1000).toFixed(1)}K</span>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500">
        <span>Price (USD)</span>
        <span>Amount</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {filteredTrades.slice(0, 50).map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={index === 0 ? { opacity: 0, x: -20, backgroundColor: trade.side === 'buy' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)' } : undefined}
              animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
              transition={{ duration: 0.3 }}
              className={cn(
                'flex items-center justify-between px-4 py-1.5 hover:bg-gray-800/30 transition-colors text-sm font-mono',
                index === 0 && isAnimating && 'bg-gray-800/20'
              )}
            >
              <span className={cn(
                'flex items-center gap-1',
                trade.side === 'buy' ? 'text-green-400' : 'text-red-400'
              )}>
                {trade.side === 'buy' ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-gray-400">
                {trade.quantity.toFixed(4)}
              </span>
              <span className="text-gray-500 text-xs text-right min-w-[60px]">
                {formatTime(trade.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTrades.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Zap className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No trades yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-800/50 text-xs text-gray-500 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Live updates
        </span>
        <span>{trades.length} trades</span>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) {
    return `${Math.floor(diff / 1000)}s`;
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
