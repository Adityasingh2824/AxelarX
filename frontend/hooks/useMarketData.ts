import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdate: number;
}

// Mock market data - in production this would come from your Linera GraphQL API
const mockMarketData: Record<string, MarketData> = {
  'BTC/USDT': {
    symbol: 'BTC/USDT',
    price: 45234.56,
    change24h: 2.34,
    high24h: 46789.12,
    low24h: 44123.45,
    volume24h: 1234567.89,
    marketCap: 876543210987,
    lastUpdate: Date.now(),
  },
  'ETH/USDT': {
    symbol: 'ETH/USDT',
    price: 2834.67,
    change24h: -1.23,
    high24h: 2901.34,
    low24h: 2789.12,
    volume24h: 987654.32,
    marketCap: 340987654321,
    lastUpdate: Date.now(),
  },
  'SOL/USDT': {
    symbol: 'SOL/USDT',
    price: 98.45,
    change24h: 5.67,
    high24h: 102.34,
    low24h: 94.12,
    volume24h: 456789.12,
    marketCap: 43210987654,
    lastUpdate: Date.now(),
  },
};

export function useMarketData(symbol: string) {
  const [realTimeData, setRealTimeData] = useState<MarketData | null>(null);

  // Fetch initial market data
  const { data: initialData, isLoading, error } = useQuery({
    queryKey: ['marketData', symbol],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = mockMarketData[symbol];
      if (!data) {
        throw new Error(`Market data not found for ${symbol}`);
      }
      
      return data;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!initialData) return;

    setRealTimeData(initialData);

    const interval = setInterval(() => {
      setRealTimeData(prevData => {
        if (!prevData) return null;

        // More realistic price changes with momentum
        const momentum = Math.sin(Date.now() / 10000) * 0.3; // Adds trend momentum
        const volatility = 0.02 + Math.random() * 0.03; // 2-5% volatility
        const priceChange = (Math.random() - 0.5 + momentum) * prevData.price * volatility;
        const newPrice = Math.max(prevData.price + priceChange, 0.01);
        
        // Update 24h high/low if needed
        const newHigh24h = Math.max(prevData.high24h, newPrice);
        const newLow24h = Math.min(prevData.low24h, newPrice);
        
        // Calculate new 24h change
        const basePrice = prevData.price - (prevData.price * prevData.change24h / 100);
        const newChange24h = ((newPrice - basePrice) / basePrice) * 100;
        
        // Add some volume fluctuation
        const volumeChange = (Math.random() - 0.5) * 50000;
        const newVolume = Math.max(prevData.volume24h + volumeChange, 100000);

        return {
          ...prevData,
          price: newPrice,
          change24h: newChange24h,
          high24h: newHigh24h,
          low24h: newLow24h,
          volume24h: newVolume,
          lastUpdate: Date.now(),
        };
      });
    }, 1000 + Math.random() * 2000); // Update every 1-3 seconds

    return () => clearInterval(interval);
  }, [initialData]);

  return {
    marketData: realTimeData || initialData,
    isLoading,
    error,
  };
}

export function useMarketList() {
  return useQuery({
    queryKey: ['marketList'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return Object.values(mockMarketData);
    },
    staleTime: 60000, // 1 minute
  });
}

export function useTradingPairs() {
  const [pairs, setPairs] = useState([
    'BTC/USDT',
    'ETH/USDT', 
    'SOL/USDT',
    'AVAX/USDT',
    'DOT/USDT',
    'ATOM/USDT',
    'NEAR/USDT',
    'FTM/USDT',
  ]);

  return { pairs };
}

export function useOrderBook(symbol: string) {
  const [orderBook, setOrderBook] = useState({
    bids: [] as Array<{ price: number; size: number; total: number }>,
    asks: [] as Array<{ price: number; size: number; total: number }>,
    lastUpdate: Date.now(),
  });

  useEffect(() => {
    // Generate initial order book
    const generateOrderBook = () => {
      const basePrice = mockMarketData[symbol]?.price || 45000;
      const spread = basePrice * 0.001; // 0.1% spread
      
      const bids = [];
      const asks = [];
      
      let total = 0;
      
      // Generate bids
      for (let i = 0; i < 20; i++) {
        const price = basePrice - spread / 2 - i * (basePrice * 0.0001);
        const size = Math.random() * 5 + 0.1;
        total += size;
        
        bids.push({ price, size, total });
      }
      
      total = 0;
      
      // Generate asks
      for (let i = 0; i < 20; i++) {
        const price = basePrice + spread / 2 + i * (basePrice * 0.0001);
        const size = Math.random() * 5 + 0.1;
        total += size;
        
        asks.unshift({ price, size, total });
      }
      
      return { bids, asks, lastUpdate: Date.now() };
    };

    setOrderBook(generateOrderBook());

    // Update order book periodically
    const interval = setInterval(() => {
      setOrderBook(generateOrderBook());
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [symbol]);

  return orderBook;
}

export function useRecentTrades(symbol: string) {
  const [trades, setTrades] = useState<Array<{
    id: string;
    price: number;
    size: number;
    side: 'buy' | 'sell';
    timestamp: number;
  }>>([]);

  useEffect(() => {
    // Generate initial trades
    const generateTrades = () => {
      const basePrice = mockMarketData[symbol]?.price || 45000;
      const newTrades = [];
      
      for (let i = 0; i < 10; i++) {
        newTrades.push({
          id: `trade-${Date.now()}-${i}`,
          price: basePrice + (Math.random() - 0.5) * 100,
          size: Math.random() * 2 + 0.01,
          side: Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell',
          timestamp: Date.now() - i * 1000,
        });
      }
      
      return newTrades;
    };

    setTrades(generateTrades());

    // Add new trades periodically
    const interval = setInterval(() => {
      const basePrice = mockMarketData[symbol]?.price || 45000;
      const newTrade = {
        id: `trade-${Date.now()}`,
        price: basePrice + (Math.random() - 0.5) * 100,
        size: Math.random() * 2 + 0.01,
        side: Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell',
        timestamp: Date.now(),
      };

      setTrades(prevTrades => [newTrade, ...prevTrades.slice(0, 49)]); // Keep last 50 trades
    }, 3000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [symbol]);

  return trades;
}

export function useWalletBalance() {
  const [balances, setBalances] = useState({
    BTC: 0.12345678,
    ETH: 2.5678,
    SOL: 45.123,
    USDT: 10000.00,
    USDC: 5000.00,
  });

  return { balances };
}
