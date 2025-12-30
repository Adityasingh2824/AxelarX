# ✅ AxelarX Deployment Checklist

## Prerequisites Installation

- [ ] **Install Rust**
  ```powershell
  winget install Rustlang.Rustup
  ```
  Or visit: https://rustup.rs/
  
  After installation, restart terminal and verify:
  ```powershell
  rustc --version
  rustup target add wasm32-unknown-unknown
  ```

- [ ] **Install Linera CLI**
  Visit: https://linera.dev/getting_started/installation.html
  
  For Windows with Rust installed:
  ```powershell
  cargo install linera-service --git https://github.com/linera-io/linera-protocol.git
  ```
  
  Verify:
  ```powershell
  linera --version
  ```

## Contract Building

- [ ] **Build OrderBook Contract**
  ```powershell
  cd contracts\orderbook
  cargo build --release --target wasm32-unknown-unknown
  cd ..\..
  ```
  
  Verify files exist:
  - `target\wasm32-unknown-unknown\release\axelarx_orderbook.wasm`
  - `target\wasm32-unknown-unknown\release\axelarx_orderbook_service.wasm`

- [ ] **Build Settlement Contract**
  ```powershell
  cd contracts\settlement
  cargo build --release --target wasm32-unknown-unknown
  cd ..\..
  ```
  
  Verify files exist:
  - `target\wasm32-unknown-unknown\release\axelarx_settlement.wasm`
  - `target\wasm32-unknown-unknown\release\axelarx_settlement_service.wasm`

- [ ] **Build Bridge Contract**
  ```powershell
  cd contracts\bridge
  cargo build --release --target wasm32-unknown-unknown
  cd ..\..
  ```
  
  Verify files exist:
  - `target\wasm32-unknown-unknown\release\axelarx_bridge.wasm`
  - `target\wasm32-unknown-unknown\release\axelarx_bridge_service.wasm`

## Network Setup

- [ ] **Start Linera Network** (Terminal 1)
  ```powershell
  linera net up --with-faucet --faucet-port 8080
  ```
  Keep this terminal running.

- [ ] **Initialize Wallet** (Terminal 2)
  ```powershell
  linera wallet init --faucet http://localhost:8080
  ```
  
  Verify:
  ```powershell
  linera wallet show
  ```

## Contract Deployment

- [ ] **Create Microchains**
  ```powershell
  # For BTC/USDT market
  linera wallet request-chain --faucet http://localhost:8080
  # Save the chain ID
  ```
  
  Repeat for ETH/USDT and SOL/USDT markets.

- [ ] **Deploy OrderBook Contract**
  ```powershell
  linera publish-and-create `
    target\wasm32-unknown-unknown\release\axelarx_orderbook.wasm `
    target\wasm32-unknown-unknown\release\axelarx_orderbook_service.wasm `
    --chain <CHAIN_ID> `
    --json-argument '{}'
  ```
  Save the Application ID.

- [ ] **Deploy Settlement Contract**
  ```powershell
  linera publish-and-create `
    target\wasm32-unknown-unknown\release\axelarx_settlement.wasm `
    target\wasm32-unknown-unknown\release\axelarx_settlement_service.wasm `
    --chain <CHAIN_ID> `
    --json-argument '{}'
  ```
  Save the Application ID.

- [ ] **Deploy Bridge Contract** (Optional)
  ```powershell
  linera publish-and-create `
    target\wasm32-unknown-unknown\release\axelarx_bridge.wasm `
    target\wasm32-unknown-unknown\release\axelarx_bridge_service.wasm `
    --chain <CHAIN_ID> `
    --json-argument '{}'
  ```

## Frontend Configuration

- [ ] **Create .env.local file**
  ```powershell
  Copy-Item frontend\env.local.example frontend\.env.local
  ```

- [ ] **Configure Contract IDs**
  Edit `frontend\.env.local`:
  ```env
  NEXT_PUBLIC_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
  NEXT_PUBLIC_BTC_USDT_CHAIN_ID=<your-chain-id>
  NEXT_PUBLIC_BTC_USDT_ORDERBOOK_APP_ID=<your-app-id>
  NEXT_PUBLIC_BTC_USDT_SETTLEMENT_APP_ID=<your-app-id>
  ```
  Repeat for ETH/USDT and SOL/USDT markets.

## Start Services

- [ ] **Start GraphQL Service** (Terminal 3)
  ```powershell
  linera service --port 8080
  ```
  Keep this terminal running.
  
  Verify:
  ```powershell
  curl http://localhost:8080/graphql -Method POST -Body '{"query":"{ health }"}' -ContentType "application/json"
  ```

- [ ] **Install Frontend Dependencies** (Terminal 4)
  ```powershell
  cd frontend
  npm install
  ```

- [ ] **Start Frontend Development Server**
  ```powershell
  npm run dev
  ```

## Verification

- [ ] **Access Frontend**
  Open: http://localhost:3000
  
- [ ] **Check Console**
  Open browser DevTools (F12) and verify no errors
  
- [ ] **Test Trade Page**
  Navigate to: http://localhost:3000/trade
  
- [ ] **Verify Contract Connection**
  Check if real data is loading (not mock data)

## Troubleshooting

If something doesn't work:

1. Check all terminals are still running
2. Verify contract IDs in `.env.local`
3. Check GraphQL endpoint is accessible
4. Review browser console for errors
5. Check Linera network is running: `linera wallet show`

## Quick Commands Reference

```powershell
# Check Rust
rustc --version

# Check Linera
linera --version

# Check wallet
linera wallet show

# List chains
linera wallet list-chains

# Check balance
linera query-balance <chain-id>

# Build all contracts (if script works)
.\scripts\build-contracts.ps1

# Deploy all contracts (if script works)
.\scripts\deploy-local.ps1
```

---

**Status:** All integration code is ready. Install prerequisites to proceed.




