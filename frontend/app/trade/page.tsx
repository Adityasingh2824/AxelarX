'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Activity, Settings, Zap, 
  ChevronDown, Star, Bell, Maximize2, Minus, X,
  BarChart2, CandlestickChart, LineChart, Volume2,
  RefreshCcw, Clock, AlertCircle, Layout, Layers,
  ChevronRight, Info
} from 'lucide-react';
import Link from 'next/link';
import TradingChart from '@/components/trading/TradingChart';
import OrderBook from '@/components/trading/OrderBook';
import TradeForm from '@/components/trading/TradeForm';
import RecentTrades from '@/components/trading/RecentTrades';
import MarketSelector from '@/components/trading/MarketSelector';
import WalletPanel from '@/components/trading/WalletPanel';
import WalletConnect from '@/components/WalletConnect';
import { useMarketData } from '@/hooks/useMarketData';
import { formatPrice, formatVolume, formatPercentage } from '@/utils/format';

// Enhanced Price Ticker with better styling
const PriceTicker = ({ price, prevPrice }: { price: number; prevPrice: number }) => {
  const isUp = price >= prevPrice;
  const [flash, setFlash] = useState(false);
  
  useEffect(() => {
    if (price !== prevPrice && prevPrice > 0) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(timer);
    }
  }, [price, prevPrice]);
  
  return (
    <motion.div
      animate={{ 
        scale: flash ? [1, 1.02, 1] : 1,
      }}
      transition={{ duration: 0.3 }}
      className="flex items-baseline gap-3"
    >
      <motion.span
        animate={{ 
          color: flash ? (isUp ? '#10b981' : '#ef4444') : '#ffffff',
        }}
        transition={{ duration: 0.3 }}
        className="text-4xl font-bold font-mono tracking-tight"
      >
        ${formatPrice(price)}
      </motion.span>
      <motion.span
        animate={{
          color: flash ? (isUp ? '#10b981' : '#ef4444') : 'transparent',
        }}
        className="text-lg font-mono"
      >
        {isUp ? '▲' : '▼'}
      </motion.span>
    </motion.div>
  );
};

