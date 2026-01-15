'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { calculateRSI, calculateMACD, calculateStochastic } from '@/lib/indicators';
import { Candlestick } from '@/lib/priceService';

interface IndicatorPanelProps {
  candles: Candlestick[];
  onClose?: () => void;
}

export default function IndicatorPanel({ candles, onClose }: IndicatorPanelProps) {
  const [activeIndicator, setActiveIndicator] = useState<'rsi' | 'macd' | 'stochastic' | null>(null);

  const closes = candles.map(c => c.close);
  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes);
  const stochastic = calculateStochastic(candles);

  const indicators = [
    {
      id: 'rsi' as const,
      name: 'RSI',
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      currentValue: rsi[rsi.length - 1],
      status: rsi[rsi.length - 1] > 70 ? 'overbought' : rsi[rsi.length - 1] < 30 ? 'oversold' : 'neutral',
    },
    {
      id: 'macd' as const,
      name: 'MACD',
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      currentValue: macd.macd[macd.macd.length - 1],
      status: macd.histogram[macd.histogram.length - 1] > 0 ? 'bullish' : 'bearish',
    },
    {
      id: 'stochastic' as const,
      name: 'Stochastic',
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      currentValue: stochastic.k[stochastic.k.length - 1],
      status: stochastic.k[stochastic.k.length - 1] > 80 ? 'overbought' : stochastic.k[stochastic.k.length - 1] < 20 ? 'oversold' : 'neutral',
    },
  ];

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="font-semibold text-white">Indicators</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {indicators.map((indicator) => {
          const Icon = indicator.icon;
          const value = indicator.currentValue;
          const isNaN = typeof value === 'number' && isNaN(value);

          return (
            <motion.button
              key={indicator.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveIndicator(activeIndicator === indicator.id ? null : indicator.id)}
              className={`w-full p-3 rounded-xl border transition-all ${
                activeIndicator === indicator.id
                  ? 'border-primary-500/50 bg-primary-500/10'
                  : 'border-white/5 hover:border-white/10 bg-dark-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${indicator.bgColor}`}>
                    <Icon className={`w-4 h-4 ${indicator.color}`} />
                  </div>
                  <span className="font-semibold text-white">{indicator.name}</span>
                </div>
                {!isNaN && (
                  <span className={`text-sm font-mono ${
                    indicator.status === 'bullish' || indicator.status === 'oversold'
                      ? 'text-bull-400'
                      : indicator.status === 'bearish' || indicator.status === 'overbought'
                      ? 'text-bear-400'
                      : 'text-gray-400'
                  }`}>
                    {typeof value === 'number' ? value.toFixed(2) : 'N/A'}
                  </span>
                )}
              </div>

              {!isNaN && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded ${
                    indicator.status === 'bullish' || indicator.status === 'oversold'
                      ? 'bg-bull-500/20 text-bull-400'
                      : indicator.status === 'bearish' || indicator.status === 'overbought'
                      ? 'bg-bear-500/20 text-bear-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {indicator.status}
                  </span>
                </div>
              )}

              <AnimatePresence>
                {activeIndicator === indicator.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/5"
                  >
                    {indicator.id === 'rsi' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Oversold: &lt;30</span>
                          <span>Overbought: &gt;70</span>
                        </div>
                        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-bear-500 via-gray-500 to-bull-500"
                            style={{ width: `${Math.min(Math.max((value || 50) / 100 * 100, 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {indicator.id === 'macd' && (
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">MACD:</span>
                          <span className="text-white font-mono">{macd.macd[macd.macd.length - 1]?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Signal:</span>
                          <span className="text-white font-mono">{macd.signal[macd.signal.length - 1]?.toFixed(4) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Histogram:</span>
                          <span className={`font-mono ${
                            (macd.histogram[macd.histogram.length - 1] || 0) > 0 ? 'text-bull-400' : 'text-bear-400'
                          }`}>
                            {macd.histogram[macd.histogram.length - 1]?.toFixed(4) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                    {indicator.id === 'stochastic' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Oversold: &lt;20</span>
                          <span>Overbought: &gt;80</span>
                        </div>
                        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-bear-500 via-gray-500 to-bull-500"
                            style={{ width: `${Math.min(Math.max((value || 50) / 100 * 100, 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}








