'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Loader2 } from 'lucide-react';
import { formatPrice } from '@/utils/format';
import { useRecentTrades, Trade } from '@/hooks/useMarketData';

interface RecentTradesProps {
  market: string;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

export default function RecentTrades({ market }: RecentTradesProps) {
  const { trades, isLoading } = useRecentTrades(market);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [prevTradeCount, setPrevTradeCount] = useState(0);
  
  // Highlight new trades
  useEffect(() => {
    if (trades.length > prevTradeCount && trades[0]) {
      setHighlightedId(trades[0].id);
      setTimeout(() => setHighlightedId(null), 500);
    }
    setPrevTradeCount(trades.length);
  }, [trades.length, prevTradeCount]);

  if (isLoading) {
    return (
      <div className="card h-64 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-400" />
            <h3 className="font-semibold text-white text-sm">Recent Trades</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="card h-64 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary-400" />
          <h3 className="font-semibold text-white text-sm">Recent Trades</h3>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-bull-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>
      
      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-2 py-2 text-xs text-gray-500 border-b border-white/5">
        <span>Price (USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>
      
      {/* Trades List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {trades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -20, backgroundColor: trade.side === 'buy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                backgroundColor: highlightedId === trade.id 
                  ? (trade.side === 'buy' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)')
                  : 'transparent'
              }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-3 gap-2 py-1.5 px-1 text-xs font-mono hover:bg-white/5 transition-colors rounded"
            >
              <span className={trade.side === 'buy' ? 'text-bull-400' : 'text-bear-400'}>
                {formatPrice(trade.price)}
              </span>
              <span className="text-right text-gray-300">
                {trade.size.toFixed(4)}
              </span>
              <span className="text-right text-gray-500">
                {formatTime(trade.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