// Enhanced Market Stats Bar
const MarketStatsBar = ({ marketData, isLoading }: { marketData: any; isLoading: boolean }) => {
  if (isLoading || !marketData) {
    return (
      <div className="flex items-center gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 w-28 bg-dark-800/50 rounded-xl" />
        ))}
      </div>
    );
  }
  
  const stats = [
    { 
      label: '24h High', 
      value: `$${formatPrice(marketData.high24h)}`, 
      icon: TrendingUp,
      color: 'text-bull-400',
      bgColor: 'bg-bull-500/10'
    },
    { 
      label: '24h Low', 
      value: `$${formatPrice(marketData.low24h)}`, 
      icon: TrendingDown,
      color: 'text-bear-400',
      bgColor: 'bg-bear-500/10'
    },
    { 
      label: '24h Volume', 
      value: formatVolume(marketData.volume24h), 
      icon: Volume2,
      color: 'text-primary-400',
      bgColor: 'bg-primary-500/10'
    },
    { 
      label: 'Market Cap', 
      value: formatVolume(marketData.marketCap), 
      icon: BarChart2,
      color: 'text-secondary-400',
      bgColor: 'bg-secondary-500/10'
    },
  ];
  
  return (
    <div className="flex items-center gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${stat.bgColor} border border-white/5`}
          >
            <Icon className={`w-4 h-4 ${stat.color}`} />
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
              <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Timeframe selector component
const timeframes = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1H' },
  { label: '4H', value: '4H' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
];

export default function TradePage() {
  const [selectedMarket, setSelectedMarket] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [prevPrice, setPrevPrice] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [latency, setLatency] = useState(0.3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { marketData, isLoading } = useMarketData(selectedMarket);
  
  // Update previous price for animation
  useEffect(() => {
    if (marketData?.price && marketData.price !== prevPrice && prevPrice > 0) {
      setPrevPrice(marketData.price);
    } else if (marketData?.price && prevPrice === 0) {
      setPrevPrice(marketData.price);
    }
  }, [marketData?.price, prevPrice]);
  
  // Simulate latency updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(0.15 + Math.random() * 0.2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Enhanced Top Navigation Bar */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 backdrop-blur-2xl">
        <div className="max-w-[1920px] mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Left section - Logo & Market Info */}
            <div className="flex items-center gap-6 flex-1 min-w-0">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow"
                >
                  <span className="text-white font-bold text-lg">A</span>
                </motion.div>
                <span className="text-xl font-bold text-gradient-primary hidden sm:block">AxelarX</span>
              </Link>
              
              {/* Divider */}
              <div className="h-10 w-px bg-white/10 hidden md:block" />
              
              {/* Market Selector */}
              <div className="flex-shrink-0">
                <MarketSelector 
                  selectedMarket={selectedMarket}
                  onMarketChange={setSelectedMarket}
                />
              </div>
              
              {/* Favorite button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2.5 rounded-xl transition-all ${
                  isFavorite 
                    ? 'text-yellow-400 bg-yellow-500/10' 
                    : 'text-gray-500 hover:text-yellow-400 hover:bg-white/5'
                }`}
              >
                <Star className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
              </motion.button>

              {/* Price Display - Always visible */}
              {!isLoading && marketData && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hidden lg:flex items-center gap-4 ml-4"
                >
                  <div className="flex flex-col">
                    <PriceTicker price={marketData.price} prevPrice={prevPrice} />
                    <div className={`flex items-center gap-1.5 mt-1 ${
                      marketData.change24h >= 0 ? 'text-bull-400' : 'text-bear-400'
                    }`}>
                      {marketData.change24h >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      <span className="text-sm font-semibold">
                        {formatPercentage(marketData.change24h)}
                      </span>
                      <span className="text-xs text-gray-500">24h</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Center section - Market Stats (hidden on smaller screens) */}
            {!isLoading && marketData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden xl:flex items-center"
              >
                <MarketStatsBar marketData={marketData} isLoading={isLoading} />
              </motion.div>
            )}

            {/* Right section - Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Latency indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden md:flex items-center gap-2 px-3 py-2 glass rounded-xl border border-white/5"
              >
                <div className="relative">
                  <div className="w-2 h-2 bg-bull-500 rounded-full" />
                  <div className="absolute inset-0 w-2 h-2 bg-bull-500 rounded-full animate-ping opacity-75" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 leading-none">Latency</span>
                  <span className="text-xs text-bull-400 font-mono font-bold">{latency.toFixed(1)}ms</span>
                </div>
              </motion.div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 glass rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2.5 glass rounded-xl transition-colors border ${
                    showSettings 
                      ? 'text-primary-400 bg-primary-500/10 border-primary-500/30' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10 border-white/5'
                  }`}
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2.5 glass rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minus className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </motion.button>
              </div>

              {/* Wallet Connect */}
              <div className="ml-2">
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Trading Layout */}
      <div className={`max-w-[1920px] mx-auto transition-all duration-300 ${isFullscreen ? 'px-0' : 'px-4 lg:px-6'} py-4 lg:py-6`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-[calc(100vh-6rem)]">
          
          {/* Left Column - Order Book */}
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`lg:col-span-3 xl:col-span-2 flex flex-col gap-4 transition-all duration-300 ${
              sidebarCollapsed ? 'lg:col-span-1' : ''
            }`}
          >
            <div className="flex-1 min-h-0">
              <OrderBook market={selectedMarket} />
            </div>
            
            {/* Collapse button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-full p-2 glass rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
            >
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </motion.button>
          </motion.aside>

          {/* Center Column - Chart */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-6 xl:col-span-7 flex flex-col min-h-0"
          >
            <div className="card h-full flex flex-col overflow-hidden">
              {/* Enhanced Chart Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-dark-900/50">
                <div className="flex items-center gap-4 flex-1">
                  {/* Chart Type Toggle */}
                  <div className="flex items-center gap-1 p-1 glass rounded-xl border border-white/5">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setChartType('candle')}
                      className={`p-2.5 rounded-lg transition-all ${
                        chartType === 'candle' 
                          ? 'bg-primary-500/20 text-primary-400 shadow-glow' 
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                      title="Candlestick Chart"
                    >
                      <CandlestickChart className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setChartType('line')}
                      className={`p-2.5 rounded-lg transition-all ${
                        chartType === 'line' 
                          ? 'bg-primary-500/20 text-primary-400 shadow-glow' 
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                      title="Line Chart"
                    >
                      <LineChart className="w-4 h-4" />
                    </motion.button>
                  </div>
                  
                  {/* Timeframe Selector */}
                  <div className="flex items-center gap-1 p-1 glass rounded-xl border border-white/5">
                    {timeframes.map((tf) => (
                      <motion.button
                        key={tf.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedTimeframe(tf.value)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          selectedTimeframe === tf.value
                            ? 'bg-primary-500/20 text-primary-400 shadow-glow'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tf.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Indicators */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-400 hover:text-white glass rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Indicators</span>
                  </motion.button>
                  
                  {/* Refresh */}
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 180 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-400 hover:text-white glass rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              
              {/* Chart Container */}
              <div className="flex-1 min-h-0 p-4">
                <TradingChart 
                  market={selectedMarket} 
                  timeframe={selectedTimeframe}
                  chartType={chartType}
                />
              </div>
            </div>
          </motion.main>

          {/* Right Column - Trade Form & Recent Trades */}
          <motion.aside
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3 flex flex-col gap-4 min-h-0"
          >
            {/* Trade Form */}
            <div className="flex-shrink-0">
              <TradeForm market={selectedMarket} />
            </div>
            
            {/* Wallet Panel */}
            <div className="flex-shrink-0">
              <WalletPanel />
            </div>
            
            {/* Recent Trades */}
            <div className="flex-1 min-h-0">
              <RecentTrades market={selectedMarket} />
            </div>
          </motion.aside>
        </div>
      </div>

      {/* Enhanced Mobile Price Bar */}
      {!isLoading && marketData && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 lg:hidden glass-dark border-t border-white/10 p-4 z-40 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold font-mono">${formatPrice(marketData.price)}</div>
              <div className={`flex items-center gap-1.5 text-sm mt-1 ${
                marketData.change24h >= 0 ? 'text-bull-400' : 'text-bear-400'
              }`}>
                {marketData.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-semibold">{formatPercentage(marketData.change24h)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-buy px-6 py-3 rounded-xl font-bold"
              >
                Buy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-sell px-6 py-3 rounded-xl font-bold"
              >
                Sell
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Modal (Placeholder) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="text-gray-400">Settings panel coming soon...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
