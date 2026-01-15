'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent: number;
}

const MOCK_PRICES: PriceData[] = [
  { symbol: 'BTC/USD', price: 90959.45, change24h: 1234.56, changePercent: 1.38 },
  { symbol: 'ETH/USD', price: 3123.87, change24h: -45.23, changePercent: -1.43 },
  { symbol: 'SOL/USD', price: 187.45, change24h: 12.34, changePercent: 7.04 },
  { symbol: 'AVAX/USD', price: 34.56, change24h: 1.23, changePercent: 3.69 },
  { symbol: 'MATIC/USD', price: 0.8234, change24h: -0.0156, changePercent: -1.86 },
  { symbol: 'ARB/USD', price: 1.234, change24h: 0.045, changePercent: 3.79 },
  { symbol: 'OP/USD', price: 2.345, change24h: 0.089, changePercent: 3.94 },
  { symbol: 'LINK/USD', price: 18.67, change24h: 0.45, changePercent: 2.47 },
];

const PriceTile = ({ data }: { data: PriceData }) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPrice = useRef(data.price);

  useEffect(() => {
    if (data.price !== prevPrice.current) {
      setFlash(data.price > prevPrice.current ? 'up' : 'down');
      prevPrice.current = data.price;
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
  }, [data.price]);

  const isPositive = data.changePercent >= 0;

  return (
    <div
      className={cn(
        'flex-shrink-0 px-6 py-3 rounded-xl bg-gray-800/30 border border-gray-700/50 transition-all duration-300',
        flash === 'up' && 'bg-green-500/20 border-green-500/50',
        flash === 'down' && 'bg-red-500/20 border-red-500/50'
      )}
    >
      <div className="flex items-center gap-4">
        <div className="font-semibold text-white">{data.symbol}</div>
        <div className="font-mono text-lg font-medium">
          ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-sm font-medium',
            isPositive ? 'text-green-400' : 'text-red-400'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default function LivePriceTicker() {
  const [prices, setPrices] = useState<PriceData[]>(MOCK_PRICES);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev =>
        prev.map(p => {
          const change = (Math.random() - 0.5) * 0.001 * p.price;
          const newPrice = p.price + change;
          return {
            ...p,
            price: newPrice,
            change24h: p.change24h + change,
            changePercent: ((p.change24h + change) / (p.price - p.change24h)) * 100,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Duplicate prices for infinite scroll effect
  const duplicatedPrices = [...prices, ...prices];

  return (
    <div className="relative overflow-hidden">
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-dark-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-dark-950 to-transparent z-10 pointer-events-none" />

      {/* Scrolling container */}
      <motion.div
        ref={containerRef}
        className="flex gap-4"
        animate={{
          x: [0, -50 * prices.length * 8],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 60,
            ease: "linear",
          },
        }}
      >
        {duplicatedPrices.map((price, index) => (
          <PriceTile key={`${price.symbol}-${index}`} data={price} />
        ))}
      </motion.div>
    </div>
  );
}
