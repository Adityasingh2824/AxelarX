# AxelarX Deployment & Integration Guide

Complete guide to deploy smart contracts and integrate with the frontend.

## Prerequisites

1. **Rust Toolchain** (1.70+)
   ```powershell
   # Install Rust
   winget install Rustlang.Rustup
   rustup toolchain install stable
   rustup default stable
   rustup target add wasm32-unknown-unknown
   ```

2. **Linera CLI**
   - Install from: https://linera.dev/getting_started/installation.html
   - Verify: `linera --version`

3. **Node.js** (18+)
   ```powershell
   node --version
   ```

## Step 1: Build Contracts

```powershell
# Navigate to project root
cd "C:\Users\Aditya singh\AxelarX"

# Build orderbook contract
cd contracts\orderbook
cargo build --release --target wasm32-unknown-unknown
cd ..\..

# Build settlement contract
cd contracts\settlement
cargo build --release --target wasm32-unknown-unknown
cd ..\..

# Build bridge contract
cd contracts\bridge
cargo build --release --target wasm32-unknown-unknown
cd ..\..
```

Compiled WASM files will be at:
- `target/wasm32-unknown-unknown/release/axelarx_orderbook.wasm`
- `target/wasm32-unknown-unknown/release/axelarx_orderbook_service.wasm`
- Similar for settlement and bridge contracts

## Step 2: Start Local Linera Network

```powershell
# Start local network with faucet
linera net up --with-faucet --faucet-port 8080

# In a separate terminal, initialize wallet
linera wallet init --faucet http://localhost:8080
```

## Step 3: Deploy Contracts

### Option A: Use PowerShell Script

```powershell
# Run deployment script
.\scripts\deploy-local.ps1
```

### Option B: Manual Deployment

For each market (BTC/USDT, ETH/USDT, SOL/USDT):

1. **Create a microchain:**
   ```powershell
   linera wallet request-chain --faucet http://localhost:8080
   ```
   Save the chain ID from output.

2. **Deploy OrderBook contract:**
   ```powershell
   linera publish-and-create `
     target\wasm32-unknown-unknown\release\axelarx_orderbook.wasm `
     target\wasm32-unknown-unknown\release\axelarx_orderbook_service.wasm `
     --chain <CHAIN_ID> `
     --json-argument '{}'
   ```
   Save the Application ID from output.

3. **Deploy Settlement contract:**
   ```powershell
   linera publish-and-create `
     target\wasm32-unknown-unknown\release\axelarx_settlement.wasm `
     target\wasm32-unknown-unknown\release\axelarx_settlement_service.wasm `
     --chain <CHAIN_ID> `
     --json-argument '{}'
   ```
   Save the Application ID from output.

4. **Deploy Bridge contract (optional):**
   ```powershell
   linera publish-and-create `
     target\wasm32-unknown-unknown\release\axelarx_bridge.wasm `
     target\wasm32-unknown-unknown\release\axelarx_bridge_service.wasm `
     --chain <CHAIN_ID> `
     --json-argument '{}'
   ```

## Step 4: Create Configuration File

Create `deployment-config.json` in the project root:

```json
{
  "network": {
    "type": "local",
    "faucet_url": "http://localhost:8080",
    "graphql_url": "http://localhost:8080/graphql"
  },
  "markets": {
    "BTC_USDT": {
      "chainId": "YOUR_BTC_CHAIN_ID",
      "orderbookAppId": "YOUR_BTC_ORDERBOOK_APP_ID",
      "settlementAppId": "YOUR_BTC_SETTLEMENT_APP_ID"
    },
    "ETH_USDT": {
      "chainId": "YOUR_ETH_CHAIN_ID",
      "orderbookAppId": "YOUR_ETH_ORDERBOOK_APP_ID",
      "settlementAppId": "YOUR_ETH_SETTLEMENT_APP_ID"
    },
    "SOL_USDT": {
      "chainId": "YOUR_SOL_CHAIN_ID",
      "orderbookAppId": "YOUR_SOL_ORDERBOOK_APP_ID",
      "settlementAppId": "YOUR_SOL_SETTLEMENT_APP_ID"
    }
  },
  "contracts": {
    "orderbook": "axelarx-orderbook",
    "settlement": "axelarx-settlement",
    "bridge": "axelarx-bridge"
  }
}
```

Or use environment variables in `frontend/.env.local`:

