# AxelarX Deployment Guide

This guide will help you deploy the AxelarX smart contracts to a Linera network and integrate them with the frontend.

## Prerequisites

1. **Rust Toolchain** (1.70+)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup toolchain install stable
   rustup default stable
   ```

2. **Linera CLI**
   - Install from: https://linera.dev/getting_started/installation.html
   - Verify: `linera --version`

3. **WASM Target**
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

4. **Node.js** (18+)
   ```bash
   node --version
   ```

## Quick Start (Local Development)

### Step 1: Build Contracts

```bash
# Build all contracts
cd contracts/orderbook
cargo build --release --target wasm32-unknown-unknown
cd ../settlement
cargo build --release --target wasm32-unknown-unknown
cd ../bridge
cargo build --release --target wasm32-unknown-unknown
cd ../..
```

The compiled WASM files will be at:
- `contracts/orderbook/target/wasm32-unknown-unknown/release/axelarx_orderbook.wasm`
- `contracts/orderbook/target/wasm32-unknown-unknown/release/axelarx_orderbook_service.wasm`
- Similar for settlement and bridge contracts

### Step 2: Start Local Linera Network

**Windows (PowerShell):**
```powershell
# Start local network with faucet
linera net up --with-faucet --faucet-port 8080

# In a separate terminal, initialize wallet
linera wallet init --faucet http://localhost:8080
```

**Linux/Mac:**
```bash
# Use the deployment script
chmod +x scripts/deploy-local.sh
./scripts/deploy-local.sh
```

### Step 3: Deploy Contracts

For each market (BTC/USDT, ETH/USDT, etc.), you need to:

1. Create a new microchain:
```bash
linera wallet request-chain --faucet http://localhost:8080
```

2. Deploy orderbook contract:
```bash
linera publish-and-create \
  target/wasm32-unknown-unknown/release/axelarx_orderbook.wasm \
  target/wasm32-unknown-unknown/release/axelarx_orderbook_service.wasm \
  --chain <CHAIN_ID> \
  --json-argument '{}'
```

3. Deploy settlement contract:
```bash
linera publish-and-create \
  target/wasm32-unknown-unknown/release/axelarx_settlement.wasm \
  target/wasm32-unknown-unknown/release/axelarx_settlement_service.wasm \
  --chain <CHAIN_ID> \
  --json-argument '{}'
```

4. Save the Application IDs for frontend configuration

### Step 4: Start GraphQL Service

```bash
# Start Linera GraphQL service
linera service --port 8080
```

This will expose a GraphQL endpoint at `http://localhost:8080/graphql`

### Step 5: Configure Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_LINERA_NETWORK_URL=http://localhost:8080
NEXT_PUBLIC_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
NEXT_PUBLIC_LINERA_FAUCET_URL=http://localhost:8080

# Market configurations (replace with your deployed app IDs)
NEXT_PUBLIC_BTC_USDT_CHAIN_ID=<chain-id>
NEXT_PUBLIC_BTC_USDT_ORDERBOOK_APP_ID=<app-id>
NEXT_PUBLIC_BTC_USDT_SETTLEMENT_APP_ID=<app-id>
```

### Step 6: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the trading interface.

## Contract Interaction

### GraphQL Queries

The Linera service exposes a GraphQL API. Example queries:

**Get Market Data:**
```graphql
query {
  application(appId: "<orderbook-app-id>") {
    view {
      marketStats {
        lastPrice
        bestBid
        bestAsk
        volume24h
      }
    }
  }
}
```

**Get Order Book:**
```graphql
query {
  application(appId: "<orderbook-app-id>") {
    view {
      orderBook {
        bids {
          price
          size
        }
        asks {
          price
          size
        }
      }
    }
  }
}
```

### Contract Operations

Operations are sent as transactions:

```bash
linera service --port 8080 &

# Place order (example)
linera service --port 8080 \
  execute-operation \
  --application-id <orderbook-app-id> \
  --operation '{
    "PlaceOrder": {
      "side": "Buy",
      "order_type": "Limit",
      "price": 4500000000000,
      "quantity": 100000000,
      "time_in_force": "GTC"
    }
  }'
```

## Production Deployment

For production deployment to Linera mainnet (when available):

1. Update environment variables to use mainnet endpoints
2. Deploy contracts using the same process
3. Use production wallet configuration
4. Enable security features (rate limiting, authentication)
5. Set up monitoring and alerts

## Troubleshooting

### Contracts won't build
- Ensure `wasm32-unknown-unknown` target is installed
- Check Rust version: `rustup show`
- Try `cargo clean` and rebuild

### Network connection issues
- Verify Linera service is running: `linera service --port 8080`
- Check firewall settings
- Verify GraphQL endpoint is accessible

### Wallet connection issues
- Ensure wallet is initialized: `linera wallet show`
- Check wallet has funds: `linera query-balance <chain-id>`
- Verify chain IDs match deployment configuration

## Architecture Notes

- Each market runs on its own microchain for isolation
- Order book and settlement contracts are deployed to the same chain
- Cross-chain communication happens via Linera messages
- Frontend connects via GraphQL API to Linera service
- Real-time updates use GraphQL subscriptions

## Next Steps

1. Set up indexer service for historical data
2. Implement relayer for cross-chain messages
3. Add monitoring and analytics
4. Deploy to testnet/mainnet

