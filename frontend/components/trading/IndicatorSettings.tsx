'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Plus, Trash2 } from 'lucide-react';

interface IndicatorSettingsProps {
  onIndicatorsChange: (indicators: any) => void;
  onClose?: () => void;
}

export default function IndicatorSettings({ onIndicatorsChange, onClose }: IndicatorSettingsProps) {
  const [indicators, setIndicators] = useState({
    sma: [] as { period: number; color: string }[],
    ema: [] as { period: number; color: string }[],
    rsi: { visible: false, period: 14 },
    macd: { visible: false },
    bollinger: { visible: false, period: 20, stdDev: 2 },
    vwap: { visible: false },
  });

  const updateIndicators = (newIndicators: typeof indicators) => {
    setIndicators(newIndicators);
    onIndicatorsChange(newIndicators);
  };

  const addSMA = () => {
    updateIndicators({
      ...indicators,
      sma: [...indicators.sma, { period: 20, color: '#3b82f6' }],
    });
  };

  const removeSMA = (index: number) => {
    updateIndicators({
      ...indicators,
      sma: indicators.sma.filter((_, i) => i !== index),
    });
  };

  const addEMA = () => {
    updateIndicators({
      ...indicators,
      ema: [...indicators.ema, { period: 20, color: '#8b5cf6' }],
    });
  };

  const removeEMA = (index: number) => {
    updateIndicators({
      ...indicators,
      ema: indicators.ema.filter((_, i) => i !== index),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card max-w-md w-full"
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold text-white">Indicator Settings</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {/* SMA */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-white">Simple Moving Average (SMA)</label>
            <button
              onClick={addSMA}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Plus className="w-4 h-4 text-primary-400" />
            </button>
          </div>
          <div className="space-y-2">
            {indicators.sma.map((sma, index) => (
              <div key={index} className="flex items-center gap-2 glass rounded-lg p-2">
                <input
                  type="number"
                  value={sma.period}
                  onChange={(e) => {
                    const updated = [...indicators.sma];
                    updated[index].period = parseInt(e.target.value) || 20;
                    updateIndicators({ ...indicators, sma: updated });
                  }}
                  className="w-20 px-2 py-1 bg-dark-800 border border-white/10 rounded text-sm text-white"
                  min="1"
                />
                <input
                  type="color"
                  value={sma.color}
                  onChange={(e) => {
                    const updated = [...indicators.sma];
                    updated[index].color = e.target.value;
                    updateIndicators({ ...indicators, sma: updated });
                  }}
                  className="w-12 h-8 rounded border border-white/10"
                />
                <button
                  onClick={() => removeSMA(index)}
                  className="p-1 hover:bg-bear-500/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-bear-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* EMA */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-white">Exponential Moving Average (EMA)</label>
            <button
              onClick={addEMA}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Plus className="w-4 h-4 text-primary-400" />
            </button>
          </div>
          <div className="space-y-2">
            {indicators.ema.map((ema, index) => (
              <div key={index} className="flex items-center gap-2 glass rounded-lg p-2">
                <input
                  type="number"
                  value={ema.period}
                  onChange={(e) => {
                    const updated = [...indicators.ema];
                    updated[index].period = parseInt(e.target.value) || 20;
                    updateIndicators({ ...indicators, ema: updated });
                  }}
                  className="w-20 px-2 py-1 bg-dark-800 border border-white/10 rounded text-sm text-white"
                  min="1"
                />
                <input
                  type="color"
                  value={ema.color}
                  onChange={(e) => {
                    const updated = [...indicators.ema];
                    updated[index].color = e.target.value;
                    updateIndicators({ ...indicators, ema: updated });
                  }}
                  className="w-12 h-8 rounded border border-white/10"
                />
                <button
                  onClick={() => removeEMA(index)}
                  className="p-1 hover:bg-bear-500/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-bear-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RSI */}
        <div className="flex items-center justify-between glass rounded-lg p-3">
          <label className="text-sm font-medium text-white">RSI (Relative Strength Index)</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={indicators.rsi.period}
              onChange={(e) => updateIndicators({
                ...indicators,
                rsi: { ...indicators.rsi, period: parseInt(e.target.value) || 14 },
              })}
              className="w-16 px-2 py-1 bg-dark-800 border border-white/10 rounded text-sm text-white"
              min="1"
            />
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={indicators.rsi.visible}
                onChange={(e) => updateIndicators({
                  ...indicators,
                  rsi: { ...indicators.rsi, visible: e.target.checked },
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>

        {/* MACD */}
        <div className="flex items-center justify-between glass rounded-lg p-3">
          <label className="text-sm font-medium text-white">MACD</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={indicators.macd.visible}
              onChange={(e) => updateIndicators({
                ...indicators,
                macd: { visible: e.target.checked },
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {/* Bollinger Bands */}
        <div className="glass rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">Bollinger Bands</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={indicators.bollinger.visible}
                onChange={(e) => updateIndicators({
                  ...indicators,
                  bollinger: { ...indicators.bollinger, visible: e.target.checked },
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          {indicators.bollinger.visible && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400">Period</label>
                <input
                  type="number"
                  value={indicators.bollinger.period}
                  onChange={(e) => updateIndicators({
                    ...indicators,
                    bollinger: { ...indicators.bollinger, period: parseInt(e.target.value) || 20 },
                  })}
                  className="w-full px-2 py-1 bg-dark-800 border border-white/10 rounded text-sm text-white mt-1"
                  min="1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Std Dev</label>
                <input
                  type="number"
                  value={indicators.bollinger.stdDev}
                  onChange={(e) => updateIndicators({
                    ...indicators,
                    bollinger: { ...indicators.bollinger, stdDev: parseFloat(e.target.value) || 2 },
                  })}
                  className="w-full px-2 py-1 bg-dark-800 border border-white/10 rounded text-sm text-white mt-1"
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>
          )}
        </div>

        {/* VWAP */}
        <div className="flex items-center justify-between glass rounded-lg p-3">
          <label className="text-sm font-medium text-white">VWAP</label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={indicators.vwap.visible}
              onChange={(e) => updateIndicators({
                ...indicators,
                vwap: { visible: e.target.checked },
              })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>
      </div>
    </motion.div>
  );
}








