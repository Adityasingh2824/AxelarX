/**
 * Utility script to derive private key from mnemonic
 * Run: node scripts/get-private-key.js
 */

const { ethers } = require("ethers");

const MNEMONIC = "possible obey else almost toward journey beyond avoid ecology learn decrease inside";

async function main() {
  console.log("\n=== AxelarX Private Key Derivation ===\n");
  
  try {
    const wallet = ethers.Wallet.fromPhrase(MNEMONIC);
    
    console.log("Mnemonic:", MNEMONIC);
    console.log("\nDerived Address:", wallet.address);
    console.log("Private Key:", wallet.privateKey);
    
    console.log("\n✅ Add this to your .env file:");
    console.log(`PRIVATE_KEY=${wallet.privateKey}`);
    console.log(`DEPLOYER_ADDRESS=${wallet.address}`);
    
    // Expected address check
    const expectedAddress = "0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8";
    if (wallet.address.toLowerCase() !== expectedAddress.toLowerCase()) {
      console.log("\n⚠️  Warning: Derived address doesn't match expected address!");
      console.log("   Expected:", expectedAddress);
      console.log("   Derived:", wallet.address);
      console.log("\n   This might be due to a different derivation path.");
      console.log("   The mnemonic phrase may generate multiple addresses.");
    } else {
      console.log("\n✅ Address matches expected address!");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();








