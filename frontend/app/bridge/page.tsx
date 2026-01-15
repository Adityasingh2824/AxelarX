'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  RefreshCcw,
  Clock,
  Shield,
  Zap,
  AlertCircle,
  Check,
  ExternalLink,
  ChevronDown,
  Loader2,
  Info,
} from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useWalletStore } from '@/stores/useStore';
import { cn } from '@/lib/utils';

const CHAINS = [
  { id: 'base', name: 'Base', icon: '🔵', color: 'blue' },
  { id: 'polygon', name: 'Polygon', icon: '🟣', color: 'purple' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷', color: 'sky' },
  { id: 'ethereum', name: 'Ethereum', icon: '⟠', color: 'gray' },
  { id: 'optimism', name: 'Optimism', icon: '🔴', color: 'red' },
];

const TOKENS = [
  { symbol: 'USDT', name: 'Tether USD', icon: '$', balance: 5000 },
  { symbol: 'USDC', name: 'USD Coin', icon: '$', balance: 3500 },
  { symbol: 'WETH', name: 'Wrapped Ethereum', icon: 'Ξ', balance: 2.5 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', icon: '₿', balance: 0.15 },
];

const RECENT_BRIDGES = [
  { from: 'Base', to: 'Polygon', token: 'USDT', amount: 1000, status: 'completed', time: '2 hours ago', txHash: '0x1234...5678' },
  { from: 'Arbitrum', to: 'Base', token: 'WETH', amount: 0.5, status: 'completed', time: '1 day ago', txHash: '0xabcd...efgh' },
  { from: 'Ethereum', to: 'Base', token: 'USDC', amount: 2500, status: 'pending', time: '5 minutes ago', txHash: '0x9876...5432' },
];

export default function BridgePage() {
  const { isConnected } = useWalletStore();
  const [fromChain, setFromChain] = useState(CHAINS[0]);
  const [toChain, setToChain] = useState(CHAINS[1]);
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [showFromChains, setShowFromChains] = useState(false);
  const [showToChains, setShowToChains] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [isBridging, setIsBridging] = useState(false);

  const swapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsBridging(true);
    // Simulate bridging
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsBridging(false);
    setAmount('');
  };

  const estimatedTime = '~2 minutes';
  const bridgeFee = parseFloat(amount || '0') * 0.001;

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              
              <div className="h-8 w-px bg-white/10" />
              
              <Link href="/" className="flex items-center gap-2">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow"
                >
                  <span className="text-white font-bold text-lg">A</span>
                </motion.div>
                <span className="text-xl font-bold text-gradient-primary">AxelarX</span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/trade"
                className="hidden sm:flex items-center gap-2 px-4 py-2 glass rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <Zap className="w-4 h-4" />
                Trade
              </Link>
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 lg:px-6 py-12 relative z-10">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowRight className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gradient-cosmic">Cross-Chain Bridge</span>
          </h1>
          <p className="text-gray-400">Transfer assets seamlessly between blockchains</p>
        </motion.div>

        {/* Bridge Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-6"
        >
          {/* From Section */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">From</span>
              <span className="text-sm text-gray-400">
                Balance: <span className="text-white">{selectedToken.balance.toLocaleString()} {selectedToken.symbol}</span>
              </span>
            </div>

            <div className="flex gap-2">
              {/* Chain Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowFromChains(!showFromChains)}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
                >
                  <span className="text-xl">{fromChain.icon}</span>
                  <span className="font-medium">{fromChain.name}</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showFromChains && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {showFromChains && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-20 shadow-xl"
                    >
                      {CHAINS.filter(c => c.id !== toChain.id).map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => {
                            setFromChain(chain);
                            setShowFromChains(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/50 transition-colors',
                            fromChain.id === chain.id && 'bg-gray-700/50'
                          )}
                        >
                          <span className="text-xl">{chain.icon}</span>
                          <span>{chain.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Amount Input */}
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-right text-lg font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={() => setAmount(selectedToken.balance.toString())}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  MAX
                </button>
              </div>

              {/* Token Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowTokens(!showTokens)}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
                >
                  <span className="text-lg font-bold">{selectedToken.icon}</span>
                  <span className="font-medium">{selectedToken.symbol}</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showTokens && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {showTokens && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-20 shadow-xl"
                    >
                      {TOKENS.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSelectedToken(token);
                            setShowTokens(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/50 transition-colors',
                            selectedToken.symbol === token.symbol && 'bg-gray-700/50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{token.icon}</span>
                            <span>{token.symbol}</span>
                          </div>
                          <span className="text-sm text-gray-400">{token.balance}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1 relative z-10">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={swapChains}
              className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center hover:border-cyan-500/50 transition-colors"
            >
              <ArrowDown className="w-5 h-5" />
            </motion.button>
          </div>

          {/* To Section */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">To</span>
              <span className="text-sm text-gray-400">
                You receive
              </span>
            </div>

            <div className="flex gap-2">
              {/* Chain Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowToChains(!showToChains)}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
                >
                  <span className="text-xl">{toChain.icon}</span>
                  <span className="font-medium">{toChain.name}</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showToChains && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {showToChains && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-20 shadow-xl"
                    >
                      {CHAINS.filter(c => c.id !== fromChain.id).map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => {
                            setToChain(chain);
                            setShowToChains(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700/50 transition-colors',
                            toChain.id === chain.id && 'bg-gray-700/50'
                          )}
                        >
                          <span className="text-xl">{chain.icon}</span>
                          <span>{chain.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Receive Amount */}
              <div className="flex-1 bg-gray-800/30 border border-gray-700/50 rounded-xl px-4 py-3 flex items-center justify-end">
                <span className="text-lg font-medium text-gray-300">
                  {amount ? (parseFloat(amount) - bridgeFee).toFixed(4) : '0.00'}
                </span>
              </div>

              {/* Token Display */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/30 border border-gray-700/50 rounded-xl">
                <span className="text-lg font-bold">{selectedToken.icon}</span>
                <span className="font-medium text-gray-400">{selectedToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Bridge Info */}
          {amount && parseFloat(amount) > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 p-4 bg-gray-800/30 rounded-xl space-y-3 text-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Estimated Time
                </span>
                <span className="font-medium">{estimatedTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Bridge Fee (0.1%)</span>
                <span className="font-medium">{bridgeFee.toFixed(4)} {selectedToken.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">You Receive</span>
                <span className="font-medium text-green-400">
                  {(parseFloat(amount) - bridgeFee).toFixed(4)} {selectedToken.symbol}
                </span>
              </div>
            </motion.div>
          )}

          {/* Bridge Button */}
          {isConnected ? (
            <button
              onClick={handleBridge}
              disabled={!amount || parseFloat(amount) <= 0 || isBridging}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isBridging ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Bridging...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Bridge {selectedToken.symbol}
                </>
              )}
            </button>
          ) : (
            <div className="mt-6">
              <WalletConnect />
            </div>
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mt-8"
        >
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Secure</div>
            <div className="text-xs text-gray-500">Audited Contracts</div>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Fast</div>
            <div className="text-xs text-gray-500">2 Min Average</div>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <RefreshCcw className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Low Fee</div>
            <div className="text-xs text-gray-500">Only 0.1%</div>
          </div>
        </motion.div>

        {/* Recent Bridges */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <h2 className="text-lg font-semibold mb-4">Recent Bridges</h2>
            <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden">
              {RECENT_BRIDGES.map((bridge, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      bridge.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                    )} />
                    <div>
                      <div className="text-sm font-medium">
                        {bridge.from} → {bridge.to}
                      </div>
                      <div className="text-xs text-gray-500">{bridge.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {bridge.amount} {bridge.token}
                    </div>
                    <a
                      href={`https://basescan.org/tx/${bridge.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 justify-end"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="font-medium text-blue-400 mb-1">How it works</p>
            <p>
              AxelarX Bridge uses secure smart contracts to lock your tokens on the source chain
              and mint equivalent tokens on the destination chain. Your assets are always backed 1:1.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
