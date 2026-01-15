'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Settings,
  Info,
  Loader2,
  ChevronDown,
  AlertTriangle,
  Check,
  Zap,
  Clock,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, InfoTooltip } from '@/components/ui/Tooltip';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market' | 'stop-limit' | 'trailing-stop' | 'twap' | 'iceberg';

interface AdvancedOrderFormProps {
  market: string;
  currentPrice: number;
  balance: {
    base: number;
    quote: number;
    baseSymbol: string;
    quoteSymbol: string;
  };
  onSubmit: (order: OrderParams) => Promise<void>;
  className?: string;
}

interface OrderParams {
  side: OrderSide;
  type: OrderType;
  price?: number;
  quantity: number;
  stopPrice?: number;
  trailingPercent?: number;
  twapDuration?: number;
  twapIntervals?: number;
  icebergVisible?: number;
  reduceOnly?: boolean;
  postOnly?: boolean;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

const ORDER_TYPES: { value: OrderType; label: string; icon: typeof Zap; description: string }[] = [
  { 
    value: 'limit', 
    label: 'Limit', 
    icon: Zap, 
    description: 'Execute at a specific price or better' 
  },
  { 
    value: 'market', 
    label: 'Market', 
    icon: Zap, 
    description: 'Execute immediately at best available price' 
  },
  { 
    value: 'stop-limit', 
    label: 'Stop Limit', 
    icon: AlertTriangle, 
    description: 'Limit order triggered when stop price is reached' 
  },
  { 
    value: 'trailing-stop', 
    label: 'Trailing Stop', 
    icon: TrendingUp, 
    description: 'Dynamic stop that follows price by percentage' 
  },
  { 
    value: 'twap', 
    label: 'TWAP', 
    icon: Clock, 
    description: 'Split order over time to minimize impact' 
  },
  { 
    value: 'iceberg', 
    label: 'Iceberg', 
    icon: Layers, 
    description: 'Hide total order size, show only a portion' 
  },
];

export function AdvancedOrderForm({
  market,
  currentPrice,
  balance,
  onSubmit,
  className,
}: AdvancedOrderFormProps) {
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [trailingPercent, setTrailingPercent] = useState('1');
  const [twapDuration, setTwapDuration] = useState('60');
  const [twapIntervals, setTwapIntervals] = useState('10');
  const [icebergVisible, setIcebergVisible] = useState('');
  const [reduceOnly, setReduceOnly] = useState(false);
  const [postOnly, setPostOnly] = useState(false);
  const [timeInForce, setTimeInForce] = useState<'GTC' | 'IOC' | 'FOK'>('GTC');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrderTypes, setShowOrderTypes] = useState(false);

