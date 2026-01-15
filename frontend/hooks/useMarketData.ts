'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { priceService, PriceData, OrderBookData as RawOrderBookData, TradeData } from '@/lib/priceService';

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

// Convert PriceData to MarketData
const convertToMarketData = (data: PriceData): MarketData => ({
  symbol: data.symbol,
  price: data.price,
  change24h: data.priceChange24h,
  changePercent24h: data.priceChangePercent24h,
  high24h: data.high24h,
  low24h: data.low24h,
  volume24h: data.volume24h,
  volumeQuote24h: data.quoteVolume24h,
  marketCap: data.quoteVolume24h * 10, // Estimate, real would come from CoinGecko
  lastUpdate: data.lastUpdate,
});

export function useMarketData(market: string): UseMarketDataResult {
  const queryClient = useQueryClient();
  const [realTimeData, setRealTimeData] = useState<MarketData | null>(null);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initial data fetch from Binance
  const { data, isLoading, refetch } = useQuery<MarketData | null>({
    queryKey: ['marketData', market],
    queryFn: async () => {
      try {
        const priceData = await priceService.getPrice(market);
        if (priceData) {
          return convertToMarketData(priceData);
        }
        return null;
      } catch (err) {
        setIsError(true);
        setError(err as Error);
        return null;
      }
    },
    staleTime: 5000,
    refetchInterval: 30000,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (data) {
      setRealTimeData(data);
    }

    const unsubscribe = priceService.subscribeToPrice(market, (priceData) => {
      setRealTimeData(convertToMarketData(priceData));
      setIsError(false);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, [market, data]);

  const memoizedRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    marketData: realTimeData,
    isLoading,
    isError,
    error,
    refetch: memoizedRefetch,
  };
}

// Hook for multiple markets with real-time updates
export function useMultipleMarketData(markets: string[]) {
  const [allData, setAllData] = useState<Record<string, MarketData>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Initial fetch
    const fetchAll = async () => {
      setIsLoading(true);
      const prices = await priceService.getPrices(markets);
      const converted: Record<string, MarketData> = {};
      prices.forEach((data, symbol) => {
        converted[symbol] = convertToMarketData(data);
      });
      setAllData(converted);
      setIsLoading(false);
    };

    fetchAll();

    // Subscribe to real-time updates for each market
    markets.forEach((market) => {
      const unsubscribe = priceService.subscribeToPrice(market, (priceData) => {
        setAllData((prev) => ({
          ...prev,
          [market]: convertToMarketData(priceData),
        }));
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [markets.join(',')]);

  return { data: allData, isLoading };
}

// Real-time Order Book Hook
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

export function useOrderBookData(market: string) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    const fetchOrderBook = async () => {
      const data = await priceService.getOrderBook(market, 20);
      if (mounted && data) {
        const bids = data.bids.map((bid, index) => ({
          price: bid.price,
          size: bid.quantity,
          total: data.bids.slice(0, index + 1).reduce((sum, b) => sum + b.quantity, 0),
        }));

        const asks = data.asks.map((ask, index) => ({
          price: ask.price,
          size: ask.quantity,
          total: data.asks.slice(0, index + 1).reduce((sum, a) => sum + a.quantity, 0),
        }));

        const spread = asks.length > 0 && bids.length > 0
          ? asks[0].price - bids[0].price
          : 0;

        setOrderBook({
          bids,
          asks,
          spread,
          spreadPercentage: asks.length > 0 ? (spread / asks[0].price) * 100 : 0,
        });
        setIsLoading(false);
      }
    };

    fetchOrderBook();

    // Subscribe to real-time updates
    const unsubscribe = priceService.subscribeToOrderBook(market, (data) => {
      if (!mounted) return;

      const bids = data.bids.map((bid, index) => ({
        price: bid.price,
        size: bid.quantity,
        total: data.bids.slice(0, index + 1).reduce((sum, b) => sum + b.quantity, 0),
      }));

      const asks = data.asks.map((ask, index) => ({
        price: ask.price,
        size: ask.quantity,
        total: data.asks.slice(0, index + 1).reduce((sum, a) => sum + a.quantity, 0),
      }));

      const spread = asks.length > 0 && bids.length > 0
        ? asks[0].price - bids[0].price
        : 0;

      setOrderBook({
        bids,
        asks,
        spread,
        spreadPercentage: asks.length > 0 ? (spread / asks[0].price) * 100 : 0,
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [market]);

  return { orderBook, isLoading };
}

// Real-time Trades Hook
export interface Trade {
  id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export function useRecentTrades(market: string) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    const fetchTrades = async () => {
      const data = await priceService.getRecentTrades(market, 50);
      if (mounted) {
        setTrades(data.map(t => ({
          id: t.id,
          price: t.price,
          size: t.quantity,
          side: t.side,
          timestamp: t.timestamp,
        })));
        setIsLoading(false);
      }
    };

    fetchTrades();

    // Subscribe to real-time updates
    const unsubscribe = priceService.subscribeToTrades(market, (trade) => {
      if (!mounted) return;
      setTrades((prev) => {
        const newTrade: Trade = {
          id: trade.id,
          price: trade.price,
          size: trade.quantity,
          side: trade.side,
          timestamp: trade.timestamp,
        };
        return [newTrade, ...prev].slice(0, 50);
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [market]);

  return { trades, isLoading };
}

// Legacy hook for backward compatibility
export function useMockOrderBook(market: string) {
  const { orderBook } = useOrderBookData(market);
  return orderBook;
}
