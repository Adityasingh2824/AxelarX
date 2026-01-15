const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

// Network configurations
const NETWORK_CONFIG = {
  baseSepolia: {
    name: "Base Sepolia",
    chainId: 84532,
    explorer: "https://sepolia.basescan.org",
    rpcUrl: "https://sepolia.base.org",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 }
  },
  polygonAmoy: {
    name: "Polygon Amoy",
    chainId: 80002,
    explorer: "https://amoy.polygonscan.com",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 }
  },
  arbitrumSepolia: {
    name: "Arbitrum Sepolia",
    chainId: 421614,
    explorer: "https://sepolia.arbiscan.io",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 }
  },
  localhost: {
    name: "Localhost",
    chainId: 31337,
    explorer: "",
    rpcUrl: "http://127.0.0.1:8545",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 }
  }
};

async function main() {
  const networkName = network.name;
  const networkConfig = NETWORK_CONFIG[networkName] || NETWORK_CONFIG.localhost;
  
  console.log("\n" + "=".repeat(70));
  console.log("🚀 AxelarX Multi-Chain Deployment");
  console.log("=".repeat(70));
  console.log(`📍 Network: ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);
  console.log(`🔗 Explorer: ${networkConfig.explorer}`);
  console.log("=".repeat(70) + "\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), networkConfig.nativeCurrency.symbol);
  
  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Deployer has no balance! Get testnet tokens from:");
    if (networkName === "baseSepolia") {
      console.log("   https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    } else if (networkName === "polygonAmoy") {
      console.log("   https://faucet.polygon.technology/");
    } else if (networkName === "arbitrumSepolia") {
      console.log("   https://faucet.arbitrum.io/");
    }
    console.log("\n");
  }

  const deployedContracts = {};
  const deploymentStart = Date.now();

  try {
    // ============ Deploy Mock Tokens ============
    console.log("\n📦 [1/5] Deploying Mock Tokens...");
    
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    
    // Deploy WBTC Mock
    console.log("   Deploying WBTC...");
    const wbtc = await MockERC20.deploy("Wrapped Bitcoin", "WBTC", 8);
    await wbtc.waitForDeployment();
    const wbtcAddress = await wbtc.getAddress();
    console.log("   ✅ WBTC:", wbtcAddress);
    deployedContracts.WBTC = wbtcAddress;
    
    // Deploy WETH Mock
    console.log("   Deploying WETH...");
    const weth = await MockERC20.deploy("Wrapped Ether", "WETH", 18);
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    console.log("   ✅ WETH:", wethAddress);
    deployedContracts.WETH = wethAddress;
    
    // Deploy USDT Mock
    console.log("   Deploying USDT...");
    const usdt = await MockERC20.deploy("Tether USD", "USDT", 6);
    await usdt.waitForDeployment();
    const usdtAddress = await usdt.getAddress();
    console.log("   ✅ USDT:", usdtAddress);
    deployedContracts.USDT = usdtAddress;
    
    // Deploy USDC Mock
    console.log("   Deploying USDC...");
    const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("   ✅ USDC:", usdcAddress);
    deployedContracts.USDC = usdcAddress;

    // ============ Deploy Order Books ============
    console.log("\n📦 [2/5] Deploying Order Book Contracts...");
    
    const AxelarXOrderBook = await ethers.getContractFactory("AxelarXOrderBook");
    
    // BTC/USDT Order Book
    console.log("   Deploying BTC/USDT OrderBook...");
    const btcUsdt = await AxelarXOrderBook.deploy(
      wbtcAddress,
      usdtAddress,
      "WBTC",
      "USDT",
      ethers.parseUnits("0.0001", 8),
      ethers.parseUnits("100", 8)
    );
    await btcUsdt.waitForDeployment();
    const btcUsdtAddress = await btcUsdt.getAddress();
    console.log("   ✅ BTC/USDT OrderBook:", btcUsdtAddress);
    deployedContracts.BTC_USDT_OrderBook = btcUsdtAddress;
    
    // ETH/USDT Order Book
    console.log("   Deploying ETH/USDT OrderBook...");
    const ethUsdt = await AxelarXOrderBook.deploy(
      wethAddress,
      usdtAddress,
      "WETH",
      "USDT",
      ethers.parseUnits("0.001", 18),
      ethers.parseUnits("1000", 18)
    );
    await ethUsdt.waitForDeployment();
    const ethUsdtAddress = await ethUsdt.getAddress();
    console.log("   ✅ ETH/USDT OrderBook:", ethUsdtAddress);
    deployedContracts.ETH_USDT_OrderBook = ethUsdtAddress;
    
    // ETH/USDC Order Book
    console.log("   Deploying ETH/USDC OrderBook...");
    const ethUsdc = await AxelarXOrderBook.deploy(
      wethAddress,
      usdcAddress,
      "WETH",
      "USDC",
      ethers.parseUnits("0.001", 18),
      ethers.parseUnits("1000", 18)
    );
    await ethUsdc.waitForDeployment();
    const ethUsdcAddress = await ethUsdc.getAddress();
    console.log("   ✅ ETH/USDC OrderBook:", ethUsdcAddress);
    deployedContracts.ETH_USDC_OrderBook = ethUsdcAddress;

    // ============ Deploy Settlement Contract ============
    console.log("\n📦 [3/5] Deploying Settlement Contract...");
    
    const axelarGateway = "0x0000000000000000000000000000000000000000";
    const axelarGasService = "0x0000000000000000000000000000000000000000";
    
    const AxelarXSettlement = await ethers.getContractFactory("AxelarXSettlement");
    const settlement = await AxelarXSettlement.deploy(axelarGateway, axelarGasService);
    await settlement.waitForDeployment();
    const settlementAddress = await settlement.getAddress();
    console.log("   ✅ Settlement:", settlementAddress);
    deployedContracts.Settlement = settlementAddress;

    // ============ Deploy Bridge Contract ============
    console.log("\n📦 [4/5] Deploying Bridge Contract...");
    
    const AxelarXBridge = await ethers.getContractFactory("AxelarXBridge");
    const bridge = await AxelarXBridge.deploy(axelarGateway, axelarGasService);
    await bridge.waitForDeployment();
    const bridgeAddress = await bridge.getAddress();
    console.log("   ✅ Bridge:", bridgeAddress);
    deployedContracts.Bridge = bridgeAddress;

    // ============ Configure Contracts ============
    console.log("\n⚙️  [5/5] Configuring Contracts...");
    
    // Authorize order books
    console.log("   Authorizing order books in Settlement...");
    await settlement.authorizeOrderBook(btcUsdtAddress, true);
    await settlement.authorizeOrderBook(ethUsdtAddress, true);
    await settlement.authorizeOrderBook(ethUsdcAddress, true);
    
    // Add supported tokens
    console.log("   Adding supported tokens to Settlement...");
    await settlement.setSupportedToken(wbtcAddress, true);
    await settlement.setSupportedToken(wethAddress, true);
    await settlement.setSupportedToken(usdtAddress, true);
    await settlement.setSupportedToken(usdcAddress, true);
    
    // Configure bridge tokens
    console.log("   Configuring Bridge tokens...");
    await bridge.configureToken(wbtcAddress, true);
    await bridge.configureToken(wethAddress, true);
    await bridge.configureToken(usdtAddress, true);
    await bridge.configureToken(usdcAddress, true);
    
    // Configure bridge chains
    console.log("   Configuring Bridge chains...");
    const chains = ["ethereum", "polygon", "arbitrum", "base"];
    for (const chain of chains) {
      await bridge.configureChain(
        chain,
        true,
        ethers.parseUnits("0.01", 18),
        ethers.parseUnits("10000", 18),
        25,
        "0x0000000000000000000000000000000000000000"
      );
    }
    
    // Mint test tokens to deployer
    console.log("   Minting test tokens to deployer...");
    await wbtc.mint(deployer.address, ethers.parseUnits("100", 8));
    await weth.mint(deployer.address, ethers.parseUnits("1000", 18));
    await usdt.mint(deployer.address, ethers.parseUnits("1000000", 6));
    await usdc.mint(deployer.address, ethers.parseUnits("1000000", 6));
    
    console.log("   ✅ Configuration complete!");

    // ============ Save Deployment Info ============
    const deploymentTime = ((Date.now() - deploymentStart) / 1000).toFixed(1);
    
    const deploymentInfo = {
      network: networkName,
      networkConfig: networkConfig,
      chainId: networkConfig.chainId,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      deploymentTime: `${deploymentTime}s`,
      contracts: deployedContracts
    };

    // Save to network-specific deployment file
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    const deploymentPath = path.join(deploymentDir, `${networkName}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Deployment saved to:", deploymentPath);

    // Update main deployment.json
    const mainDeploymentPath = path.join(__dirname, "../deployment.json");
    let allDeployments = {};
    if (fs.existsSync(mainDeploymentPath)) {
      allDeployments = JSON.parse(fs.readFileSync(mainDeploymentPath, "utf8"));
    }
    allDeployments[networkName] = deploymentInfo;
    fs.writeFileSync(mainDeploymentPath, JSON.stringify(allDeployments, null, 2));

    // Generate frontend config
    const frontendConfigPath = path.join(__dirname, "../../frontend/lib/contracts/deployments.ts");
    const frontendConfig = generateFrontendConfig(allDeployments);
    fs.writeFileSync(frontendConfigPath, frontendConfig);
    console.log("📄 Frontend config saved to:", frontendConfigPath);

    // Print summary
    console.log("\n" + "=".repeat(70));
    console.log("✨ DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));
    console.log(`⏱️  Time: ${deploymentTime} seconds`);
    console.log(`🌐 Network: ${networkConfig.name}`);
    console.log(`🔗 Explorer: ${networkConfig.explorer}`);
    console.log("\n📋 Deployed Contracts:");
    console.log("-".repeat(70));
    Object.entries(deployedContracts).forEach(([name, address]) => {
      const explorerUrl = networkConfig.explorer ? `${networkConfig.explorer}/address/${address}` : address;
      console.log(`   ${name.padEnd(25)} ${address}`);
    });
    console.log("-".repeat(70));

    console.log("\n📝 Next Steps:");
    console.log("   1. Copy contract addresses to frontend/.env.local");
    console.log("   2. Run 'npm run dev' in frontend directory");
    console.log("   3. Connect wallet and start trading!");
    
    if (networkConfig.explorer) {
      console.log(`\n🔍 View on explorer: ${networkConfig.explorer}/address/${deployer.address}`);
    }

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
}

function generateFrontendConfig(deployments) {
  const networks = Object.entries(deployments).map(([name, info]) => {
    return `
  ${name}: {
    chainId: ${info.chainId},
    name: "${info.networkConfig?.name || name}",
    rpcUrl: "${info.networkConfig?.rpcUrl || ""}",
    explorer: "${info.networkConfig?.explorer || ""}",
    contracts: {
      tokens: {
        WBTC: "${info.contracts.WBTC}",
        WETH: "${info.contracts.WETH}",
        USDT: "${info.contracts.USDT}",
        USDC: "${info.contracts.USDC}",
      },
      orderBooks: {
        "BTC/USDT": "${info.contracts.BTC_USDT_OrderBook}",
        "ETH/USDT": "${info.contracts.ETH_USDT_OrderBook}",
        "ETH/USDC": "${info.contracts.ETH_USDC_OrderBook}",
      },
      settlement: "${info.contracts.Settlement}",
      bridge: "${info.contracts.Bridge}",
    },
    deployer: "${info.deployer}",
    deployedAt: "${info.timestamp}",
  }`;
  }).join(",\n");

  return `// Auto-generated deployment configuration
// Last updated: ${new Date().toISOString()}

export const DEPLOYMENTS = {${networks}
} as const;

export type NetworkName = keyof typeof DEPLOYMENTS;

export const SUPPORTED_NETWORKS: NetworkName[] = Object.keys(DEPLOYMENTS) as NetworkName[];

export const DEFAULT_NETWORK: NetworkName = "${Object.keys(deployments)[0] || "baseSepolia"}";

export function getDeployment(network: NetworkName) {
  return DEPLOYMENTS[network];
}

export function getContractAddress(network: NetworkName, contract: string) {
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
`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
