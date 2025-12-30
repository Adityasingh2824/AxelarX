# 🚀 AxelarX Quick Start Guide

## Step 1: Install Prerequisites

### Option A: Automated Setup (Recommended)
```powershell
.\scripts\setup-prerequisites.ps1
```

### Option B: Manual Installation

**1. Install Rust:**
```powershell
# Using winget (Windows Package Manager)
winget install Rustlang.Rustup

# Or download from: https://rustup.rs/
```

After installation, restart your terminal and verify:
```powershell
rustc --version
rustup target add wasm32-unknown-unknown
```

**2. Install Linera CLI:**

Visit the official guide: https://linera.dev/getting_started/installation.html

For Windows, you typically need to:
- Install from source (requires Rust)
- Or use WSL (Windows Subsystem for Linux)

If you have Rust installed:
```powershell
cargo install linera-service --git https://github.com/linera-io/linera-protocol.git
```

Verify installation:
```powershell
linera --version
```

## Step 2: Build Smart Contracts

```powershell
.\scripts\build-contracts.ps1
```

This will build all three contracts:
- OrderBook
- Settlement  
- Bridge

WASM files will be in:
- `contracts/orderbook/target/wasm32-unknown-unknown/release/`
- `contracts/settlement/target/wasm32-unknown-unknown/release/`
- `contracts/bridge/target/wasm32-unknown-unknown/release/`

## Step 3: Start Linera Network

Open a **new terminal** and run:
```powershell
linera net up --with-faucet --faucet-port 8080
```

Keep this terminal running. In another terminal, initialize wallet:
```powershell
linera wallet init --faucet http://localhost:8080
```

## Step 4: Deploy Contracts

```powershell
.\scripts\deploy-local.ps1
```

**OR** deploy manually:

1. **Create a microchain:**
```powershell
linera wallet request-chain --faucet http://localhost:8080
```
Save the chain ID from output.

2. **Deploy OrderBook:**
```powershell
linera publish-and-create `
  target\wasm32-unknown-unknown\release\axelarx_orderbook.wasm `
  target\wasm32-unknown-unknown\release\axelarx_orderbook_service.wasm `
  --chain <CHAIN_ID> `
  --json-argument '{}'
```
Save the Application ID.

3. **Deploy Settlement:**
```powershell
linera publish-and-create `
  target\wasm32-unknown-unknown\release\axelarx_settlement.wasm `
  target\wasm32-unknown-unknown\release\axelarx_settlement_service.wasm `
  --chain <CHAIN_ID> `
  --json-argument '{}'
```

4. **Deploy Bridge (optional):**
```powershell
linera publish-and-create `
  target\wasm32-unknown-unknown\release\axelarx_bridge.wasm `
  target\wasm32-unknown-unknown\release\axelarx_bridge_service.wasm `
  --chain <CHAIN_ID> `
  --json-argument '{}'
```

## Step 5: Configure Frontend

1. **Copy environment template:**
```powershell
Copy-Item frontend\.env.local.example frontend\.env.local
```

2. **Edit `frontend/.env.local` and add your contract IDs:**
```env
NEXT_PUBLIC_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
NEXT_PUBLIC_LINERA_FAUCET_URL=http://localhost:8080

# Replace with your actual chain ID and app IDs
NEXT_PUBLIC_BTC_USDT_CHAIN_ID=your-chain-id
NEXT_PUBLIC_BTC_USDT_ORDERBOOK_APP_ID=your-app-id
NEXT_PUBLIC_BTC_USDT_SETTLEMENT_APP_ID=your-app-id
```

## Step 6: Start GraphQL Service

In a **new terminal**:
```powershell
linera service --port 8080
```

Keep this running.

## Step 7: Start Frontend

In a **new terminal**:
```powershell
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000

## ✅ Verification

1. **Check contracts are built:**
```powershell
Test-Path "contracts\orderbook\target\wasm32-unknown-unknown\release\axelarx_orderbook.wasm"
```

2. **Check Linera network:**
```powershell
linera wallet show
```

3. **Check GraphQL endpoint:**
```powershell
curl http://localhost:8080/graphql -Method POST -Body '{"query":"{ health }"}' -ContentType "application/json"
```

## 🐛 Troubleshooting

### Rust not found
- Restart terminal after installing Rust
- Check PATH: `$env:PATH`
- Verify: `rustc --version`

### Linera CLI not found
- Follow official installation guide
- Try installing from source: `cargo install linera-service`
- Check if installed in a different location

### Contracts won't build
- Ensure WASM target: `rustup target add wasm32-unknown-unknown`
- Clean build: `cargo clean`
- Check Rust version: `rustup show`

### Network connection errors
- Ensure Linera network is running: `linera net up`
- Check firewall settings
- Verify port 8080 is not in use

### Frontend can't connect
- Verify GraphQL service is running
- Check `.env.local` has correct URLs
- Check browser console for errors

## 📚 Additional Resources

- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- Integration status: `INTEGRATION_STATUS.md`
- Project description: `PROJECT_DESCRIPTION.md`

---

**Note:** If you encounter issues, the frontend will gracefully fall back to mock data for development purposes.
