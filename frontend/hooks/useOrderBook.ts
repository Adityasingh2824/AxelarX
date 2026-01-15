/**
 * React hook for OrderBook EVM contract interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { evmClient, OrderBookEntry, MarketStats, Trade, Order } from '@/lib/evm';

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: string;
  spreadPercentage: string;
}

export interface UseOrderBookResult {
  orderBook: OrderBookData | null;
  marketStats: MarketStats | null;
  recentTrades: Trade[];
  userOrders: Order[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  placeOrder: (params: {
    side: 'Buy' | 'Sell';
    orderType: 'Limit' | 'Market';
    price: string;
    quantity: string;
  }) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  cancelOrder: (orderId: string) => Promise<{ success: boolean; error?: string }>;
}

export function useOrderBook(market: string): UseOrderBookResult {
  const queryClient = useQueryClient();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Initialize and get wallet address
  useEffect(() => {
    const initWallet = async () => {
      const wallet = await evmClient.connectWallet();
      if (wallet) {
        setWalletAddress(wallet.address);
      }
    };
    initWallet();
  }, []);

  // Query order book data
  const { 
    data: orderBookData, 
    isLoading: isLoadingOrderBook, 
    isError: isOrderBookError, 
    error: orderBookError, 
    refetch: refetchOrderBook 
  } = useQuery<OrderBookData | null>({
    queryKey: ['orderBook', market],
    queryFn: async () => {
      const data = await evmClient.getOrderBook(market);
      if (!data) {
        // Generate mock data if contract not deployed yet
        return generateMockOrderBook();
      }
      
      const bestBid = parseFloat(data.bids[0]?.price || '0');
      const bestAsk = parseFloat(data.asks[0]?.price || '0');
      const spread = bestAsk - bestBid;
      const spreadPercentage = bestAsk > 0 ? ((spread / bestAsk) * 100).toFixed(4) : '0';
      
      return {
        bids: data.bids,
        asks: data.asks,
        spread: spread.toString(),
        spreadPercentage,
      };
    },
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  // Query market stats
  const { data: marketStats, isLoading: isLoadingStats } = useQuery<MarketStats | null>({
    queryKey: ['marketStats', market],
    queryFn: async () => {
      const stats = await evmClient.getMarketStats(market);
      if (!stats) {
        // Generate mock stats if contract not deployed yet
        return generateMockMarketStats();
      }
      return stats;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Query recent trades
  const { data: recentTrades = [] } = useQuery<Trade[]>({
    queryKey: ['recentTrades', market],
    queryFn: async () => {
      const trades = await evmClient.getRecentTrades(market);
      if (!trades.length) {
        // Generate mock trades if contract not deployed yet
        return generateMockTrades();
      }
      return trades;
    },
    refetchInterval: 2000, // Refetch every 2 seconds
  });

  // Query user orders
  const { data: userOrders = [] } = useQuery<Order[]>({
    queryKey: ['userOrders', market, walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      return evmClient.getUserOrders(market, walletAddress);
    },
    enabled: !!walletAddress,
    refetchInterval: 5000,
  });

  // Place order mutation
  const placeOrder = useCallback(async (params: {
    side: 'Buy' | 'Sell';
    orderType: 'Limit' | 'Market';
    price: string;
    quantity: string;
  }) => {
    try {
      const result = await evmClient.placeOrder(
        market,
        params.side,
        params.orderType,
        params.price,
        params.quantity
      );

      if (result.success) {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['orderBook', market] });
        queryClient.invalidateQueries({ queryKey: ['marketStats', market] });
        queryClient.invalidateQueries({ queryKey: ['recentTrades', market] });
        queryClient.invalidateQueries({ queryKey: ['userOrders', market] });
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [market, queryClient]);

  // Cancel order mutation
  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      const result = await evmClient.cancelOrder(market, orderId);

      if (result.success) {
        // Invalidate queries to refetch
        queryClient.invalidateQueries({ queryKey: ['orderBook', market] });
        queryClient.invalidateQueries({ queryKey: ['marketStats', market] });
        queryClient.invalidateQueries({ queryKey: ['userOrders', market] });
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [market, queryClient]);

  const refetch = useCallback(() => {
    refetchOrderBook();
  }, [refetchOrderBook]);

  return {
    orderBook: orderBookData || null,
    marketStats: marketStats || null,
    recentTrades,
    userOrders,
    isLoading: isLoadingOrderBook || isLoadingStats,
    isError: isOrderBookError,
    error: orderBookError as Error | null,
    refetch,
    placeOrder,
    cancelOrder,
  };
}

// Mock data generators for when contracts aren't deployed
function generateMockOrderBook(): OrderBookData {
  const basePrice = 45000 + Math.random() * 1000;
  const spread = 10 + Math.random() * 20;
  
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  
  for (let i = 0; i < 15; i++) {
    bids.push({
      price: (basePrice - spread / 2 - i * (5 + Math.random() * 10)).toFixed(2),
      quantity: (Math.random() * 2 + 0.1).toFixed(4),
    });
    
    asks.push({
      price: (basePrice + spread / 2 + i * (5 + Math.random() * 10)).toFixed(2),
      quantity: (Math.random() * 2 + 0.1).toFixed(4),
    });
  }
  
  return {
    bids,
    asks,
    spread: spread.toFixed(2),
    spreadPercentage: ((spread / basePrice) * 100).toFixed(4),
  };
}

function generateMockMarketStats(): MarketStats {
  const lastPrice = 45000 + Math.random() * 1000;
  return {
    lastPrice: lastPrice.toFixed(2),
    bestBid: (lastPrice - 5).toFixed(2),
    bestAsk: (lastPrice + 5).toFixed(2),
    volume24h: (Math.random() * 1000 + 100).toFixed(2),
    high24h: (lastPrice + Math.random() * 500).toFixed(2),
    low24h: (lastPrice - Math.random() * 500).toFixed(2),
    totalTrades: Math.floor(Math.random() * 10000),
  };
}

function generateMockTrades(): Trade[] {
  const basePrice = 45000 + Math.random() * 1000;
  const trades: Trade[] = [];
  
  for (let i = 0; i < 20; i++) {
    trades.push({
      id: `${Date.now()}-${i}`,
      makerOrderId: `${Math.floor(Math.random() * 1000)}`,
      takerOrderId: `${Math.floor(Math.random() * 1000)}`,
      maker: `0x${Math.random().toString(16).slice(2, 42)}`,
      taker: `0x${Math.random().toString(16).slice(2, 42)}`,
      price: (basePrice + (Math.random() - 0.5) * 100).toFixed(2),
      quantity: (Math.random() * 0.5 + 0.01).toFixed(4),
      timestamp: Math.floor(Date.now() / 1000) - i * 60,
    });
  }
  
  return trades;
}
