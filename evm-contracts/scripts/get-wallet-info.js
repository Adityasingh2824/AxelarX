/**
 * Utility script to derive wallet address from mnemonic
 * and check balances across testnets
 */

const { HDNodeWallet, Mnemonic, JsonRpcProvider, formatEther } = require("ethers");

// Your mnemonic
const MNEMONIC = "orphan teach boy swing club rifle sting wisdom save prosper payment puzzle";

// Testnet RPC endpoints
const NETWORKS = {
  baseSepolia: {
    name: "Base Sepolia",
    rpc: "https://sepolia.base.org",
    chainId: 84532,
    faucet: "https://www.coinbase.com/faucets/base-ethereum-goerli-faucet"
  },
  polygonAmoy: {
    name: "Polygon Amoy", 
    rpc: "https://rpc-amoy.polygon.technology",
    chainId: 80002,
    faucet: "https://faucet.polygon.technology/"
  },
  arbitrumSepolia: {
    name: "Arbitrum Sepolia",
    rpc: "https://sepolia-rollup.arbitrum.io/rpc",
    chainId: 421614,
    faucet: "https://faucet.arbitrum.io/"
  },
  ethereumSepolia: {
    name: "Ethereum Sepolia",
    rpc: "https://rpc.sepolia.org",
    chainId: 11155111,
    faucet: "https://sepoliafaucet.com/"
  }
};

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🔐 AxelarX Wallet Information");
  console.log("=".repeat(60) + "\n");

  // Derive wallet from mnemonic
  const mnemonic = Mnemonic.fromPhrase(MNEMONIC);
  const wallet = HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
  
  console.log("📍 Wallet Address:", wallet.address);
  console.log("🔑 Private Key:", wallet.privateKey);
  console.log("\n" + "-".repeat(60));
  console.log("⚠️  NEVER share your private key or mnemonic!");
  console.log("-".repeat(60) + "\n");

  // Check balances on all networks
  console.log("💰 Balances on Testnets:\n");
  
  for (const [networkId, network] of Object.entries(NETWORKS)) {
    try {
      const provider = new JsonRpcProvider(network.rpc);
      const balance = await provider.getBalance(wallet.address);
      const balanceEth = formatEther(balance);
      
      const status = parseFloat(balanceEth) > 0 ? "✅" : "❌";
      console.log(`   ${status} ${network.name.padEnd(20)} ${balanceEth} ETH/MATIC`);
      
      if (parseFloat(balanceEth) === 0) {
        console.log(`      └─ Get tokens: ${network.faucet}`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${network.name.padEnd(20)} Could not connect`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📝 To deploy contracts, run:");
  console.log("   npx hardhat run scripts/deploy-multichain.js --network baseSepolia");
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
