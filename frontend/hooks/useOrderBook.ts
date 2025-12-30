/**
 * React hook for OrderBook contract interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderBookClient, OrderBookData, OrderBookMarketStats, Trade } from '@/lib/contracts/orderbook';
import { getMarketConfig, getGraphQLEndpoint } from '@/lib/contracts/config';

export interface UseOrderBookResult {
  orderBook: OrderBookData | null;
  marketStats: OrderBookMarketStats | null;
  recentTrades: Trade[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  placeOrder: (params: {
    side: 'Buy' | 'Sell';
    orderType: 'Limit' | 'Market';
    price: string;
    quantity: string;
  }) => Promise<{ success: boolean; error?: string }>;
  cancelOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useOrderBook(market: string): UseOrderBookResult {
  const queryClient = useQueryClient();
  const [orderBookClient, setOrderBookClient] = useState<OrderBookClient | null>(null);

  // Initialize contract client
  useEffect(() => {
    let mounted = true;

    const initClient = async () => {
      const marketConfig = await getMarketConfig(market);
      if (!marketConfig?.orderbookAppId || !marketConfig.chainId) {
        console.warn(`Market ${market} not configured`);
        return;
      }

      const graphqlUrl = await getGraphQLEndpoint();
      const client = new OrderBookClient(
        marketConfig.orderbookAppId,
        marketConfig.chainId,
        graphqlUrl
      );

      if (mounted) {
        setOrderBookClient(client);
      }
    };

    initClient();

    return () => {
      mounted = false;
    };
  }, [market]);

  // Query order book data
  const { data: orderBookData, isLoading: isLoadingOrderBook, isError: isOrderBookError, error: orderBookError, refetch: refetchOrderBook } = useQuery<OrderBookData | null>({
    queryKey: ['orderBook', market],
    queryFn: async () => {
      if (!orderBookClient) return null;
      return orderBookClient.getOrderBook(20);
    },
    enabled: !!orderBookClient,
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  // Query market stats
  const { data: marketStats, isLoading: isLoadingStats } = useQuery<OrderBookMarketStats | null>({
    queryKey: ['marketStats', market],
    queryFn: async () => {
      if (!orderBookClient) return null;
      return orderBookClient.getMarketStats();
    },
    enabled: !!orderBookClient,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Query recent trades
  const { data: recentTrades = [] } = useQuery<Trade[]>({
    queryKey: ['recentTrades', market],
    queryFn: async () => {
      if (!orderBookClient) return [];
      return orderBookClient.getRecentTrades(50);
    },
    enabled: !!orderBookClient,
    refetchInterval: 1000, // Refetch every second
  });

  // Place order mutation
  const placeOrder = useCallback(async (params: {
    side: 'Buy' | 'Sell';
    orderType: 'Limit' | 'Market';
    price: string;
    quantity: string;
  }) => {
    if (!orderBookClient) {
      return { success: false, error: 'Contract client not initialized' };
    }

    try {
      const result = await orderBookClient.placeOrder({
        ...params,
        timeInForce: 'GTC',
      });

      if (result.success) {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['orderBook', market] });
        queryClient.invalidateQueries({ queryKey: ['marketStats', market] });
        queryClient.invalidateQueries({ queryKey: ['recentTrades', market] });
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [orderBookClient, market, queryClient]);

  // Cancel order mutation
  const cancelOrder = useCallback(async (orderId: string) => {
    if (!orderBookClient) {
      return { success: false, error: 'Contract client not initialized' };
    }

    try {
      const result = await orderBookClient.cancelOrder(orderId);

      if (result.success) {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['orderBook', market] });
        queryClient.invalidateQueries({ queryKey: ['marketStats', market] });
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [orderBookClient, market, queryClient]);

  const refetch = useCallback(() => {
    refetchOrderBook();
  }, [refetchOrderBook]);

  return {
    orderBook: orderBookData || null,
    marketStats: marketStats || null,
    recentTrades,
    isLoading: isLoadingOrderBook || isLoadingStats,
    isError: isOrderBookError,
    error: orderBookError as Error | null,
    refetch,
    placeOrder,
    cancelOrder,
  };
}



