import { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { lineraClient } from '@/lib/linera';
import { toast } from 'react-hot-toast';

export interface PlaceOrderParams {
  market: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop';
  price: number;
  quantity: number;
}

export interface OrderResult {
  orderId: string;
  status: 'pending' | 'filled' | 'cancelled';
  message?: string;
}

export function useTrading() {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const queryClient = useQueryClient();

  const placeOrderMutation = useMutation({
    mutationFn: async (params: PlaceOrderParams): Promise<OrderResult> => {
      try {
        const orderId = await lineraClient.placeOrder(params);
        
        if (orderId) {
          return {
            orderId,
            status: 'pending',
            message: 'Order placed successfully',
          };
        } else {
          throw new Error('Failed to place order');
        }
      } catch (error: any) {
        throw new Error(error.message || 'Failed to place order');
      }
    },
    onSuccess: (result, variables) => {
      toast.success(`${variables.side.toUpperCase()} order placed successfully!`);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['orderBook', variables.market] });
      queryClient.invalidateQueries({ queryKey: ['recentTrades', variables.market] });
      queryClient.invalidateQueries({ queryKey: ['userOrders'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const placeOrder = useCallback(async (params: PlaceOrderParams) => {
    setIsPlacingOrder(true);
    try {
      const result = await placeOrderMutation.mutateAsync(params);
      return result;
    } finally {
      setIsPlacingOrder(false);
    }
  }, [placeOrderMutation]);

  return {
    placeOrder,
    isPlacingOrder: isPlacingOrder || placeOrderMutation.isPending,
    error: placeOrderMutation.error,
  };
}

export function useOrderBook(market: string) {
  const { data: orderBook, isLoading, error } = useQuery({
    queryKey: ['orderBook', market],
    queryFn: async () => {
      try {
        const data = await lineraClient.getOrderBook(market);
        return data;
      } catch (error) {
        console.warn('Failed to get Linera order book, using mock data:', error);
        
        // Fallback to mock data generation
        const basePrice = 45000 + Math.random() * 10000;
        const spread = 50 + Math.random() * 100;
        
        const bids = [];
        const asks = [];
        
        let total = 0;
        
        // Generate bids
        for (let i = 0; i < 15; i++) {
          const price = basePrice - spread / 2 - i * (10 + Math.random() * 20);
          const size = Math.random() * 5 + 0.1;
          total += size;
          
          bids.push({ price, size, total });
        }
        
        total = 0;
        
        // Generate asks
        for (let i = 0; i < 15; i++) {
          const price = basePrice + spread / 2 + i * (10 + Math.random() * 20);
          const size = Math.random() * 5 + 0.1;
          total += size;
          
          asks.unshift({ price, size, total });
        }
        
        return { bids, asks, lastUpdate: Date.now() };
      }
    },
    staleTime: 5000, // 5 seconds
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  return {
    orderBook,
    isLoading,
    error,
  };
}

export function useRecentTrades(market: string) {
  const { data: trades = [], isLoading, error } = useQuery({
    queryKey: ['recentTrades', market],
    queryFn: async () => {
      try {
        const data = await lineraClient.getRecentTrades(market);
        return data;
      } catch (error) {
        console.warn('Failed to get Linera trades, using mock data:', error);
        
        // Fallback to mock data
        const basePrice = 45000 + Math.random() * 10000;
        const trades = [];
        
        for (let i = 0; i < 20; i++) {
          trades.push({
            id: `trade-${Date.now()}-${i}`,
            price: basePrice + (Math.random() - 0.5) * 1000,
            size: Math.random() * 2 + 0.01,
            side: Math.random() > 0.5 ? 'buy' : 'sell',
            timestamp: Date.now() - i * 1000,
          });
        }
        
        return trades;
      }
    },
    staleTime: 3000, // 3 seconds
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  return {
    trades,
    isLoading,
    error,
  };
}
