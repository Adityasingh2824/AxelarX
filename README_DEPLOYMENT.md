# Quick Start: Deploy & Integrate Contracts

## Prerequisites

1. Install Linera CLI: https://linera.dev/getting_started/installation.html
2. Install Rust with WASM target: `rustup target add wasm32-unknown-unknown`
3. Have Node.js 18+ installed

## Quick Deployment Steps

### 1. Build Contracts

```powershell
# From project root
cargo build --release --target wasm32-unknown-unknown
```

### 2. Start Linera Network

```powershell
# Terminal 1: Start network
linera net up --with-faucet --faucet-port 8080

# Terminal 2: Initialize wallet
linera wallet init --faucet http://localhost:8080
```

### 3. Deploy Contracts (Manual)

For each market:

```powershell
# Get a chain
$chainId = linera wallet request-chain --faucet http://localhost:8080

# Deploy OrderBook
$orderbookAppId = linera publish-and-create `
  target\wasm32-unknown-unknown\release\axelarx_orderbook.wasm `
  target\wasm32-unknown-unknown\release\axelarx_orderbook_service.wasm `
  --chain $chainId `
  --json-argument '{}'

# Deploy Settlement
$settlementAppId = linera publish-and-create `
  target\wasm32-unknown-unknown\release\axelarx_settlement.wasm `
  target\wasm32-unknown-unknown\release\axelarx_settlement_service.wasm `
  --chain $chainId `
  --json-argument '{}'
```

### 4. Configure Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
NEXT_PUBLIC_BTC_USDT_CHAIN_ID=your-chain-id
NEXT_PUBLIC_BTC_USDT_ORDERBOOK_APP_ID=your-app-id
```

### 5. Start Services

```powershell
# Terminal 3: GraphQL service
linera service --port 8080

# Terminal 4: Frontend
cd frontend
npm run dev
```

### 6. Use the Application

- Open http://localhost:3000
- Connect wallet
- Start trading!

## Important Notes

⚠️ **The contracts are ready, but you need Linera CLI installed and running to deploy them.**

⚠️ **The frontend integration code is complete and will automatically connect to deployed contracts once they're deployed.**

⚠️ **If Linera CLI is not available, the frontend will gracefully fall back to mock data for development.**

See `DEPLOYMENT_GUIDE.md` for detailed instructions.




