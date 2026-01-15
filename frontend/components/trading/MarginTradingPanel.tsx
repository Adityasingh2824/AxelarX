'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Zap,
  Shield,
  DollarSign,
  Percent,
  ArrowUpDown,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Tooltip, InfoTooltip } from '@/components/ui/Tooltip';

interface MarginTradingPanelProps {
  market: string;
  currentPrice: number;
  maxLeverage?: number;
  balance: {
    available: number;
    marginUsed: number;
    totalEquity: number;
  };
  onSubmit: (params: MarginOrderParams) => Promise<void>;
  className?: string;
}

interface MarginOrderParams {
  side: 'long' | 'short';
  size: number;
  leverage: number;
  orderType: 'market' | 'limit';
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  marginType: 'isolated' | 'cross';
}

const LEVERAGE_PRESETS = [1, 2, 3, 5, 10, 20, 50, 100];

export function MarginTradingPanel({
  market,
  currentPrice,
  maxLeverage = 100,
  balance,
  onSubmit,
  className,
}: MarginTradingPanelProps) {
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [size, setSize] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [marginType, setMarginType] = useState<'isolated' | 'cross'>('isolated');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate position details
  const calculations = useMemo(() => {
    const sizeNum = parseFloat(size) || 0;
    const priceNum = orderType === 'limit' ? (parseFloat(price) || currentPrice) : currentPrice;
    const stopLossNum = parseFloat(stopLoss) || 0;
    const takeProfitNum = parseFloat(takeProfit) || 0;

    const positionValue = sizeNum * priceNum;
    const requiredMargin = positionValue / leverage;
    const maintenanceMargin = positionValue * 0.005; // 0.5% maintenance margin
    
    // Liquidation price calculation (simplified)
    const marginRatio = 0.005; // 0.5%
    const liquidationPrice = side === 'long'
      ? priceNum * (1 - (1 / leverage) + marginRatio)
      : priceNum * (1 + (1 / leverage) - marginRatio);
    
    // PnL calculations
    const stopLossPnl = stopLossNum
      ? (side === 'long' 
        ? (stopLossNum - priceNum) * sizeNum 
        : (priceNum - stopLossNum) * sizeNum)
      : 0;
    
    const takeProfitPnl = takeProfitNum
      ? (side === 'long'
        ? (takeProfitNum - priceNum) * sizeNum
        : (priceNum - takeProfitNum) * sizeNum)
      : 0;
    
    // Fees (0.04% maker, 0.06% taker)
    const fee = positionValue * (orderType === 'limit' ? 0.0004 : 0.0006);
    
    return {
      positionValue,
      requiredMargin,
      maintenanceMargin,
      liquidationPrice,
      stopLossPnl,
      takeProfitPnl,
      fee,
      maxSize: (balance.available * leverage) / priceNum,
    };
  }, [size, price, currentPrice, leverage, side, orderType, stopLoss, takeProfit, balance.available]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !size) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        side,
        size: parseFloat(size),
        leverage,
        orderType,
        price: orderType === 'limit' ? parseFloat(price) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        marginType,
      });
      setSize('');
      setStopLoss('');
      setTakeProfit('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSize = (percentage: number) => {
    const maxSize = calculations.maxSize;
    setSize((maxSize * percentage / 100).toFixed(4));
  };

  return (
    <div className={cn('bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold">Margin Trading</h3>
          <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-400 rounded-full">
            {leverage}x
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Margin Type Toggle */}
          <div className="flex bg-gray-800/50 rounded-lg p-0.5">
            {(['isolated', 'cross'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setMarginType(type)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-colors capitalize',
                  marginType === type
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Side Selection */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide('long')}
            className={cn(
              'flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all',
              side === 'long'
                ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-green-400'
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Long
          </button>
          <button
            type="button"
            onClick={() => setSide('short')}
            className={cn(
              'flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all',
              side === 'short'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-red-400'
            )}
          >
            <TrendingDown className="w-4 h-4" />
            Short
          </button>
        </div>

        {/* Leverage Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">Leverage</span>
              <InfoTooltip content="Higher leverage = higher risk & potential reward" />
            </div>
            <span className="text-lg font-bold text-cyan-400">{leverage}x</span>
          </div>
          
          <input
            type="range"
            min={1}
            max={maxLeverage}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(leverage / maxLeverage) * 100}%, #1f2937 ${(leverage / maxLeverage) * 100}%, #1f2937 100%)`
            }}
          />
          
          <div className="flex justify-between mt-2 gap-1">
            {LEVERAGE_PRESETS.filter(l => l <= maxLeverage).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLeverage(l)}
                className={cn(
                  'flex-1 py-1 text-xs rounded transition-colors',
                  leverage === l
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-gray-800/50 text-gray-500 hover:text-gray-300 border border-transparent'
                )}
              >
                {l}x
              </button>
            ))}
          </div>
        </div>

        {/* Order Type */}
        <div className="grid grid-cols-2 gap-2">
          {(['market', 'limit'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setOrderType(type)}
              className={cn(
                'py-2 text-sm rounded-lg border transition-colors capitalize',
                orderType === type
                  ? 'bg-gray-800 border-gray-600 text-white'
                  : 'bg-gray-800/30 border-gray-700 text-gray-500 hover:text-gray-300'
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Price Input (for limit orders) */}
        {orderType === 'limit' && (
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Price</label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={currentPrice.toFixed(2)}
                step="0.01"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-16 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">USD</span>
            </div>
          </div>
        )}

        {/* Size Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-500">Size</label>
            <span className="text-xs text-gray-500">
              Max: <span className="text-gray-300">{calculations.maxSize.toFixed(4)}</span>
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              step="0.0001"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-16 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {market.split('/')[0]}
            </span>
          </div>
          
          {/* Quick Size Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleQuickSize(pct)}
                className="py-1.5 text-xs bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* TP/SL Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          <Shield className="w-4 h-4" />
          TP/SL & Risk Management
          <ChevronDown className={cn('w-4 h-4 transition-transform', showAdvanced && 'rotate-180')} />
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Take Profit */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-500">Take Profit</label>
                  {takeProfit && (
                    <span className={cn('text-xs', calculations.takeProfitPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {calculations.takeProfitPnl >= 0 ? '+' : ''}{calculations.takeProfitPnl.toFixed(2)} USD
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder="Price"
                    step="0.01"
                    className="w-full bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-2.5 pr-16 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-green-500/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">USD</span>
                </div>
              </div>

              {/* Stop Loss */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-500">Stop Loss</label>
                  {stopLoss && (
                    <span className={cn('text-xs', calculations.stopLossPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {calculations.stopLossPnl >= 0 ? '+' : ''}{calculations.stopLossPnl.toFixed(2)} USD
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="Price"
                    step="0.01"
                    className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 pr-16 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-red-500/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">USD</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Position Summary */}
        {size && parseFloat(size) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-gray-800/30 rounded-xl space-y-2 text-sm"
          >
            <div className="flex justify-between">
              <span className="text-gray-500">Position Value</span>
              <span className="font-medium">${calculations.positionValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Required Margin</span>
              <span className="font-medium">${calculations.requiredMargin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 flex items-center gap-1">
                Liquidation Price
                <InfoTooltip content="Position will be automatically closed at this price" />
              </span>
              <span className={cn('font-medium', side === 'long' ? 'text-red-400' : 'text-green-400')}>
                ${calculations.liquidationPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Est. Fee</span>
              <span className="text-gray-400">${calculations.fee.toFixed(2)}</span>
            </div>
          </motion.div>
        )}

        {/* Risk Warning */}
        {leverage >= 20 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">High Leverage Warning:</span> {leverage}x leverage significantly increases your risk of liquidation. Trade responsibly.
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!size || parseFloat(size) <= 0 || calculations.requiredMargin > balance.available || isSubmitting}
          className={cn(
            'w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2',
            side === 'long'
              ? 'bg-green-500 hover:bg-green-400 disabled:bg-green-500/20 text-black disabled:text-green-500/50'
              : 'bg-red-500 hover:bg-red-400 disabled:bg-red-500/20 text-white disabled:text-red-500/50'
          )}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              Opening Position...
            </>
          ) : (
            <>
              {side === 'long' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {side === 'long' ? 'Long' : 'Short'} {market.split('/')[0]}
            </>
          )}
        </button>

        {/* Margin Balance */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800">
          <div className="text-center">
            <div className="text-xs text-gray-500">Available</div>
            <div className="text-sm font-medium text-green-400">
              ${balance.available.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Margin Used</div>
            <div className="text-sm font-medium text-yellow-400">
              ${balance.marginUsed.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Equity</div>
            <div className="text-sm font-medium">
              ${balance.totalEquity.toLocaleString()}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
