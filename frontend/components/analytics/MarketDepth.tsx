'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { OrderBookData } from '@/lib/priceService';
import { formatPrice } from '@/utils/format';

interface MarketDepthProps {
  orderBook: OrderBookData | null;
  isLoading: boolean;
}

export default function MarketDepth({ orderBook, isLoading }: MarketDepthProps) {
  const depthData = useMemo(() => {
    if (!orderBook) return null;

    const maxBidQty = Math.max(...orderBook.bids.map(b => b.quantity), 0);
    const maxAskQty = Math.max(...orderBook.asks.map(a => a.quantity), 0);
    const maxQty = Math.max(maxBidQty, maxAskQty);

    // Get best bid/ask
    const bestBid = orderBook.bids[0];
    const bestAsk = orderBook.asks[0];
    const spread = bestAsk && bestBid ? bestAsk.price - bestBid.price : 0;
    const spreadPercent = bestAsk && bestBid ? (spread / bestBid.price) * 100 : 0;

    return {
      bids: orderBook.bids.map(bid => ({
        ...bid,
        widthPercent: (bid.quantity / maxQty) * 100,
      })),
      asks: orderBook.asks.map(ask => ({
        ...ask,
        widthPercent: (ask.quantity / maxQty) * 100,
      })),
      bestBid,
      bestAsk,
      spread,
      spreadPercent,
    };
  }, [orderBook]);

  if (isLoading) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-gray-400">Loading market depth...</div>
      </div>
    );
  }

  if (!depthData) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-gray-400">No order book data available</div>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="p-4 border-b border-white/5">
        <h3 className="font-semibold text-white mb-2">Market Depth</h3>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-400">Best Bid: </span>
            <span className="text-bull-400 font-mono font-semibold">
              {formatPrice(depthData.bestBid?.price || 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Best Ask: </span>
            <span className="text-bear-400 font-mono font-semibold">
              {formatPrice(depthData.bestAsk?.price || 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Spread: </span>
            <span className="text-white font-mono">
              {formatPrice(depthData.spread)} ({depthData.spreadPercent.toFixed(3)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {/* Asks (Sell Orders) */}
          {depthData.asks.slice(0, 20).reverse().map((ask, index) => (
            <motion.div
              key={`ask-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="relative h-6 flex items-center"
            >
              <div
                className="absolute right-0 h-full bg-bear-500/30 rounded"
                style={{ width: `${ask.widthPercent}%` }}
              />
              <div className="relative z-10 flex items-center justify-between w-full px-2 text-xs">
                <span className="text-bear-400 font-mono">{formatPrice(ask.price)}</span>
                <span className="text-gray-400 font-mono">{ask.quantity.toFixed(4)}</span>
              </div>
            </motion.div>
          ))}

          {/* Spread Line */}
          <div className="h-px bg-white/20 my-2" />

          {/* Bids (Buy Orders) */}
          {depthData.bids.slice(0, 20).map((bid, index) => (
            <motion.div
              key={`bid-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="relative h-6 flex items-center"
            >
              <div
                className="absolute left-0 h-full bg-bull-500/30 rounded"
                style={{ width: `${bid.widthPercent}%` }}
              />
              <div className="relative z-10 flex items-center justify-between w-full px-2 text-xs">
                <span className="text-bull-400 font-mono">{formatPrice(bid.price)}</span>
                <span className="text-gray-400 font-mono">{bid.quantity.toFixed(4)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}








