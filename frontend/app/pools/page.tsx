'use client';

import { motion } from 'framer-motion';
import { Droplets, Plus, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const mockPools = [
  {
    id: 1,
    name: 'BTC/USDT',
    tvl: '$12.5M',
    apr: '24.5%',
    volume24h: '$2.1M',
    fee: '0.3%',
  },
  {
    id: 2,
    name: 'ETH/USDT',
    tvl: '$8.7M',
    apr: '18.2%',
    volume24h: '$1.5M',
    fee: '0.3%',
  },
  {
    id: 3,
    name: 'SOL/USDT',
    tvl: '$5.2M',
    apr: '31.8%',
    volume24h: '$890K',
    fee: '0.3%',
  },
];

export default function PoolsPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Liquidity Pools</h1>
              <p className="text-gray-400">Provide liquidity and earn fees from trading activity</p>
            </div>
            <Link href="/trade" className="btn-primary flex items-center space-x-2">
              <span>Start Trading</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Total TVL</div>
                <div className="text-xl font-bold text-white">$26.4M</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="text-sm text-gray-400">24h Volume</div>
                <div className="text-xl font-bold text-white">$4.49M</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Active Pools</div>
                <div className="text-xl font-bold text-white">12</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Your Pools</div>
                <div className="text-xl font-bold text-white">0</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pools Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Available Pools</h2>
            <button className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create Pool</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="trading-table">
              <thead>
                <tr>
                  <th>Pool</th>
                  <th>TVL</th>
                  <th>APR</th>
                  <th>24h Volume</th>
                  <th>Fee</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {mockPools.map((pool, index) => (
                  <motion.tr
                    key={pool.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {pool.name.split('/')[0].charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-white">{pool.name}</span>
                      </div>
                    </td>
                    <td className="text-white font-mono">{pool.tvl}</td>
                    <td className="text-green-500 font-mono">{pool.apr}</td>
                    <td className="text-white font-mono">{pool.volume24h}</td>
                    <td className="text-gray-400 font-mono">{pool.fee}</td>
                    <td>
                      <button className="btn-primary text-sm px-4 py-2">
                        Add Liquidity
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="card max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Droplets className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Advanced Pool Features Coming Soon
              </h3>
              <p className="text-gray-400 mb-4">
                Concentrated liquidity, yield farming, and cross-chain pools are in development
              </p>
              <Link href="/trade" className="btn-primary">
                Trade Now
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
