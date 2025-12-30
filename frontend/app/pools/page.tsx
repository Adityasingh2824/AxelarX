'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Droplets, Plus, ArrowRight, TrendingUp, TrendingDown,
  Search, Filter, ChevronDown, ExternalLink, Info, Zap,
  Percent, DollarSign, Users, Activity, Star, ArrowUpRight
} from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';

interface Pool {
  id: string;
  name: string;
  token0: string;
  token1: string;
  tvl: number;
  apr: number;
  volume24h: number;
  fee: number;
  myLiquidity?: number;
  isFavorite?: boolean;
}

const pools: Pool[] = [
  { id: '1', name: 'BTC/USDT', token0: 'BTC', token1: 'USDT', tvl: 125000000, apr: 12.5, volume24h: 45000000, fee: 0.3, myLiquidity: 5000, isFavorite: true },
  { id: '2', name: 'ETH/USDT', token0: 'ETH', token1: 'USDT', tvl: 98000000, apr: 15.2, volume24h: 38000000, fee: 0.3, myLiquidity: 3500, isFavorite: true },
  { id: '3', name: 'SOL/USDT', token0: 'SOL', token1: 'USDT', tvl: 45000000, apr: 22.8, volume24h: 18000000, fee: 0.3 },
  { id: '4', name: 'AVAX/USDT', token0: 'AVAX', token1: 'USDT', tvl: 32000000, apr: 18.5, volume24h: 12000000, fee: 0.3 },
  { id: '5', name: 'ETH/BTC', token0: 'ETH', token1: 'BTC', tvl: 28000000, apr: 8.2, volume24h: 15000000, fee: 0.05 },
  { id: '6', name: 'DOT/USDT', token0: 'DOT', token1: 'USDT', tvl: 18000000, apr: 25.4, volume24h: 8000000, fee: 0.3 },
  { id: '7', name: 'ATOM/USDT', token0: 'ATOM', token1: 'USDT', tvl: 15000000, apr: 28.6, volume24h: 6500000, fee: 0.3 },
  { id: '8', name: 'NEAR/USDT', token0: 'NEAR', token1: 'USDT', tvl: 12000000, apr: 32.1, volume24h: 5000000, fee: 0.3 },
];

const formatValue = (value: number) => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const stats = [
  { label: 'Total Value Locked', value: '$373M', change: '+5.2%', icon: DollarSign, color: 'text-primary-400' },
  { label: 'Total Volume 24h', value: '$147M', change: '+12.8%', icon: Activity, color: 'text-bull-400' },
  { label: 'Active Pools', value: '48', change: '+3', icon: Droplets, color: 'text-secondary-400' },
  { label: 'Liquidity Providers', value: '12.5K', change: '+245', icon: Users, color: 'text-accent-400' },
];

export default function PoolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'tvl' | 'apr' | 'volume24h'>('tvl');
  const [filterTab, setFilterTab] = useState<'all' | 'my' | 'favorites'>('all');
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Filter and sort pools
  const filteredPools = pools
    .filter(pool => {
      const matchesSearch = pool.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterTab === 'all' || 
        (filterTab === 'my' && pool.myLiquidity) ||
        (filterTab === 'favorites' && pool.isFavorite);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary-500/10 rounded-full blur-[128px]" />
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
                <Link href="/pools" className="nav-link active">Pools</Link>
                <Link href="/bridge" className="nav-link">Bridge</Link>
                <Link href="/docs" className="nav-link">Docs</Link>
              </div>
            </div>
            
            <WalletConnect />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Liquidity Pools</h1>
              <p className="text-gray-400">Provide liquidity and earn trading fees</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              <span>Create Pool</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="card-glass"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-xs text-bull-400">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Filters & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6"
        >
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 glass rounded-xl">
            {(['all', 'my', 'favorites'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filterTab === tab
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All Pools' : tab === 'my' ? 'My Liquidity' : 'Favorites'}
              </button>
            ))}
          </div>
          
          {/* Search & Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pools..."
                className="input pl-10 py-2"
              />
            </div>
            
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none px-4 py-2 pr-10 glass rounded-xl text-sm text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="tvl">Sort by TVL</option>
                <option value="apr">Sort by APR</option>
                <option value="volume24h">Sort by Volume</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Pools Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card overflow-hidden"
        >
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs text-gray-500 font-medium">
            <div className="col-span-3">Pool</div>
            <div className="col-span-2 text-right">TVL</div>
            <div className="col-span-2 text-right">APR</div>
            <div className="col-span-2 text-right">Volume 24h</div>
            <div className="col-span-2 text-right">My Liquidity</div>
            <div className="col-span-1"></div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {filteredPools.map((pool, index) => (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                >
                  {/* Pool Info */}
                  <div className="col-span-12 md:col-span-3">
                    <div className="flex items-center gap-3">
                      {/* Token Icons */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/50 to-secondary-500/50 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{pool.token0.slice(0, 2)}</span>
                        </div>
                        <div className="absolute -right-2 -bottom-1 w-7 h-7 rounded-full bg-gradient-to-br from-secondary-500/50 to-accent-500/50 flex items-center justify-center border-2 border-dark-900">
                          <span className="text-2xs font-bold text-white">{pool.token1.slice(0, 2)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{pool.name}</span>
                          {pool.isFavorite && <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />}
                        </div>
                        <div className="text-xs text-gray-500">Fee: {pool.fee}%</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* TVL */}
                  <div className="col-span-4 md:col-span-2 text-right">
                    <div className="font-semibold text-white">{formatValue(pool.tvl)}</div>
                    <div className="text-xs text-bull-400 md:hidden">TVL</div>
                  </div>
                  
                  {/* APR */}
                  <div className="col-span-4 md:col-span-2 text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-bull-500/10 rounded-lg">
                      <Percent className="w-3 h-3 text-bull-400" />
                      <span className="font-semibold text-bull-400">{pool.apr.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  {/* Volume */}
                  <div className="col-span-4 md:col-span-2 text-right">
                    <div className="font-medium text-gray-300">{formatValue(pool.volume24h)}</div>
                    <div className="text-xs text-gray-500 md:hidden">24h Volume</div>
                  </div>
                  
                  {/* My Liquidity */}
                  <div className="hidden md:block col-span-2 text-right">
                    {pool.myLiquidity ? (
                      <span className="font-medium text-white">${pool.myLiquidity.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                  
                  {/* Action */}
                  <div className="col-span-12 md:col-span-1 flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1 px-4 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Add</span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredPools.length === 0 && (
            <div className="p-12 text-center">
              <Droplets className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No pools found</p>
            </div>
          )}
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 card bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-accent-500/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Earn Rewards</h3>
              <p className="text-gray-400 mb-4">
                Provide liquidity to pools and earn a share of trading fees. 
                The more liquidity you provide, the more you earn!
              </p>
              <Link href="/docs" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium">
                Learn more
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
