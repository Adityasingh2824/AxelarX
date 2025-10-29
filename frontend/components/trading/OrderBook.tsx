'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
import { formatPrice, formatVolume } from '@/utils/format';

interface OrderBookProps {
  market: string;
}

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

// Mock data generator
const generateOrderBookData = () => {
  const basePrice = 45000 + Math.random() * 10000;
  const spread = 50 + Math.random() * 100;
  
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  
  let total = 0;
  
  // Generate bids (buy orders) - prices below current
  for (let i = 0; i < 15; i++) {
    const price = basePrice - spread / 2 - i * (10 + Math.random() * 20);
    const size = Math.random() * 5 + 0.1;
    total += size;
    
    bids.push({
      price,
      size,
      total,
    });
  }
  
  total = 0;
  
  // Generate asks (sell orders) - prices above current
  for (let i = 0; i < 15; i++) {
    const price = basePrice + spread / 2 + i * (10 + Math.random() * 20);
    const size = Math.random() * 5 + 0.1;
    total += size;
    
    asks.unshift({
      price,
      size,
      total,
    });
  }
  
  return { bids, asks, spread: asks[asks.length - 1].price - bids[0].price };
};

export default function OrderBook({ market }: OrderBookProps) {
  const [orderBookData, setOrderBookData] = useState(generateOrderBookData());
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [view, setView] = useState<'both' | 'bids' | 'asks'>('both');

  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBookData(generateOrderBookData());
      setLastUpdate(Date.now());
    }, 1000 + Math.random() * 2000); // Random updates between 1-3 seconds
    
    return () => clearInterval(interval);
  }, [market]);

  const { bids, asks, spread } = orderBookData;
  const maxTotal = Math.max(
    bids[bids.length - 1]?.total || 0,
    asks[asks.length - 1]?.total || 0
  );

  const OrderRow = ({ 
    order, 
    type, 
    maxTotal,
    index 
  }: { 
    order: OrderBookEntry; 
    type: 'bid' | 'ask'; 
    maxTotal: number;
    index: number;
  }) => {
    const percentage = (order.total / maxTotal) * 100;
    const isBid = type === 'bid';
    
    return (
      <motion.div
        initial={{ opacity: 0, x: isBid ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`relative orderbook-row ${isBid ? 'orderbook-buy' : 'orderbook-sell'} cursor-pointer`}
        whileHover={{ scale: 1.02 }}
      >
        {/* Background bar showing depth */}
        <div
          className={`absolute inset-0 ${
            isBid ? 'bg-green-500/10' : 'bg-red-500/10'
          } transition-all duration-300`}
          style={{ 
            width: `${percentage}%`,
            right: isBid ? 0 : 'auto',
            left: isBid ? 'auto' : 0,
          }}
        />
        
        <div className="relative z-10 flex justify-between items-center">
          <span className={`font-mono text-sm ${
            isBid ? 'text-green-500' : 'text-red-500'
          }`}>
            {formatPrice(order.price)}
          </span>
          <span className="text-white text-sm">
            {order.size.toFixed(4)}
          </span>
          <span className="text-gray-400 text-xs">
            {order.total.toFixed(2)}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-white">Order Book</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-bull-500 rounded-full"
          />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex bg-dark-800 rounded-lg p-1 mb-4">
        {(['both', 'bids', 'asks'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setView(option)}
            className={`flex-1 text-xs py-1 px-2 rounded transition-all duration-200 ${
              view === option
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {option === 'both' ? 'All' : option === 'bids' ? 'Bids' : 'Asks'}
          </button>
        ))}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-4 py-2 px-2 border-b border-white/10 mb-2">
        <span className="text-xs text-gray-400 font-medium">Price</span>
        <span className="text-xs text-gray-400 font-medium text-right">Size</span>
        <span className="text-xs text-gray-400 font-medium text-right">Total</span>
      </div>

      {/* Order Book Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            {(view === 'both' || view === 'asks') && (
              <motion.div
                key="asks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-0.5"
              >
                {asks.map((ask, index) => (
                  <OrderRow
                    key={`ask-${ask.price}`}
                    order={ask}
                    type="ask"
                    maxTotal={maxTotal}
                    index={index}
                  />
                ))}
              </motion.div>
            )}

            {view === 'both' && (
              <motion.div
                key="spread"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="my-3 p-2 bg-dark-700/50 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Spread</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono text-white">
                      ${spread.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({((spread / asks[asks.length - 1].price) * 100).toFixed(3)}%)
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {(view === 'both' || view === 'bids') && (
              <motion.div
                key="bids"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-0.5"
              >
                {bids.map((bid, index) => (
                  <OrderRow
                    key={`bid-${bid.price}`}
                    order={bid}
                    type="bid"
                    maxTotal={maxTotal}
                    index={index}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-gray-400">
                      Bid: <span className="text-green-500">{formatPrice(bids[0]?.price || 0)}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-3 h-3 text-red-500" />
                    <span className="text-gray-400">
                      Ask: <span className="text-red-500">{formatPrice(asks[asks.length - 1]?.price || 0)}</span>
                    </span>
                  </div>
        </div>
        
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Zap className="w-3 h-3" />
            <span>Updated {Math.floor((Date.now() - lastUpdate) / 1000)}s ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
