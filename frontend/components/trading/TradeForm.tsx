'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Info, Percent, DollarSign, Zap, AlertCircle, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { useOrderBook } from '@/hooks/useOrderBook';
import { toContractPrice, toContractQuantity } from '@/lib/contracts/utils';
import toast from 'react-hot-toast';

interface TradeFormProps {
  market: string;
}

type OrderType = 'limit' | 'market' | 'stop-limit';
type Side = 'buy' | 'sell';

export default function TradeForm({ market }: TradeFormProps) {
  const [side, setSide] = useState<Side>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { placeOrder } = useOrderBook(market);
  
  // Get base and quote from market
  const [base, quote] = market.split('/');
  
  // Mock balances (replace with real balance fetching)
  const balances = {
    BTC: 0.5234,
    ETH: 4.8765,
    SOL: 125.45,
    USDT: 10000.00,
    USDC: 5000.00,
  };
  
  const availableBalance = side === 'buy' 
    ? balances[quote as keyof typeof balances] || 0
    : balances[base as keyof typeof balances] || 0;
  
  // Calculate total when price or amount changes
  useEffect(() => {
    if (price && amount) {
      const totalValue = parseFloat(price) * parseFloat(amount);
      setTotal(totalValue.toFixed(2));
    } else {
      setTotal('');
    }
  }, [price, amount]);
  
  // Handle slider change
  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    if (side === 'buy' && price) {
      const totalAmount = (availableBalance * value) / 100;
      setTotal(totalAmount.toFixed(2));
      setAmount((totalAmount / parseFloat(price)).toFixed(6));
    } else if (side === 'sell') {
      const sellAmount = (availableBalance * value) / 100;
      setAmount(sellAmount.toFixed(6));
      if (price) {
        setTotal((sellAmount * parseFloat(price)).toFixed(2));
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || (orderType !== 'market' && !price)) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Convert to contract format
      const contractPrice = orderType === 'market' ? '0' : toContractPrice(parseFloat(price));
      const contractQuantity = toContractQuantity(parseFloat(amount));
      
      // Place order via contract
      const result = await placeOrder({
        side: side === 'buy' ? 'Buy' : 'Sell',
        orderType: orderType === 'market' ? 'Market' : 'Limit',
        price: contractPrice,
        quantity: contractQuantity,
      });
      
      if (result.success) {
        setShowSuccess(true);
        toast.success('Order placed successfully!');
        
        // Reset form after success
        setTimeout(() => {
          setShowSuccess(false);
          setPrice('');
          setAmount('');
          setTotal('');
          setSliderValue(0);
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to place order');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const sliderMarks = [0, 25, 50, 75, 100];
  const isDisabled = isSubmitting || !amount || (orderType !== 'market' && !price);

  return (
    <div className="card overflow-hidden h-full flex flex-col">
      {/* Enhanced Side Toggle */}
      <div className="flex gap-2 mb-4 p-1 glass rounded-xl border border-white/5">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSide('buy');
            setPrice('');
            setAmount('');
            setTotal('');
            setSliderValue(0);
          }}
          className={`flex-1 py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm transition-all duration-300 relative overflow-hidden ${
            side === 'buy'
              ? 'bg-gradient-to-r from-bull-600 to-bull-500 text-white shadow-neon-green'
              : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          {side === 'buy' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-bull-600 to-bull-500"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            Buy {base}
          </span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSide('sell');
            setPrice('');
            setAmount('');
            setTotal('');
            setSliderValue(0);
          }}
          className={`flex-1 py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm transition-all duration-300 relative overflow-hidden ${
            side === 'sell'
              ? 'bg-gradient-to-r from-bear-600 to-bear-500 text-white shadow-neon-pink'
              : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
          }`}
        >
          {side === 'sell' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-r from-bear-600 to-bear-500"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center justify-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            Sell {base}
          </span>
        </motion.button>
      </div>
      
      {/* Order Type Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl border border-white/5 mb-4">
        {(['limit', 'market', 'stop-limit'] as OrderType[]).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex-1 py-1.5 lg:py-2 text-[10px] lg:text-xs font-semibold rounded-lg transition-all ${
              orderType === type
                ? 'bg-primary-500/20 text-primary-400'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {type === 'limit' ? 'Limit' : type === 'market' ? 'Market' : 'Stop'}
          </button>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4 flex-1 flex flex-col">
        {/* Price Input */}
        {orderType !== 'market' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] lg:text-xs text-gray-400 font-medium">Price</label>
              <button
                type="button"
                onClick={() => {
                  // Set to market price (mock)
                  const mockPrice = side === 'buy' ? '45234.56' : '45235.00';
                  setPrice(mockPrice);
                }}
                className="text-[10px] lg:text-xs text-primary-400 hover:text-primary-300 font-medium"
              >
                Market
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="input pr-14 lg:pr-16 font-mono text-sm lg:text-lg w-full"
              />
              <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs lg:text-sm font-medium">
                {quote}
              </span>
            </div>
          </div>
        )}
        
        {/* Amount Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] lg:text-xs text-gray-400 font-medium">Amount</label>
            <span className="text-[10px] lg:text-xs text-gray-500">
              Available: <span className="text-white font-semibold">{availableBalance.toFixed(4)} {side === 'buy' ? quote : base}</span>
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.000001"
              className="input pr-14 lg:pr-16 font-mono text-sm lg:text-lg w-full"
            />
            <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs lg:text-sm font-medium">
              {base}
            </span>
          </div>
        </div>
        
        {/* Amount Slider */}
        <div className="space-y-1.5">
          <div className="relative pt-1">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full h-1.5 lg:h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, ${side === 'buy' ? '#10b981' : '#ef4444'} ${sliderValue}%, #1e293b ${sliderValue}%)`,
              }}
            />
            <div className="flex justify-between mt-1.5 lg:mt-2">
              {[0, 25, 50, 75, 100].map((mark) => (
                <button
                  key={mark}
                  type="button"
                  onClick={() => handleSliderChange(mark)}
                  className={`text-[9px] lg:text-xs px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md transition-all font-medium ${
                    sliderValue === mark
                      ? side === 'buy' 
                        ? 'bg-bull-500/20 text-bull-400' 
                        : 'bg-bear-500/20 text-bear-400'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {mark}%
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Total */}
        <div className="space-y-1.5">
          <label className="text-[10px] lg:text-xs text-gray-400 font-medium">Total</label>
          <div className="relative">
            <input
              type="number"
              value={total}
              onChange={(e) => {
                setTotal(e.target.value);
                if (price) {
                  setAmount((parseFloat(e.target.value) / parseFloat(price)).toFixed(6));
                }
              }}
              placeholder="0.00"
              step="0.01"
              className="input pr-14 lg:pr-16 font-mono text-sm lg:text-lg w-full"
            />
            <span className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs lg:text-sm font-medium">
              {quote}
            </span>
          </div>
        </div>
        
        {/* Fee Info */}
        <div className="flex items-center justify-between text-[10px] lg:text-xs text-gray-500 py-2 lg:py-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
            <span>Trading Fee</span>
          </div>
          <span className="text-white font-semibold">0.1%</span>
        </div>
        
        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isDisabled}
          whileHover={{ scale: isDisabled ? 1 : 1.02 }}
          whileTap={{ scale: isDisabled ? 1 : 0.98 }}
          className={`w-full py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden mt-auto ${
            side === 'buy'
              ? 'bg-gradient-to-r from-bull-600 to-bull-500 text-white hover:shadow-neon-green'
              : 'bg-gradient-to-r from-bear-600 to-bear-500 text-white hover:shadow-neon-pink'
          }`}
        >
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </motion.div>
            ) : showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 lg:w-5 lg:h-5" />
                <span>Order Placed!</span>
              </motion.div>
            ) : (
              <motion.span
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {side === 'buy' ? 'Buy' : 'Sell'} {base}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </form>
      
      {/* Quick Tips */}
      <div className="mt-3 lg:mt-4 p-2.5 lg:p-3 glass rounded-xl border border-white/5">
        <div className="flex items-start gap-2">
          <Zap className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] lg:text-xs text-gray-400 leading-relaxed">
            {orderType === 'market' 
              ? 'Market orders execute immediately at the best available price.'
              : 'Limit orders execute only when the market reaches your price.'}
          </p>
        </div>
      </div>
    </div>
  );
}
