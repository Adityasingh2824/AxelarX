'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Settings, Info } from 'lucide-react';
import { useMarketData, useWalletBalance } from '@/hooks/useMarketData';
import { formatPrice, formatTokenAmount } from '@/utils/format';
import { toast } from 'react-hot-toast';

interface TradeFormProps {
  market: string;
}

type OrderType = 'market' | 'limit' | 'stop';
type OrderSide = 'buy' | 'sell';

export default function TradeForm({ market }: TradeFormProps) {
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isAdvanced, setIsAdvanced] = useState(false);

  const { marketData } = useMarketData(market);
  const { balances } = useWalletBalance();

  const [base, quote] = market.split('/');
  const currentPrice = marketData?.price || 0;

  // Calculate values when inputs change
  const handlePriceChange = (value: string) => {
    setPrice(value);
    if (value && amount) {
      const totalValue = parseFloat(value) * parseFloat(amount);
      setTotal(totalValue.toFixed(6));
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const priceValue = orderType === 'market' ? currentPrice : parseFloat(price);
    if (priceValue && value) {
      const totalValue = priceValue * parseFloat(value);
      setTotal(totalValue.toFixed(6));
    }
  };

  const handleTotalChange = (value: string) => {
    setTotal(value);
    const priceValue = orderType === 'market' ? currentPrice : parseFloat(price);
    if (priceValue && value) {
      const amountValue = parseFloat(value) / priceValue;
      setAmount(amountValue.toFixed(8));
    }
  };

  const handlePercentageClick = (percentage: number) => {
    const availableBalance = orderSide === 'buy' 
      ? balances.USDT || 0 
      : balances[base as keyof typeof balances] || 0;
    
    if (orderSide === 'buy') {
      const totalValue = availableBalance * (percentage / 100);
      setTotal(totalValue.toFixed(6));
      
      const priceValue = orderType === 'market' ? currentPrice : parseFloat(price);
      if (priceValue) {
        const amountValue = totalValue / priceValue;
        setAmount(amountValue.toFixed(8));
      }
    } else {
      const amountValue = availableBalance * (percentage / 100);
      setAmount(amountValue.toFixed(8));
      
      const priceValue = orderType === 'market' ? currentPrice : parseFloat(price);
      if (priceValue) {
        const totalValue = amountValue * priceValue;
        setTotal(totalValue.toFixed(6));
      }
    }
  };

  const handleSubmit = async () => {
    if (!amount || (!price && orderType === 'limit')) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate order submission
    toast.loading('Submitting order...', { id: 'submit-order' });
    
    setTimeout(() => {
      toast.success(
        `${orderSide.toUpperCase()} order placed successfully!`,
        { id: 'submit-order' }
      );
      
      // Reset form
      setAmount('');
      setPrice('');
      setTotal('');
    }, 2000);
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trade {market}</h3>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="p-1 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </motion.button>
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <Zap className="w-3 h-3 text-bull-500" />
            <span>Fast</span>
          </div>
        </div>
      </div>

      {/* Order Side Toggle */}
      <div className="flex bg-dark-800 rounded-lg p-1 mb-4">
        <button
          onClick={() => setOrderSide('buy')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            orderSide === 'buy'
              ? 'bg-green-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span>Buy</span>
          </div>
        </button>
        <button
          onClick={() => setOrderSide('sell')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
            orderSide === 'sell'
              ? 'bg-red-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-1">
            <TrendingDown className="w-4 h-4" />
            <span>Sell</span>
          </div>
        </button>
      </div>

      {/* Order Type */}
      <div className="mb-4">
        <div className="flex bg-dark-700 rounded-lg p-1">
          {(['market', 'limit', 'stop'] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-all duration-200 ${
                orderType === type
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Price Input (for limit orders) */}
      <AnimatePresence>
        {orderType !== 'market' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <label className="block text-sm text-gray-400 mb-2">
              Price ({quote})
            </label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder={formatPrice(currentPrice)}
                className="input-glass w-full pr-16"
              />
              <button
                onClick={() => setPrice(currentPrice.toString())}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-primary-400 hover:text-primary-300"
              >
                Market
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Amount ({base})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0.00000000"
          className="input-glass w-full"
        />
      </div>

      {/* Percentage Buttons */}
      <div className="flex space-x-1 mb-4">
        {[25, 50, 75, 100].map((percentage) => (
          <button
            key={percentage}
            onClick={() => handlePercentageClick(percentage)}
            className="flex-1 py-1 px-2 text-xs bg-dark-700 hover:bg-dark-600 text-gray-300 rounded transition-colors"
          >
            {percentage}%
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">
          Total ({quote})
        </label>
        <input
          type="number"
          value={total}
          onChange={(e) => handleTotalChange(e.target.value)}
          placeholder="0.00000000"
          className="input-glass w-full"
        />
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {isAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-dark-700/50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Slippage Tolerance</label>
              <div className="flex items-center space-x-1">
                <Info className="w-3 h-3 text-gray-500" />
              </div>
            </div>
            <div className="flex space-x-2">
              {['0.1', '0.5', '1.0'].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    slippage === value
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="flex-1 px-2 py-1 text-xs bg-dark-600 text-white rounded border border-dark-500 focus:border-primary-500 focus:outline-none"
                placeholder="Custom"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Info */}
      <div className="mb-4 p-3 bg-dark-700/30 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Available:</span>
          <span className="text-white">
            {formatTokenAmount(
              orderSide === 'buy' 
                ? balances.USDT || 0 
                : balances[base as keyof typeof balances] || 0,
              0,
              6
            )} {orderSide === 'buy' ? quote : base}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!amount || (!price && orderType === 'limit')}
        className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
          orderSide === 'buy'
            ? 'btn-buy shadow-lg'
            : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg hover:shadow-xl'
        } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      >
        {orderSide === 'buy' ? `Buy ${base}` : `Sell ${base}`}
      </motion.button>

      {/* Order Summary */}
      {(amount || total) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-dark-700/30 rounded-lg text-xs"
        >
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Order Type:</span>
            <span className="text-white capitalize">{orderType}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Est. Fee:</span>
            <span className="text-white">0.1% ≈ {(parseFloat(total || '0') * 0.001).toFixed(6)} {quote}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Est. Total:</span>
            <span className="text-white">
              {(parseFloat(total || '0') * (orderSide === 'buy' ? 1.001 : 0.999)).toFixed(6)} {quote}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
