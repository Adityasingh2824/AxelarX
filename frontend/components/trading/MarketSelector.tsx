'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { useTradingPairs, useMarketList } from '@/hooks/useMarketData';
import { formatPrice, formatPercent } from '@/utils/format';

interface MarketSelectorProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
}

export default function MarketSelector({ selectedMarket, onMarketChange }: MarketSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['BTC/USDT', 'ETH/USDT']);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { pairs } = useTradingPairs();
  const { data: marketList } = useMarketList();

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

  const filteredPairs = pairs.filter(pair =>
    pair.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFavorite = (pair: string) => {
    setFavorites(prev =>
      prev.includes(pair)
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  const getMarketData = (symbol: string) => {
    return marketList?.find(m => m.symbol === symbol);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-dark-800/50 hover:bg-dark-700/50 border border-white/20 rounded-lg px-4 py-2 transition-all duration-200"
      >
        <div className="text-left">
          <div className="text-white font-semibold text-lg">{selectedMarket}</div>
          {getMarketData(selectedMarket) && (
            <div className="text-xs text-gray-400">
              ${formatPrice(getMarketData(selectedMarket)!.price)}
              <span className={`ml-2 ${
                getMarketData(selectedMarket)!.change24h >= 0 ? 'text-bull-500' : 'text-bear-500'
              }`}>
                {formatPercent(getMarketData(selectedMarket)!.change24h)}
              </span>
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-80 bg-dark-800 border border-white/20 rounded-xl shadow-2xl backdrop-blur-md z-50"
          >
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Favorites */}
            {favorites.length > 0 && (
              <div className="p-2 border-b border-white/10">
                <div className="flex items-center space-x-2 px-2 py-1 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-400 font-medium">Favorites</span>
                </div>
                <div className="space-y-1">
                  {favorites.map((pair) => {
                    const marketData = getMarketData(pair);
                    return (
                      <motion.button
                        key={pair}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        onClick={() => {
                          onMarketChange(pair);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(pair);
                            }}
                            className="p-1"
                          >
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          </button>
                          <span className="text-white font-medium">{pair}</span>
                        </div>
                        {marketData && (
                          <div className="text-right">
                            <div className="text-sm text-white">
                              ${formatPrice(marketData.price)}
                            </div>
                            <div className={`text-xs ${
                              marketData.change24h >= 0 ? 'text-bull-500' : 'text-bear-500'
                            }`}>
                              {marketData.change24h >= 0 ? (
                                <TrendingUp className="w-3 h-3 inline mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 inline mr-1" />
                              )}
                              {formatPercent(marketData.change24h)}
                            </div>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Markets */}
            <div className="p-2 max-h-60 overflow-y-auto scrollbar-thin">
              <div className="flex items-center space-x-2 px-2 py-1 mb-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-400 font-medium">All Markets</span>
              </div>
              <div className="space-y-1">
                {filteredPairs.map((pair) => {
                  const marketData = getMarketData(pair);
                  const isFavorite = favorites.includes(pair);
                  
                  return (
                    <motion.button
                      key={pair}
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      onClick={() => {
                        onMarketChange(pair);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        selectedMarket === pair ? 'bg-primary-500/20 border border-primary-500/50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(pair);
                          }}
                          className="p-1"
                        >
                          <Star className={`w-3 h-3 ${
                            isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-500'
                          }`} />
                        </button>
                        <span className="text-white font-medium">{pair}</span>
                      </div>
                      {marketData && (
                        <div className="text-right">
                          <div className="text-sm text-white">
                            ${formatPrice(marketData.price)}
                          </div>
                          <div className={`text-xs ${
                            marketData.change24h >= 0 ? 'text-bull-500' : 'text-bear-500'
                          }`}>
                            {marketData.change24h >= 0 ? (
                              <TrendingUp className="w-3 h-3 inline mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 inline mr-1" />
                            )}
                            {formatPercent(marketData.change24h)}
                          </div>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              
              {filteredPairs.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  No markets found for "{searchTerm}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
