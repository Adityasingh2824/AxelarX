'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TradeData } from '@/lib/priceService';
import { formatPrice } from '@/utils/format';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface OrderFlowProps {
  trades: TradeData[];
  isLoading: boolean;
}

export default function OrderFlow({ trades, isLoading }: OrderFlowProps) {
  const [timeWindow, setTimeWindow] = useState<'1m' | '5m' | '15m' | '1h'>('5m');

  const flowData = useMemo(() => {
    if (trades.length === 0) return null;

    const now = Date.now();
    const windowMs = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
    }[timeWindow];

    const recentTrades = trades.filter(t => now - t.timestamp < windowMs);
    
    const buyVolume = recentTrades
      .filter(t => t.side === 'buy')
      .reduce((sum, t) => sum + (t.price * t.quantity), 0);
    
    const sellVolume = recentTrades
      .filter(t => t.side === 'sell')
      .reduce((sum, t) => sum + (t.price * t.quantity), 0);

    const buyCount = recentTrades.filter(t => t.side === 'buy').length;
    const sellCount = recentTrades.filter(t => t.side === 'sell').length;

    const netFlow = buyVolume - sellVolume;
    const totalVolume = buyVolume + sellVolume;
    const flowRatio = totalVolume > 0 ? (netFlow / totalVolume) * 100 : 0;

    // Calculate order flow imbalance
    const priceLevels = new Map<number, { buy: number; sell: number }>();
    recentTrades.forEach(trade => {
      const level = Math.floor(trade.price / 10) * 10; // Round to nearest 10
      if (!priceLevels.has(level)) {
        priceLevels.set(level, { buy: 0, sell: 0 });
      }
      const levelData = priceLevels.get(level)!;
      if (trade.side === 'buy') {
        levelData.buy += trade.quantity;
      } else {
        levelData.sell += trade.quantity;
      }
    });

    return {
      buyVolume,
      sellVolume,
      netFlow,
      flowRatio,
      buyCount,
      sellCount,
      totalTrades: recentTrades.length,
      priceLevels: Array.from(priceLevels.entries())
        .map(([price, data]) => ({
          price,
          buy: data.buy,
          sell: data.sell,
          imbalance: data.buy - data.sell,
        }))
        .sort((a, b) => b.price - a.price),
    };
  }, [trades, timeWindow]);

  if (isLoading) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-gray-400">Loading order flow...</div>
      </div>
    );
  }

  if (!flowData) {
    return (
      <div className="card h-full flex items-center justify-center">
        <div className="text-gray-400">No trade data available</div>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white">Order Flow Analysis</h3>
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value as any)}
            className="px-3 py-1 bg-dark-800 border border-white/10 rounded text-sm text-white"
          >
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="1h">1 Hour</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-1">Buy Volume</div>
            <div className="text-bull-400 font-mono font-semibold text-lg">
              {formatPrice(flowData.buyVolume)}
            </div>
            <div className="text-xs text-gray-500">{flowData.buyCount} trades</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Sell Volume</div>
            <div className="text-bear-400 font-mono font-semibold text-lg">
              {formatPrice(flowData.sellVolume)}
            </div>
            <div className="text-xs text-gray-500">{flowData.sellCount} trades</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Net Flow Indicator */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Net Flow</span>
            <div className={`flex items-center gap-1 ${
              flowData.netFlow >= 0 ? 'text-bull-400' : 'text-bear-400'
            }`}>
              {flowData.netFlow >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-mono font-semibold">
                {flowData.netFlow >= 0 ? '+' : ''}{formatPrice(flowData.netFlow)}
              </span>
            </div>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                flowData.flowRatio >= 0 ? 'bg-bull-500' : 'bg-bear-500'
              }`}
              style={{ width: `${Math.abs(flowData.flowRatio)}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Flow Ratio: {flowData.flowRatio.toFixed(2)}%
          </div>
        </div>

        {/* Price Level Imbalance */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Price Level Imbalance</h4>
          <div className="space-y-2">
            {flowData.priceLevels.slice(0, 20).map((level, index) => {
              const maxImbalance = Math.max(
                ...flowData.priceLevels.map(l => Math.abs(l.imbalance))
              );
              const imbalancePercent = maxImbalance > 0 
                ? (Math.abs(level.imbalance) / maxImbalance) * 100 
                : 0;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-xs text-gray-400 font-mono w-20">
                    {formatPrice(level.price)}
                  </span>
                  <div className="flex-1 h-4 bg-dark-700 rounded-full overflow-hidden relative">
                    <div
                      className={`absolute h-full ${
                        level.imbalance >= 0 ? 'bg-bull-500' : 'bg-bear-500'
                      }`}
                      style={{ 
                        width: `${imbalancePercent}%`,
                        left: level.imbalance >= 0 ? '0' : 'auto',
                        right: level.imbalance < 0 ? '0' : 'auto',
                      }}
                    />
                  </div>
                  <span className={`text-xs font-mono w-16 text-right ${
                    level.imbalance >= 0 ? 'text-bull-400' : 'text-bear-400'
                  }`}>
                    {level.imbalance >= 0 ? '+' : ''}{level.imbalance.toFixed(2)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}








