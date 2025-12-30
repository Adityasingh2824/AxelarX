'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeQuote24h: number;
  marketCap: number;
  lastUpdate: number;
}

interface UseMarketDataResult {
  marketData: MarketData | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

// Generate realistic mock data
const generateMockData = (symbol: string): MarketData => {
  const basePrices: Record<string, number> = {
    'BTC/USDT': 45234.56,
    'ETH/USDT': 2834.67,
    'SOL/USDT': 98.45,
    'AVAX/USDT': 34.56,
    'DOT/USDT': 7.89,
    'ATOM/USDT': 9.12,
    'NEAR/USDT': 5.67,
    'FTM/USDT': 0.45,
    'MATIC/USDT': 0.89,
    'ARB/USDT': 1.23,
  };

  const basePrice = basePrices[symbol] || 100;
  const volatility = 0.02; // 2% volatility
  const randomChange = (Math.random() - 0.5) * 2 * volatility;
  const price = basePrice * (1 + randomChange);
  
  const change24h = (Math.random() - 0.4) * 10; // -6% to +6%
  const previousPrice = price / (1 + change24h / 100);
  
  const volume24h = basePrice * (10000 + Math.random() * 50000);
  const volumeQuote24h = volume24h * price;
  
  return {
    symbol,
    price,
    change24h: price - previousPrice,
    changePercent24h: change24h,
    high24h: price * (1 + Math.random() * 0.05),
    low24h: price * (1 - Math.random() * 0.05),
    volume24h,
    volumeQuote24h,
    marketCap: price * (1000000 + Math.random() * 10000000),
    lastUpdate: Date.now(),
  };
};

// Simulated price update
const updatePrice = (data: MarketData): MarketData => {
  const volatility = 0.001; // 0.1% per update
  const randomChange = (Math.random() - 0.5) * 2 * volatility;
  const newPrice = data.price * (1 + randomChange);
  
  return {
    ...data,
    price: newPrice,
    change24h: data.change24h + (newPrice - data.price),
    high24h: Math.max(data.high24h, newPrice),
    low24h: Math.min(data.low24h, newPrice),
    lastUpdate: Date.now(),
  };
};

export function useMarketData(market: string): UseMarketDataResult {
  const queryClient = useQueryClient();
  const [realTimeData, setRealTimeData] = useState<MarketData | null>(null);

  // Initial data fetch
  const { data, isLoading, isError, error, refetch } = useQuery<MarketData>({
    queryKey: ['marketData', market],
    queryFn: async () => {
      // In production, this would try to fetch from contract first
      // For now, use mock data until contracts are deployed
      await new Promise(resolve => setTimeout(resolve, 300));
      return generateMockData(market);
    },
    staleTime: 5000,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time updates simulation
  useEffect(() => {
    if (!data) return;

    setRealTimeData(data);

    // Simulate WebSocket updates
    const interval = setInterval(() => {
      setRealTimeData(prev => {
        if (!prev) return data;
        return updatePrice(prev);
      });
    }, 500 + Math.random() * 1000); // Random interval between 0.5-1.5s

    return () => clearInterval(interval);
  }, [data]);

  // Memoize the refetch callback
  const memoizedRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    marketData: realTimeData,
    isLoading,
    isError,
    error: error as Error | null,
    refetch: memoizedRefetch,
  };
}

// Hook for multiple markets
export function useMultipleMarketData(markets: string[]) {
  const [allData, setAllData] = useState<Record<string, MarketData>>({});

  useEffect(() => {
    // Initialize with mock data
    const initialData: Record<string, MarketData> = {};
    markets.forEach(market => {
      initialData[market] = generateMockData(market);
    });
    setAllData(initialData);

    // Update all markets periodically
    const interval = setInterval(() => {
      setAllData(prev => {
        const updated: Record<string, MarketData> = {};
        Object.entries(prev).forEach(([market, data]) => {
          updated[market] = updatePrice(data);
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [markets.join(',')]);

  return allData;
}

// Hook for order book data (mock version - for backward compatibility)
// Note: Use the contract-based useOrderBook from './useOrderBook' for real data
export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercentage: number;
}

export function useMockOrderBook(market: string) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);

  useEffect(() => {
    const generateOrderBook = (basePrice: number): OrderBookData => {
      const spread = basePrice * 0.0005;
      const bids: OrderBookEntry[] = [];
      const asks: OrderBookEntry[] = [];

      let bidTotal = 0;
      let askTotal = 0;

      for (let i = 0; i < 15; i++) {
        const bidPrice = basePrice - spread / 2 - i * basePrice * 0.0001;
        const bidSize = Math.random() * 3 + 0.1;
        bidTotal += bidSize;
        bids.push({ price: bidPrice, size: bidSize, total: bidTotal });

        const askPrice = basePrice + spread / 2 + i * basePrice * 0.0001;
        const askSize = Math.random() * 3 + 0.1;
        askTotal += askSize;
        asks.unshift({ price: askPrice, size: askSize, total: askTotal });
      }

      return {
        bids,
        asks,
        spread,
        spreadPercentage: (spread / basePrice) * 100,
      };
    };

    const basePrices: Record<string, number> = {
      'BTC/USDT': 45234.56,
      'ETH/USDT': 2834.67,
      'SOL/USDT': 98.45,
    };

    const basePrice = basePrices[market] || 100;

    const interval = setInterval(() => {
      const newPrice = basePrice * (1 + (Math.random() - 0.5) * 0.002);
      setOrderBook(generateOrderBook(newPrice));
    }, 500);

    // Initial data
    setOrderBook(generateOrderBook(basePrice));

    return () => clearInterval(interval);
  }, [market]);

  return orderBook;
}

// Hook for recent trades
export interface Trade {
  id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export function useRecentTrades(market: string) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const basePrices: Record<string, number> = {
      'BTC/USDT': 45234.56,
      'ETH/USDT': 2834.67,
      'SOL/USDT': 98.45,
    };

    let price = basePrices[market] || 100;

    // Generate initial trades
    const initialTrades: Trade[] = [];
    for (let i = 0; i < 20; i++) {
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      price += (Math.random() - 0.5) * price * 0.001;
      initialTrades.push({
        id: `trade-${Date.now()}-${i}`,
        price,
        size: Math.random() * 2 + 0.01,
        side,
        timestamp: Date.now() - i * 1000,
      });
    }
    setTrades(initialTrades);

    // Add new trades periodically
    const interval = setInterval(() => {
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      price += (Math.random() - 0.5) * price * 0.001;
      
      const newTrade: Trade = {
        id: `trade-${Date.now()}`,
        price,
        size: Math.random() * 2 + 0.01,
        side,
        timestamp: Date.now(),
      };

      setTrades(prev => [newTrade, ...prev.slice(0, 49)]);
    }, 800 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [market]);

  return trades;
}
