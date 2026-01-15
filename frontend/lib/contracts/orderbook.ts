/**
 * OrderBook Contract Client
 * Provides type-safe methods for interacting with the OrderBook contract
 */

import { getGraphQLClient } from '../graphql/client';

export interface OrderBookMarketStats {
  lastPrice: string;
  bestBid: string;
  bestAsk: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  priceChange24h: string;
  totalTrades: string;
}

export interface OrderBookEntry {
  price: string;
  size: string;
  total: string;
}

export interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: string;
  spreadPercentage: string;
}

export interface Order {
  id: string;
  user: string;
  side: 'Buy' | 'Sell';
  orderType: 'Limit' | 'Market' | 'StopLoss' | 'TakeProfit';
  price: string;
  quantity: string;
  filledQuantity: string;
  status: 'Pending' | 'Open' | 'PartiallyFilled' | 'Filled' | 'Cancelled' | 'Expired' | 'Rejected';
  timestamp: string;
}

export interface Trade {
  id: string;
  makerOrderId: string;
  takerOrderId: string;
  price: string;
  quantity: string;
  timestamp: string;
  maker: string;
  taker: string;
}

export class OrderBookClient {
  private appId: string;
  private chainId: string;
  private client: ReturnType<typeof getGraphQLClient>;

  constructor(appId: string, chainId: string, graphqlUrl?: string) {
    this.appId = appId;
    this.chainId = chainId;
    this.client = getGraphQLClient(graphqlUrl);
  }

  /**
   * Get market statistics
   */
  async getMarketStats(): Promise<OrderBookMarketStats | null> {
    const query = `
      query GetMarketStats($appId: String!) {
        application(appId: $appId) {
          view {
            marketStats {
              lastPrice
              bestBid
              bestAsk
              volume24h
              high24h
              low24h
              priceChange24h
              totalTrades
            }
          }
        }
      }
    `;

    try {
      const result = await this.client.query(
        query,
        { appId: this.appId }
      );

      return result.data?.application?.view?.marketStats || null;
    } catch (error) {
      console.error('Error fetching market stats:', error);
      return null;
    }
  }

  /**
   * Get order book (bids and asks)
   */
  async getOrderBook(limit: number = 20): Promise<OrderBookData | null> {
    const query = `
      query GetOrderBook($appId: String!, $limit: Int!) {
        application(appId: $appId) {
          view {
            buyLevels(limit: $limit) {
              price
              totalQuantity
              orders {
                id
                quantity
                filledQuantity
              }
            }
            sellLevels(limit: $limit) {
              price
              totalQuantity
              orders {
                id
                quantity
                filledQuantity
              }
            }
          }
        }
      }
    `;

    try {
      const result = await this.client.query(
        query,
        { appId: this.appId, limit }
      );

      const view = result.data?.application?.view;
      if (!view) return null;

      // Transform the data into the expected format
      const bids = (view.buyLevels || []).map((level: any) => ({
        price: level.price,
        size: level.totalQuantity,
        total: level.totalQuantity,
      }));

      const asks = (view.sellLevels || []).map((level: any) => ({
        price: level.price,
        size: level.totalQuantity,
        total: level.totalQuantity,
      }));

      const bestBid = bids[0]?.price || '0';
      const bestAsk = asks[0]?.price || '0';
      const spread = (parseFloat(bestAsk) - parseFloat(bestBid)).toString();
      const spreadPercentage = bestAsk !== '0' 
        ? ((parseFloat(spread) / parseFloat(bestAsk)) * 100).toFixed(4)
        : '0';

      return {
        bids,
        asks,
        spread,
        spreadPercentage,
      };
    } catch (error) {
      console.error('Error fetching order book:', error);
      return null;
    }
  }

