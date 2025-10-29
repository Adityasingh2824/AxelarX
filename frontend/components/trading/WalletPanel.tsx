'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Minus, RefreshCw, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';
import { useWalletBalance } from '@/hooks/useMarketData';
import { formatTokenAmount, formatCurrency, formatAddress } from '@/utils/format';
import { toast } from 'react-hot-toast';
import WalletConnect from '@/components/WalletConnect';

export default function WalletPanel() {
  const [showBalances, setShowBalances] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'spot' | 'futures'>('spot');
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const { balances } = useWalletBalance();

  // Check wallet connection status on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      const wallet = JSON.parse(savedWallet);
      setIsConnected(true);
      setAddress(wallet.address);
    }
  }, []);

  const totalUSDValue = Object.entries(balances).reduce((total, [symbol, amount]) => {
    // Mock USD prices for calculation
    const prices: Record<string, number> = {
      BTC: 45000,
      ETH: 2800,
      SOL: 98,
      USDT: 1,
      USDC: 1,
    };
    return total + (amount * (prices[symbol] || 0));
  }, 0);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  const handleDeposit = (symbol: string) => {
    toast.success(`Deposit ${symbol} initiated`);
  };

  const handleWithdraw = (symbol: string) => {
    toast.success(`Withdraw ${symbol} initiated`);
  };

  if (!isConnected) {
    return (
      <div className="card h-full flex flex-col items-center justify-center">
        <Wallet className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Connect Wallet</h3>
        <p className="text-sm text-gray-400 text-center mb-4">
          Connect your wallet to view balances and start trading
        </p>
        <WalletConnect 
          onConnect={(addr) => {
            setIsConnected(true);
            setAddress(addr);
          }}
          onDisconnect={() => {
            setIsConnected(false);
            setAddress('');
          }}
        />
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Wallet className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-white">Wallet</h3>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBalances(!showBalances)}
            className="p-1 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
          >
            {showBalances ? (
              <Eye className="w-4 h-4 text-gray-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            className="p-1 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Address */}
      {address && (
        <div className="mb-4 p-2 bg-dark-700/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Address:</span>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-white font-mono">
                {formatAddress(address)}
              </span>
              <button
                onClick={copyAddress}
                className="p-1 hover:bg-dark-600 rounded transition-colors"
              >
                <Copy className="w-3 h-3 text-gray-400" />
              </button>
              <button className="p-1 hover:bg-dark-600 rounded transition-colors">
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-dark-800 rounded-lg p-1 mb-4">
        <button
          onClick={() => setSelectedTab('spot')}
          className={`flex-1 text-xs py-1 px-2 rounded transition-all duration-200 ${
            selectedTab === 'spot'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Spot
        </button>
        <button
          onClick={() => setSelectedTab('futures')}
          className={`flex-1 text-xs py-1 px-2 rounded transition-all duration-200 ${
            selectedTab === 'futures'
              ? 'bg-primary-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Futures
        </button>
      </div>

      {/* Total Balance */}
      <div className="mb-4 p-3 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 rounded-lg border border-primary-500/20">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Total Balance</div>
          <div className="text-xl font-bold text-white">
            {showBalances ? formatCurrency(totalUSDValue) : '••••••'}
          </div>
          <div className="text-xs text-bull-500 mt-1">
            +2.34% (24h)
          </div>
        </div>
      </div>

      {/* Balances List */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2"
            >
              {Object.entries(balances).map(([symbol, balance]) => {
                const prices: Record<string, number> = {
                  BTC: 45000,
                  ETH: 2800,
                  SOL: 98,
                  USDT: 1,
                  USDC: 1,
                };
                const usdValue = balance * (prices[symbol] || 0);

                return (
                  <motion.div
                    key={symbol}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    className="p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{symbol}</div>
                          <div className="text-xs text-gray-400">
                            {showBalances ? formatCurrency(usdValue) : '••••'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white font-mono">
                          {showBalances ? formatTokenAmount(balance, 0, 6) : '••••••'}
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeposit(symbol)}
                            className="p-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-500 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleWithdraw(symbol)}
                            className="p-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-500 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-glass text-xs py-2"
          >
            Deposit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-glass text-xs py-2"
          >
            Withdraw
          </motion.button>
        </div>
        
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
            <span>Linera Network</span>
          </div>
        </div>
      </div>
    </div>
  );
}
