'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Star, TrendingUp, TrendingDown, X } from 'lucide-react';
import { formatPrice, formatPercentage } from '@/utils/format';

interface MarketSelectorProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
}

interface Market {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  isFavorite?: boolean;
}

// Mock markets data
const markets: Market[] = [
  { symbol: 'BTC/USDT', price: 45234.56, change24h: 2.34, volume24h: 1234567890, isFavorite: true },
  { symbol: 'ETH/USDT', price: 2834.67, change24h: -1.23, volume24h: 987654321, isFavorite: true },
  { symbol: 'SOL/USDT', price: 98.45, change24h: 5.67, volume24h: 456789123 },
  { symbol: 'AVAX/USDT', price: 34.56, change24h: -2.45, volume24h: 234567890 },
  { symbol: 'DOT/USDT', price: 7.89, change24h: 1.23, volume24h: 123456789 },
  { symbol: 'ATOM/USDT', price: 9.12, change24h: 3.45, volume24h: 98765432 },
  { symbol: 'NEAR/USDT', price: 5.67, change24h: -0.89, volume24h: 87654321 },
  { symbol: 'FTM/USDT', price: 0.45, change24h: 8.90, volume24h: 76543210 },
  { symbol: 'MATIC/USDT', price: 0.89, change24h: 1.56, volume24h: 65432109 },
  { symbol: 'ARB/USDT', price: 1.23, change24h: -3.21, volume24h: 54321098 },
];

export default function MarketSelector({ selectedMarket, onMarketChange }: MarketSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedMarketData = markets.find(m => m.symbol === selectedMarket) || markets[0];
  
  // Filter markets based on search and tab
  const filteredMarkets = markets.filter(market => {
    const matchesSearch = market.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || market.isFavorite;
    return matchesSearch && matchesTab;
  });
  
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
        className="flex items-center gap-3 px-4 py-2 glass rounded-xl hover:bg-white/10 transition-colors"
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
              <span className="text-gray-400">${formatPrice(selectedMarketData?.price ?? 0)}</span>
              <span className={(selectedMarketData?.change24h ?? 0) >= 0 ? 'text-bull-400' : 'text-bear-400'}>
                {formatPercentage(selectedMarketData?.change24h ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </motion.button>
      
      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-80 glass-strong rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search markets..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:border-primary-500/50 focus:outline-none"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-1 p-2 border-b border-white/5">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'all'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Markets
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'favorites'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Star className="w-3 h-3" />
                Favorites
              </button>
            </div>
            
            {/* Markets List */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {filteredMarkets.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
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
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                        market.symbol === selectedMarket
                          ? 'bg-primary-500/10 border border-primary-500/30'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Market icon */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/50 to-secondary-500/50 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {market.symbol?.split('/')[0]?.slice(0, 2) ?? '--'}
                          </span>
                        </div>
                        
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{market.symbol}</span>
                            {market.isFavorite && (
                              <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            Vol ${(market.volume24h / 1e6).toFixed(2)}M
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-mono text-sm text-white">
                          ${formatPrice(market.price)}
                        </div>
                        <div className={`flex items-center justify-end gap-1 text-xs ${
                          market.change24h >= 0 ? 'text-bull-400' : 'text-bear-400'
                        }`}>
                          {market.change24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatPercentage(market.change24h)}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
