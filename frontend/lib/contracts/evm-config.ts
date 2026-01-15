// Auto-generated EVM Contract Configuration
// Deployed: 2026-01-01T15:04:12.716Z
// Network: localhost (Chain ID: 31337)

export const EVM_CONTRACTS = {
  chainId: 31337,
  networkName: "localhost",
  rpcUrl: "http://127.0.0.1:8545",
  blockExplorer: "https://sepolia.basescan.org", // Will update when deployed to Base Sepolia
  
  // Token Addresses
  tokens: {
    WBTC: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    WETH: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    USDT: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    USDC: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  },
  
  // Order Book Addresses
  orderBooks: {
    "BTC/USDT": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    "ETH/USDT": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    "ETH/USDC": "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  },
  
  // Core Contract Addresses
  settlement: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  bridge: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  
  // Deployer
  deployer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
} as const;

export const SUPPORTED_MARKETS = [
  { symbol: "BTC/USDT", baseToken: "WBTC", quoteToken: "USDT", address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", decimals: { base: 8, quote: 6 } },
  { symbol: "ETH/USDT", baseToken: "WETH", quoteToken: "USDT", address: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707", decimals: { base: 18, quote: 6 } },
  { symbol: "ETH/USDC", baseToken: "WETH", quoteToken: "USDC", address: "0x0165878A594ca255338adfa4d48449f69242Eb8F", decimals: { base: 18, quote: 6 } },
] as const;

export const SUPPORTED_CHAINS = [
  { name: "localhost", displayName: "Localhost", chainId: 31337, enabled: true },
  { name: "ethereum", displayName: "Ethereum", chainId: 1, enabled: true },
  { name: "polygon", displayName: "Polygon", chainId: 137, enabled: true },
  { name: "arbitrum", displayName: "Arbitrum", chainId: 42161, enabled: true },
  { name: "base", displayName: "Base", chainId: 8453, enabled: true },
  { name: "baseSepolia", displayName: "Base Sepolia", chainId: 84532, enabled: true },
] as const;

// ABI Fragments for OrderBook
export const ORDER_BOOK_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function placeOrder(uint8 side, uint8 orderType, uint256 price, uint256 quantity, uint8 timeInForce) external returns (uint256)",
  "function cancelOrder(uint256 orderId) external",
  "function getOrderBook(uint256 limit) external view returns (uint256[] memory bidPrices, uint256[] memory bidQuantities, uint256[] memory askPrices, uint256[] memory askQuantities)",
  "function getUserOrders(address user) external view returns (tuple(uint256 id, address trader, uint8 side, uint8 orderType, uint256 price, uint256 quantity, uint256 filledQuantity, uint8 status, uint8 timeInForce, uint256 timestamp)[])",
  "function getRecentTrades(uint256 limit) external view returns (tuple(uint256 id, uint256 makerOrderId, uint256 takerOrderId, address maker, address taker, uint256 price, uint256 quantity, uint256 timestamp)[])",
  "function getBalance(address user, address token) external view returns (uint256)",
  "function getMarketStats() external view returns (tuple(uint256 lastPrice, uint256 bestBid, uint256 bestAsk, uint256 volume24h, uint256 high24h, uint256 low24h, uint256 totalTrades))",
  "function baseToken() external view returns (address)",
  "function quoteToken() external view returns (address)",
  "event OrderPlaced(uint256 indexed orderId, address indexed trader, uint8 side, uint8 orderType, uint256 price, uint256 quantity)",
  "event OrderCancelled(uint256 indexed orderId, address indexed trader)",
  "event TradeExecuted(uint256 indexed tradeId, uint256 indexed makerOrderId, uint256 indexed takerOrderId, address maker, address taker, uint256 price, uint256 quantity)",
];

// ABI for ERC20
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function faucet(uint256 amount) external",
];

// Bridge ABI
export const BRIDGE_ABI = [
  "function bridge(address token, uint256 amount, string destinationChain, string destinationAddress) external payable returns (uint256)",
  "function getBridgeRequest(uint256 requestId) external view returns (tuple(uint256 id, address sender, address token, uint256 amount, string destinationChain, string destinationAddress, uint256 timestamp, bool completed, bytes32 txHash))",
  "function getSupportedChains() external view returns (string[])",
  "function getSupportedTokens() external view returns (address[])",
  "function isTokenSupported(address token) external view returns (bool)",
];
