# Implementation Plan: Public REST API

## Overview
Create a comprehensive REST API for market data, trading, and account management to enable third-party integrations and algorithmic trading.

## Priority: High | Effort: Medium | Timeline: 4-6 weeks

---

## 1. API Architecture

### 1.1 Technology Stack

- **Framework**: Express.js (Node.js) or Actix-web (Rust)
- **Database**: PostgreSQL for caching/indexing
- **Authentication**: JWT tokens + API keys
- **Rate Limiting**: Redis-based rate limiting
- **Documentation**: OpenAPI/Swagger

### 1.2 Project Structure

```
api/
├── src/
│   ├── routes/
│   │   ├── markets.ts
│   │   ├── orders.ts
│   │   ├── account.ts
│   │   └── websocket.ts
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── models/
│   └── utils/
├── tests/
└── docs/
```

---

## 2. API Endpoints

### 2.1 Market Data Endpoints

```typescript
// GET /api/v1/markets
// List all available markets
interface MarketsResponse {
  markets: Market[];
}

// GET /api/v1/markets/{pair}
// Get market details
interface MarketResponse {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  lastPrice: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  priceChange24h: string;
  priceChangePercent24h: string;
}

// GET /api/v1/markets/{pair}/orderbook
// Get order book
interface OrderBookResponse {
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][];
  timestamp: number;
}

// GET /api/v1/markets/{pair}/trades
// Get recent trades
interface TradesResponse {
  trades: Trade[];
}

// GET /api/v1/markets/{pair}/candles
// Get OHLCV candles
interface CandlesResponse {
  candles: Candle[];
}
```

### 2.2 Trading Endpoints

```typescript
// POST /api/v1/orders
// Place new order
interface PlaceOrderRequest {
  market: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'iceberg' | 'twap';
  quantity: string;
  price?: string; // Required for limit orders
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  // Advanced order params
  visibleQuantity?: string; // For iceberg
  timeWindow?: number; // For TWAP
  intervals?: number; // For TWAP
}

interface PlaceOrderResponse {
  orderId: string;
  status: string;
  filledQuantity: string;
}

// GET /api/v1/orders
// Get user orders
interface OrdersResponse {
  orders: Order[];
}

// GET /api/v1/orders/{orderId}
// Get order details
interface OrderResponse {
  orderId: string;
  market: string;
  side: string;
  type: string;
  quantity: string;
  filledQuantity: string;
  price: string;
  status: string;
  timestamp: number;
}

// DELETE /api/v1/orders/{orderId}
// Cancel order
interface CancelOrderResponse {
  orderId: string;
  status: 'cancelled';
}
```

### 2.3 Account Endpoints

```typescript
// GET /api/v1/account/balance
// Get account balances
interface BalanceResponse {
  balances: {
    asset: string;
    available: string;
    locked: string;
    total: string;
  }[];
}

// GET /api/v1/account/positions
// Get open positions (for margin trading)
interface PositionsResponse {
  positions: Position[];
}

// GET /api/v1/account/trades
// Get trade history
interface TradeHistoryResponse {
  trades: Trade[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

---

## 3. Implementation

### 3.1 Express.js Server Setup

```typescript
// api/src/server.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);

// Routes
app.use('/api/v1/markets', require('./routes/markets'));
app.use('/api/v1/orders', authMiddleware, require('./routes/orders'));
app.use('/api/v1/account', authMiddleware, require('./routes/account'));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
```

### 3.2 Authentication Middleware

```typescript
// api/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    account: string;
    apiKey?: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check for API key in header
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey) {
    // Validate API key
    const user = validateApiKey(apiKey);
    if (user) {
      req.user = user;
      return next();
    }
  }
  
  // Check for JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      req.user = decoded as any;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  return res.status(401).json({ error: 'Authentication required' });
};
```

### 3.3 Market Data Service

```typescript
// api/src/services/marketData.ts

import { GraphQLClient } from 'graphql-request';

export class MarketDataService {
  private client: GraphQLClient;
  
  constructor() {
    this.client = new GraphQLClient(process.env.LINERA_GRAPHQL_URL!);
  }
  
  async getMarkets(): Promise<Market[]> {
    const query = `
      query GetMarkets {
        markets {
          pair
          baseAsset
          quoteAsset
          lastPrice
          volume24h
        }
      }
    `;
    
    const data = await this.client.request(query);
    return data.markets;
  }
  
  async getOrderBook(pair: string, depth: number = 20): Promise<OrderBook> {
    const query = `
      query GetOrderBook($pair: String!, $depth: Int!) {
        orderBook(pair: $pair, depth: $depth) {
          bids {
            price
            quantity
          }
          asks {
            price
            quantity
          }
        }
      }
    `;
    
    const data = await this.client.request(query, { pair, depth });
    return data.orderBook;
  }
  
  async getTrades(pair: string, limit: number = 50): Promise<Trade[]> {
    // Implementation...
  }
}
```

### 3.4 Order Service

```typescript
// api/src/services/orderService.ts

