'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, TrendingUp, TrendingDown, RefreshCw, Trash2 } from 'lucide-react';
import { usePriceAlerts, useUser } from '@/hooks/useSupabase';
import { formatCurrency, formatTimeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: string;
  currentPrice: number;
  walletAddress?: string;
}

export function PriceAlertModal({
  isOpen,
  onClose,
  market,
  currentPrice,
  walletAddress,
}: PriceAlertModalProps) {
  const { user } = useUser(walletAddress);
  const { alerts, addAlert, removeAlert, loading } = usePriceAlerts(user?.id);
  
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const marketAlerts = alerts.filter(a => a.market === market);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addAlert(market, condition, targetPrice, repeat);
      setTargetPrice('');
      setRepeat(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPrice = (percentage: number) => {
    const newPrice = currentPrice * (1 + percentage / 100);
    setTargetPrice(newPrice.toFixed(2));
    setCondition(percentage > 0 ? 'above' : 'below');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="font-semibold">Price Alerts</h2>
                  <p className="text-sm text-gray-400">{market}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Price */}
            <div className="p-4 bg-gray-800/30 border-b border-gray-800">
              <div className="text-sm text-gray-400">Current Price</div>
              <div className="text-2xl font-bold">{formatCurrency(currentPrice)}</div>
            </div>

            {/* Create Alert Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Condition Selector */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Alert when price goes</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCondition('above')}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors',
                      condition === 'above'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Above
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition('below')}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors',
                      condition === 'below'
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                    )}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Below
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Target Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-8 py-3 text-lg font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                  />
                </div>

                {/* Quick Price Buttons */}
                <div className="flex gap-2 mt-2">
                  {[
                    { label: '-10%', value: -10 },
                    { label: '-5%', value: -5 },
                    { label: '+5%', value: 5 },
                    { label: '+10%', value: 10 },
                  ].map((btn) => (
                    <button
                      key={btn.value}
                      type="button"
                      onClick={() => handleQuickPrice(btn.value)}
                      className={cn(
                        'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                        btn.value > 0
                          ? 'border-green-500/20 text-green-400 hover:bg-green-500/10'
                          : 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repeat Option */}
              <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Repeat alert after triggered</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRepeat(!repeat)}
                  className={cn(
                    'w-10 h-6 rounded-full transition-colors relative',
                    repeat ? 'bg-cyan-500' : 'bg-gray-700'
                  )}
                >
                  <motion.div
                    animate={{ x: repeat ? 16 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                  />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!targetPrice || isSubmitting}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    Create Alert
                  </>
                )}
              </button>
            </form>

            {/* Existing Alerts */}
            {marketAlerts.length > 0 && (
              <div className="border-t border-gray-800">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    Active Alerts ({marketAlerts.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {marketAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          {alert.condition === 'above' ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <div>
                            <div className="text-sm font-medium">
                              {alert.condition === 'above' ? 'Above' : 'Below'}{' '}
                              {formatCurrency(parseFloat(alert.target_price))}
                            </div>
                            <div className="text-xs text-gray-500">
                              Created {formatTimeAgo(alert.created_at)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeAlert(alert.id)}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
