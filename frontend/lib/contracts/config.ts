/**
 * Contract Configuration Management
 * Loads and manages deployment configuration for contracts
 */

export interface MarketConfig {
  chainId: string;
  orderbookAppId?: string;
  settlementAppId?: string;
  bridgeAppId?: string;
}

export interface DeploymentConfig {
  network: {
    type: string;
    faucetUrl: string;
    graphqlUrl: string;
  };
  wallet: {
    path: string;
    keystore: string;
    storage: string;
  };
  markets: Record<string, MarketConfig>;
  contracts: {
    orderbook: string;
    settlement: string;
    bridge: string;
  };
  deploymentTime?: string;
}

let deploymentConfig: DeploymentConfig | null = null;

/**
 * Load deployment configuration
 */
export async function loadDeploymentConfig(): Promise<DeploymentConfig | null> {
  if (deploymentConfig) {
    return deploymentConfig;
  }

  try {
    // Try to load from public directory first (if deployed)
    const response = await fetch('/deployment-config.json');
    if (response.ok) {
      deploymentConfig = await response.json();
      return deploymentConfig;
    }
  } catch (error) {
    console.warn('Could not load deployment-config.json, using environment variables');
  }

  // Fallback to environment variables
  const graphqlUrl = process.env.NEXT_PUBLIC_LINERA_GRAPHQL_URL || 'http://localhost:8080/graphql';
  const faucetUrl = process.env.NEXT_PUBLIC_LINERA_FAUCET_URL || 'http://localhost:8080';

  // Create default config from environment variables
  deploymentConfig = {
    network: {
      type: 'local',
      faucetUrl,
      graphqlUrl,
    },
    wallet: {
      path: '',
      keystore: '',
      storage: '',
    },
    markets: {
      'BTC/USDT': {
        chainId: process.env.NEXT_PUBLIC_BTC_USDT_CHAIN_ID || '',
        orderbookAppId: process.env.NEXT_PUBLIC_BTC_USDT_ORDERBOOK_APP_ID || '',
        settlementAppId: process.env.NEXT_PUBLIC_BTC_USDT_SETTLEMENT_APP_ID || '',
      },
      'ETH/USDT': {
        chainId: process.env.NEXT_PUBLIC_ETH_USDT_CHAIN_ID || '',
        orderbookAppId: process.env.NEXT_PUBLIC_ETH_USDT_ORDERBOOK_APP_ID || '',
        settlementAppId: process.env.NEXT_PUBLIC_ETH_USDT_SETTLEMENT_APP_ID || '',
      },
      'SOL/USDT': {
        chainId: process.env.NEXT_PUBLIC_SOL_USDT_CHAIN_ID || '',
        orderbookAppId: process.env.NEXT_PUBLIC_SOL_USDT_ORDERBOOK_APP_ID || '',
        settlementAppId: process.env.NEXT_PUBLIC_SOL_USDT_SETTLEMENT_APP_ID || '',
      },
    },
    contracts: {
      orderbook: 'axelarx-orderbook',
      settlement: 'axelarx-settlement',
      bridge: 'axelarx-bridge',
    },
  };

  return deploymentConfig;
}

/**
 * Get market configuration
 */
export async function getMarketConfig(market: string): Promise<MarketConfig | null> {
  const config = await loadDeploymentConfig();
  if (!config) return null;

  // Normalize market name (BTC/USDT -> BTC_USDT)
  const normalizedMarket = market.replace('/', '_');
  
  return config.markets[normalizedMarket] || config.markets[market] || null;
}

/**
 * Get GraphQL endpoint
 */
export async function getGraphQLEndpoint(): Promise<string> {
  const config = await loadDeploymentConfig();
  return config?.network.graphqlUrl || process.env.NEXT_PUBLIC_LINERA_GRAPHQL_URL || 'http://localhost:8080/graphql';
}

/**
 * Check if contracts are deployed
 */
export async function isDeployed(): Promise<boolean> {
  const config = await loadDeploymentConfig();
  if (!config) return false;

  // Check if at least one market has contract IDs
  return Object.values(config.markets).some(
    (market) => market.orderbookAppId && market.orderbookAppId.length > 0
  );
}













