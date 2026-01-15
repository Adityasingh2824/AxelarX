# AxelarX EVM Deployment Complete ✅

## Deployment Summary

### Deployed Contracts (Local Hardhat Network - Chain ID: 31337)

| Contract | Address |
|----------|---------|
| WBTC | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| WETH | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| USDT | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| USDC | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| BTC/USDT OrderBook | `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9` |
| ETH/USDT OrderBook | `0x5FC8d32690cc91D4c39d9d3abcBD16989F875707` |
| ETH/USDC OrderBook | `0x0165878A594ca255338adfa4d48449f69242Eb8F` |
| Settlement | `0xa513E6E4b8f2a923D98304ec87F64353C4D5C853` |
| Bridge | `0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6` |

### Wallet Information
- **Deployer Address:** `0xCF2E0DBEde2B76d79c7D3bd5c6FD3eC4CD8BbeB8`
- **Recovery Phrase:** `possible obey else almost toward journey beyond avoid ecology learn decrease inside`
- **Private Key:** (stored in `evm-contracts/.env`)

---

## Files Created/Updated

### Smart Contracts (Solidity)
- `evm-contracts/contracts/AxelarXOrderBook.sol` - Central Limit Order Book
- `evm-contracts/contracts/AxelarXSettlement.sol` - Trade settlement contract
- `evm-contracts/contracts/AxelarXBridge.sol` - Cross-chain bridge
- `evm-contracts/contracts/MockERC20.sol` - Test tokens with faucet

### Deployment Scripts
- `evm-contracts/scripts/deploy.js` - Main deployment script
- `evm-contracts/scripts/get-private-key.js` - Utility to derive private key

### Frontend Integration
- `frontend/lib/evm.ts` - EVM client with ethers.js integration
- `frontend/lib/contracts/evm-config.ts` - Contract addresses and ABIs
- `frontend/components/WalletConnect.tsx` - Updated wallet connection
- `frontend/hooks/useOrderBook.ts` - Order book hook with EVM support
- `frontend/hooks/useTrading.ts` - Trading hook with EVM support

### Configuration
- `evm-contracts/hardhat.config.js` - Hardhat configuration
- `evm-contracts/package.json` - Dependencies

---

## How to Run Locally

### 1. Start Local Hardhat Node
```powershell
cd "C:\Users\Aditya singh\AxelarX\evm-contracts"
npx hardhat node
```

### 2. Deploy Contracts (in another terminal)
```powershell
cd "C:\Users\Aditya singh\AxelarX\evm-contracts"
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Start Frontend
```powershell
cd "C:\Users\Aditya singh\AxelarX\frontend"
npm run dev
```

### 4. Open in Browser
Navigate to: http://localhost:3000/trade

---

## Deploy to Base Sepolia (Testnet)

### Prerequisites
You need testnet ETH on Base Sepolia. Get some from:
- https://www.alchemy.com/faucets/base-sepolia
- https://faucet.quicknode.com/base/sepolia
- https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### Deploy Command
```powershell
cd "C:\Users\Aditya singh\AxelarX\evm-contracts"
npx hardhat run scripts/deploy.js --network baseSepolia
```

### After Deployment
The script will automatically update `frontend/lib/contracts/evm-config.ts` with the new addresses.

---

## Smart Contract Features

### OrderBook Contract
- **Deposit/Withdraw:** Manage token balances
- **Place Order:** Limit, Market orders with GTC/IOC/FOK/PostOnly
- **Cancel Order:** Cancel open orders
- **Order Matching:** Automatic price-time priority matching
- **Market Stats:** Track volume, price, trades

### Settlement Contract
- **Atomic Settlement:** Secure trade execution
- **Cross-chain Support:** Axelar integration ready
- **Authorization:** Only whitelisted order books

### Bridge Contract
- **Multi-chain:** Ethereum, Polygon, Arbitrum, Base
- **Fee System:** Configurable per-chain fees
- **Token Support:** Configurable token whitelist

---

## Testing the Integration

1. **Connect Wallet:** Click "Connect Wallet" button
2. **Get Test Tokens:** Use the faucet buttons in wallet dropdown
3. **Deposit Tokens:** Click "Deposit" to add funds to order book
4. **Place Order:** Use the trading form to buy/sell
5. **View Order Book:** See bids/asks update in real-time

---

## Next Steps

1. **Get Base Sepolia ETH** from a faucet
2. **Deploy to Base Sepolia** using the command above
3. **Verify Contracts** on Basescan:
   ```powershell
   npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
   ```
4. **Test on Testnet** with real MetaMask wallet
5. **Deploy to Base Mainnet** when ready for production

---

## Security Notes

⚠️ **Never commit the `.env` file to version control!**

The private key in `.env` gives full control of the wallet. Keep it secret!

For production:
- Use hardware wallets or multi-sig
- Audit smart contracts
- Implement rate limiting
- Add circuit breakers

---

**Deployment completed on:** January 1, 2026








