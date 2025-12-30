'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock } from 'lucide-react';
import { formatPrice } from '@/utils/format';

interface Trade {
  id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

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
  const [trades, setTrades] = useState<Trade[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  // Get base price from market
  const basePrice = useMemo(() => {
    const prices: Record<string, number> = {
      'BTC/USDT': 45234.56,
      'ETH/USDT': 2834.67,
      'SOL/USDT': 98.45,
    };
    return prices[market] || 45000;
  }, [market]);
  
  // Generate initial trades
  useEffect(() => {
    const initialTrades: Trade[] = [];
    let price = basePrice;
    
    for (let i = 0; i < 20; i++) {
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      price += (Math.random() - 0.5) * price * 0.001;
      
      initialTrades.push({
        id: `trade-${Date.now()}-${i}`,
        price,
        size: Math.random() * 2 + 0.01,
        side,
        timestamp: Date.now() - i * 1000,
      });
    }
    
    setTrades(initialTrades);
  }, [basePrice, market]);
  
  // Add new trades periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const lastTrade = trades[0];
      if (!lastTrade) return;
      
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const priceChange = (Math.random() - 0.5) * lastTrade.price * 0.001;
      
      const newTrade: Trade = {
        id: `trade-${Date.now()}`,
        price: lastTrade.price + priceChange,
        size: Math.random() * 2 + 0.01,
        side,
        timestamp: Date.now(),
      };
      
      setTrades(prev => [newTrade, ...prev.slice(0, 49)]);
      setHighlightedId(newTrade.id);
      
      // Clear highlight after animation
      setTimeout(() => setHighlightedId(null), 500);
    }, 800 + Math.random() * 2000);
    
    return () => clearInterval(interval);
  }, [trades]);

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