export class OrderService {
  async placeOrder(
    account: string,
    order: PlaceOrderRequest
  ): Promise<PlaceOrderResponse> {
    // Validate order
    this.validateOrder(order);
    
    // Call contract
    const result = await this.contractClient.placeOrder({
      account,
      ...order,
    });
    
    return {
      orderId: result.orderId,
      status: result.status,
      filledQuantity: result.filledQuantity,
    };
  }
  
  async cancelOrder(
    account: string,
    orderId: string
  ): Promise<CancelOrderResponse> {
    await this.contractClient.cancelOrder({
      account,
      orderId,
    });
    
    return {
      orderId,
      status: 'cancelled',
    };
  }
  
  private validateOrder(order: PlaceOrderRequest): void {
    if (order.type === 'limit' && !order.price) {
      throw new Error('Price required for limit orders');
    }
    
    if (order.type === 'iceberg' && !order.visibleQuantity) {
      throw new Error('Visible quantity required for iceberg orders');
    }
    
    // More validation...
  }
}
```

---

## 4. WebSocket API

### 4.1 WebSocket Server

```typescript
// api/src/websocket/server.ts

import { WebSocketServer } from 'ws';
import { authenticateWebSocket } from './auth';

export class WebSocketServer {
  private wss: WebSocketServer;
  
  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
  }
  
  private setupHandlers() {
    this.wss.on('connection', (ws, req) => {
      // Authenticate
      const user = authenticateWebSocket(req);
      if (!user) {
        ws.close(1008, 'Authentication failed');
        return;
      }
      
      ws.on('message', (message) => {
        this.handleMessage(ws, user, JSON.parse(message.toString()));
      });
    });
  }
  
  private handleMessage(ws: WebSocket, user: any, message: any) {
    switch (message.type) {
      case 'subscribe':
        this.subscribe(ws, user, message.channel);
        break;
      case 'unsubscribe':
        this.unsubscribe(ws, message.channel);
        break;
    }
  }
  
  private subscribe(ws: WebSocket, user: any, channel: string) {
    // Subscribe to channel (orderbook, trades, etc.)
    const subscription = this.subscriptionManager.subscribe(channel, (data) => {
      ws.send(JSON.stringify({
        channel,
        data,
      }));
    });
    
    ws.subscriptions = ws.subscriptions || [];
    ws.subscriptions.push(subscription);
  }
}
```

### 4.2 WebSocket Channels

```typescript
// Available channels:
// - orderbook:{pair}
// - trades:{pair}
// - ticker:{pair}
// - user:orders
// - user:trades

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'message';
  channel: string;
  data?: any;
}
```

---

## 5. Rate Limiting

### 5.1 Tiered Rate Limits

```typescript
// api/src/middleware/rateLimit.ts

const rateLimits = {
  free: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
  },
  basic: {
    requestsPerMinute: 120,
    requestsPerHour: 5000,
  },
  pro: {
    requestsPerMinute: 300,
    requestsPerHour: 50000,
  },
  enterprise: {
    requestsPerMinute: 1000,
    requestsPerHour: 500000,
  },
};

export const getRateLimit = (tier: string) => {
  return rateLimits[tier] || rateLimits.free;
};
```

---

## 6. API Documentation

### 6.1 OpenAPI Specification

```yaml
# api/docs/openapi.yaml

openapi: 3.0.0
info:
  title: AxelarX API
  version: 1.0.0
  description: REST API for AxelarX trading platform

paths:
  /api/v1/markets:
    get:
      summary: List all markets
      responses:
        '200':
          description: List of markets
          content:
            application/json:
              schema:
                type: object
                properties:
                  markets:
                    type: array
                    items:
                      $ref: '#/components/schemas/Market'
  
  /api/v1/orders:
    post:
      summary: Place new order
      security:
        - ApiKeyAuth: []
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PlaceOrderRequest'
      responses:
        '200':
          description: Order placed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PlaceOrderResponse'

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

---

## 7. Testing

### 7.1 API Tests

```typescript
// api/tests/markets.test.ts

import request from 'supertest';
import app from '../src/server';

describe('Markets API', () => {
  it('should list all markets', async () => {
    const response = await request(app)
      .get('/api/v1/markets')
      .expect(200);
    
    expect(response.body.markets).toBeInstanceOf(Array);
  });
  
  it('should get market details', async () => {
    const response = await request(app)
      .get('/api/v1/markets/BTC-USDT')
      .expect(200);
    
    expect(response.body.pair).toBe('BTC-USDT');
  });
});
```

---

## 8. Deployment

### 8.1 Docker Configuration

```dockerfile
# api/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

### 8.2 Environment Variables

```env
# api/.env

PORT=3001
LINERA_GRAPHQL_URL=http://localhost:8080/graphql
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost:5432/axelarx
```

---

*Implementation Plan Version: 1.0*  
*Last Updated: 2024*






