'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Droplets, 
  ArrowLeft, 
  TrendingUp, 
  Gift, 
  Shield, 
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';
import { LiquidityMiningPanel } from '@/components/liquidity/LiquidityMiningPanel';
import WalletConnect from '@/components/WalletConnect';
import { useWalletStore } from '@/stores/useStore';

// Mock pool data - would come from contracts in production
const MOCK_POOLS = [
  {
    id: 'btc-usdt',
    name: 'BTC/USDT',
    baseToken: 'WBTC',
    quoteToken: 'USDT',
    apy: 24.5,
    tvl: 12500000,
    volume24h: 8750000,
    fee: 0.3,
    rewards: [{ token: 'AXEL', rate: 1250 }],
    userPosition: {
      lpTokens: 1.2345,
      baseAmount: 0.0523,
      quoteAmount: 4850.25,
      pendingRewards: 125.4567,
      tier: 'gold' as const,
    },
  },
  {
    id: 'eth-usdt',
    name: 'ETH/USDT',
    baseToken: 'WETH',
    quoteToken: 'USDT',
    apy: 18.2,
    tvl: 8500000,
    volume24h: 5200000,
    fee: 0.3,
    rewards: [{ token: 'AXEL', rate: 850 }],
    userPosition: {
      lpTokens: 5.6789,
      baseAmount: 2.1456,
      quoteAmount: 7280.50,
      pendingRewards: 89.1234,
      tier: 'silver' as const,
    },
  },
  {
    id: 'eth-usdc',
    name: 'ETH/USDC',
    baseToken: 'WETH',
    quoteToken: 'USDC',
    apy: 16.8,
    tvl: 6200000,
    volume24h: 3800000,
    fee: 0.3,
    rewards: [{ token: 'AXEL', rate: 620 }],
    userPosition: undefined,
  },
];

export default function PoolsPage() {
  const { isConnected } = useWalletStore();
  const [pools, setPools] = useState(MOCK_POOLS);

  const handleAddLiquidity = async (poolId: string, baseAmount: number, quoteAmount: number) => {
    console.log('Adding liquidity:', { poolId, baseAmount, quoteAmount });
    // Contract interaction would go here
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const handleRemoveLiquidity = async (poolId: string, lpTokens: number) => {
    console.log('Removing liquidity:', { poolId, lpTokens });
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const handleClaimRewards = async (poolId: string) => {
    console.log('Claiming rewards:', poolId);
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  return (
    <div className="min-h-screen bg-dark-950">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <Droplets className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gradient-cosmic">Liquidity Mining</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Provide liquidity to earn trading fees and AXEL token rewards. 
            Higher tiers unlock better reward multipliers.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="p-5 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold mb-1">High APY</h3>
            <p className="text-sm text-gray-400">Earn up to 50% APY with trading fees + AXEL rewards</p>
          </div>

          <div className="p-5 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-1">Tiered Rewards</h3>
            <p className="text-sm text-gray-400">Bronze, Silver, Gold, Platinum tiers with up to 2x multiplier</p>
          </div>

          <div className="p-5 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold mb-1">No Lock-up</h3>
            <p className="text-sm text-gray-400">Withdraw anytime with no minimum lock period</p>
          </div>
        </motion.div>

        {/* Not Connected State */}
        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16 bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800"
          >
            <Droplets className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to view and manage liquidity positions</p>
            <WalletConnect />
          </motion.div>
        ) : (
          <LiquidityMiningPanel
            pools={pools}
            onAddLiquidity={handleAddLiquidity}
            onRemoveLiquidity={handleRemoveLiquidity}
            onClaimRewards={handleClaimRewards}
          />
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl"
        >
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-400 mb-2">How Liquidity Mining Works</h3>
              <div className="text-sm text-gray-400 space-y-2">
                <p>
                  1. <strong className="text-gray-200">Deposit tokens</strong> - Add equal value of base and quote tokens to a pool
                </p>
                <p>
                  2. <strong className="text-gray-200">Receive LP tokens</strong> - Get LP tokens representing your share of the pool
                </p>
                <p>
                  3. <strong className="text-gray-200">Earn rewards</strong> - Collect trading fees + AXEL token rewards
                </p>
                <p>
                  4. <strong className="text-gray-200">Tier up</strong> - Higher liquidity = higher tier = more rewards
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <a 
                  href="/docs" 
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Learn more <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
