/**
 * Real-time Cryptocurrency Price Service
 * Uses Binance API for live price data
 */

export interface PriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  lastUpdate: number;
}

export interface TradeData {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdate: number;
}

export interface Candlestick {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean; // Whether this candle is finalized
}

// Map our symbols to Binance symbols
const SYMBOL_MAP: Record<string, string> = {
  'BTC/USDT': 'BTCUSDT',
  'ETH/USDT': 'ETHUSDT',
  'ETH/USDC': 'ETHUSDC',
  'SOL/USDT': 'SOLUSDT',
  'BNB/USDT': 'BNBUSDT',
  'XRP/USDT': 'XRPUSDT',
  'ADA/USDT': 'ADAUSDT',
  'DOGE/USDT': 'DOGEUSDT',
  'MATIC/USDT': 'MATICUSDT',
  'DOT/USDT': 'DOTUSDT',
};

const BINANCE_REST_URL = 'https://api.binance.com/api/v3';
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

class PriceService {
  private prices: Map<string, PriceData> = new Map();
  private subscribers: Map<string, Set<(data: PriceData) => void>> = new Map();
  private orderBookSubscribers: Map<string, Set<(data: OrderBookData) => void>> = new Map();
  private tradeSubscribers: Map<string, Set<(data: TradeData) => void>> = new Map();
  private candlestickSubscribers: Map<string, Set<(data: Candlestick) => void>> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Map timeframe to Binance interval
  private timeframeToInterval: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1H': '1h',
    '4H': '4h',
    '1D': '1d',
    '1W': '1w',
  };

  /**
   * Get current price for a symbol
   */
  async getPrice(symbol: string): Promise<PriceData | null> {
    const binanceSymbol = SYMBOL_MAP[symbol] || symbol.replace('/', '');
    
    // Return cached price if fresh (less than 5 seconds old)
    const cached = this.prices.get(symbol);
    if (cached && Date.now() - cached.lastUpdate < 5000) {
      return cached;
    }

    try {
      const response = await fetch(`${BINANCE_REST_URL}/ticker/24hr?symbol=${binanceSymbol}`);
      if (!response.ok) throw new Error('Failed to fetch price');
      
      const data = await response.json();
      
      const priceData: PriceData = {
        symbol,
        price: parseFloat(data.lastPrice),
        priceChange24h: parseFloat(data.priceChange),
        priceChangePercent24h: parseFloat(data.priceChangePercent),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        volume24h: parseFloat(data.volume),
        quoteVolume24h: parseFloat(data.quoteVolume),
        lastUpdate: Date.now(),
      };

      this.prices.set(symbol, priceData);
      return priceData;
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      return cached || null;
    }
  }

  /**
   * Get prices for multiple symbols
   */
  async getPrices(symbols: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();
    
    await Promise.all(
      symbols.map(async (symbol) => {
        const price = await this.getPrice(symbol);
        if (price) {
          results.set(symbol, price);
        }
      })
    );

    return results;
  }

  /**
   * Get order book for a symbol
   */
  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBookData | null> {
    const binanceSymbol = SYMBOL_MAP[symbol] || symbol.replace('/', '');
    
    try {
      const response = await fetch(`${BINANCE_REST_URL}/depth?symbol=${binanceSymbol}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch order book');
      
      const data = await response.json();
      
      return {
        bids: data.bids.map(([price, quantity]: [string, string]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
        asks: data.asks.map(([price, quantity]: [string, string]) => ({
          price: parseFloat(price),
          quantity: parseFloat(quantity),
        })),
        lastUpdate: Date.now(),
      };
    } catch (error) {
      console.error(`Failed to fetch order book for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get historical candlestick data (klines)
   */
  async getCandlesticks(
    symbol: string,
    interval: string,
    limit: number = 500
  ): Promise<Candlestick[]> {
    const binanceSymbol = SYMBOL_MAP[symbol] || symbol.replace('/', '');
    const binanceInterval = this.timeframeToInterval[interval] || interval.toLowerCase();
    
    try {
      const response = await fetch(
        `${BINANCE_REST_URL}/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`
      );
      if (!response.ok) throw new Error('Failed to fetch candlesticks');
      
      const data = await response.json();
      
      return data.map((kline: any[]) => ({
        time: kline[0], // Open time
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        isClosed: true, // Historical data is always closed
      }));
    } catch (error) {
      console.error(`Failed to fetch candlesticks for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Subscribe to real-time candlestick updates
   */
  subscribeToCandlesticks(
    symbol: string,
    interval: string,
    callback: (data: Candlestick) => void
  ): () => void {
    const key = `${symbol}_${interval}`;
    if (!this.candlestickSubscribers.has(key)) {
      this.candlestickSubscribers.set(key, new Set());
    }
    this.candlestickSubscribers.get(key)!.add(callback);

    // Start WebSocket connection
    this.connectCandlestickWebSocket(symbol, interval);

    return () => {
      this.candlestickSubscribers.get(key)?.delete(callback);
      if (this.candlestickSubscribers.get(key)?.size === 0) {
        const wsKey = `candlestick_${symbol}_${interval}`;
        const ws = this.websockets.get(wsKey);
        if (ws) {
          ws.close();
          this.websockets.delete(wsKey);
        }
        const timer = this.reconnectTimers.get(wsKey);
        if (timer) {
          clearTimeout(timer);
          this.reconnectTimers.delete(wsKey);
        }
      }
    };
  }

  private connectCandlestickWebSocket(symbol: string, interval: string) {
    const binanceInterval = this.timeframeToInterval[interval] || interval.toLowerCase();
    const wsKey = `candlestick_${symbol}_${interval}`;
    if (this.websockets.has(wsKey)) return;

    const binanceSymbol = (SYMBOL_MAP[symbol] || symbol.replace('/', '')).toLowerCase();
    const ws = new WebSocket(`${BINANCE_WS_URL}/${binanceSymbol}@kline_${binanceInterval}`);

    ws.onopen = () => {
      console.log(`Candlestick WebSocket connected for ${symbol} ${interval}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const kline = data.k;
        
        if (!kline) return;
        
        const candlestick: Candlestick = {
          time: kline.t, // Open time
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
          isClosed: kline.x, // Is this candle closed?
        };

        this.candlestickSubscribers.get(`${symbol}_${interval}`)?.forEach(callback => callback(candlestick));
      } catch (error) {
        console.error('Error parsing candlestick data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`Candlestick WebSocket error for ${symbol}:`, error);
    };

    ws.onclose = () => {
      this.websockets.delete(wsKey);
      if (this.candlestickSubscribers.get(`${symbol}_${interval}`)?.size) {
        const timer = setTimeout(() => this.connectCandlestickWebSocket(symbol, interval), 5000);
        this.reconnectTimers.set(wsKey, timer);
      }
    };

    this.websockets.set(wsKey, ws);
  }

  /**
   * Get recent trades for a symbol
   */
  async getRecentTrades(symbol: string, limit: number = 50): Promise<TradeData[]> {
    const binanceSymbol = SYMBOL_MAP[symbol] || symbol.replace('/', '');
    
    try {
      const response = await fetch(`${BINANCE_REST_URL}/trades?symbol=${binanceSymbol}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch trades');
      
      const data = await response.json();
      
      return data.map((trade: any) => ({
        id: trade.id.toString(),
        symbol,
        price: parseFloat(trade.price),
        quantity: parseFloat(trade.qty),
        side: trade.isBuyerMaker ? 'sell' : 'buy',
        timestamp: trade.time,
      }));
    } catch (error) {
      console.error(`Failed to fetch trades for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Subscribe to real-time price updates
   */
  subscribeToPrice(symbol: string, callback: (data: PriceData) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    // Start WebSocket connection if not already connected
    this.connectPriceWebSocket(symbol);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(symbol)?.delete(callback);
      if (this.subscribers.get(symbol)?.size === 0) {
        this.disconnectWebSocket(symbol, 'price');
      }
    };
  }

  /**
   * Subscribe to real-time order book updates
   */
  subscribeToOrderBook(symbol: string, callback: (data: OrderBookData) => void): () => void {
    if (!this.orderBookSubscribers.has(symbol)) {
      this.orderBookSubscribers.set(symbol, new Set());
    }
    this.orderBookSubscribers.get(symbol)!.add(callback);

    // Start WebSocket connection
    this.connectOrderBookWebSocket(symbol);

    return () => {
      this.orderBookSubscribers.get(symbol)?.delete(callback);
      if (this.orderBookSubscribers.get(symbol)?.size === 0) {
        this.disconnectWebSocket(symbol, 'orderbook');
      }
    };
  }

  /**
   * Subscribe to real-time trade updates
   */
  subscribeToTrades(symbol: string, callback: (data: TradeData) => void): () => void {
    if (!this.tradeSubscribers.has(symbol)) {
      this.tradeSubscribers.set(symbol, new Set());
    }
    this.tradeSubscribers.get(symbol)!.add(callback);

    // Start WebSocket connection
    this.connectTradeWebSocket(symbol);

    return () => {
      this.tradeSubscribers.get(symbol)?.delete(callback);
      if (this.tradeSubscribers.get(symbol)?.size === 0) {
        this.disconnectWebSocket(symbol, 'trade');
      }
    };
  }

  private connectPriceWebSocket(symbol: string) {
    const wsKey = `price_${symbol}`;
    if (this.websockets.has(wsKey)) return;

    const binanceSymbol = (SYMBOL_MAP[symbol] || symbol.replace('/', '')).toLowerCase();
    const ws = new WebSocket(`${BINANCE_WS_URL}/${binanceSymbol}@ticker`);

    ws.onopen = () => {
      console.log(`Price WebSocket connected for ${symbol}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        const priceData: PriceData = {
          symbol,
          price: parseFloat(data.c),
          priceChange24h: parseFloat(data.p),
          priceChangePercent24h: parseFloat(data.P),
          high24h: parseFloat(data.h),
          low24h: parseFloat(data.l),
          volume24h: parseFloat(data.v),
          quoteVolume24h: parseFloat(data.q),
          lastUpdate: Date.now(),
        };

        this.prices.set(symbol, priceData);
        this.subscribers.get(symbol)?.forEach(callback => callback(priceData));
      } catch (error) {
        console.error('Error parsing price data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`Price WebSocket error for ${symbol}:`, error);
    };

    ws.onclose = () => {
      console.log(`Price WebSocket closed for ${symbol}`);
      this.websockets.delete(wsKey);
      
      // Reconnect after 5 seconds if there are still subscribers
      if (this.subscribers.get(symbol)?.size) {
        const timer = setTimeout(() => this.connectPriceWebSocket(symbol), 5000);
        this.reconnectTimers.set(wsKey, timer);
      }
    };

    this.websockets.set(wsKey, ws);
  }

  private connectOrderBookWebSocket(symbol: string) {
    const wsKey = `orderbook_${symbol}`;
    if (this.websockets.has(wsKey)) return;

    const binanceSymbol = (SYMBOL_MAP[symbol] || symbol.replace('/', '')).toLowerCase();
    const ws = new WebSocket(`${BINANCE_WS_URL}/${binanceSymbol}@depth20@100ms`);

    ws.onopen = () => {
      console.log(`OrderBook WebSocket connected for ${symbol}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        const orderBookData: OrderBookData = {
          bids: data.bids.map(([price, quantity]: [string, string]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
          })),
          asks: data.asks.map(([price, quantity]: [string, string]) => ({
            price: parseFloat(price),
            quantity: parseFloat(quantity),
          })),
          lastUpdate: Date.now(),
        };

        this.orderBookSubscribers.get(symbol)?.forEach(callback => callback(orderBookData));
      } catch (error) {
        console.error('Error parsing order book data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`OrderBook WebSocket error for ${symbol}:`, error);
    };

    ws.onclose = () => {
      this.websockets.delete(wsKey);
      if (this.orderBookSubscribers.get(symbol)?.size) {
        const timer = setTimeout(() => this.connectOrderBookWebSocket(symbol), 5000);
        this.reconnectTimers.set(wsKey, timer);
      }
    };

    this.websockets.set(wsKey, ws);
  }

  private connectTradeWebSocket(symbol: string) {
    const wsKey = `trade_${symbol}`;
    if (this.websockets.has(wsKey)) return;

    const binanceSymbol = (SYMBOL_MAP[symbol] || symbol.replace('/', '')).toLowerCase();
    const ws = new WebSocket(`${BINANCE_WS_URL}/${binanceSymbol}@trade`);

    ws.onopen = () => {
      console.log(`Trade WebSocket connected for ${symbol}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        const tradeData: TradeData = {
          id: data.t.toString(),
          symbol,
          price: parseFloat(data.p),
          quantity: parseFloat(data.q),
          side: data.m ? 'sell' : 'buy',
          timestamp: data.T,
        };

        this.tradeSubscribers.get(symbol)?.forEach(callback => callback(tradeData));
      } catch (error) {
        console.error('Error parsing trade data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error(`Trade WebSocket error for ${symbol}:`, error);
    };

    ws.onclose = () => {
      this.websockets.delete(wsKey);
      if (this.tradeSubscribers.get(symbol)?.size) {
        const timer = setTimeout(() => this.connectTradeWebSocket(symbol), 5000);
        this.reconnectTimers.set(wsKey, timer);
      }
    };

    this.websockets.set(wsKey, ws);
  }

  private disconnectWebSocket(symbol: string, type: 'price' | 'orderbook' | 'trade' | 'candlestick') {
    const wsKey = type === 'candlestick' ? symbol : `${type}_${symbol}`;
    const ws = this.websockets.get(wsKey);
    if (ws) {
      ws.close();
      this.websockets.delete(wsKey);
    }

    const timer = this.reconnectTimers.get(wsKey);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(wsKey);
    }
  }

  /**
   * Disconnect all WebSockets
   */
  disconnectAll() {
    this.websockets.forEach((ws) => ws.close());
    this.websockets.clear();
    this.reconnectTimers.forEach((timer) => clearTimeout(timer));
    this.reconnectTimers.clear();
  }
}

// Export singleton instance
export const priceService = new PriceService();

