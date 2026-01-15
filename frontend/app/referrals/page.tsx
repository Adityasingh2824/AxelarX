'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Gift,
  DollarSign,
  Copy,
  Check,
  Share2,
  Twitter,
  Send,
  TrendingUp,
  Award,
  Star,
  Zap,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useWalletStore } from '@/stores/useStore';
import { cn } from '@/lib/utils';

const REFERRAL_TIERS = [
  { level: 1, name: 'Starter', minReferrals: 0, rebate: 10, color: 'gray' },
  { level: 2, name: 'Bronze', minReferrals: 5, rebate: 15, color: 'orange' },
  { level: 3, name: 'Silver', minReferrals: 15, rebate: 20, color: 'slate' },
  { level: 4, name: 'Gold', minReferrals: 50, rebate: 25, color: 'yellow' },
  { level: 5, name: 'Platinum', minReferrals: 100, rebate: 30, color: 'cyan' },
  { level: 6, name: 'Diamond', minReferrals: 250, rebate: 35, color: 'purple' },
];

const MOCK_REFERRALS = [
  { address: '0x1234...5678', date: '2024-01-10', volume: 12500, earned: 125 },
  { address: '0xabcd...efgh', date: '2024-01-08', volume: 8200, earned: 82 },
  { address: '0x9876...5432', date: '2024-01-05', volume: 5600, earned: 56 },
  { address: '0xijkl...mnop', date: '2024-01-03', volume: 3400, earned: 34 },
];

const MOCK_STATS = {
  totalReferrals: 23,
  activeReferrals: 18,
  totalVolume: 156234,
  totalEarned: 1562.34,
  pendingRewards: 234.56,
  currentTier: 3,
};

