'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Calendar, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { TradeHistoryEntry } from '@/hooks/usePortfolio';
import { formatPrice } from '@/utils/format';

interface TradeHistoryProps {
  trades: TradeHistoryEntry[];
  isLoading: boolean;
  onExportCSV: () => void;
  onExportJSON: () => void;
}

export default function TradeHistory({ trades, isLoading, onExportCSV, onExportJSON }: TradeHistoryProps) {
  const [search, setSearch] = useState('');
  const [filterMarket, setFilterMarket] = useState<string>('all');
  const [filterSide, setFilterSide] = useState<'all' | 'Buy' | 'Sell'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'volume'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Get unique markets
  const markets = useMemo(() => {
    const unique = new Set(trades.map(t => t.market));
    return Array.from(unique);
  }, [trades]);

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let filtered = trades.filter(trade => {
      const matchesSearch = search === '' || 
        trade.market.toLowerCase().includes(search.toLowerCase()) ||
        trade.orderId.toLowerCase().includes(search.toLowerCase());
      
      const matchesMarket = filterMarket === 'all' || trade.market === filterMarket;
      const matchesSide = filterSide === 'all' || trade.side === filterSide;
      
      return matchesSearch && matchesMarket && matchesSide;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'pnl':
          comparison = a.realizedPnl - b.realizedPnl;
          break;
        case 'volume':
          comparison = (a.price * a.quantity) - (b.price * b.quantity);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [trades, search, filterMarket, filterSide, sortBy, sortOrder]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Trade History</h2>
          <p className="text-sm text-gray-400">{filteredTrades.length} of {trades.length} trades</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExportCSV}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-white/5 hover:bg-white/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">CSV</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExportJSON}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg border border-white/5 hover:bg-white/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">JSON</span>
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trades..."
            className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none"
          />
        </div>

        {/* Market Filter */}
        <select
          value={filterMarket}
          onChange={(e) => setFilterMarket(e.target.value)}
          className="px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:border-primary-500/50 focus:outline-none"
        >
          <option value="all">All Markets</option>
          {markets.map(market => (
            <option key={market} value={market}>{market}</option>
          ))}
        </select>

        {/* Side Filter */}
        <select
          value={filterSide}
          onChange={(e) => setFilterSide(e.target.value as 'all' | 'Buy' | 'Sell')}
          className="px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:border-primary-500/50 focus:outline-none"
        >
          <option value="all">All Sides</option>
          <option value="Buy">Buy Only</option>
          <option value="Sell">Sell Only</option>
        </select>

        {/* Sort */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-');
            setSortBy(by as 'date' | 'pnl' | 'volume');
            setSortOrder(order as 'asc' | 'desc');
          }}
          className="px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:border-primary-500/50 focus:outline-none"
        >
          <option value="date-desc">Date (Newest)</option>
          <option value="date-asc">Date (Oldest)</option>
          <option value="pnl-desc">P&L (Highest)</option>
          <option value="pnl-asc">P&L (Lowest)</option>
          <option value="volume-desc">Volume (Largest)</option>
          <option value="volume-asc">Volume (Smallest)</option>
        </select>
      </div>

      {/* Trades Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Date</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Market</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Side</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">Price</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">Quantity</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">Fee</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400">P&L</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  No trades found
                </td>
              </tr>
            ) : (
              filteredTrades.map((trade, index) => (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-gray-300 font-mono">
                    {formatDate(trade.timestamp)}
                  </td>
                  <td className="py-3 px-4 text-sm text-white font-semibold">
                    {trade.market}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                      trade.side === 'Buy' 
                        ? 'bg-bull-500/20 text-bull-400' 
                        : 'bg-bear-500/20 text-bear-400'
                    }`}>
                      {trade.side === 'Buy' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {trade.side}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-white font-mono text-right">
                    {formatPrice(trade.price)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300 font-mono text-right">
                    {trade.quantity.toFixed(6)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400 font-mono text-right">
                    {formatPrice(trade.fee)}
                  </td>
                  <td className={`py-3 px-4 text-sm font-bold font-mono text-right ${
                    trade.realizedPnl >= 0 ? 'text-bull-400' : 'text-bear-400'
                  }`}>
                    {trade.realizedPnl >= 0 ? '+' : ''}{formatPrice(trade.realizedPnl)}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}








