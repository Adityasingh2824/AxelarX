const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting AxelarX Contract Deployment...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH\n");

  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId.toString(), ")\n");

  const deployedContracts = {};

  // ============ Deploy Mock Tokens (for testnet) ============
  console.log("📦 Deploying Mock Tokens...");
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  // Deploy WBTC Mock
  const wbtc = await MockERC20.deploy("Wrapped Bitcoin", "WBTC", 8);
  await wbtc.waitForDeployment();
  const wbtcAddress = await wbtc.getAddress();
  console.log("   ✅ WBTC deployed to:", wbtcAddress);
  deployedContracts.WBTC = wbtcAddress;
  
  // Deploy WETH Mock
  const weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
  await weth.waitForDeployment();
  const wethAddress = await weth.getAddress();
  console.log("   ✅ WETH deployed to:", wethAddress);
  deployedContracts.WETH = wethAddress;
  
  // Deploy USDT Mock
  const usdt = await MockERC20.deploy("Tether USD", "USDT", 6);
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("   ✅ USDT deployed to:", usdtAddress);
  deployedContracts.USDT = usdtAddress;
  
  // Deploy USDC Mock
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("   ✅ USDC deployed to:", usdcAddress);
  deployedContracts.USDC = usdcAddress;

  console.log("");

  // ============ Deploy Order Books ============
  console.log("📦 Deploying Order Book Contracts...");
  
  const AxelarXOrderBook = await ethers.getContractFactory("AxelarXOrderBook");
  
  // BTC/USDT Order Book
  const btcUsdt = await AxelarXOrderBook.deploy(
    wbtcAddress,           // base token
    usdtAddress,           // quote token
    "WBTC",                // base symbol
    "USDT",                // quote symbol
    ethers.parseUnits("0.0001", 8),   // min order size (0.0001 BTC)
    ethers.parseUnits("100", 8)       // max order size (100 BTC)
  );
  await btcUsdt.waitForDeployment();
  const btcUsdtAddress = await btcUsdt.getAddress();
  console.log("   ✅ BTC/USDT OrderBook deployed to:", btcUsdtAddress);
  deployedContracts.BTC_USDT_OrderBook = btcUsdtAddress;
  
  // ETH/USDT Order Book
  const ethUsdt = await AxelarXOrderBook.deploy(
    wethAddress,           // base token
    usdtAddress,           // quote token
    "WETH",                // base symbol
    "USDT",                // quote symbol
    ethers.parseUnits("0.001", 18),   // min order size (0.001 ETH)
    ethers.parseUnits("1000", 18)     // max order size (1000 ETH)
  );
  await ethUsdt.waitForDeployment();
  const ethUsdtAddress = await ethUsdt.getAddress();
  console.log("   ✅ ETH/USDT OrderBook deployed to:", ethUsdtAddress);
  deployedContracts.ETH_USDT_OrderBook = ethUsdtAddress;
  
  // ETH/USDC Order Book
  const ethUsdc = await AxelarXOrderBook.deploy(
    wethAddress,           // base token
    usdcAddress,           // quote token
    "WETH",                // base symbol
    "USDC",                // quote symbol
    ethers.parseUnits("0.001", 18),   // min order size (0.001 ETH)
    ethers.parseUnits("1000", 18)     // max order size (1000 ETH)
  );
  await ethUsdc.waitForDeployment();
  const ethUsdcAddress = await ethUsdc.getAddress();
  console.log("   ✅ ETH/USDC OrderBook deployed to:", ethUsdcAddress);
  deployedContracts.ETH_USDC_OrderBook = ethUsdcAddress;

  console.log("");

  // ============ Deploy Settlement Contract ============
  console.log("📦 Deploying Settlement Contract...");
  
  // Use zero addresses for Axelar on testnet
  const axelarGateway = "0x0000000000000000000000000000000000000000";
  const axelarGasService = "0x0000000000000000000000000000000000000000";
  
  const AxelarXSettlement = await ethers.getContractFactory("AxelarXSettlement");
  const settlement = await AxelarXSettlement.deploy(axelarGateway, axelarGasService);
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log("   ✅ Settlement deployed to:", settlementAddress);
  deployedContracts.Settlement = settlementAddress;

  console.log("");

  // ============ Deploy Bridge Contract ============
  console.log("📦 Deploying Bridge Contract...");
  
  const AxelarXBridge = await ethers.getContractFactory("AxelarXBridge");
  const bridge = await AxelarXBridge.deploy(axelarGateway, axelarGasService);
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("   ✅ Bridge deployed to:", bridgeAddress);
  deployedContracts.Bridge = bridgeAddress;

  console.log("");

  // ============ Configure Contracts ============
  console.log("⚙️  Configuring contracts...");
  
  // Authorize order books in settlement
  await settlement.authorizeOrderBook(btcUsdtAddress, true);
  await settlement.authorizeOrderBook(ethUsdtAddress, true);
  await settlement.authorizeOrderBook(ethUsdcAddress, true);
  console.log("   ✅ Order books authorized in Settlement");
  
  // Add supported tokens to settlement
  await settlement.setSupportedToken(wbtcAddress, true);
  await settlement.setSupportedToken(wethAddress, true);
  await settlement.setSupportedToken(usdtAddress, true);
  await settlement.setSupportedToken(usdcAddress, true);
  console.log("   ✅ Tokens configured in Settlement");
  
  // Configure bridge for tokens
  await bridge.configureToken(wbtcAddress, true);
  await bridge.configureToken(wethAddress, true);
  await bridge.configureToken(usdtAddress, true);
  await bridge.configureToken(usdcAddress, true);
  console.log("   ✅ Tokens configured in Bridge");
  
  // Configure bridge chains
  await bridge.configureChain(
    "ethereum",
    true,
    ethers.parseUnits("0.01", 18),   // min amount
    ethers.parseUnits("1000", 18),   // max amount
    50,                               // 0.5% fee
    "0x0000000000000000000000000000000000000000"
  );
  await bridge.configureChain(
    "polygon",
    true,
    ethers.parseUnits("0.01", 18),
    ethers.parseUnits("1000", 18),
    30,                               // 0.3% fee
    "0x0000000000000000000000000000000000000000"
  );
  await bridge.configureChain(
    "arbitrum",
    true,
    ethers.parseUnits("0.01", 18),
    ethers.parseUnits("1000", 18),
    25,                               // 0.25% fee
    "0x0000000000000000000000000000000000000000"
  );
  console.log("   ✅ Chains configured in Bridge");

  console.log("");

  // ============ Mint Test Tokens ============
  console.log("🪙 Minting test tokens to deployer...");
  
  await wbtc.mint(deployer.address, ethers.parseUnits("10", 8));
  await weth.mint(deployer.address, ethers.parseUnits("100", 18));
  await usdt.mint(deployer.address, ethers.parseUnits("100000", 6));
  await usdc.mint(deployer.address, ethers.parseUnits("100000", 6));
  console.log("   ✅ Test tokens minted to:", deployer.address);

  console.log("");

  // ============ Save Deployment Info ============
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts
  };

  // Save to evm-contracts directory
  const evmDeploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(evmDeploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("📄 Deployment info saved to:", evmDeploymentPath);

  // Save to frontend directory
  const frontendConfigPath = path.join(__dirname, "../../frontend/lib/contracts/evm-config.ts");
  const frontendConfig = `// Auto-generated EVM Contract Configuration
// Deployed: ${new Date().toISOString()}
// Network: ${network.name} (Chain ID: ${network.chainId})

export const EVM_CONTRACTS = {
  chainId: ${network.chainId},
  networkName: "${network.name}",
  
  // Token Addresses
  tokens: {
    WBTC: "${wbtcAddress}",
    WETH: "${wethAddress}",
    USDT: "${usdtAddress}",
    USDC: "${usdcAddress}",
  },
  
  // Order Book Addresses
  orderBooks: {
    "BTC/USDT": "${btcUsdtAddress}",
    "ETH/USDT": "${ethUsdtAddress}",
    "ETH/USDC": "${ethUsdcAddress}",
  },
  
  // Core Contract Addresses
  settlement: "${settlementAddress}",
  bridge: "${bridgeAddress}",
  
  // Deployer
  deployer: "${deployer.address}",
} as const;

export const SUPPORTED_MARKETS = [
  { symbol: "BTC/USDT", baseToken: "WBTC", quoteToken: "USDT", address: "${btcUsdtAddress}" },
  { symbol: "ETH/USDT", baseToken: "WETH", quoteToken: "USDT", address: "${ethUsdtAddress}" },
  { symbol: "ETH/USDC", baseToken: "WETH", quoteToken: "USDC", address: "${ethUsdcAddress}" },
] as const;

export const SUPPORTED_CHAINS = [
  { name: "ethereum", displayName: "Ethereum", enabled: true },
  { name: "polygon", displayName: "Polygon", enabled: true },
  { name: "arbitrum", displayName: "Arbitrum", enabled: true },
  { name: "base", displayName: "Base", enabled: true },
] as const;
`;

  fs.writeFileSync(frontendConfigPath, frontendConfig);
  console.log("📄 Frontend config saved to:", frontendConfigPath);

  console.log("\n✨ Deployment complete!\n");
  console.log("=".repeat(60));
  console.log("DEPLOYED CONTRACTS:");
  console.log("=".repeat(60));
  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`${name.padEnd(25)} ${address}`);
  });
  console.log("=".repeat(60));
  
  console.log("\n📝 Next Steps:");
  console.log("1. Update frontend/.env.local with the contract addresses");
  console.log("2. Run 'npm run dev' in frontend to start the app");
  console.log("3. Get testnet ETH from a faucet for gas fees");
  console.log("4. Use the faucet functions to get test tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });








