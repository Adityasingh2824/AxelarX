require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const { HDNodeWallet, Mnemonic } = require("ethers");

// Derive private key from mnemonic
function getPrivateKey() {
  if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66) {
    return process.env.PRIVATE_KEY;
  }
  
  if (process.env.MNEMONIC) {
    try {
      const mnemonic = Mnemonic.fromPhrase(process.env.MNEMONIC);
      const wallet = HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/0");
      console.log("📍 Derived wallet address:", wallet.address);
      return wallet.privateKey;
    } catch (e) {
      console.warn("Failed to derive from mnemonic:", e.message);
    }
  }
  
  // Fallback for compilation only
  return "0x0000000000000000000000000000000000000000000000000000000000000001";
}

const PRIVATE_KEY = getPrivateKey();

// API Keys for verification
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    // Local Development
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    
    // Ethereum Sepolia Testnet
    sepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC || "https://rpc.sepolia.org",
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasPrice: "auto"
    },
    
    // Base Sepolia Testnet (Primary)
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: [PRIVATE_KEY],
      chainId: 84532,
      gasPrice: 1000000000, // 1 gwei
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.basescan.org"
        }
      }
    },
    
    // Polygon Amoy Testnet (formerly Mumbai)
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology",
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      gasPrice: "auto"
    },
    
    // Arbitrum Sepolia Testnet
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 421614,
      gasPrice: "auto"
    },
    
    // Production Networks (for future use)
    base: {
      url: "https://mainnet.base.org",
      accounts: [PRIVATE_KEY],
      chainId: 8453
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [PRIVATE_KEY],
      chainId: 137
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [PRIVATE_KEY],
      chainId: 42161
    }
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      baseSepolia: BASESCAN_API_KEY,
      base: BASESCAN_API_KEY,
      polygonAmoy: POLYGONSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      arbitrumSepolia: ARBISCAN_API_KEY,
      arbitrumOne: ARBISCAN_API_KEY
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      },
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};
