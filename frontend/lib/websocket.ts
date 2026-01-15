/**
 * WebSocket Service for Real-Time Market Data
 * Handles connections to Binance WebSocket API for live price feeds
 */

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

interface WebSocketConfig {
  url: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface Subscription {
  id: string;
  stream: string;
  handler: MessageHandler;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private subscriptions: Map<string, Subscription> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  
  private onConnectHandlers: Set<ConnectionHandler> = new Set();
  private onDisconnectHandlers: Set<ConnectionHandler> = new Set();
  
  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectDelay: 3000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }
  
  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    
    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    
    this.isConnecting = true;
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          console.log('🔗 WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPingInterval();
          this.resubscribeAll();
          this.onConnectHandlers.forEach(handler => handler());
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
        };
        
        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.isConnecting = false;
          this.stopPingInterval();
          this.onDisconnectHandlers.forEach(handler => handler());
          this.scheduleReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }
  
  private handleMessage(data: any) {
    // Handle stream data
    if (data.stream) {
      const subscription = this.subscriptions.get(data.stream);
      if (subscription) {
        subscription.handler(data.data);
      }
    } else if (data.e) {
      // Direct event (not combined stream)
      const streamType = this.getStreamFromEvent(data);
      if (streamType) {
        const subscription = this.subscriptions.get(streamType);
        if (subscription) {
          subscription.handler(data);
        }
      }
    }
  }
  
  private getStreamFromEvent(data: any): string | null {
    const symbol = data.s?.toLowerCase();
    if (!symbol) return null;
    
    switch (data.e) {
      case 'trade':
        return `${symbol}@trade`;
      case 'kline':
        return `${symbol}@kline_${data.k?.i}`;
      case 'depthUpdate':
        return `${symbol}@depth`;
      case '24hrTicker':
        return `${symbol}@ticker`;
      default:
        return null;
    }
  }
  
  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Binance doesn't require ping, but we can use it to keep connection alive
        this.ws.send(JSON.stringify({ method: 'PING' }));
      }
    }, 30000);
  }
  
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 10)) {
      this.reconnectAttempts++;
      const delay = Math.min(
        (this.config.reconnectDelay || 3000) * Math.pow(1.5, this.reconnectAttempts - 1),
        30000
      );
      
      console.log(`📡 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect().catch(console.error);
      }, delay);
    }
  }
  
  private resubscribeAll() {
    if (this.subscriptions.size === 0) return;
    
    const streams = Array.from(this.subscriptions.keys());
    this.send({
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now(),
    });
  }
  
  subscribe(stream: string, handler: MessageHandler): () => void {
    const id = `${stream}-${Date.now()}`;
    
    this.subscriptions.set(stream, { id, stream, handler });
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        method: 'SUBSCRIBE',
        params: [stream],
        id: Date.now(),
      });
    }
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(stream);
    };
  }
  
  unsubscribe(stream: string) {
    this.subscriptions.delete(stream);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({
        method: 'UNSUBSCRIBE',
        params: [stream],
        id: Date.now(),
      });
    }
  }
  
  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  onConnect(handler: ConnectionHandler): () => void {
    this.onConnectHandlers.add(handler);
    return () => this.onConnectHandlers.delete(handler);
  }
  
  onDisconnect(handler: ConnectionHandler): () => void {
    this.onDisconnectHandlers.add(handler);
    return () => this.onDisconnectHandlers.delete(handler);
  }
  
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPingInterval();
    this.subscriptions.clear();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instances for different data sources
export const binanceWS = new WebSocketService({
  url: 'wss://stream.binance.com:9443/stream',
});

// Helper functions for common subscriptions
export function subscribeToTicker(symbol: string, handler: (data: TickerData) => void) {
  const stream = `${symbol.toLowerCase()}@ticker`;
  return binanceWS.subscribe(stream, handler);
}

export function subscribeToTrades(symbol: string, handler: (data: TradeData) => void) {
  const stream = `${symbol.toLowerCase()}@trade`;
  return binanceWS.subscribe(stream, handler);
}

export function subscribeToKlines(
  symbol: string, 
  interval: string, 
  handler: (data: KlineData) => void
) {
  const stream = `${symbol.toLowerCase()}@kline_${interval}`;
  return binanceWS.subscribe(stream, handler);
}

export function subscribeToDepth(symbol: string, handler: (data: DepthData) => void) {
  const stream = `${symbol.toLowerCase()}@depth@100ms`;
  return binanceWS.subscribe(stream, handler);
}

// Type definitions
export interface TickerData {
  e: string;        // Event type
  E: number;        // Event time
  s: string;        // Symbol
  p: string;        // Price change
  P: string;        // Price change percent
  w: string;        // Weighted average price
  c: string;        // Last price
  Q: string;        // Last quantity
  o: string;        // Open price
  h: string;        // High price
  l: string;        // Low price
  v: string;        // Total traded base asset volume
  q: string;        // Total traded quote asset volume
  O: number;        // Statistics open time
  C: number;        // Statistics close time
  F: number;        // First trade ID
  L: number;        // Last trade Id
  n: number;        // Total number of trades
}

export interface TradeData {
  e: string;        // Event type
  E: number;        // Event time
  s: string;        // Symbol
  t: number;        // Trade ID
  p: string;        // Price
  q: string;        // Quantity
  b: number;        // Buyer order ID
  a: number;        // Seller order ID
  T: number;        // Trade time
  m: boolean;       // Is the buyer the market maker?
}

export interface KlineData {
  e: string;        // Event type
  E: number;        // Event time
  s: string;        // Symbol
  k: {
    t: number;      // Kline start time
    T: number;      // Kline close time
    s: string;      // Symbol
    i: string;      // Interval
    f: number;      // First trade ID
    L: number;      // Last trade ID
    o: string;      // Open price
    c: string;      // Close price
    h: string;      // High price
    l: string;      // Low price
    v: string;      // Base asset volume
    n: number;      // Number of trades
    x: boolean;     // Is this kline closed?
    q: string;      // Quote asset volume
    V: string;      // Taker buy base asset volume
    Q: string;      // Taker buy quote asset volume
  };
}

export interface DepthData {
  e: string;        // Event type
  E: number;        // Event time
  s: string;        // Symbol
  U: number;        // First update ID in event
  u: number;        // Final update ID in event
  b: [string, string][];  // Bids [price, quantity]
  a: [string, string][];  // Asks [price, quantity]
}

// React hook for WebSocket connection
import { useEffect, useState, useCallback, useRef } from 'react';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    binanceWS.connect().catch(console.error);
    
    const unsubConnect = binanceWS.onConnect(() => setIsConnected(true));
    const unsubDisconnect = binanceWS.onDisconnect(() => setIsConnected(false));
    
    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, []);
  
  return { isConnected, ws: binanceWS };
}

export function useTicker(symbol: string) {
  const [ticker, setTicker] = useState<TickerData | null>(null);
  
  useEffect(() => {
    binanceWS.connect().catch(console.error);
    const unsubscribe = subscribeToTicker(symbol, setTicker);
    return unsubscribe;
  }, [symbol]);
  
  return ticker;
}

export function useTrades(symbol: string, maxTrades = 50) {
  const [trades, setTrades] = useState<TradeData[]>([]);
  
  useEffect(() => {
    binanceWS.connect().catch(console.error);
    
    const unsubscribe = subscribeToTrades(symbol, (trade) => {
      setTrades(prev => {
        const updated = [trade, ...prev];
        return updated.slice(0, maxTrades);
      });
    });
    
    return unsubscribe;
  }, [symbol, maxTrades]);
  
  return trades;
}

export function useOrderBook(symbol: string) {
  const [orderBook, setOrderBook] = useState<{ bids: [string, string][]; asks: [string, string][] }>({
    bids: [],
    asks: [],
  });
  
  const bidsRef = useRef<Map<string, string>>(new Map());
  const asksRef = useRef<Map<string, string>>(new Map());
  
  useEffect(() => {
    binanceWS.connect().catch(console.error);
    
    // Initial snapshot via REST API
    fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=20`)
      .then(res => res.json())
      .then(data => {
        bidsRef.current = new Map(data.bids);
        asksRef.current = new Map(data.asks);
        setOrderBook({
          bids: data.bids.slice(0, 15),
          asks: data.asks.slice(0, 15),
        });
      })
      .catch(console.error);
    
    const unsubscribe = subscribeToDepth(symbol, (data) => {
      // Update bids
      data.b.forEach(([price, qty]) => {
        if (parseFloat(qty) === 0) {
          bidsRef.current.delete(price);
        } else {
          bidsRef.current.set(price, qty);
        }
      });
      
      // Update asks
      data.a.forEach(([price, qty]) => {
        if (parseFloat(qty) === 0) {
          asksRef.current.delete(price);
        } else {
          asksRef.current.set(price, qty);
        }
      });
      
      // Sort and update state
      const sortedBids = Array.from(bidsRef.current.entries())
        .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
        .slice(0, 15);
      
      const sortedAsks = Array.from(asksRef.current.entries())
        .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
        .slice(0, 15);
      
      setOrderBook({ bids: sortedBids, asks: sortedAsks });
    });
    
    return unsubscribe;
  }, [symbol]);
  
  return orderBook;
}
