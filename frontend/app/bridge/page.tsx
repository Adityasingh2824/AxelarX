'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowDown, ArrowRight, RefreshCcw, Clock, Shield,
  ChevronDown, ExternalLink, AlertCircle, Check, Zap,
  Globe, Layers, Activity, Info
} from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';

interface Chain {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Token {
  symbol: string;
  name: string;
  balance: number;
  price: number;
}

const chains: Chain[] = [
  { id: 'linera', name: 'Linera', icon: '⚡', color: 'from-primary-500 to-secondary-500' },
  { id: 'ethereum', name: 'Ethereum', icon: '◆', color: 'from-blue-500 to-blue-600' },
  { id: 'bitcoin', name: 'Bitcoin', icon: '₿', color: 'from-orange-500 to-orange-600' },
  { id: 'solana', name: 'Solana', icon: '◎', color: 'from-purple-500 to-pink-500' },
  { id: 'avalanche', name: 'Avalanche', icon: '△', color: 'from-red-500 to-red-600' },
  { id: 'polygon', name: 'Polygon', icon: '⬡', color: 'from-purple-500 to-purple-600' },
];

const tokens: Token[] = [
  { symbol: 'BTC', name: 'Bitcoin', balance: 0.5234, price: 45234.56 },
  { symbol: 'ETH', name: 'Ethereum', balance: 4.8765, price: 2834.67 },
  { symbol: 'USDT', name: 'Tether', balance: 10000, price: 1.00 },
  { symbol: 'USDC', name: 'USD Coin', balance: 5000, price: 1.00 },
];

const recentTransfers = [
  { id: 1, from: 'Ethereum', to: 'Linera', amount: '1.5 ETH', status: 'completed', time: '5 min ago' },
  { id: 2, from: 'Linera', to: 'Solana', amount: '500 USDT', status: 'pending', time: '12 min ago' },
  { id: 3, from: 'Bitcoin', to: 'Linera', amount: '0.05 BTC', status: 'completed', time: '1 hour ago' },
];

export default function BridgePage() {
  const [fromChain, setFromChain] = useState(chains[1]); // Ethereum
  const [toChain, setToChain] = useState(chains[0]); // Linera
  const [selectedToken, setSelectedToken] = useState(tokens[1]); // ETH
  const [amount, setAmount] = useState('');
  const [isFromChainOpen, setIsFromChainOpen] = useState(false);
  const [isToChainOpen, setIsToChainOpen] = useState(false);
  const [isTokenOpen, setIsTokenOpen] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const estimatedFee = parseFloat(amount || '0') * 0.001;
  const estimatedReceived = parseFloat(amount || '0') - estimatedFee;
  
  const handleSwapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };
  
  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsBridging(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsBridging(false);
    setAmount('');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary-500/10 rounded-full blur-[150px] animate-pulse-slow delay-1000" />
        
        {/* Connection lines animation */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[...Array(5)].map((_, i) => (
            <motion.line
              key={i}
              x1="0%"
              y1={`${20 + i * 15}%`}
              x2="100%"
              y2={`${40 + i * 10}%`}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 4,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-xl font-bold text-gradient-primary">AxelarX</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-1">
                <Link href="/trade" className="nav-link">Trade</Link>
                <Link href="/pools" className="nav-link">Pools</Link>
                <Link href="/bridge" className="nav-link active">Bridge</Link>
                <Link href="/docs" className="nav-link">Docs</Link>
              </div>
            </div>
            
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Cross-Chain Bridge</h1>
          <p className="text-gray-400">Transfer assets seamlessly between blockchains</p>
        </motion.div>

        {/* Bridge Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          {/* From Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">From</span>
              <span className="text-xs text-gray-500">
                Balance: {selectedToken?.balance.toFixed(4) ?? '0.0000'} {selectedToken?.symbol ?? ''}
              </span>
            </div>
            
            {/* From Chain Selector */}
            <div className="relative">
              <button
                onClick={() => setIsFromChainOpen(!isFromChainOpen)}
                className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${fromChain?.color ?? 'from-gray-500 to-gray-600'} flex items-center justify-center text-xl`}>
                    {fromChain?.icon ?? '◆'}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">{fromChain?.name ?? 'Select Chain'}</div>
                    <div className="text-xs text-gray-500">Source Chain</div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isFromChainOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isFromChainOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl overflow-hidden z-20"
                  >
                    {chains.filter(c => c.id !== toChain?.id).map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => { setFromChain(chain); setIsFromChainOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${chain.color} flex items-center justify-center`}>
                          {chain.icon}
                        </div>
                        <span className="text-white">{chain.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Amount Input */}
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full input text-2xl font-mono pr-32"
              />
              
              {/* Token Selector */}
              <button
                onClick={() => setIsTokenOpen(!isTokenOpen)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors"
              >
                <span className="font-semibold text-white">{selectedToken?.symbol ?? ''}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              <AnimatePresence>
                {isTokenOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-48 glass-strong rounded-xl overflow-hidden z-20"
                  >
                    {tokens.map((token) => (
                      <button
                        key={token.symbol}
                        onClick={() => { setSelectedToken(token); setIsTokenOpen(false); }}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-white">{token.symbol}</span>
                        <span className="text-xs text-gray-500">{token.balance.toFixed(2)}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex items-center gap-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setAmount(((selectedToken?.balance ?? 0) * percent / 100).toFixed(6))}
                  className="flex-1 py-2 text-xs font-medium glass rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSwapChains}
              className="w-12 h-12 bg-dark-800 border-4 border-dark-900 rounded-xl flex items-center justify-center text-primary-400 hover:text-primary-300 transition-colors"
            >
              <ArrowDown className="w-5 h-5" />
            </motion.button>
          </div>

          {/* To Section */}
          <div className="space-y-4">
            <span className="text-sm text-gray-400">To</span>
            
            {/* To Chain Selector */}
            <div className="relative">
              <button
                onClick={() => setIsToChainOpen(!isToChainOpen)}
                className="w-full flex items-center justify-between p-4 glass rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${toChain?.color ?? 'from-gray-500 to-gray-600'} flex items-center justify-center text-xl`}>
                    {toChain?.icon ?? '◆'}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white">{toChain?.name ?? 'Select Chain'}</div>
                    <div className="text-xs text-gray-500">Destination Chain</div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isToChainOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isToChainOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl overflow-hidden z-20"
                  >
                    {chains.filter(c => c.id !== fromChain?.id).map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => { setToChain(chain); setIsToChainOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${chain.color} flex items-center justify-center`}>
                          {chain.icon}
                        </div>
                        <span className="text-white">{chain.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Estimated Output */}
            <div className="p-4 glass rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">You will receive</span>
              </div>
              <div className="text-2xl font-mono text-white">
                {estimatedReceived > 0 ? estimatedReceived.toFixed(6) : '0.00'} {selectedToken?.symbol ?? ''}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between text-gray-400">
              <div className="flex items-center gap-1">
                <span>Bridge Fee</span>
                <Info className="w-3 h-3" />
              </div>
              <span className="text-white">{estimatedFee.toFixed(6)} {selectedToken?.symbol ?? ''}</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Estimated Time</span>
              </div>
              <span className="text-white">~2 minutes</span>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Security</span>
              </div>
              <span className="text-bull-400">Atomic Swap</span>
            </div>
          </div>

          {/* Bridge Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBridge}
            disabled={!amount || parseFloat(amount) <= 0 || isBridging}
            className="w-full mt-6 btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait">
              {isBridging ? (
                <motion.div
                  key="bridging"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Bridging...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="bridge"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <Globe className="w-5 h-5" />
                  <span>Bridge Assets</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* Recent Transfers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Recent Transfers</h2>
          
          <div className="space-y-3">
            {recentTransfers.map((transfer, index) => (
              <motion.div
                key={transfer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="card-glass flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{transfer.from}</span>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-white">{transfer.to}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-white">{transfer.amount}</span>
                  <div className={`flex items-center gap-1 text-xs ${
                    transfer.status === 'completed' ? 'text-bull-400' : 'text-yellow-400'
                  }`}>
                    {transfer.status === 'completed' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span className="capitalize">{transfer.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 glass rounded-xl flex items-start gap-3"
        >
          <Zap className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-400">
              Powered by Linera's cross-chain messaging protocol. 
              All transfers are protected by atomic swap guarantees with automatic refunds on failure.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
