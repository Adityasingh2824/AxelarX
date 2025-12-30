'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Eye, EyeOff, RefreshCcw } from 'lucide-react';

interface Balance {
  asset: string;
  available: number;
  inOrder: number;
  usdValue: number;
}

const balances: Balance[] = [
  { asset: 'BTC', available: 0.5234, inOrder: 0.1000, usdValue: 28500.00 },
  { asset: 'ETH', available: 4.8765, inOrder: 1.2345, usdValue: 15800.00 },
  { asset: 'SOL', available: 125.45, inOrder: 25.00, usdValue: 14500.00 },
  { asset: 'USDT', available: 10000.00, inOrder: 2500.00, usdValue: 10000.00 },
  { asset: 'USDC', available: 5000.00, inOrder: 500.00, usdValue: 5000.00 },
];

export default function WalletPanel() {
  const [isHidden, setIsHidden] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-primary-400" />
          <h3 className="font-semibold text-white">Wallet</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsHidden(!isHidden)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0 }}
            >
              <RefreshCcw className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>
      </div>
      
      {/* Total Value */}
      <div className="py-4 border-b border-white/5">
        <div className="text-xs text-gray-500 mb-1">Total Value</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            {isHidden ? '••••••' : `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          </span>
          <span className="text-sm text-bull-400">+2.34%</span>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 py-4 border-b border-white/5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 py-2 glass rounded-lg text-sm font-medium text-bull-400 hover:bg-bull-500/10 transition-colors"
        >
          <ArrowDownLeft className="w-4 h-4" />
          Deposit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 py-2 glass rounded-lg text-sm font-medium text-primary-400 hover:bg-primary-500/10 transition-colors"
        >
          <ArrowUpRight className="w-4 h-4" />
          Withdraw
        </motion.button>
      </div>
      
      {/* Balances */}
      <div className="pt-4 space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {balances.map((balance, index) => (
            <motion.div
              key={balance.asset}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/30 to-secondary-500/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {balance.asset.slice(0, 2)}
                  </span>
                </div>
                
                <div>
                  <div className="font-medium text-white text-sm">{balance.asset}</div>
                  <div className="text-xs text-gray-500">
                    {isHidden ? '••••' : `${balance.inOrder.toFixed(4)} in orders`}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-mono text-sm text-white">
                  {isHidden ? '••••••' : balance.available.toFixed(4)}
                </div>
                <div className="text-xs text-gray-500">
                  {isHidden ? '••••' : `$${balance.usdValue.toLocaleString()}`}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
