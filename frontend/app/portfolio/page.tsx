'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Download,
  Filter,
  RefreshCcw,
  Copy,
  ExternalLink,
  Check,
  AlertCircle,
  Zap,
  DollarSign,
  Percent,
  Activity,
} from 'lucide-react';
import WalletConnect from '@/components/WalletConnect';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useWalletStore } from '@/stores/useStore';
import { cn } from '@/lib/utils';

// Mock portfolio data
const MOCK_PORTFOLIO = {
  totalValue: 156234.87,
  totalPnl: 12543.21,
  totalPnlPercent: 8.74,
  change24h: 3421.56,
  change24hPercent: 2.24,
  assets: [
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: 1.2345, value: 112341.23, change24h: 2.1, allocation: 71.9, icon: '₿' },
    { symbol: 'WETH', name: 'Wrapped Ethereum', balance: 12.5678, value: 39234.56, change24h: -0.8, allocation: 25.1, icon: 'Ξ' },
    { symbol: 'USDT', name: 'Tether USD', balance: 2500.00, value: 2500.00, change24h: 0.01, allocation: 1.6, icon: '$' },
    { symbol: 'USDC', name: 'USD Coin', balance: 2159.08, value: 2159.08, change24h: 0.00, allocation: 1.4, icon: '$' },
  ],
  recentActivity: [
    { type: 'buy', asset: 'WBTC', amount: 0.05, value: 4523.45, time: '2 hours ago', txHash: '0x1234...5678' },
    { type: 'sell', asset: 'WETH', amount: 1.5, value: 4687.23, time: '5 hours ago', txHash: '0xabcd...efgh' },
    { type: 'deposit', asset: 'USDT', amount: 2500, value: 2500, time: '1 day ago', txHash: '0x9876...5432' },
    { type: 'buy', asset: 'WETH', amount: 2.0, value: 6234.56, time: '2 days ago', txHash: '0xijkl...mnop' },
    { type: 'withdraw', asset: 'USDC', amount: 1000, value: 1000, time: '3 days ago', txHash: '0xqrst...uvwx' },
  ],
  openPositions: [
    { market: 'BTC/USDT', side: 'long', size: 0.5, entryPrice: 89500, currentPrice: 90959, pnl: 729.50, pnlPercent: 1.63, leverage: 5 },
    { market: 'ETH/USDT', side: 'short', size: 5.0, entryPrice: 3150, currentPrice: 3123, pnl: 135.00, pnlPercent: 0.86, leverage: 3 },
  ],
};

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  prefix = '',
  suffix = '',
  delay = 0 
}: { 
  icon: any; 
  label: string; 
  value: number; 
  change?: number; 
  prefix?: string;
  suffix?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-6"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-cyan-400" />
      </div>
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <div className="flex items-end justify-between">
      <div className="text-2xl font-bold">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={2} />
      </div>
      {change !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          change >= 0 ? 'text-green-400' : 'text-red-400'
        )}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  </motion.div>
);

