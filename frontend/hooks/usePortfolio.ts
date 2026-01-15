/**
 * Portfolio Management Hook
 * Provides real-time P&L calculation, trade history, and performance analytics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { OrderBookClient } from '@/lib/contracts/orderbook';
import { getMarketConfig } from '@/lib/contracts/config';
import { formatPrice, formatPercentage } from '@/utils/format';

export interface Position {
  market: string;
  baseAsset: string;
  quoteAsset: string;
  baseQuantity: number;
  quoteQuantity: number;
  averageEntryPrice: number;
  currentPrice: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  pnlPercentage: number;
  totalTrades: number;
  totalVolume: number;
}

export interface TradeHistoryEntry {
  id: string;
  tradeId: string;
  orderId: string;
  market: string;
  side: 'Buy' | 'Sell';
  price: number;
  quantity: number;
  fee: number;
  timestamp: number;
  realizedPnl: number;
  date: string;
}

export interface PortfolioMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalPnl: number;
  averageProfitPerTrade: number;
  averageLossPerTrade: number;
  largestWin: number;
  largestLoss: number;
  winRate: number;
  totalVolume: number;
  roi: number;
  totalFeesPaid: number;
}

export interface UsePortfolioResult {
  positions: Position[];
  tradeHistory: TradeHistoryEntry[];
  metrics: PortfolioMetrics | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  exportToCSV: () => void;
  exportToJSON: () => void;
}

// Mock data generator for development
function generateMockPositions(): Position[] {
  const markets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  return markets.map((market, index) => {
    const [base, quote] = market.split('/');
    const baseQty = 0.5 + Math.random() * 2;
    const entryPrice = 45000 + Math.random() * 5000;
    const currentPrice = entryPrice * (0.95 + Math.random() * 0.1);
    const realizedPnl = (Math.random() - 0.3) * 1000;
    const unrealizedPnl = (currentPrice - entryPrice) * baseQty;
    const totalPnl = realizedPnl + unrealizedPnl;
    
    return {
      market,
      baseAsset: base,
      quoteAsset: quote,
      baseQuantity: baseQty,
      quoteQuantity: entryPrice * baseQty,
      averageEntryPrice: entryPrice,
      currentPrice,
      realizedPnl,
      unrealizedPnl,
      totalPnl,
      pnlPercentage: ((totalPnl / (entryPrice * baseQty)) * 100),
      totalTrades: Math.floor(Math.random() * 50) + 10,
      totalVolume: entryPrice * baseQty * (1 + Math.random()),
    };
  });
}

function generateMockTradeHistory(): TradeHistoryEntry[] {
  const trades: TradeHistoryEntry[] = [];
  const markets = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
  const now = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const market = markets[Math.floor(Math.random() * markets.length)];
    const side = Math.random() > 0.5 ? 'Buy' : 'Sell';
    const price = 45000 + (Math.random() - 0.5) * 5000;
    const quantity = 0.01 + Math.random() * 0.5;
    const fee = price * quantity * 0.001;
    const timestamp = now - i * 3600000; // Spread over hours
    const realizedPnl = (Math.random() - 0.4) * 500;
    
    trades.push({
      id: `trade-${i}`,
      tradeId: `trade-${i}`,
      orderId: `order-${i}`,
      market,
      side,
      price,
      quantity,
      fee,
      timestamp,
      realizedPnl,
      date: new Date(timestamp).toISOString(),
    });
  }
  
  return trades.sort((a, b) => b.timestamp - a.timestamp);
}

function calculateMetrics(tradeHistory: TradeHistoryEntry[]): PortfolioMetrics {
  if (tradeHistory.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalRealizedPnl: 0,
      totalUnrealizedPnl: 0,
      totalPnl: 0,
      averageProfitPerTrade: 0,
      averageLossPerTrade: 0,
      largestWin: 0,
      largestLoss: 0,
      winRate: 0,
      totalVolume: 0,
      roi: 0,
      totalFeesPaid: 0,
    };
  }
  
  const winningTrades = tradeHistory.filter(t => t.realizedPnl > 0);
  const losingTrades = tradeHistory.filter(t => t.realizedPnl < 0);
  const totalRealizedPnl = tradeHistory.reduce((sum, t) => sum + t.realizedPnl, 0);
  const totalFeesPaid = tradeHistory.reduce((sum, t) => sum + t.fee, 0);
  const totalVolume = tradeHistory.reduce((sum, t) => sum + (t.price * t.quantity), 0);
  
  const profits = winningTrades.map(t => t.realizedPnl);
  const losses = losingTrades.map(t => Math.abs(t.realizedPnl));
  
  const averageProfit = profits.length > 0 
    ? profits.reduce((sum, p) => sum + p, 0) / profits.length 
    : 0;
  const averageLoss = losses.length > 0 
    ? losses.reduce((sum, l) => sum + l, 0) / losses.length 
    : 0;
  
  const largestWin = profits.length > 0 ? Math.max(...profits) : 0;
  const largestLoss = losses.length > 0 ? -Math.max(...losses) : 0;
  
  const winRate = tradeHistory.length > 0 
    ? (winningTrades.length / tradeHistory.length) * 100 
    : 0;
  
  // Calculate ROI (simplified - would need initial capital)
  const initialCapital = totalVolume * 0.1; // Estimate
  const roi = initialCapital > 0 
    ? (totalRealizedPnl / initialCapital) * 100 
    : 0;
  
  return {
    totalTrades: tradeHistory.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    totalRealizedPnl,
    totalUnrealizedPnl: 0, // Would be calculated from positions
    totalPnl: totalRealizedPnl,
    averageProfitPerTrade: averageProfit,
    averageLossPerTrade: -averageLoss,
    largestWin,
    largestLoss,
    winRate,
    totalVolume,
    roi,
    totalFeesPaid,
  };
}

export function usePortfolio(userAddress?: string | null): UsePortfolioResult {
  const queryClient = useQueryClient();
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryEntry[]>([]);
  
  // Fetch positions
  const { data: positionsData, isLoading: isLoadingPositions } = useQuery<Position[]>({
    queryKey: ['portfolio', 'positions', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      
      // In production, fetch from contract
      // For now, use mock data
      return generateMockPositions();
    },
    enabled: !!userAddress,
    refetchInterval: 5000,
  });
  
  // Fetch trade history
  const { data: historyData, isLoading: isLoadingHistory } = useQuery<TradeHistoryEntry[]>({
    queryKey: ['portfolio', 'history', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      
      // In production, fetch from contract
      return generateMockTradeHistory();
    },
    enabled: !!userAddress,
    refetchInterval: 10000,
  });
  
  // Calculate metrics from trade history
  const metrics = useMemo(() => {
    if (!historyData) return null;
    return calculateMetrics(historyData);
  }, [historyData]);
  
  // Update positions with current prices
  useEffect(() => {
    if (positionsData) {
      // In production, fetch current prices and update unrealized P&L
      setPositions(positionsData);
    }
  }, [positionsData]);
  
  useEffect(() => {
    if (historyData) {
      setTradeHistory(historyData);
    }
  }, [historyData]);
  
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['portfolio'] });
  }, [queryClient]);
  
  // Export to CSV
  const exportToCSV = useCallback(() => {
    if (tradeHistory.length === 0) return;
    
    const headers = ['Date', 'Market', 'Side', 'Price', 'Quantity', 'Fee', 'Realized P&L'];
    const rows = tradeHistory.map(trade => [
      new Date(trade.timestamp).toISOString(),
      trade.market,
      trade.side,
      trade.price.toFixed(2),
      trade.quantity.toFixed(6),
      trade.fee.toFixed(4),
      trade.realizedPnl.toFixed(2),
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `axelarx-trades-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [tradeHistory]);
  
  // Export to JSON
  const exportToJSON = useCallback(() => {
    const data = {
      positions,
      tradeHistory,
      metrics,
      exportedAt: new Date().toISOString(),
    };
    
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `axelarx-portfolio-${Date.now()}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [positions, tradeHistory, metrics]);
  
  return {
    positions,
    tradeHistory,
    metrics,
    isLoading: isLoadingPositions || isLoadingHistory,
    isError: false,
    error: null,
    refetch,
    exportToCSV,
    exportToJSON,
  };
}








