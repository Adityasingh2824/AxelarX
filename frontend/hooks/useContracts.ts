/**
 * Contract Integration Hooks
 * Provides reactive access to smart contract functions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers, BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { useWalletStore, useTradingStore, useNotificationStore, useToast } from '@/stores/useStore';
import { DEPLOYMENTS, getDeployment, getNetworkByChainId, type NetworkName, CHAIN_CONFIG } from '@/lib/contracts/deployments';

// ABI fragments for the contracts
const ORDER_BOOK_ABI = [
  'function placeLimitOrder(bool isBuy, uint256 price, uint256 quantity) external returns (uint256)',
  'function placeMarketOrder(bool isBuy, uint256 quantity) external returns (uint256)',
  'function cancelOrder(uint256 orderId) external',
  'function getOrder(uint256 orderId) external view returns (address trader, bool isBuy, uint256 price, uint256 quantity, uint256 filled, uint8 status)',
  'function getBestBid() external view returns (uint256 price, uint256 quantity)',
  'function getBestAsk() external view returns (uint256 price, uint256 quantity)',
  'function getOrderBook(uint256 depth) external view returns (uint256[] memory bidPrices, uint256[] memory bidQuantities, uint256[] memory askPrices, uint256[] memory askQuantities)',
  'event OrderPlaced(uint256 indexed orderId, address indexed trader, bool isBuy, uint256 price, uint256 quantity)',
  'event OrderFilled(uint256 indexed orderId, uint256 filledQuantity, uint256 remainingQuantity)',
  'event OrderCancelled(uint256 indexed orderId)',
];

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

const BRIDGE_ABI = [
  'function bridgeTokens(string calldata destinationChain, string calldata destinationAddress, address token, uint256 amount) external payable',
  'function getPendingBridges(address user) external view returns (tuple(string destinationChain, string destinationAddress, address token, uint256 amount, uint256 timestamp, uint8 status)[] memory)',
];

const SETTLEMENT_ABI = [
  'function deposit(address token, uint256 amount) external',
  'function withdraw(address token, uint256 amount) external',
  'function getBalance(address user, address token) external view returns (uint256)',
];

// ============================================
// Provider Hook
// ============================================

export function useProvider() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const { address, chainId, isConnected } = useWalletStore();

  useEffect(() => {
    const setupProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum && isConnected) {
        try {
          const browserProvider = new BrowserProvider(window.ethereum);
          const signerInstance = await browserProvider.getSigner();
          setProvider(browserProvider);
          setSigner(signerInstance);
        } catch (error) {
          console.error('Failed to setup provider:', error);
        }
      }
    };

    setupProvider();
  }, [isConnected, chainId]);

  return { provider, signer };
}

// ============================================
// Network Hook
// ============================================

export function useNetwork() {
  const { chainId } = useWalletStore();
  const { provider, signer } = useProvider();
  const toast = useToast();

  const networkName = useMemo(() => {
    if (!chainId) return null;
    return getNetworkByChainId(chainId);
  }, [chainId]);

  const deployment = useMemo(() => {
    if (!networkName) return null;
    return getDeployment(networkName);
  }, [networkName]);

  const switchNetwork = useCallback(async (targetNetwork: NetworkName) => {
    if (!window.ethereum) {
      toast.error('Wallet Not Found', 'Please install a Web3 wallet');
      return false;
    }

    const config = CHAIN_CONFIG[targetNetwork];
    if (!config) {
      toast.error('Network Error', 'Unsupported network');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: config.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [config],
          });
          return true;
        } catch (addError) {
          toast.error('Network Error', 'Failed to add network');
          return false;
        }
      }
      toast.error('Network Error', 'Failed to switch network');
      return false;
    }
  }, [toast]);

  return {
    chainId,
    networkName,
    deployment,
    isSupported: !!deployment,
    switchNetwork,
  };
}

// ============================================
// Token Balances Hook
// ============================================

export function useTokenBalances() {
  const { address, isConnected } = useWalletStore();
  const { deployment } = useNetwork();
  const { provider } = useProvider();
  const { updateBalance } = useTradingStore();
  
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!address || !deployment || !provider) {
      setBalances({});
      return;
    }

    setLoading(true);
    try {
      const tokenBalances: Record<string, string> = {};
      
      for (const [symbol, tokenAddress] of Object.entries(deployment.contracts.tokens)) {
        if (tokenAddress === '0x0000000000000000000000000000000000000000') continue;
        
        try {
          const contract = new Contract(tokenAddress, ERC20_ABI, provider);
          const balance = await contract.balanceOf(address);
          const decimals = await contract.decimals();
          const formatted = formatUnits(balance, decimals);
          tokenBalances[symbol] = formatted;
          updateBalance(symbol, parseFloat(formatted));
        } catch (error) {
          console.error(`Failed to fetch ${symbol} balance:`, error);
          tokenBalances[symbol] = '0';
        }
      }
      
      // Get native balance
      const nativeBalance = await provider.getBalance(address);
      tokenBalances['ETH'] = formatUnits(nativeBalance, 18);
      
      setBalances(tokenBalances);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  }, [address, deployment, provider, updateBalance]);

  useEffect(() => {
    fetchBalances();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return { balances, loading, refresh: fetchBalances };
}

// ============================================
// Order Book Contract Hook
// ============================================

export function useOrderBookContract(market: string) {
  const { deployment } = useNetwork();
  const { provider, signer } = useProvider();
  const toast = useToast();
  const addNotification = useNotificationStore((s) => s.addNotification);
  const addOrder = useTradingStore((s) => s.addOrder);

  const contract = useMemo(() => {
    if (!deployment || !signer) return null;
    
    const orderBookAddress = deployment.contracts.orderBooks[market as keyof typeof deployment.contracts.orderBooks];
    if (!orderBookAddress || orderBookAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    
    return new Contract(orderBookAddress, ORDER_BOOK_ABI, signer);
  }, [deployment, signer, market]);

  const placeLimitOrder = useCallback(async (
    isBuy: boolean,
    price: number,
    quantity: number
  ): Promise<string | null> => {
    if (!contract) {
      toast.error('Contract Error', 'Order book contract not available');
      return null;
    }

    try {
      toast.info('Placing Order', 'Please confirm the transaction in your wallet');
      
      const priceWei = parseUnits(price.toString(), 6); // Quote decimals
      const quantityWei = parseUnits(quantity.toString(), 18); // Base decimals
      
      const tx = await contract.placeLimitOrder(isBuy, priceWei, quantityWei);
      toast.info('Transaction Sent', 'Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      // Parse events
      const orderPlacedEvent = receipt.logs.find(
        (log: any) => log.topics[0] === contract.interface.getEvent('OrderPlaced')?.topicHash
      );
      
      if (orderPlacedEvent) {
        const parsed = contract.interface.parseLog({
          topics: orderPlacedEvent.topics,
          data: orderPlacedEvent.data,
        });
        
        const orderId = parsed?.args?.orderId?.toString() || 'unknown';
        
        // Add to local state
        addOrder({
          id: orderId,
          market,
          side: isBuy ? 'buy' : 'sell',
          type: 'limit',
          price,
          quantity,
          filled: 0,
          status: 'pending',
          createdAt: new Date(),
        });
        
        addNotification({
          type: 'order_filled',
          title: 'Order Placed',
          message: `${isBuy ? 'Buy' : 'Sell'} ${quantity} at $${price}`,
          data: { orderId, market, price, quantity },
        });
        
        toast.success('Order Placed', `Order #${orderId} created successfully`);
        return orderId;
      }
      
      return null;
    } catch (error: any) {
      console.error('Failed to place order:', error);
      toast.error('Order Failed', error.reason || error.message || 'Transaction failed');
      return null;
    }
  }, [contract, market, toast, addOrder, addNotification]);

  const placeMarketOrder = useCallback(async (
    isBuy: boolean,
    quantity: number
  ): Promise<string | null> => {
    if (!contract) {
      toast.error('Contract Error', 'Order book contract not available');
      return null;
    }

    try {
      toast.info('Placing Order', 'Please confirm the transaction in your wallet');
      
      const quantityWei = parseUnits(quantity.toString(), 18);
      
      const tx = await contract.placeMarketOrder(isBuy, quantityWei);
      toast.info('Transaction Sent', 'Waiting for confirmation...');
      
      const receipt = await tx.wait();
      toast.success('Order Executed', 'Market order filled successfully');
      
      return receipt.hash;
    } catch (error: any) {
      console.error('Failed to place market order:', error);
      toast.error('Order Failed', error.reason || error.message || 'Transaction failed');
      return null;
    }
  }, [contract, toast]);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    if (!contract) {
      toast.error('Contract Error', 'Order book contract not available');
      return false;
    }

    try {
      toast.info('Cancelling Order', 'Please confirm the transaction in your wallet');
      
      const tx = await contract.cancelOrder(orderId);
      await tx.wait();
      
      toast.success('Order Cancelled', `Order #${orderId} cancelled successfully`);
      return true;
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      toast.error('Cancel Failed', error.reason || error.message || 'Transaction failed');
      return false;
    }
  }, [contract, toast]);

  const getOrderBook = useCallback(async (depth = 10) => {
    if (!contract) return { bids: [], asks: [] };

    try {
      const [bidPrices, bidQuantities, askPrices, askQuantities] = await contract.getOrderBook(depth);
      
      const bids = bidPrices.map((price: bigint, i: number) => ({
        price: parseFloat(formatUnits(price, 6)),
        quantity: parseFloat(formatUnits(bidQuantities[i], 18)),
      }));
      
      const asks = askPrices.map((price: bigint, i: number) => ({
        price: parseFloat(formatUnits(price, 6)),
        quantity: parseFloat(formatUnits(askQuantities[i], 18)),
      }));
      
      return { bids, asks };
    } catch (error) {
      console.error('Failed to get order book:', error);
      return { bids: [], asks: [] };
    }
  }, [contract]);

  return {
    contract,
    placeLimitOrder,
    placeMarketOrder,
    cancelOrder,
    getOrderBook,
    isReady: !!contract,
  };
}

// ============================================
// Token Approval Hook
// ============================================

export function useTokenApproval(tokenSymbol: string, spenderAddress: string) {
  const { address } = useWalletStore();
  const { deployment } = useNetwork();
  const { provider, signer } = useProvider();
  const toast = useToast();
  
  const [allowance, setAllowance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);

  const tokenAddress = deployment?.contracts.tokens[tokenSymbol as keyof typeof deployment.contracts.tokens];

  const checkAllowance = useCallback(async () => {
    if (!tokenAddress || !address || !provider || tokenAddress === '0x0000000000000000000000000000000000000000') {
      return;
    }

    try {
      const contract = new Contract(tokenAddress, ERC20_ABI, provider);
      const currentAllowance = await contract.allowance(address, spenderAddress);
      setAllowance(currentAllowance);
    } catch (error) {
      console.error('Failed to check allowance:', error);
    }
  }, [tokenAddress, address, provider, spenderAddress]);

  useEffect(() => {
    checkAllowance();
  }, [checkAllowance]);

  const approve = useCallback(async (amount: bigint = ethers.MaxUint256): Promise<boolean> => {
    if (!tokenAddress || !signer) {
      toast.error('Approval Error', 'Token not available');
      return false;
    }

    setLoading(true);
    try {
      const contract = new Contract(tokenAddress, ERC20_ABI, signer);
      
      toast.info('Approving Token', 'Please confirm in your wallet');
      const tx = await contract.approve(spenderAddress, amount);
      
      toast.info('Transaction Sent', 'Waiting for confirmation...');
      await tx.wait();
      
      await checkAllowance();
      toast.success('Approved', 'Token approval successful');
      return true;
    } catch (error: any) {
      console.error('Failed to approve:', error);
      toast.error('Approval Failed', error.reason || error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, signer, spenderAddress, toast, checkAllowance]);

  return {
    allowance,
    loading,
    approve,
    hasAllowance: (amount: bigint) => allowance >= amount,
    refresh: checkAllowance,
  };
}

// ============================================
// Bridge Contract Hook
// ============================================

export function useBridgeContract() {
  const { deployment } = useNetwork();
  const { signer } = useProvider();
  const toast = useToast();

  const contract = useMemo(() => {
    if (!deployment || !signer) return null;
    if (deployment.contracts.bridge === '0x0000000000000000000000000000000000000000') return null;
    return new Contract(deployment.contracts.bridge, BRIDGE_ABI, signer);
  }, [deployment, signer]);

  const bridgeTokens = useCallback(async (
    destinationChain: string,
    destinationAddress: string,
    tokenAddress: string,
    amount: bigint,
    gasPayment: bigint
  ): Promise<string | null> => {
    if (!contract) {
      toast.error('Bridge Error', 'Bridge contract not available');
      return null;
    }

    try {
      toast.info('Initiating Bridge', 'Please confirm the transaction');
      
      const tx = await contract.bridgeTokens(
        destinationChain,
        destinationAddress,
        tokenAddress,
        amount,
        { value: gasPayment }
      );
      
      toast.info('Transaction Sent', 'Waiting for confirmation...');
      const receipt = await tx.wait();
      
      toast.success('Bridge Initiated', 'Your tokens are being bridged');
      return receipt.hash;
    } catch (error: any) {
      console.error('Bridge failed:', error);
      toast.error('Bridge Failed', error.reason || error.message);
      return null;
    }
  }, [contract, toast]);

  return {
    contract,
    bridgeTokens,
    isReady: !!contract,
  };
}

// Global ethereum type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}