export default function PortfolioPage() {
  const { isConnected, address } = useWalletStore();
  const [activeTab, setActiveTab] = useState<'assets' | 'activity' | 'positions'>('assets');
  const [copied, setCopied] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {!isConnected ? (
          /* Not Connected State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-gray-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Connect your wallet to view your portfolio, track performance, and manage your assets.
            </p>
            <WalletConnect />
          </motion.div>
        ) : (
          <>
            {/* Portfolio Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyAddress}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <span className="font-mono text-sm">{formatAddress(address || '')}</span>
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`https://basescan.org/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Time Range Selector */}
                  <div className="flex bg-gray-800/50 rounded-lg p-1">
                    {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={cn(
                          'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                          timeRange === range
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'text-gray-400 hover:text-white'
                        )}
                      >
                        {range === 'all' ? 'All' : range.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors">
                    <RefreshCcw className="w-5 h-5" />
                  </button>
                  <button className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Wallet}
                  label="Total Value"
                  value={MOCK_PORTFOLIO.totalValue}
                  change={MOCK_PORTFOLIO.change24hPercent}
                  prefix="$"
                  delay={0}
                />
                <StatCard
                  icon={TrendingUp}
                  label="Total P&L"
                  value={MOCK_PORTFOLIO.totalPnl}
                  change={MOCK_PORTFOLIO.totalPnlPercent}
                  prefix="$"
                  delay={0.1}
                />
                <StatCard
                  icon={DollarSign}
                  label="24h Change"
                  value={MOCK_PORTFOLIO.change24h}
                  change={MOCK_PORTFOLIO.change24hPercent}
                  prefix="$"
                  delay={0.2}
                />
                <StatCard
                  icon={Activity}
                  label="Open Positions"
                  value={MOCK_PORTFOLIO.openPositions.length}
                  delay={0.3}
                />
              </div>
            </motion.div>

            {/* Portfolio Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Portfolio Value Over Time</h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    $<AnimatedNumber value={MOCK_PORTFOLIO.totalValue} decimals={2} />
                  </span>
                  <span className={cn(
                    'flex items-center gap-1 text-sm',
                    MOCK_PORTFOLIO.change24hPercent >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    {MOCK_PORTFOLIO.change24hPercent >= 0 ? '+' : ''}
                    {MOCK_PORTFOLIO.change24hPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-700 rounded-xl">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Portfolio chart visualization</p>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-gray-800">
              {(['assets', 'positions', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-3 font-medium capitalize transition-colors relative',
                    activeTab === tab
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-300'
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'assets' && (
                <motion.div
                  key="assets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden"
                >
                  {/* Assets Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-800 text-sm text-gray-400">
                    <div className="col-span-4">Asset</div>
                    <div className="col-span-2 text-right">Balance</div>
                    <div className="col-span-2 text-right">Value</div>
                    <div className="col-span-2 text-right">24h Change</div>
                    <div className="col-span-2 text-right">Allocation</div>
                  </div>

                  {/* Assets Rows */}
                  {MOCK_PORTFOLIO.assets.map((asset, index) => (
                    <motion.div
                      key={asset.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold">
                          {asset.icon}
                        </div>
                        <div>
                          <div className="font-medium">{asset.symbol}</div>
                          <div className="text-sm text-gray-500">{asset.name}</div>
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-mono">
                        {asset.balance.toLocaleString(undefined, { minimumFractionDigits: 4 })}
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        ${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className={cn(
                        'col-span-2 text-right font-medium',
                        asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                      </div>
                      <div className="col-span-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${asset.allocation}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400">{asset.allocation.toFixed(1)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'positions' && (
                <motion.div
                  key="positions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {MOCK_PORTFOLIO.openPositions.map((position, index) => (
                    <motion.div
                      key={`${position.market}-${position.side}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-bold uppercase',
                            position.side === 'long'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          )}>
                            {position.side}
                          </span>
                          <span className="text-lg font-bold">{position.market}</span>
                          <span className="text-sm text-gray-400">{position.leverage}x</span>
                        </div>
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors">
                          Close Position
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Size</div>
                          <div className="font-medium">{position.size}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Entry Price</div>
                          <div className="font-medium">${position.entryPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Current Price</div>
                          <div className="font-medium">${position.currentPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Unrealized P&L</div>
                          <div className={cn(
                            'font-medium',
                            position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                          )}>
                            {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">ROI</div>
                          <div className={cn(
                            'font-medium',
                            position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                          )}>
                            {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden"
                >
                  {MOCK_PORTFOLIO.recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          activity.type === 'buy' && 'bg-green-500/20',
                          activity.type === 'sell' && 'bg-red-500/20',
                          activity.type === 'deposit' && 'bg-blue-500/20',
                          activity.type === 'withdraw' && 'bg-orange-500/20'
                        )}>
                          {activity.type === 'buy' && <ArrowUpRight className="w-5 h-5 text-green-400" />}
                          {activity.type === 'sell' && <ArrowDownRight className="w-5 h-5 text-red-400" />}
                          {activity.type === 'deposit' && <ArrowUpRight className="w-5 h-5 text-blue-400" />}
                          {activity.type === 'withdraw' && <ArrowDownRight className="w-5 h-5 text-orange-400" />}
                        </div>
                        <div>
                          <div className="font-medium capitalize">
                            {activity.type} {activity.asset}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {activity.time}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-medium">
                          {activity.type === 'sell' || activity.type === 'withdraw' ? '-' : '+'}
                          {activity.amount} {activity.asset}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${activity.value.toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
