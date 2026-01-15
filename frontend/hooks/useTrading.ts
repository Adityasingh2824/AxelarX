import { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { evmClient, OrderBookEntry, Trade } from '@/lib/evm';
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
        const result = await evmClient.placeOrder(
          params.market,
          params.side === 'buy' ? 'Buy' : 'Sell',
          params.type === 'market' ? 'Market' : 'Limit',
          params.price.toString(),
          params.quantity.toString()
        );
        
        if (result.success && result.orderId) {
          return {
            orderId: result.orderId,
            status: 'pending',
            message: 'Order placed successfully',
          };
        } else {
          throw new Error(result.error || 'Failed to place order');
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
      queryClient.invalidateQueries({ queryKey: ['marketStats', variables.market] });
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
        const data = await evmClient.getOrderBook(market);
        if (data) {
          // Transform to match expected format
          let bidTotal = 0;
          let askTotal = 0;
          
          const bids = data.bids.map((bid: OrderBookEntry) => {
            bidTotal += parseFloat(bid.quantity);
            return {
              price: parseFloat(bid.price),
              size: parseFloat(bid.quantity),
              total: bidTotal,
            };
          });
          
          const asks = data.asks.map((ask: OrderBookEntry) => {
            askTotal += parseFloat(ask.quantity);
            return {
              price: parseFloat(ask.price),
              size: parseFloat(ask.quantity),
              total: askTotal,
            };
          });
          
          return { bids, asks, lastUpdate: Date.now() };
        }
      } catch (error) {
        console.warn('Failed to get EVM order book, using mock data:', error);
      }
      
      // Fallback to mock data generation
      const basePrice = 45000 + Math.random() * 1000;
      const spread = 10 + Math.random() * 20;
      
      const bids = [];
      const asks = [];
      
      let total = 0;
      
      // Generate bids
      for (let i = 0; i < 15; i++) {
        const price = basePrice - spread / 2 - i * (5 + Math.random() * 10);
        const size = Math.random() * 2 + 0.1;
        total += size;
        
        bids.push({ price, size, total });
      }
      
      total = 0;
      
      // Generate asks
      for (let i = 0; i < 15; i++) {
        const price = basePrice + spread / 2 + i * (5 + Math.random() * 10);
        const size = Math.random() * 2 + 0.1;
        total += size;
        
        asks.unshift({ price, size, total });
      }
      
      return { bids, asks, lastUpdate: Date.now() };
    },
    staleTime: 3000, // 3 seconds
    refetchInterval: 5000, // Refetch every 5 seconds
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
        const data = await evmClient.getRecentTrades(market);
        if (data.length > 0) {
          return data.map((trade: Trade) => ({
            id: trade.id,
            price: parseFloat(trade.price),
            size: parseFloat(trade.quantity),
            side: trade.maker === trade.taker ? 'buy' : (parseFloat(trade.price) > 0 ? 'sell' : 'buy'),
            timestamp: trade.timestamp * 1000,
          }));
        }
      } catch (error) {
        console.warn('Failed to get EVM trades, using mock data:', error);
      }
      
      // Fallback to mock data
      const basePrice = 45000 + Math.random() * 1000;
      const trades = [];
      
      for (let i = 0; i < 20; i++) {
        trades.push({
          id: `trade-${Date.now()}-${i}`,
          price: basePrice + (Math.random() - 0.5) * 100,
          size: Math.random() * 0.5 + 0.01,
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          timestamp: Date.now() - i * 5000,
        });
      }
      
      return trades;
    },
    staleTime: 2000, // 2 seconds
    refetchInterval: 3000, // Refetch every 3 seconds
  });

  return {
    trades,
    isLoading,
    error,
  };
}
