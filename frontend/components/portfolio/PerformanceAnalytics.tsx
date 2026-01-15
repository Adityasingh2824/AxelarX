'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Target, DollarSign, 
  BarChart3, Percent, Award, AlertCircle, Loader2 
} from 'lucide-react';
import { PortfolioMetrics } from '@/hooks/usePortfolio';
import { formatPrice, formatPercentage } from '@/utils/format';

interface PerformanceAnalyticsProps {
  metrics: PortfolioMetrics | null;
  isLoading: boolean;
}

export default function PerformanceAnalytics({ metrics, isLoading }: PerformanceAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!metrics || metrics.totalTrades === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <BarChart3 className="w-12 h-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Trading Data</h3>
          <p className="text-gray-400 text-sm">Complete your first trade to see analytics</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total P&L',
      value: formatPrice(metrics.totalPnl),
      change: metrics.totalPnl >= 0,
      icon: DollarSign,
      color: metrics.totalPnl >= 0 ? 'text-bull-400' : 'text-bear-400',
      bgColor: metrics.totalPnl >= 0 ? 'bg-bull-500/10' : 'bg-bear-500/10',
    },
    {
      label: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      change: metrics.winRate >= 50,
      icon: Target,
      color: metrics.winRate >= 50 ? 'text-bull-400' : 'text-bear-400',
      bgColor: metrics.winRate >= 50 ? 'bg-bull-500/10' : 'bg-bear-500/10',
    },
    {
      label: 'ROI',
      value: formatPercentage(metrics.roi),
      change: metrics.roi >= 0,
      icon: Percent,
      color: metrics.roi >= 0 ? 'text-bull-400' : 'text-bear-400',
      bgColor: metrics.roi >= 0 ? 'bg-bull-500/10' : 'bg-bear-500/10',
    },
    {
      label: 'Total Trades',
      value: metrics.totalTrades.toString(),
      icon: BarChart3,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10',
    },
  ];

  const performanceMetrics = [
    {
      label: 'Winning Trades',
      value: metrics.winningTrades,
      total: metrics.totalTrades,
      color: 'text-bull-400',
      bgColor: 'bg-bull-500/20',
    },
    {
      label: 'Losing Trades',
      value: metrics.losingTrades,
      total: metrics.totalTrades,
      color: 'text-bear-400',
      bgColor: 'bg-bear-500/20',
    },
  ];

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Performance Analytics</h2>
          <p className="text-sm text-gray-400">Trading performance overview</p>
        </div>
        <div className={`text-2xl font-bold font-mono ${
          metrics.totalPnl >= 0 ? 'text-bull-400' : 'text-bear-400'
        }`}>
          {metrics.totalPnl >= 0 ? '+' : ''}{formatPrice(metrics.totalPnl)}
        </div>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bgColor} rounded-xl p-4 border border-white/5`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
              </div>
              <div className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {performanceMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-xl p-4 border border-white/5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{metric.label}</span>
              <span className={`text-lg font-bold ${metric.color}`}>
                {metric.value} / {metric.total}
              </span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(metric.value / metric.total) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.2 }}
                className={`h-full ${metric.bgColor}`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="text-xs text-gray-400 mb-1">Avg Profit/Trade</div>
          <div className={`text-lg font-bold ${
            metrics.averageProfitPerTrade >= 0 ? 'text-bull-400' : 'text-bear-400'
          }`}>
            {formatPrice(metrics.averageProfitPerTrade)}
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="text-xs text-gray-400 mb-1">Avg Loss/Trade</div>
          <div className={`text-lg font-bold ${
            metrics.averageLossPerTrade >= 0 ? 'text-bull-400' : 'text-bear-400'
          }`}>
            {formatPrice(metrics.averageLossPerTrade)}
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="text-xs text-gray-400 mb-1">Largest Win</div>
          <div className="text-lg font-bold text-bull-400">
            {formatPrice(metrics.largestWin)}
          </div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/5">
          <div className="text-xs text-gray-400 mb-1">Largest Loss</div>
          <div className="text-lg font-bold text-bear-400">
            {formatPrice(metrics.largestLoss)}
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Total Volume:</span>
          <span className="text-white ml-2 font-semibold">{formatPrice(metrics.totalVolume)}</span>
        </div>
        <div>
          <span className="text-gray-400">Total Fees:</span>
          <span className="text-white ml-2 font-semibold">{formatPrice(metrics.totalFeesPaid)}</span>
        </div>
      </div>
    </div>
  );
}








