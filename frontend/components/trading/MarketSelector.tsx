'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Star, TrendingUp, TrendingDown, X, Loader2 } from 'lucide-react';
import { formatPrice, formatPercentage } from '@/utils/format';
import { useMultipleMarketData } from '@/hooks/useMarketData';

interface MarketSelectorProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
}

// Available markets
const AVAILABLE_MARKETS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'BNB/USDT',
  'XRP/USDT',
  'ADA/USDT',
  'DOGE/USDT',
  'MATIC/USDT',
  'DOT/USDT',
];

// Store favorites in localStorage
const getFavorites = (): string[] => {
  if (typeof window === 'undefined') return ['BTC/USDT', 'ETH/USDT'];
  try {
    const stored = localStorage.getItem('marketFavorites');
    return stored ? JSON.parse(stored) : ['BTC/USDT', 'ETH/USDT'];
  } catch {
    return ['BTC/USDT', 'ETH/USDT'];
  }
};

const saveFavorites = (favorites: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('marketFavorites', JSON.stringify(favorites));
};

export default function MarketSelector({ selectedMarket, onMarketChange }: MarketSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [favorites, setFavorites] = useState<string[]>(getFavorites());
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get real-time market data
  const { data: marketData, isLoading } = useMultipleMarketData(AVAILABLE_MARKETS);
  
  // Toggle favorite
  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(symbol)
      ? favorites.filter(f => f !== symbol)
      : [...favorites, symbol];
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };
  
  // Get selected market data
  const selectedMarketData = useMemo(() => {
    return marketData[selectedMarket];
  }, [marketData, selectedMarket]);
  
  // Filter markets based on search and tab
  const filteredMarkets = useMemo(() => {
    return AVAILABLE_MARKETS.filter(symbol => {
      const matchesSearch = symbol.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === 'all' || favorites.includes(symbol);
      return matchesSearch && matchesTab;
    }).map(symbol => ({
      symbol,
      data: marketData[symbol],
      isFavorite: favorites.includes(symbol),
    }));
  }, [search, activeTab, marketData, favorites]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle market selection
  const handleSelect = (symbol: string) => {
    onMarketChange(symbol);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 glass rounded-xl hover:bg-white/10 transition-colors border border-white/10"
      >
        <div className="flex items-center gap-2">
          {/* Market icon placeholder */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {selectedMarket?.split('/')[0]?.slice(0, 2) ?? '--'}
            </span>
          </div>
          
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{selectedMarket}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {isLoading || !selectedMarketData ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <>
                  <span className="text-gray-300 font-mono">${formatPrice(selectedMarketData.price)}</span>
                  <span className={selectedMarketData.changePercent24h >= 0 ? 'text-bull-400' : 'text-bear-400'}>
                    {formatPercentage(selectedMarketData.changePercent24h)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.button>
      
      {/* Dropdown - Much more opaque and visible */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50 border border-white/20"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Search */}
              <div className="p-3 border-b border-white/20 bg-dark-900/80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search markets..."
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-800/90 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    autoFocus
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-1 p-2 border-b border-white/20 bg-dark-900/60">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeTab === 'all'
                      ? 'bg-primary-500/30 text-primary-300 border border-primary-500/50'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  All Markets
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                    activeTab === 'favorites'
                      ? 'bg-primary-500/30 text-primary-300 border border-primary-500/50'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  Favorites
                </button>
              </div>
              
              {/* Live indicator */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/20 bg-dark-900/80">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-bull-500" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-bull-500 animate-ping opacity-75" />
                </div>
                <span className="text-xs text-gray-300 font-medium">Real-time prices from Binance</span>
              </div>
              
              {/* Markets List */}
              <div className="max-h-80 overflow-y-auto scrollbar-thin bg-dark-900/40">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 text-primary-400 animate-spin mx-auto" />
                    <span className="text-gray-300 text-sm mt-2 block">Loading prices...</span>
                  </div>
                ) : filteredMarkets.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    No markets found
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredMarkets.map((market, index) => (
                      <motion.button
                        key={market.symbol}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSelect(market.symbol)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mb-1 ${
                          market.symbol === selectedMarket
                            ? 'bg-primary-500/20 border border-primary-500/50 shadow-lg shadow-primary-500/10'
                            : 'hover:bg-white/10 border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Favorite button */}
                          <button
                            onClick={(e) => toggleFavorite(market.symbol, e)}
                            className={`p-1 rounded transition-colors flex-shrink-0 ${
                              market.isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
                            }`}
                          >
                            <Star className="w-4 h-4" fill={market.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          
                          {/* Market icon */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500/80 to-secondary-500/80 flex items-center justify-center flex-shrink-0 border border-white/20">
                            <span className="text-xs font-bold text-white">
                              {market.symbol?.split('/')[0]?.slice(0, 2) ?? '--'}
                            </span>
                          </div>
                          
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">{market.symbol}</span>
                            </div>
                            {market.data && (
                              <span className="text-xs text-gray-400 block truncate">
                                Vol ${(market.data.volumeQuote24h / 1e6).toFixed(2)}M
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0 ml-2">
                          {market.data ? (
                            <>
                              <div className="font-mono text-sm font-bold text-white">
                                ${formatPrice(market.data.price)}
                              </div>
                              <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${
                                market.data.changePercent24h >= 0 ? 'text-bull-400' : 'text-bear-400'
                              }`}>
                                {market.data.changePercent24h >= 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {formatPercentage(market.data.changePercent24h)}
                              </div>
                            </>
                          ) : (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
