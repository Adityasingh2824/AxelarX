'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, BarChart3, Settings, Zap } from 'lucide-react';
import TradingChart from '@/components/trading/TradingChart';
import OrderBook from '@/components/trading/OrderBook';
import TradeForm from '@/components/trading/TradeForm';
import RecentTrades from '@/components/trading/RecentTrades';
import MarketSelector from '@/components/trading/MarketSelector';
import WalletPanel from '@/components/trading/WalletPanel';
import { useMarketData } from '@/hooks/useMarketData';
import { formatPrice, formatVolume } from '@/utils/format';

export default function TradePage() {
  const [selectedMarket, setSelectedMarket] = useState('BTC/USDT');
  const { marketData, isLoading } = useMarketData(selectedMarket);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-dark-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Market Info */}
            <div className="flex items-center space-x-6">
              <MarketSelector 
                selectedMarket={selectedMarket}
                onMarketChange={setSelectedMarket}
              />
              
              {!isLoading && marketData && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-6"
                >
                  {/* Price */}
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-white">
                      ${formatPrice(marketData.price)}
                    </span>
                    <div className={`flex items-center space-x-1 ${
                      marketData.change24h >= 0 ? 'text-bull-500' : 'text-bear-500'
                    }`}>
                      {marketData.change24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {marketData.change24h >= 0 ? '+' : ''}
                        {marketData.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* 24h Stats */}
                  <div className="hidden md:flex items-center space-x-6 text-sm">
                    <div>
                      <span className="text-gray-400">24h High: </span>
                      <span className="text-white">${formatPrice(marketData.high24h)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">24h Low: </span>
                      <span className="text-white">${formatPrice(marketData.low24h)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Volume: </span>
                      <span className="text-white">{formatVolume(marketData.volume24h)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-glass p-2"
                title="Market Settings"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
              
              <div className="flex items-center space-x-2 bg-dark-800/50 rounded-lg px-3 py-2">
                <Zap className="w-4 h-4 text-bull-500" />
                <span className="text-sm text-gray-300">Real-time</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Trading Interface */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Sidebar - Order Book */}
          <div className="lg:col-span-1 space-y-6">
            <OrderBook market={selectedMarket} />
            <WalletPanel />
          </div>

          {/* Main Chart Area */}
          <div className="lg:col-span-2 xl:col-span-3">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-white">
                    {selectedMarket} Chart
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-bull-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-400">Live</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="text-xs px-3 py-1 bg-primary-500 text-white rounded-full">
                    1m
                  </button>
                  <button className="text-xs px-3 py-1 bg-dark-700 text-gray-300 rounded-full hover:bg-dark-600">
                    5m
                  </button>
                  <button className="text-xs px-3 py-1 bg-dark-700 text-gray-300 rounded-full hover:bg-dark-600">
                    1h
                  </button>
                  <button className="text-xs px-3 py-1 bg-dark-700 text-gray-300 rounded-full hover:bg-dark-600">
                    1d
                  </button>
                </div>
              </div>
              
              <div className="h-full">
                <TradingChart market={selectedMarket} />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Trading & Recent Trades */}
          <div className="lg:col-span-1 space-y-6">
            <TradeForm market={selectedMarket} />
            <RecentTrades market={selectedMarket} />
          </div>
        </div>

        {/* Mobile Bottom Panel */}
        <div className="lg:hidden mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TradeForm market={selectedMarket} />
            <WalletPanel />
          </div>
          <RecentTrades market={selectedMarket} />
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-dark-800/80 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 flex items-center space-x-2"
        >
          <Activity className="w-4 h-4 text-bull-500" />
          <span className="text-sm text-white">
            Latency: <span className="text-bull-500 font-mono">0.3ms</span>
          </span>
        </motion.div>
      </div>
    </div>
  );
}
