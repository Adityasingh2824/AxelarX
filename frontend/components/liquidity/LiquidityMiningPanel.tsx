'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  TrendingUp,
  Gift,
  Clock,
  Coins,
  Wallet,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Sparkles,
  Award,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedNumber, AnimatedPercentage } from '@/components/ui/AnimatedNumber';
import { InfoTooltip } from '@/components/ui/Tooltip';

interface Pool {
  id: string;
  name: string;
  baseToken: string;
  quoteToken: string;
  apy: number;
  tvl: number;
  volume24h: number;
  fee: number;
  rewards: {
    token: string;
    rate: number;
  }[];
  userPosition?: {
    lpTokens: number;
    baseAmount: number;
    quoteAmount: number;
    pendingRewards: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
}

interface LiquidityMiningPanelProps {
  pools: Pool[];
  onAddLiquidity: (poolId: string, baseAmount: number, quoteAmount: number) => Promise<void>;
  onRemoveLiquidity: (poolId: string, lpTokens: number) => Promise<void>;
  onClaimRewards: (poolId: string) => Promise<void>;
  className?: string;
}

const TIER_COLORS = {
  bronze: { bg: 'bg-amber-700/20', text: 'text-amber-500', border: 'border-amber-500/30' },
  silver: { bg: 'bg-gray-400/20', text: 'text-gray-300', border: 'border-gray-300/30' },
  gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-400/30' },
  platinum: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-400/30' },
};

const TIER_MULTIPLIERS = {
  bronze: 1,
  silver: 1.25,
  gold: 1.5,
  platinum: 2,
};

export function LiquidityMiningPanel({
  pools,
  onAddLiquidity,
  onRemoveLiquidity,
  onClaimRewards,
  className,
}: LiquidityMiningPanelProps) {
  const [expandedPool, setExpandedPool] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [baseAmount, setBaseAmount] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total stats
  const totalStats = useMemo(() => {
    const totalTvl = pools.reduce((sum, p) => sum + p.tvl, 0);
    const totalPendingRewards = pools.reduce(
      (sum, p) => sum + (p.userPosition?.pendingRewards || 0),
      0
    );
    const totalUserValue = pools.reduce(
      (sum, p) => {
        if (!p.userPosition) return sum;
        // Simplified calculation
        return sum + p.userPosition.baseAmount * 95000 + p.userPosition.quoteAmount;
      },
      0
    );
    
    return { totalTvl, totalPendingRewards, totalUserValue };
  }, [pools]);

  const handleAddLiquidity = async (poolId: string) => {
    if (!baseAmount || !quoteAmount || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddLiquidity(poolId, parseFloat(baseAmount), parseFloat(quoteAmount));
      setBaseAmount('');
      setQuoteAmount('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLiquidity = async (poolId: string) => {
    if (!removeAmount || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onRemoveLiquidity(poolId, parseFloat(removeAmount));
      setRemoveAmount('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimRewards = async (poolId: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onClaimRewards(poolId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center">
              <Droplets className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-sm text-gray-400">Total Value Locked</span>
          </div>
          <div className="text-2xl font-bold">
            <AnimatedNumber value={totalStats.totalTvl} prefix="$" decimals={0} size="2xl" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-gray-400">Your Liquidity</span>
          </div>
          <div className="text-2xl font-bold">
            <AnimatedNumber value={totalStats.totalUserValue} prefix="$" decimals={0} size="2xl" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">Pending Rewards</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-purple-400">
              <AnimatedNumber value={totalStats.totalPendingRewards} decimals={4} size="2xl" /> AXEL
            </div>
            {totalStats.totalPendingRewards > 0 && (
              <button className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium rounded-lg transition-colors">
                Claim All
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pools List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Liquidity Pools</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Earn AXEL rewards
          </div>
        </div>

        {pools.map((pool, index) => (
          <motion.div
            key={pool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden"
          >
            {/* Pool Header */}
            <button
              onClick={() => setExpandedPool(expandedPool === pool.id ? null : pool.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Token Pair Icon */}
                <div className="relative">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-lg font-bold">
                    {pool.baseToken === 'WBTC' ? '₿' : 'Ξ'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-xs font-bold border-2 border-gray-900">
                    $
                  </div>
                </div>

                <div className="text-left">
                  <div className="font-semibold flex items-center gap-2">
                    {pool.name}
                    {pool.userPosition && (
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full border',
                        TIER_COLORS[pool.userPosition.tier].bg,
                        TIER_COLORS[pool.userPosition.tier].text,
                        TIER_COLORS[pool.userPosition.tier].border
                      )}>
                        {pool.userPosition.tier.charAt(0).toUpperCase() + pool.userPosition.tier.slice(1)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Fee: {pool.fee}%</div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                {/* APY */}
                <div className="text-right">
                  <div className="text-xs text-gray-500">APY</div>
                  <div className="text-lg font-bold text-green-400">
                    {pool.userPosition 
                      ? (pool.apy * TIER_MULTIPLIERS[pool.userPosition.tier]).toFixed(1)
                      : pool.apy.toFixed(1)
                    }%
                  </div>
                </div>

                {/* TVL */}
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-500">TVL</div>
                  <div className="font-medium">${(pool.tvl / 1000000).toFixed(2)}M</div>
                </div>

                {/* 24h Volume */}
                <div className="text-right hidden md:block">
                  <div className="text-xs text-gray-500">24h Vol</div>
                  <div className="font-medium">${(pool.volume24h / 1000000).toFixed(2)}M</div>
                </div>

                {/* Your Position */}
                {pool.userPosition && (
                  <div className="text-right hidden lg:block">
                    <div className="text-xs text-gray-500">Your LP</div>
                    <div className="font-medium text-cyan-400">{pool.userPosition.lpTokens.toFixed(4)}</div>
                  </div>
                )}

                <ChevronDown 
                  className={cn(
                    'w-5 h-5 text-gray-500 transition-transform',
                    expandedPool === pool.id && 'rotate-180'
                  )} 
                />
              </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedPool === pool.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2 border-t border-gray-800">
                    {/* Tier Benefits Banner */}
                    {pool.userPosition && pool.userPosition.tier !== 'platinum' && (
                      <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-purple-400" />
                          <span className="text-gray-300">
                            Add more liquidity to reach{' '}
                            <span className="text-purple-400 font-medium">
                              {pool.userPosition.tier === 'bronze' ? 'Silver' : pool.userPosition.tier === 'silver' ? 'Gold' : 'Platinum'}
                            </span>
                            {' '}tier and earn higher rewards!
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-purple-400" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Add/Remove Liquidity */}
                      <div>
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                          <button
                            onClick={() => setActiveTab('add')}
                            className={cn(
                              'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                              activeTab === 'add'
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'bg-gray-800/50 text-gray-400 hover:text-gray-300'
                            )}
                          >
                            Add Liquidity
                          </button>
                          <button
                            onClick={() => setActiveTab('remove')}
                            className={cn(
                              'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                              activeTab === 'remove'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-800/50 text-gray-400 hover:text-gray-300'
                            )}
                          >
                            Remove Liquidity
                          </button>
                        </div>

                        {activeTab === 'add' ? (
                          <div className="space-y-4">
                            {/* Base Token Input */}
                            <div>
                              <label className="text-xs text-gray-500 mb-1.5 block">{pool.baseToken}</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={baseAmount}
                                  onChange={(e) => setBaseAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-cyan-400 hover:text-cyan-300">
                                  MAX
                                </button>
                              </div>
                            </div>

                            {/* Quote Token Input */}
                            <div>
                              <label className="text-xs text-gray-500 mb-1.5 block">{pool.quoteToken}</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={quoteAmount}
                                  onChange={(e) => setQuoteAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50"
                                />
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-cyan-400 hover:text-cyan-300">
                                  MAX
                                </button>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddLiquidity(pool.id)}
                              disabled={!baseAmount || !quoteAmount || isSubmitting}
                              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/20 text-black disabled:text-cyan-500/50 font-semibold rounded-xl transition-colors"
                            >
                              {isSubmitting ? 'Adding...' : 'Add Liquidity'}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs text-gray-500">LP Tokens</label>
                                <span className="text-xs text-gray-400">
                                  Balance: {pool.userPosition?.lpTokens.toFixed(4) || '0'}
                                </span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={removeAmount}
                                  onChange={(e) => setRemoveAmount(e.target.value)}
                                  placeholder="0.00"
                                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-right font-medium placeholder:text-gray-600 focus:outline-none focus:border-red-500/50"
                                />
                                <button 
                                  onClick={() => setRemoveAmount(pool.userPosition?.lpTokens.toString() || '0')}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-red-400 hover:text-red-300"
                                >
                                  MAX
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                              {[25, 50, 75, 100].map((pct) => (
                                <button
                                  key={pct}
                                  onClick={() => {
                                    const max = pool.userPosition?.lpTokens || 0;
                                    setRemoveAmount((max * pct / 100).toString());
                                  }}
                                  className="py-1.5 text-xs bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg transition-colors"
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => handleRemoveLiquidity(pool.id)}
                              disabled={!removeAmount || isSubmitting}
                              className="w-full py-3 bg-red-500 hover:bg-red-400 disabled:bg-red-500/20 text-white disabled:text-red-500/50 font-semibold rounded-xl transition-colors"
                            >
                              {isSubmitting ? 'Removing...' : 'Remove Liquidity'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Position Info & Rewards */}
                      <div className="space-y-4">
                        {/* Current Position */}
                        {pool.userPosition && (
                          <div className="p-4 bg-gray-800/30 rounded-xl space-y-3">
                            <h4 className="text-sm font-medium text-gray-400">Your Position</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs text-gray-500">{pool.baseToken}</div>
                                <div className="font-medium">{pool.userPosition.baseAmount.toFixed(6)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">{pool.quoteToken}</div>
                                <div className="font-medium">{pool.userPosition.quoteAmount.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">LP Tokens</div>
                                <div className="font-medium text-cyan-400">{pool.userPosition.lpTokens.toFixed(4)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">Reward Multiplier</div>
                                <div className={cn('font-medium', TIER_COLORS[pool.userPosition.tier].text)}>
                                  {TIER_MULTIPLIERS[pool.userPosition.tier]}x
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Pending Rewards */}
                        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-medium">Pending Rewards</span>
                            </div>
                            <span className="text-lg font-bold text-purple-400">
                              {pool.userPosition?.pendingRewards.toFixed(4) || '0'} AXEL
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleClaimRewards(pool.id)}
                            disabled={!pool.userPosition?.pendingRewards || isSubmitting}
                            className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-500/20 text-white disabled:text-purple-500/50 font-medium rounded-lg transition-colors"
                          >
                            {isSubmitting ? 'Claiming...' : 'Claim Rewards'}
                          </button>
                        </div>

                        {/* Reward Info */}
                        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400">
                          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            Rewards are distributed every block. Reach higher tiers by providing more liquidity to earn up to 2x rewards!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
