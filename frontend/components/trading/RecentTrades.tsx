'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useRecentTrades } from '@/hooks/useMarketData';
import { formatPrice, formatTimeAgo } from '@/utils/format';

interface RecentTradesProps {
  market: string;
}

export default function RecentTrades({ market }: RecentTradesProps) {
  const trades = useRecentTrades(market);

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-white">Recent Trades</h3>
        </div>
        <div className="text-xs text-gray-400">
          {trades.length} trades
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-2 py-2 px-2 border-b border-white/10 mb-2">
        <span className="text-xs text-gray-400 font-medium">Price</span>
        <span className="text-xs text-gray-400 font-medium text-right">Size</span>
        <span className="text-xs text-gray-400 font-medium text-right">Time</span>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin">
          <AnimatePresence initial={false}>
            {trades.map((trade, index) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: trade.side === 'buy' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: trade.side === 'buy' ? -20 : 20 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className={`grid grid-cols-3 gap-2 py-1.5 px-2 text-sm hover:bg-white/5 transition-colors duration-150 rounded cursor-pointer ${
                  trade.side === 'buy' ? 'hover:bg-green-500/5' : 'hover:bg-red-500/5'
                }`}
              >
                {/* Price with side indicator */}
                <div className="flex items-center space-x-1">
                  {trade.side === 'buy' ? (
                    <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500 flex-shrink-0" />
                  )}
                  <span className={`font-mono text-xs ${
                    trade.side === 'buy' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPrice(trade.price)}
                  </span>
                </div>

                {/* Size */}
                <div className="text-right">
                  <span className="text-white text-xs font-mono">
                    {trade.size.toFixed(4)}
                  </span>
                </div>

                {/* Time */}
                <div className="text-right">
                  <span className="text-gray-400 text-xs">
                    {formatTimeAgo(trade.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Buy Volume:</span>
            <span className="text-green-500 font-mono">
              {trades
                .filter(t => t.side === 'buy')
                .reduce((sum, t) => sum + t.size, 0)
                .toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Sell Volume:</span>
            <span className="text-red-500 font-mono">
              {trades
                .filter(t => t.side === 'sell')
                .reduce((sum, t) => sum + t.size, 0)
                .toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center space-x-1 text-xs text-gray-500"
          >
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            <span>Live feed active</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