  const priceRef = useRef<HTMLInputElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);

  // Calculate order value
  const orderValue = parseFloat(price || currentPrice.toString()) * parseFloat(quantity || '0');
  const availableBalance = side === 'buy' ? balance.quote : balance.base;
  const maxQuantity = side === 'buy' 
    ? balance.quote / (parseFloat(price) || currentPrice) 
    : balance.base;

  // Percentage buttons
  const handlePercentage = (percent: number) => {
    const max = side === 'buy' 
      ? balance.quote / (parseFloat(price) || currentPrice)
      : balance.base;
    setQuantity((max * percent / 100).toFixed(6));
  };

  // Set price to current
  const setCurrentPrice = () => {
    setPrice(currentPrice.toFixed(2));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        side,
        type: orderType,
        price: orderType !== 'market' ? parseFloat(price) : undefined,
        quantity: parseFloat(quantity),
        stopPrice: orderType === 'stop-limit' ? parseFloat(stopPrice) : undefined,
        trailingPercent: orderType === 'trailing-stop' ? parseFloat(trailingPercent) : undefined,
        twapDuration: orderType === 'twap' ? parseFloat(twapDuration) : undefined,
        twapIntervals: orderType === 'twap' ? parseFloat(twapIntervals) : undefined,
        icebergVisible: orderType === 'iceberg' ? parseFloat(icebergVisible) : undefined,
        reduceOnly,
        postOnly: orderType === 'limit' ? postOnly : undefined,
        timeInForce,
      });
      // Reset form
      setQuantity('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOrderType = ORDER_TYPES.find(t => t.value === orderType);

  return (
    <div className={cn('bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800', className)}>
      {/* Side Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setSide('buy')}
          className={cn(
            'flex-1 py-4 font-semibold transition-all relative',
            side === 'buy'
              ? 'text-green-400'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <ArrowUp className="w-4 h-4" />
            Buy
          </span>
          {side === 'buy' && (
            <motion.div
              layoutId="order-side-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
            />
          )}
        </button>
        <button
          onClick={() => setSide('sell')}
          className={cn(
            'flex-1 py-4 font-semibold transition-all relative',
            side === 'sell'
              ? 'text-red-400'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <ArrowDown className="w-4 h-4" />
            Sell
          </span>
          {side === 'sell' && (
            <motion.div
              layoutId="order-side-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
            />
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Order Type Selector */}
        <div className="relative">
          <label className="text-xs text-gray-500 mb-1.5 block">Order Type</label>
          <button
            type="button"
            onClick={() => setShowOrderTypes(!showOrderTypes)}
            className="w-full flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center gap-2">
              {selectedOrderType && <selectedOrderType.icon className="w-4 h-4 text-cyan-400" />}
              <span>{selectedOrderType?.label}</span>
            </div>
            <ChevronDown className={cn('w-4 h-4 transition-transform', showOrderTypes && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {showOrderTypes && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-20 shadow-xl"
              >
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setOrderType(type.value);
                      setShowOrderTypes(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-colors text-left',
                      orderType === type.value && 'bg-gray-700/30'
                    )}
                  >
                    <type.icon className={cn('w-4 h-4', orderType === type.value ? 'text-cyan-400' : 'text-gray-500')} />
                    <div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                    {orderType === type.value && <Check className="w-4 h-4 text-cyan-400 ml-auto" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Price Input (for non-market orders) */}
        {orderType !== 'market' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-500">Price</label>
              <button
                type="button"
                onClick={setCurrentPrice}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Use Market
              </button>
            </div>
            <div className="relative">
              <input
                ref={priceRef}
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-16 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {balance.quoteSymbol}
              </span>
            </div>
          </div>
        )}

        {/* Stop Price (for stop-limit) */}
        {orderType === 'stop-limit' && (
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label className="text-xs text-gray-500">Stop Price</label>
              <InfoTooltip content="Order activates when market price reaches this level" />
            </div>
            <div className="relative">
              <input
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-16 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {balance.quoteSymbol}
              </span>
            </div>
          </div>
        )}

        {/* Trailing Percent (for trailing-stop) */}
        {orderType === 'trailing-stop' && (
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label className="text-xs text-gray-500">Trail By</label>
              <InfoTooltip content="Stop price trails market price by this percentage" />
            </div>
            <div className="relative">
              <input
                type="number"
                value={trailingPercent}
                onChange={(e) => setTrailingPercent(e.target.value)}
                placeholder="1.0"
                step="0.1"
                min="0.1"
                max="20"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-8 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>
        )}

        {/* TWAP Settings */}
        {orderType === 'twap' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <label className="text-xs text-gray-500">Duration</label>
                <InfoTooltip content="Total time to execute the order" />
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={twapDuration}
                  onChange={(e) => setTwapDuration(e.target.value)}
                  placeholder="60"
                  min="10"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-12 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">min</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <label className="text-xs text-gray-500">Intervals</label>
                <InfoTooltip content="Number of sub-orders to split into" />
              </div>
              <input
                type="number"
                value={twapIntervals}
                onChange={(e) => setTwapIntervals(e.target.value)}
                placeholder="10"
                min="2"
                max="100"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        )}

        {/* Iceberg Visible Amount */}
        {orderType === 'iceberg' && (
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label className="text-xs text-gray-500">Visible Amount</label>
              <InfoTooltip content="Amount shown in order book. Rest is hidden." />
            </div>
            <div className="relative">
              <input
                type="number"
                value={icebergVisible}
                onChange={(e) => setIcebergVisible(e.target.value)}
                placeholder="10% of total"
                step="0.001"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-16 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {balance.baseSymbol}
              </span>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-500">Amount</label>
            <span className="text-xs text-gray-500">
              Available: <span className="text-gray-300">{availableBalance.toFixed(4)} {side === 'buy' ? balance.quoteSymbol : balance.baseSymbol}</span>
            </span>
          </div>
          <div className="relative">
            <input
              ref={quantityRef}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              step="0.0001"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-16 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
              {balance.baseSymbol}
            </span>
          </div>

          {/* Percentage Buttons */}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentage(pct)}
                className="py-1.5 text-xs bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-3 bg-gray-800/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Order Value</span>
            <span className="font-medium">
              <AnimatedNumber value={orderValue} prefix="$" decimals={2} />
            </span>
          </div>
          {orderType === 'limit' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Est. Fee (0.1%)</span>
              <span className="text-gray-400">${(orderValue * 0.001).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Advanced Options
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
              {/* Time in Force */}
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block">Time in Force</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['GTC', 'IOC', 'FOK'] as const).map((tif) => (
                    <button
                      key={tif}
                      type="button"
                      onClick={() => setTimeInForce(tif)}
                      className={cn(
                        'py-2 text-xs rounded-lg border transition-colors',
                        timeInForce === tif
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                          : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                      )}
                    >
                      {tif}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduce Only & Post Only */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reduceOnly}
                    onChange={(e) => setReduceOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500/20"
                  />
                  <span className="text-sm text-gray-400">Reduce Only</span>
                </label>
                {orderType === 'limit' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={postOnly}
                      onChange={(e) => setPostOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span className="text-sm text-gray-400">Post Only</span>
                  </label>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!quantity || parseFloat(quantity) <= 0 || isSubmitting}
          className={cn(
            'w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2',
            side === 'buy'
              ? 'bg-green-500 hover:bg-green-400 disabled:bg-green-500/20 text-black disabled:text-green-500/50'
              : 'bg-red-500 hover:bg-red-400 disabled:bg-red-500/20 text-white disabled:text-red-500/50'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {side === 'buy' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
              {side === 'buy' ? 'Buy' : 'Sell'} {balance.baseSymbol}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
