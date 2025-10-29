'use client';

import { motion } from 'framer-motion';
import { ArrowLeftRight, Zap, Shield, Globe, ArrowRight, Copy } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const supportedChains = [
  { name: 'Ethereum', symbol: 'ETH', color: 'from-blue-400 to-blue-600' },
  { name: 'Bitcoin', symbol: 'BTC', color: 'from-orange-400 to-orange-600' },
  { name: 'Solana', symbol: 'SOL', color: 'from-purple-400 to-purple-600' },
  { name: 'Polygon', symbol: 'MATIC', color: 'from-purple-500 to-indigo-600' },
  { name: 'Avalanche', symbol: 'AVAX', color: 'from-red-400 to-red-600' },
  { name: 'Linera', symbol: 'LINERA', color: 'from-primary-400 to-primary-600' },
];

export default function BridgePage() {
  const [fromChain, setFromChain] = useState('Ethereum');
  const [toChain, setToChain] = useState('Linera');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('ETH');

  const swapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Cross-Chain Bridge</h1>
              <p className="text-gray-400">Transfer assets seamlessly across blockchains</p>
            </div>
            <Link href="/trade" className="btn-primary flex items-center space-x-2">
              <span>Start Trading</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Bridge Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center"
          >
            <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-primary-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">~30s</div>
            <div className="text-sm text-gray-400">Average Bridge Time</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card text-center"
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">$2.5B+</div>
            <div className="text-sm text-gray-400">Total Bridged</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card text-center"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Globe className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">6</div>
            <div className="text-sm text-gray-400">Supported Chains</div>
          </motion.div>
        </div>

        {/* Bridge Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card max-w-2xl mx-auto"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Bridge Assets</h2>
            <p className="text-gray-400">Transfer your assets across different blockchains</p>
          </div>

          {/* From Chain */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">From</label>
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <select
                  value={fromChain}
                  onChange={(e) => setFromChain(e.target.value)}
                  className="bg-dark-600 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                >
                  {supportedChains.map((chain) => (
                    <option key={chain.name} value={chain.name}>
                      {chain.name}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-400">Balance: 10.5 ETH</div>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={swapChains}
              className="w-12 h-12 bg-dark-700 hover:bg-dark-600 rounded-full flex items-center justify-center transition-colors"
            >
              <ArrowLeftRight className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>

          {/* To Chain */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">To</label>
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <select
                  value={toChain}
                  onChange={(e) => setToChain(e.target.value)}
                  className="bg-dark-600 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                >
                  {supportedChains.map((chain) => (
                    <option key={chain.name} value={chain.name}>
                      {chain.name}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-400">Balance: 0.0 ETH</div>
              </div>
              <div className="text-2xl text-white">
                {amount || '0.0'}
              </div>
            </div>
          </div>

          {/* Bridge Details */}
          {amount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-dark-700/50 rounded-lg p-4 mb-6 text-sm"
            >
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Bridge Fee:</span>
                <span className="text-white">0.1% (~$4.50)</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Gas Fee:</span>
                <span className="text-white">~$12.00</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Estimated Time:</span>
                <span className="text-white">~30 seconds</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">You'll receive:</span>
                  <span className="text-white font-medium">
                    {(parseFloat(amount || '0') * 0.999).toFixed(6)} ETH
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bridge Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!amount}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!amount ? 'Enter Amount' : `Bridge ${amount} ${asset}`}
          </motion.button>
        </motion.div>

        {/* Supported Chains */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <h3 className="text-xl font-semibold text-white mb-4 text-center">
            Supported Networks
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {supportedChains.map((chain, index) => (
              <motion.div
                key={chain.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="card text-center p-4"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${chain.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <span className="text-white font-bold text-sm">
                    {chain.symbol.charAt(0)}
                  </span>
                </div>
                <div className="text-sm text-white font-medium">{chain.name}</div>
                <div className="text-xs text-gray-400">{chain.symbol}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="card max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Bridge Functionality Coming Soon
              </h3>
              <p className="text-gray-400 mb-4">
                Full cross-chain bridging capabilities are currently in development
              </p>
              <Link href="/trade" className="btn-primary">
                Start Trading on Linera
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