```env
NEXT_PUBLIC_LINERA_NETWORK_URL=http://localhost:8080
NEXT_PUBLIC_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
NEXT_PUBLIC_LINERA_FAUCET_URL=http://localhost:8080

# BTC/USDT Market
NEXT_PUBLIC_BTC_USDT_CHAIN_ID=your-chain-id
NEXT_PUBLIC_BTC_USDT_ORDERBOOK_APP_ID=your-app-id
NEXT_PUBLIC_BTC_USDT_SETTLEMENT_APP_ID=your-app-id

# ETH/USDT Market
NEXT_PUBLIC_ETH_USDT_CHAIN_ID=your-chain-id
NEXT_PUBLIC_ETH_USDT_ORDERBOOK_APP_ID=your-app-id
NEXT_PUBLIC_ETH_USDT_SETTLEMENT_APP_ID=your-app-id

# SOL/USDT Market
NEXT_PUBLIC_SOL_USDT_CHAIN_ID=your-chain-id
NEXT_PUBLIC_SOL_USDT_ORDERBOOK_APP_ID=your-app-id
NEXT_PUBLIC_SOL_USDT_SETTLEMENT_APP_ID=your-app-id
```

## Step 5: Start GraphQL Service

```powershell
# Start Linera GraphQL service
linera service --port 8080
```

This exposes a GraphQL endpoint at `http://localhost:8080/graphql`

## Step 6: Configure Frontend

1. Copy the deployment config to frontend public directory:
   ```powershell
   Copy-Item deployment-config.json frontend\public\deployment-config.json
   ```

2. Install frontend dependencies (if not done):
   ```powershell
   cd frontend
   npm install
   ```

## Step 7: Start Frontend

```powershell
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the trading interface.

## Integration Architecture

### Contract Interaction Flow

1. **Frontend** → GraphQL Client → **Linera GraphQL Service** → **Smart Contracts**

2. **Query Flow** (Read Operations):
   - Frontend calls `OrderBookClient.getOrderBook()`
   - GraphQL client sends query to Linera service
   - Service queries contract view
   - Response returned to frontend

3. **Mutation Flow** (Write Operations):
   - Frontend calls `OrderBookClient.placeOrder()`
   - GraphQL client sends mutation to Linera service
   - Service executes operation on chain
   - Transaction hash returned
   - Frontend polls for confirmation

### Key Components

- **`frontend/lib/graphql/client.ts`**: GraphQL client for Linera API
- **`frontend/lib/contracts/orderbook.ts`**: OrderBook contract client
- **`frontend/lib/contracts/config.ts`**: Configuration management
- **`frontend/hooks/useOrderBook.ts`**: React hook for contract interactions

## Testing the Integration

1. **Check GraphQL endpoint:**
   ```powershell
   curl http://localhost:8080/graphql -Method POST -Body '{"query":"{ health }"}' -ContentType "application/json"
   ```

2. **Query market stats:**
   Use the GraphQL playground or:
   ```powershell
   $query = @{
     query = "query { application(appId: `"YOUR_APP_ID`") { view { marketStats { lastPrice } } } }"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "http://localhost:8080/graphql" -Method POST -Body $query -ContentType "application/json"
   ```

3. **Place a test order:**
   - Open the frontend at http://localhost:3000/trade
   - Connect wallet
   - Select BTC/USDT market
   - Place a limit order
   - Check order book updates

## Troubleshooting

### Contracts won't build
- Ensure `wasm32-unknown-unknown` target is installed: `rustup target add wasm32-unknown-unknown`
- Check Rust version: `rustup show`
- Try `cargo clean` and rebuild

### Network connection issues
- Verify Linera service is running: `linera service --port 8080`
- Check firewall settings
- Verify GraphQL endpoint: `curl http://localhost:8080/graphql`

### Wallet connection issues
- Ensure wallet is initialized: `linera wallet show`
- Check wallet has funds: `linera query-balance <chain-id>`
- Verify chain IDs match deployment configuration

### Frontend can't connect
- Check browser console for errors
- Verify `deployment-config.json` is in `frontend/public/`
- Check environment variables are set correctly
- Verify GraphQL URL is accessible

## Next Steps

1. Set up indexer service for historical data
2. Implement relayer for cross-chain messages
3. Add monitoring and analytics
4. Deploy to testnet/mainnet (when available)

## Production Deployment

For production:

1. Update environment variables to use production endpoints
2. Use secure wallet configuration
3. Enable rate limiting and authentication
4. Set up monitoring and alerts
5. Configure CORS properly

---

**Note**: This integration uses Linera's GraphQL API. The actual GraphQL schema may differ based on Linera SDK version. Adjust queries as needed based on your Linera setup.













