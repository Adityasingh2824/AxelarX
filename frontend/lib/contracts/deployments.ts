// Auto-generated deployment configuration
// This file is updated by the deploy-multichain.js script
// Last updated: ${new Date().toISOString()}

export interface NetworkContracts {
  tokens: {
    WBTC: string;
    WETH: string;
    USDT: string;
    USDC: string;
  };
  orderBooks: {
    "BTC/USDT": string;
    "ETH/USDT": string;
    "ETH/USDC": string;
  };
  settlement: string;
  bridge: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorer: string;
  contracts: NetworkContracts;
  deployer: string;
  deployedAt: string;
}

export interface Deployments {
  [networkName: string]: NetworkConfig;
}

// Default deployments (update via deployment script)
export const DEPLOYMENTS: Deployments = {
  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    contracts: {
      tokens: {
        WBTC: "0x0000000000000000000000000000000000000000",
        WETH: "0x0000000000000000000000000000000000000000",
        USDT: "0x0000000000000000000000000000000000000000",
        USDC: "0x0000000000000000000000000000000000000000",
      },
      orderBooks: {
        "BTC/USDT": "0x0000000000000000000000000000000000000000",
        "ETH/USDT": "0x0000000000000000000000000000000000000000",
        "ETH/USDC": "0x0000000000000000000000000000000000000000",
      },
      settlement: "0x0000000000000000000000000000000000000000",
      bridge: "0x0000000000000000000000000000000000000000",
    },
    deployer: "",
    deployedAt: "",
  },
  polygonAmoy: {
    chainId: 80002,
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    explorer: "https://amoy.polygonscan.com",
    contracts: {
      tokens: {
        WBTC: "0x0000000000000000000000000000000000000000",
        WETH: "0x0000000000000000000000000000000000000000",
        USDT: "0x0000000000000000000000000000000000000000",
        USDC: "0x0000000000000000000000000000000000000000",
      },
      orderBooks: {
        "BTC/USDT": "0x0000000000000000000000000000000000000000",
        "ETH/USDT": "0x0000000000000000000000000000000000000000",
        "ETH/USDC": "0x0000000000000000000000000000000000000000",
      },
      settlement: "0x0000000000000000000000000000000000000000",
      bridge: "0x0000000000000000000000000000000000000000",
    },
    deployer: "",
    deployedAt: "",
  },
  arbitrumSepolia: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    explorer: "https://sepolia.arbiscan.io",
    contracts: {
      tokens: {
        WBTC: "0x0000000000000000000000000000000000000000",
        WETH: "0x0000000000000000000000000000000000000000",
        USDT: "0x0000000000000000000000000000000000000000",
        USDC: "0x0000000000000000000000000000000000000000",
      },
      orderBooks: {
        "BTC/USDT": "0x0000000000000000000000000000000000000000",
        "ETH/USDT": "0x0000000000000000000000000000000000000000",
        "ETH/USDC": "0x0000000000000000000000000000000000000000",
      },
      settlement: "0x0000000000000000000000000000000000000000",
      bridge: "0x0000000000000000000000000000000000000000",
    },
    deployer: "",
    deployedAt: "",
  },
};

export type NetworkName = keyof typeof DEPLOYMENTS;

export const SUPPORTED_NETWORKS: NetworkName[] = Object.keys(DEPLOYMENTS) as NetworkName[];

export const DEFAULT_NETWORK: NetworkName = "baseSepolia";

export function getDeployment(network: NetworkName): NetworkConfig | null {
  return DEPLOYMENTS[network] || null;
}

export function getContractAddress(
  network: NetworkName, 
  contract: keyof NetworkContracts['tokens'] | keyof NetworkContracts['orderBooks'] | 'settlement' | 'bridge'
): string | null {
  const deployment = DEPLOYMENTS[network];
  if (!deployment) return null;
  
  // Check in tokens
  if (contract in deployment.contracts.tokens) {
    return deployment.contracts.tokens[contract as keyof typeof deployment.contracts.tokens];
  }
  
  // Check in orderBooks
  if (contract in deployment.contracts.orderBooks) {
    return deployment.contracts.orderBooks[contract as keyof typeof deployment.contracts.orderBooks];
  }
  
  // Check direct contracts
  if (contract === "settlement") return deployment.contracts.settlement;
  if (contract === "bridge") return deployment.contracts.bridge;
  
  return null;
}

export function getNetworkByChainId(chainId: number): NetworkName | null {
  for (const [name, config] of Object.entries(DEPLOYMENTS)) {
    if (config.chainId === chainId) {
      return name as NetworkName;
    }
  }
  return null;
}

export function isContractDeployed(network: NetworkName): boolean {
  const deployment = DEPLOYMENTS[network];
  if (!deployment) return false;
  
  // Check if any orderbook has a non-zero address
  return Object.values(deployment.contracts.orderBooks).some(
    addr => addr !== "0x0000000000000000000000000000000000000000"
  );
}

// Chain configuration for wallet switching
export const CHAIN_CONFIG = {
  baseSepolia: {
    chainId: "0x14a34", // 84532 in hex
    chainName: "Base Sepolia",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"],
  },
  polygonAmoy: {
    chainId: "0x13882", // 80002 in hex
    chainName: "Polygon Amoy",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    blockExplorerUrls: ["https://amoy.polygonscan.com"],
  },
  arbitrumSepolia: {
    chainId: "0x66eee", // 421614 in hex
    chainName: "Arbitrum Sepolia",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://sepolia.arbiscan.io"],
  },
} as const;

// Supported markets across all networks
export const SUPPORTED_MARKETS = [
  { 
    symbol: "BTC/USDT", 
    baseToken: "WBTC", 
    quoteToken: "USDT",
    baseDecimals: 8,
    quoteDecimals: 6,
    minOrderSize: "0.0001",
    maxOrderSize: "100",
    tickSize: "0.01",
    icon: "₿"
  },
  { 
    symbol: "ETH/USDT", 
    baseToken: "WETH", 
    quoteToken: "USDT",
    baseDecimals: 18,
    quoteDecimals: 6,
    minOrderSize: "0.001",
    maxOrderSize: "1000",
    tickSize: "0.01",
    icon: "Ξ"
  },
  { 
    symbol: "ETH/USDC", 
    baseToken: "WETH", 
    quoteToken: "USDC",
    baseDecimals: 18,
    quoteDecimals: 6,
    minOrderSize: "0.001",
    maxOrderSize: "1000",
    tickSize: "0.01",
    icon: "Ξ"
  },
] as const;

export type MarketSymbol = typeof SUPPORTED_MARKETS[number]['symbol'];

export function getMarketConfig(symbol: MarketSymbol) {
  return SUPPORTED_MARKETS.find(m => m.symbol === symbol);
}
