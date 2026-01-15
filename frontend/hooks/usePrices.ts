/**
 * React hooks for real-time cryptocurrency prices
 */

import { useState, useEffect, useCallback } from 'react';
import { priceService, PriceData, OrderBookData, TradeData } from '@/lib/priceService';

/**
 * Hook to get real-time price for a single symbol
 */
export function usePrice(symbol: string) {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    const fetchPrice = async () => {
      try {
        const data = await priceService.getPrice(symbol);
        if (mounted) {
          setPrice(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    fetchPrice();

    // Subscribe to real-time updates
    const unsubscribe = priceService.subscribeToPrice(symbol, (data) => {
      if (mounted) {
        setPrice(data);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [symbol]);

  return { price, isLoading, error };
}

/**
 * Hook to get real-time prices for multiple symbols
 */
export function usePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const unsubscribes: (() => void)[] = [];

    // Initial fetch
    const fetchPrices = async () => {
      try {
        const data = await priceService.getPrices(symbols);
        if (mounted) {
          setPrices(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    fetchPrices();

    // Subscribe to real-time updates for each symbol
    symbols.forEach((symbol) => {
      const unsubscribe = priceService.subscribeToPrice(symbol, (data) => {
        if (mounted) {
          setPrices((prev) => {
            const newPrices = new Map(prev);
            newPrices.set(symbol, data);
            return newPrices;
          });
        }
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      mounted = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [symbols.join(',')]);

  return { prices, isLoading, error };
}

/**
 * Hook to get real-time order book for a symbol
 */
export function useOrderBook(symbol: string) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    const fetchOrderBook = async () => {
      try {
        const data = await priceService.getOrderBook(symbol, 20);
        if (mounted) {
          setOrderBook(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    fetchOrderBook();

    // Subscribe to real-time updates
    const unsubscribe = priceService.subscribeToOrderBook(symbol, (data) => {
      if (mounted) {
        setOrderBook(data);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [symbol]);

  return { orderBook, isLoading, error };
}

/**
 * Hook to get real-time trades for a symbol
 */
export function useTrades(symbol: string, maxTrades: number = 50) {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Initial fetch
    const fetchTrades = async () => {
      try {
        const data = await priceService.getRecentTrades(symbol, maxTrades);
        if (mounted) {
          setTrades(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    fetchTrades();

    // Subscribe to real-time updates
    const unsubscribe = priceService.subscribeToTrades(symbol, (trade) => {
      if (mounted) {
        setTrades((prev) => {
          const newTrades = [trade, ...prev];
          return newTrades.slice(0, maxTrades);
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [symbol, maxTrades]);

  return { trades, isLoading, error };
}

/**
 * Hook for market data with all information
 */
export function useMarketData(symbol: string) {
  const { price, isLoading: priceLoading } = usePrice(symbol);
  const { orderBook, isLoading: orderBookLoading } = useOrderBook(symbol);
  const { trades, isLoading: tradesLoading } = useTrades(symbol);

  return {
    price,
    orderBook,
    trades,
    isLoading: priceLoading || orderBookLoading || tradesLoading,
    // Computed values
    spread: orderBook ? (orderBook.asks[0]?.price || 0) - (orderBook.bids[0]?.price || 0) : 0,
    spreadPercent: orderBook && orderBook.asks[0]?.price
      ? (((orderBook.asks[0].price - (orderBook.bids[0]?.price || 0)) / orderBook.asks[0].price) * 100)
      : 0,
    midPrice: orderBook
      ? ((orderBook.asks[0]?.price || 0) + (orderBook.bids[0]?.price || 0)) / 2
      : price?.price || 0,
  };
}