export default function ReferralsPage() {
  const { isConnected, address } = useWalletStore();
  const [copied, setCopied] = useState(false);

  const referralCode = address ? `${address.slice(0, 8)}` : 'CONNECT_WALLET';
  const referralLink = `https://axelarx.io/ref/${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTierData = REFERRAL_TIERS[MOCK_STATS.currentTier - 1];
  const nextTierData = REFERRAL_TIERS[MOCK_STATS.currentTier];
  const progressToNextTier = nextTierData
    ? ((MOCK_STATS.totalReferrals - currentTierData.minReferrals) /
        (nextTierData.minReferrals - currentTierData.minReferrals)) *
      100
    : 100;

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
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

            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-cosmic">Referral Program</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Invite friends and earn up to 35% of their trading fees. The more you refer, the more you earn!
          </p>
        </motion.div>

        {!isConnected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <p className="text-gray-400 mb-6">Connect your wallet to start referring</p>
            <WalletConnect />
          </motion.div>
        ) : (
          <>
            {/* Referral Link Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 p-6 mb-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Your Referral Link</h2>
                  <p className="text-sm text-gray-400">Share this link to earn rewards</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="flex-1 md:w-80 bg-gray-900/50 rounded-xl px-4 py-3 font-mono text-sm truncate">
                    {referralLink}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyLink}
                    className={cn(
                      'p-3 rounded-xl transition-colors',
                      copied
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                    )}
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </motion.button>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-[#1DA1F2]/20 rounded-xl text-[#1DA1F2] hover:bg-[#1DA1F2]/30 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-[#0088CC]/20 rounded-xl text-[#0088CC] hover:bg-[#0088CC]/30 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Users, label: 'Total Referrals', value: MOCK_STATS.totalReferrals, suffix: '' },
                { icon: TrendingUp, label: 'Total Volume', value: MOCK_STATS.totalVolume, prefix: '$', suffix: '' },
                { icon: DollarSign, label: 'Total Earned', value: MOCK_STATS.totalEarned, prefix: '$', suffix: '' },
                { icon: Gift, label: 'Pending Rewards', value: MOCK_STATS.pendingRewards, prefix: '$', suffix: '' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-6"
                >
                  <stat.icon className="w-8 h-8 text-purple-400 mb-3" />
                  <div className="text-2xl font-bold mb-1">
                    {stat.prefix}<AnimatedNumber value={stat.value} decimals={stat.value % 1 !== 0 ? 2 : 0} />{stat.suffix}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Current Tier */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-6 mb-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center',
                    currentTierData.color === 'gray' && 'bg-gray-500/20',
                    currentTierData.color === 'orange' && 'bg-orange-500/20',
                    currentTierData.color === 'slate' && 'bg-slate-400/20',
                    currentTierData.color === 'yellow' && 'bg-yellow-500/20',
                    currentTierData.color === 'cyan' && 'bg-cyan-500/20',
                    currentTierData.color === 'purple' && 'bg-purple-500/20'
                  )}>
                    <Award className={cn(
                      'w-8 h-8',
                      currentTierData.color === 'gray' && 'text-gray-400',
                      currentTierData.color === 'orange' && 'text-orange-400',
                      currentTierData.color === 'slate' && 'text-slate-300',
                      currentTierData.color === 'yellow' && 'text-yellow-400',
                      currentTierData.color === 'cyan' && 'text-cyan-400',
                      currentTierData.color === 'purple' && 'text-purple-400'
                    )} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Current Tier</div>
                    <div className="text-2xl font-bold">{currentTierData.name}</div>
                    <div className="text-sm text-purple-400">{currentTierData.rebate}% fee rebate</div>
                  </div>
                </div>

                {nextTierData && (
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress to {nextTierData.name}</span>
                      <span className="font-medium">
                        {MOCK_STATS.totalReferrals} / {nextTierData.minReferrals} referrals
                      </span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressToNextTier}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {nextTierData.minReferrals - MOCK_STATS.totalReferrals} more referrals to unlock {nextTierData.rebate}% rebate
                    </div>
                  </div>
                )}

                <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-xl font-semibold transition-colors flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Claim Rewards
                </button>
              </div>
            </motion.div>

            {/* Tier Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-6 mb-8"
            >
              <h2 className="text-lg font-semibold mb-6">Referral Tiers</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {REFERRAL_TIERS.map((tier, index) => (
                  <motion.div
                    key={tier.level}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className={cn(
                      'p-4 rounded-xl border text-center transition-all',
                      MOCK_STATS.currentTier === tier.level
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : MOCK_STATS.currentTier > tier.level
                        ? 'bg-gray-800/50 border-gray-700 opacity-60'
                        : 'bg-gray-800/30 border-gray-700/50'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center',
                      tier.color === 'gray' && 'bg-gray-500/20',
                      tier.color === 'orange' && 'bg-orange-500/20',
                      tier.color === 'slate' && 'bg-slate-400/20',
                      tier.color === 'yellow' && 'bg-yellow-500/20',
                      tier.color === 'cyan' && 'bg-cyan-500/20',
                      tier.color === 'purple' && 'bg-purple-500/20'
                    )}>
                      <Star className={cn(
                        'w-5 h-5',
                        tier.color === 'gray' && 'text-gray-400',
                        tier.color === 'orange' && 'text-orange-400',
                        tier.color === 'slate' && 'text-slate-300',
                        tier.color === 'yellow' && 'text-yellow-400',
                        tier.color === 'cyan' && 'text-cyan-400',
                        tier.color === 'purple' && 'text-purple-400'
                      )} />
                    </div>
                    <div className="font-semibold text-sm">{tier.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{tier.minReferrals}+ refs</div>
                    <div className="text-lg font-bold text-purple-400 mt-2">{tier.rebate}%</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recent Referrals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Referrals</h2>
                <button className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-gray-800/50">
                {MOCK_REFERRALS.map((referral, index) => (
                  <motion.div
                    key={referral.address}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center font-mono text-sm">
                        {referral.address.slice(2, 4)}
                      </div>
                      <div>
                        <div className="font-mono">{referral.address}</div>
                        <div className="text-sm text-gray-500">Joined {referral.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${referral.volume.toLocaleString()} volume</div>
                      <div className="text-sm text-green-400">+${referral.earned} earned</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
