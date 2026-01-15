'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, Loader2 } from 'lucide-react';
import { Position } from '@/hooks/usePortfolio';
import { formatPrice, formatPercentage } from '@/utils/format';

interface PositionTrackerProps {
  positions: Position[];
  isLoading: boolean;
}

export default function PositionTracker({ positions, isLoading }: PositionTrackerProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Activity className="w-12 h-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Open Positions</h3>
          <p className="text-gray-400 text-sm">Start trading to see your positions here</p>
        </div>
      </div>
    );
  }

  const totalPnl = positions.reduce((sum, pos) => sum + pos.totalPnl, 0);
  const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Open Positions</h2>
          <p className="text-sm text-gray-400">{positions.length} active position{positions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold font-mono ${
            totalPnl >= 0 ? 'text-bull-400' : 'text-bear-400'
          }`}>
            {totalPnl >= 0 ? '+' : ''}{formatPrice(totalPnl)}
          </div>
          <div className="text-xs text-gray-500">Total P&L</div>
        </div>
      </div>

      {/* Positions List */}
      <div className="space-y-3">
        {positions.map((position, index) => (
          <motion.div
            key={position.market}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-white text-lg">{position.market}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary-500/20 text-primary-400">
                    {position.baseQuantity.toFixed(4)} {position.baseAsset}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Entry Price:</span>
                    <span className="text-white ml-2 font-mono">{formatPrice(position.averageEntryPrice)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Price:</span>
                    <span className="text-white ml-2 font-mono">{formatPrice(position.currentPrice)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Volume:</span>
                    <span className="text-white ml-2 font-mono">{formatPrice(position.totalVolume)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Trades:</span>
                    <span className="text-white ml-2">{position.totalTrades}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right ml-4">
                <div className={`text-xl font-bold font-mono mb-1 ${
                  position.totalPnl >= 0 ? 'text-bull-400' : 'text-bear-400'
                }`}>
                  {position.totalPnl >= 0 ? '+' : ''}{formatPrice(position.totalPnl)}
                </div>
                <div className={`text-sm font-semibold mb-2 ${
                  position.pnlPercentage >= 0 ? 'text-bull-400' : 'text-bear-400'
                }`}>
                  {position.pnlPercentage >= 0 ? '+' : ''}{formatPercentage(position.pnlPercentage)}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div>
                    <span className="block">Realized</span>
                    <span className={`font-semibold ${
                      position.realizedPnl >= 0 ? 'text-bull-400' : 'text-bear-400'
                    }`}>
                      {position.realizedPnl >= 0 ? '+' : ''}{formatPrice(position.realizedPnl)}
                    </span>
                  </div>
                  <div>
                    <span className="block">Unrealized</span>
                    <span className={`font-semibold ${
                      position.unrealizedPnl >= 0 ? 'text-bull-400' : 'text-bear-400'
                    }`}>
                      {position.unrealizedPnl >= 0 ? '+' : ''}{formatPrice(position.unrealizedPnl)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* P&L Bar */}
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">P&L Breakdown</span>
                <span className={`font-semibold ${
                  position.totalPnl >= 0 ? 'text-bull-400' : 'text-bear-400'
                }`}>
                  {position.totalPnl >= 0 ? '+' : ''}{formatPrice(position.totalPnl)}
                </span>
              </div>
              <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    position.totalPnl >= 0 ? 'bg-bull-500' : 'bg-bear-500'
                  }`}
                  style={{ 
                    width: `${Math.min(Math.abs(position.pnlPercentage), 100)}%` 
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}








