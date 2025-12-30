'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Layers, Minus } from 'lucide-react';
import { formatPrice } from '@/utils/format';

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

interface OrderBookProps {
  market: string;
}

// Generate realistic order book data
const generateOrderBook = (basePrice: number) => {
  const spread = basePrice * 0.0005; // 0.05% spread
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  
  let bidTotal = 0;
  let askTotal = 0;
  
  // Generate bids (buy orders)
  for (let i = 0; i < 15; i++) {
    const price = basePrice - spread / 2 - (i * basePrice * 0.0001);
    const size = Math.random() * 3 + 0.1;
    bidTotal += size;
    bids.push({ price, size, total: bidTotal });
  }
  
  // Generate asks (sell orders)
  for (let i = 0; i < 15; i++) {
    const price = basePrice + spread / 2 + (i * basePrice * 0.0001);
    const size = Math.random() * 3 + 0.1;
    askTotal += size;
    asks.unshift({ price, size, total: askTotal });
  }
  
  return { bids, asks };
};

export default function OrderBook({ market }: OrderBookProps) {
  const [orderBook, setOrderBook] = useState({ bids: [] as OrderBookEntry[], asks: [] as OrderBookEntry[] });
  const [viewMode, setViewMode] = useState<'both' | 'bids' | 'asks'>('both');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  
  // Get base price from market
  const basePrice = useMemo(() => {
    const prices: Record<string, number> = {
      'BTC/USDT': 45234.56,
      'ETH/USDT': 2834.67,
      'SOL/USDT': 98.45,
    };
    return prices[market] || 45000;
  }, [market]);
  
  // Update order book periodically
  useEffect(() => {
    const updateOrderBook = () => {
      const newBasePrice = basePrice + (Math.random() - 0.5) * basePrice * 0.001;
      setOrderBook(generateOrderBook(newBasePrice));
    };
    
    updateOrderBook();
    const interval = setInterval(updateOrderBook, 500 + Math.random() * 1000);
    
    return () => clearInterval(interval);
  }, [basePrice]);
  
  // Calculate max total for depth visualization
  const maxTotal = useMemo(() => {
    const maxBid = orderBook.bids.length > 0 ? (orderBook.bids[orderBook.bids.length - 1]?.total ?? 0) : 0;
    const maxAsk = orderBook.asks.length > 0 ? (orderBook.asks[0]?.total ?? 0) : 0;
    return Math.max(maxBid, maxAsk);
  }, [orderBook]);
  
  // Spread calculation
  const spread = useMemo(() => {
    if (orderBook.asks.length > 0 && orderBook.bids.length > 0) {
      const lowestAsk = orderBook.asks[orderBook.asks.length - 1]?.price || 0;
      const highestBid = orderBook.bids[0]?.price || 0;
      return {
        value: lowestAsk - highestBid,
        percentage: ((lowestAsk - highestBid) / lowestAsk) * 100
      };
    }
    return { value: 0, percentage: 0 };
  }, [orderBook]);

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-dark-900/50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary-400" />
          <h3 className="font-semibold text-white text-sm">Order Book</h3>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-0.5 glass rounded-lg border border-white/5">
          <button
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'both' 
                ? 'bg-primary-500/20 text-primary-400' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
            title="Show Both"
          >
            <div className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-bear-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-bull-400" />
            </div>
          </button>
          <button
            onClick={() => setViewMode('bids')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'bids' 
                ? 'bg-bull-500/20 text-bull-400' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
            title="Show Bids Only"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => setViewMode('asks')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewMode === 'asks' 
                ? 'bg-bear-500/20 text-bear-400' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
            title="Show Asks Only"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Column Headers */}
      <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs text-gray-500 font-medium border-b border-white/5 bg-dark-900/30">
        <span className="col-span-5">Price (USDT)</span>
        <span className="col-span-3 text-right">Size</span>
        <span className="col-span-4 text-right">Total</span>
      </div>
      
      {/* Order Book Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Asks (Sell Orders) */}
        {(viewMode === 'both' || viewMode === 'asks') && (
          <div className={`overflow-y-auto scrollbar-thin ${viewMode === 'both' ? 'flex-1' : 'flex-1'}`}>
            <div className="flex flex-col-reverse">
              <AnimatePresence mode="popLayout">
                {orderBook.asks.slice(-12).map((ask, index) => {
                  const rowId = `ask-${index}-${ask.price.toFixed(2)}`;
                  return (
                    <motion.div
                      key={rowId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                      onMouseEnter={() => setHoveredRow(rowId)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className="relative grid grid-cols-12 gap-2 py-1.5 px-4 text-xs font-mono cursor-pointer group hover:bg-bear-500/10 transition-colors"
                    >
                      {/* Depth visualization */}
                      <div 
                        className="absolute inset-y-0 right-0 bg-bear-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100"
                        style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                      />
                      
                      <span className="text-bear-400 font-semibold relative z-10 col-span-5">{formatPrice(ask.price)}</span>
                      <span className="text-right text-gray-300 relative z-10 col-span-3">{ask.size.toFixed(4)}</span>
                      <span className="text-right text-gray-500 relative z-10 col-span-4">{ask.total.toFixed(4)}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
        
        {/* Enhanced Spread Indicator */}
        {viewMode === 'both' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-4 px-4 border-y border-white/5 bg-dark-900/50 relative"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/5 to-transparent" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="text-xs text-gray-500 font-medium">Spread</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-white font-semibold">{formatPrice(spread.value)}</span>
                <span className="text-xs text-primary-400 font-medium">({spread.percentage.toFixed(3)}%)</span>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Bids (Buy Orders) */}
        {(viewMode === 'both' || viewMode === 'bids') && (
          <div className={`overflow-y-auto scrollbar-thin ${viewMode === 'both' ? 'flex-1' : 'flex-1'}`}>
            <AnimatePresence mode="popLayout">
              {orderBook.bids.slice(0, 12).map((bid, index) => {
                const rowId = `bid-${index}-${bid.price.toFixed(2)}`;
                return (
                  <motion.div
                    key={rowId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={() => setHoveredRow(rowId)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className="relative grid grid-cols-12 gap-2 py-1.5 px-4 text-xs font-mono cursor-pointer group hover:bg-bull-500/10 transition-colors"
                  >
                    {/* Depth visualization */}
                    <div 
                      className="absolute inset-y-0 right-0 bg-bull-500/10 transition-all duration-300 opacity-0 group-hover:opacity-100"
                      style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                    />
                    
                    <span className="text-bull-400 font-semibold relative z-10 col-span-5">{formatPrice(bid.price)}</span>
                    <span className="text-right text-gray-300 relative z-10 col-span-3">{bid.size.toFixed(4)}</span>
                    <span className="text-right text-gray-500 relative z-10 col-span-4">{bid.total.toFixed(4)}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
