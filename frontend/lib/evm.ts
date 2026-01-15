/**
 * EVM Integration Layer
 * Handles Web3/Ethers.js connections and contract interactions
 */

import { BrowserProvider, JsonRpcProvider, Contract, formatEther, formatUnits, parseUnits } from 'ethers';
import { EVM_CONTRACTS, ORDER_BOOK_ABI, ERC20_ABI, BRIDGE_ABI, SUPPORTED_MARKETS } from './contracts/evm-config';

// Types
export interface EVMWallet {
  address: string;
  chainId: number;
  balance: string;
  isConnected: boolean;
}

export interface OrderBookEntry {
  price: string;
  quantity: string;
}

export interface Order {
  id: string;
  trader: string;
  side: 'Buy' | 'Sell';
  orderType: 'Limit' | 'Market';
  price: string;
  quantity: string;
  filledQuantity: string;
  status: 'Open' | 'PartiallyFilled' | 'Filled' | 'Cancelled';
  timestamp: number;
}

export interface Trade {
  id: string;
  makerOrderId: string;
  takerOrderId: string;
  maker: string;
  taker: string;
  price: string;
  quantity: string;
  timestamp: number;
}

export interface MarketStats {
  lastPrice: string;
  bestBid: string;
  bestAsk: string;
  volume24h: string;
  high24h: string;
  low24h: string;
  totalTrades: number;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

class EVMClient {
  private provider: BrowserProvider | JsonRpcProvider | null = null;
  private signer: any = null;

  async connectWallet(): Promise<EVMWallet | null> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        console.warn('No wallet detected');
        return this.getDemoWallet();
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Check and switch to the target chain
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const targetChainId = '0x' + EVM_CONTRACTS.chainId.toString(16);

      if (chainId !== targetChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainId,
                chainName: EVM_CONTRACTS.networkName === 'localhost' ? 'Hardhat Local' : 'Base Sepolia',
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [EVM_CONTRACTS.rpcUrl],
                blockExplorerUrls: [EVM_CONTRACTS.blockExplorer],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Create provider and signer
      this.provider = new BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);

      return {
        address,
        chainId: EVM_CONTRACTS.chainId,
        balance: formatEther(balance),
        isConnected: true,
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return this.getDemoWallet();
    }
  }

