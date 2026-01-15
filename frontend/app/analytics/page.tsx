'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Activity, MessageSquare,
  RefreshCcw, Settings, Calendar, DollarSign 
} from 'lucide-react';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import MarketDepth from '@/components/analytics/MarketDepth';
import VolumeProfile from '@/components/analytics/VolumeProfile';
import OrderFlow from '@/components/analytics/OrderFlow';
import MarketSentiment from '@/components/analytics/MarketSentiment';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useTrades } from '@/hooks/usePrices';
import { priceService } from '@/lib/priceService';
import { useQuery } from '@tanstack/react-query';

export default function AnalyticsPage() {
  const [selectedMarket, setSelectedMarket] = useState('BTC/USDT');
  const [candles, setCandles] = useState<any[]>([]);

  const { orderBook, isLoading: orderBookLoading } = useOrderBook(selectedMarket);
  const { trades, isLoading: tradesLoading } = useTrades(selectedMarket);

  // Fetch candlesticks for volume profile
  const { data: candlestickData, isLoading: candlesLoading } = useQuery({
    queryKey: ['candlesticks', selectedMarket, '1h'],
    queryFn: async () => {
      return await priceService.getCandlesticks(selectedMarket, '1h', 200);
    },
    refetchInterval: 60000,
  });

  const tabs = [
    { id: 'depth', label: 'Market Depth', icon: BarChart3 },
    { id: 'volume', label: 'Volume Profile', icon: TrendingUp },
    { id: 'flow', label: 'Order Flow', icon: Activity },
    { id: 'sentiment', label: 'Sentiment', icon: MessageSquare },
  ];

  const [activeTab, setActiveTab] = useState('depth');

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow"
              >
                <span className="text-white font-bold text-sm lg:text-lg">A</span>
              </motion.div>
              <span className="text-lg lg:text-xl font-bold text-gradient-primary hidden sm:block">AxelarX</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {['Trade', 'Portfolio', 'Pools', 'Bridge', 'Analytics'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item === 'Analytics'
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Market Analytics</h1>
          <p className="text-gray-400">Advanced market analysis and insights</p>
        </div>

        {/* Market Selector */}
        <div className="mb-6">
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="px-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:border-primary-500/50 focus:outline-none"
          >
            <option value="BTC/USDT">BTC/USDT</option>
            <option value="ETH/USDT">ETH/USDT</option>
            <option value="SOL/USDT">SOL/USDT</option>
            <option value="BNB/USDT">BNB/USDT</option>
            <option value="XRP/USDT">XRP/USDT</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeTab === 'depth' && (
            <div className="lg:col-span-2">
              <MarketDepth orderBook={orderBook} isLoading={orderBookLoading} />
            </div>
          )}

          {activeTab === 'volume' && (
            <div className="lg:col-span-2">
              <VolumeProfile 
                candles={candlestickData || []} 
                isLoading={candlesLoading} 
              />
            </div>
          )}

          {activeTab === 'flow' && (
            <div className="lg:col-span-2">
              <OrderFlow trades={trades} isLoading={tradesLoading} />
            </div>
          )}

          {activeTab === 'sentiment' && (
            <div className="lg:col-span-2">
              <MarketSentiment symbol={selectedMarket} />
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Order Book Depth</div>
                <div className="text-xl font-bold text-white">
                  {orderBook ? orderBook.bids.length + orderBook.asks.length : 0}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-bull-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-bull-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Recent Trades</div>
                <div className="text-xl font-bold text-white">{trades.length}</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-secondary-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Order Flow</div>
                <div className="text-xl font-bold text-white">
                  {trades.length > 0 ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Sentiment</div>
                <div className="text-xl font-bold text-white">Live</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}