  /**
   * Get recent trades
   */
  async getRecentTrades(limit: number = 50): Promise<Trade[]> {
    const query = `
      query GetRecentTrades($appId: String!, $limit: Int!) {
        application(appId: $appId) {
          view {
            trades(limit: $limit) {
              id
              makerOrderId
              takerOrderId
              price
              quantity
              timestamp
              maker
              taker
            }
          }
        }
      }
    `;

    try {
      const result = await this.client.query(
        query,
        { appId: this.appId, limit }
      );

      return result.data?.application?.view?.trades || [];
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      return [];
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(userAddress: string): Promise<Order[]> {
    const query = `
      query GetUserOrders($appId: String!, $user: String!) {
        application(appId: $appId) {
          view {
            userOrders(user: $user) {
              id
              user
              side
              orderType
              price
              quantity
              filledQuantity
              status
              timestamp
            }
          }
        }
      }
    `;

    try {
      const result = await this.client.query(
        query,
        { appId: this.appId, user: userAddress }
      );

      return result.data?.application?.view?.userOrders || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  }

  /**
   * Place an order
   */
  async placeOrder(params: {
    side: 'Buy' | 'Sell';
    orderType: 'Limit' | 'Market';
    price: string; // In smallest unit (scaled by 1e8)
    quantity: string; // In smallest unit
    timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'PostOnly';
    expiresAt?: number;
  }): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const mutation = `
      mutation PlaceOrder(
        $appId: String!
        $chainId: String!
        $operation: String!
      ) {
        executeOperation(
          appId: $appId
          chainId: $chainId
          operation: $operation
        ) {
          blockHash
          height
        }
      }
    `;

    const operation = JSON.stringify({
      PlaceOrder: {
        side: params.side,
        order_type: params.orderType,
        price: params.price,
        quantity: params.quantity,
        time_in_force: params.timeInForce || 'GTC',
        expires_at: params.expiresAt ? new Date(params.expiresAt).toISOString() : null,
      },
    });

    try {
      const result = await this.client.mutate(
        mutation,
        {
          appId: this.appId,
          chainId: this.chainId,
          operation,
        }
      );

      if (result.errors) {
        return { success: false, error: result.errors[0]?.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error placing order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    const mutation = `
      mutation CancelOrder(
        $appId: String!
        $chainId: String!
        $operation: String!
      ) {
        executeOperation(
          appId: $appId
          chainId: $chainId
          operation: $operation
        ) {
          blockHash
          height
        }
      }
    `;

    const operation = JSON.stringify({
      CancelOrder: {
        order_id: orderId,
      },
    });

    try {
      const result = await this.client.mutate(
        mutation,
        {
          appId: this.appId,
          chainId: this.chainId,
          operation,
        }
      );

      if (result.errors) {
        return { success: false, error: result.errors[0]?.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user balance
   */
  async getBalance(userAddress: string, asset: string): Promise<string> {
    const query = `
      query GetBalance($appId: String!, $user: String!, $asset: String!) {
        application(appId: $appId) {
          view {
            balance(user: $user, asset: $asset)
          }
        }
      }
    `;

    try {
      const result = await this.client.query(
        query,
        {
          appId: this.appId,
          user: userAddress,
          asset,
        }
      );

      return result.data?.application?.view?.balance || '0';
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  /**
   * Deposit tokens
   */
  async deposit(asset: string, amount: string): Promise<{ success: boolean; error?: string }> {
    const mutation = `
      mutation Deposit(
        $appId: String!
        $chainId: String!
        $operation: String!
      ) {
        executeOperation(
          appId: $appId
          chainId: $chainId
          operation: $operation
        ) {
          blockHash
          height
        }
      }
    `;

    const operation = JSON.stringify({
      Deposit: {
        asset,
        amount,
      },
    });

    try {
      const result = await this.client.mutate(
        mutation,
        {
          appId: this.appId,
          chainId: this.chainId,
          operation,
        }
      );

      if (result.errors) {
        return { success: false, error: result.errors[0]?.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error depositing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user positions
   */
  async getUserPositions(userAddress: string): Promise<any[]> {
    const query = `
      query GetUserPositions($appId: String!, $user: String!) {
        application(appId: $appId) {
          view {
            positions(user: $user) {
              market
              baseAsset
              quoteAsset
              baseQuantity
              quoteQuantity
              averageEntryPrice
              realizedPnl
              unrealizedPnl
              totalTrades
              totalVolume
            }
          }
        }
      }
    `;

    try {
      const result = await this.client.query(
        query,
        { appId: this.appId, user: userAddress }
      );

      return result.data?.application?.view?.positions || [];
    } catch (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }
  }

  /**
   * Get user trade history
   */
  async getUserTradeHistory(userAddress: string, market?: string, limit: number = 100): Promise<Trade[]> {
    const query = `
      query GetUserTradeHistory($appId: String!, $user: String!, $market: String, $limit: Int!) {
        application(appId: $appId) {
          view {
            tradeHistory(user: $user, market: $market, limit: $limit) {
              tradeId
              orderId
              market
              side
              price
              quantity
              fee
              timestamp
              realizedPnl
            }
          }
        }
      }
    `;

    try {
      const result = await this.client.query(
        query,
        { appId: this.appId, user: userAddress, market: market || null, limit }
      );

      return result.data?.application?.view?.tradeHistory || [];
    } catch (error) {
      console.error('Error fetching trade history:', error);
      return [];
    }
  }

  /**
   * Get portfolio metrics
   */
  async getPortfolioMetrics(userAddress: string): Promise<any | null> {
    const query = `
      query GetPortfolioMetrics($appId: String!, $user: String!) {
        application(appId: $appId) {
          view {
            portfolioMetrics(user: $user) {
              totalTrades
              winningTrades
              losingTrades
              totalRealizedPnl
              totalUnrealizedPnl
              averageProfitPerTrade
              averageLossPerTrade
              largestWin
              largestLoss
              winRate
              totalVolume
              roi
              totalFeesPaid
            }
          }
        }
      }
    `;

    try {
      const result = await this.client.query(
        query,
        { appId: this.appId, user: userAddress }
      );

      return result.data?.application?.view?.portfolioMetrics || null;
    } catch (error) {
      console.error('Error fetching portfolio metrics:', error);
      return null;
    }
  }

  /**
   * Withdraw tokens
   */
  async withdraw(asset: string, amount: string): Promise<{ success: boolean; error?: string }> {
    const mutation = `
      mutation Withdraw(
        $appId: String!
        $chainId: String!
        $operation: String!
      ) {
        executeOperation(
          appId: $appId
          chainId: $chainId
          operation: $operation
        ) {
          blockHash
          height
        }
      }
    `;

    const operation = JSON.stringify({
      Withdraw: {
        asset,
        amount,
      },
    });

    try {
      const result = await this.client.mutate(
        mutation,
        {
          appId: this.appId,
          chainId: this.chainId,
          operation,
        }
      );

      if (result.errors) {
        return { success: false, error: result.errors[0]?.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error withdrawing:', error);
      return { success: false, error: error.message };
    }
  }
}