  private getDemoWallet(): EVMWallet {
    const demoAddress = '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    return {
      address: demoAddress,
      chainId: EVM_CONTRACTS.chainId,
      balance: '1.0',
      isConnected: true,
    };
  }

  async getOrderBookContract(market: string) {
    if (!this.provider) {
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
      } else {
        this.provider = new JsonRpcProvider(EVM_CONTRACTS.rpcUrl);
      }
    }

    const marketConfig = SUPPORTED_MARKETS.find(m => m.symbol === market);
    if (!marketConfig) {
      throw new Error(`Market ${market} not found`);
    }

    const address = EVM_CONTRACTS.orderBooks[market as keyof typeof EVM_CONTRACTS.orderBooks];
    if (!address) {
      throw new Error(`OrderBook address not configured for ${market}`);
    }

    return new Contract(
      address,
      ORDER_BOOK_ABI,
      this.signer || this.provider
    );
  }

  async getTokenContract(tokenSymbol: string) {
    if (!this.provider) {
      this.provider = new JsonRpcProvider(EVM_CONTRACTS.rpcUrl);
    }

    const address = EVM_CONTRACTS.tokens[tokenSymbol as keyof typeof EVM_CONTRACTS.tokens];
    if (!address) {
      throw new Error(`Token ${tokenSymbol} not configured`);
    }

    return new Contract(
      address,
      ERC20_ABI,
      this.signer || this.provider
    );
  }

  async getMarketStats(market: string): Promise<MarketStats | null> {
    try {
      const contract = await this.getOrderBookContract(market);
      const stats = await contract.getMarketStats();

      return {
        lastPrice: formatUnits(stats.lastPrice, 18),
        bestBid: formatUnits(stats.bestBid, 18),
        bestAsk: formatUnits(stats.bestAsk, 18),
        volume24h: formatUnits(stats.volume24h, 18),
        high24h: formatUnits(stats.high24h, 18),
        low24h: formatUnits(stats.low24h, 18),
        totalTrades: Number(stats.totalTrades),
      };
    } catch (error) {
      console.error('Failed to get market stats:', error);
      return null;
    }
  }

  async getOrderBook(market: string, limit: number = 20): Promise<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] } | null> {
    try {
      const contract = await this.getOrderBookContract(market);
      const [bidPrices, bidQuantities, askPrices, askQuantities] = await contract.getOrderBook(limit);

      const bids: OrderBookEntry[] = bidPrices.map((price: bigint, i: number) => ({
        price: formatUnits(price, 18),
        quantity: formatUnits(bidQuantities[i], 18),
      }));

      const asks: OrderBookEntry[] = askPrices.map((price: bigint, i: number) => ({
        price: formatUnits(price, 18),
        quantity: formatUnits(askQuantities[i], 18),
      }));

      return { bids, asks };
    } catch (error) {
      console.error('Failed to get order book:', error);
      return null;
    }
  }

  async getRecentTrades(market: string, limit: number = 50): Promise<Trade[]> {
    try {
      const contract = await this.getOrderBookContract(market);
      const trades = await contract.getRecentTrades(limit);

      return trades.map((trade: any) => ({
        id: trade.id.toString(),
        makerOrderId: trade.makerOrderId.toString(),
        takerOrderId: trade.takerOrderId.toString(),
        maker: trade.maker,
        taker: trade.taker,
        price: formatUnits(trade.price, 18),
        quantity: formatUnits(trade.quantity, 18),
        timestamp: Number(trade.timestamp),
      }));
    } catch (error) {
      console.error('Failed to get recent trades:', error);
      return [];
    }
  }

  async getUserOrders(market: string, userAddress: string): Promise<Order[]> {
    try {
      const contract = await this.getOrderBookContract(market);
      const orders = await contract.getUserOrders(userAddress);

      const statusMap = ['Open', 'PartiallyFilled', 'Filled', 'Cancelled'];
      const sideMap = ['Buy', 'Sell'];
      const typeMap = ['Limit', 'Market'];

      return orders.map((order: any) => ({
        id: order.id.toString(),
        trader: order.trader,
        side: sideMap[order.side] as 'Buy' | 'Sell',
        orderType: typeMap[order.orderType] as 'Limit' | 'Market',
        price: formatUnits(order.price, 18),
        quantity: formatUnits(order.quantity, 18),
        filledQuantity: formatUnits(order.filledQuantity, 18),
        status: statusMap[order.status] as Order['status'],
        timestamp: Number(order.timestamp),
      }));
    } catch (error) {
      console.error('Failed to get user orders:', error);
      return [];
    }
  }

  async getBalance(market: string, userAddress: string, isBaseToken: boolean): Promise<string> {
    try {
      const contract = await this.getOrderBookContract(market);
      const tokenAddress = isBaseToken 
        ? await contract.baseToken() 
        : await contract.quoteToken();
      
      const balance = await contract.getBalance(userAddress, tokenAddress);
      return formatUnits(balance, 18);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  async approveToken(tokenSymbol: string, spenderAddress: string, amount: string): Promise<boolean> {
    try {
      const token = await this.getTokenContract(tokenSymbol);
      const tx = await token.approve(spenderAddress, parseUnits(amount, 18));
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to approve token:', error);
      return false;
    }
  }

  async deposit(market: string, tokenSymbol: string, amount: string): Promise<boolean> {
    try {
      const contract = await this.getOrderBookContract(market);
      const tokenAddress = EVM_CONTRACTS.tokens[tokenSymbol as keyof typeof EVM_CONTRACTS.tokens];
      
      // First approve
      const token = await this.getTokenContract(tokenSymbol);
      const marketAddress = EVM_CONTRACTS.orderBooks[market as keyof typeof EVM_CONTRACTS.orderBooks];
      const approveTx = await token.approve(marketAddress, parseUnits(amount, 18));
      await approveTx.wait();
      
      // Then deposit
      const tx = await contract.deposit(tokenAddress, parseUnits(amount, 18));
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to deposit:', error);
      return false;
    }
  }

  async withdraw(market: string, tokenSymbol: string, amount: string): Promise<boolean> {
    try {
      const contract = await this.getOrderBookContract(market);
      const tokenAddress = EVM_CONTRACTS.tokens[tokenSymbol as keyof typeof EVM_CONTRACTS.tokens];
      
      const tx = await contract.withdraw(tokenAddress, parseUnits(amount, 18));
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to withdraw:', error);
      return false;
    }
  }

  async placeOrder(
    market: string,
    side: 'Buy' | 'Sell',
    orderType: 'Limit' | 'Market',
    price: string,
    quantity: string,
    timeInForce: 'GTC' | 'IOC' | 'FOK' | 'PostOnly' = 'GTC'
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const contract = await this.getOrderBookContract(market);
      
      const sideEnum = side === 'Buy' ? 0 : 1;
      const typeEnum = orderType === 'Limit' ? 0 : 1;
      const tifEnum = { GTC: 0, IOC: 1, FOK: 2, PostOnly: 3 }[timeInForce];
      
      const priceWei = parseUnits(price, 18);
      const quantityWei = parseUnits(quantity, 18);
      
      const tx = await contract.placeOrder(sideEnum, typeEnum, priceWei, quantityWei, tifEnum);
      const receipt = await tx.wait();
      
      // Get order ID from event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'OrderPlaced';
        } catch {
          return false;
        }
      });
      
      const orderId = event ? contract.interface.parseLog(event)?.args[0].toString() : undefined;
      
      return { success: true, orderId };
    } catch (error: any) {
      console.error('Failed to place order:', error);
      return { success: false, error: error.message };
    }
  }

  async cancelOrder(market: string, orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const contract = await this.getOrderBookContract(market);
      const tx = await contract.cancelOrder(BigInt(orderId));
      await tx.wait();
      return { success: true };
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      return { success: false, error: error.message };
    }
  }

  async requestFaucet(tokenSymbol: string, amount: string): Promise<boolean> {
    try {
      const token = await this.getTokenContract(tokenSymbol);
      const decimals = tokenSymbol === 'WBTC' ? 8 : (tokenSymbol === 'USDT' || tokenSymbol === 'USDC' ? 6 : 18);
      const tx = await token.faucet(parseUnits(amount, decimals));
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to request faucet:', error);
      return false;
    }
  }

  // Subscribe to events
  subscribeToOrderBook(market: string, callback: (bids: OrderBookEntry[], asks: OrderBookEntry[]) => void) {
    let intervalId: NodeJS.Timeout;
    
    const fetchData = async () => {
      const data = await this.getOrderBook(market);
      if (data) {
        callback(data.bids, data.asks);
      }
    };

    // Initial fetch
    fetchData();
    
    // Poll every 5 seconds
    intervalId = setInterval(fetchData, 5000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }
}

// Export singleton instance
export const evmClient = new EVMClient();

