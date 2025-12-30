# Quick Start: Deploy AxelarX Contracts

## ⚠️ Prerequisites Installation Required

Before deploying, you need to install:

### 1. Install Rust

**Windows:**
```powershell
# Download and run rustup-init.exe from:
# https://rustup.rs/

# Or use winget:
winget install Rustlang.Rustup

# After installation, restart your terminal and verify:
rustc --version
cargo --version
```

**Then install WASM target:**
```powershell
rustup target add wasm32-unknown-unknown
```

### 2. Install Linera CLI

Visit: https://linera.dev/getting_started/installation.html

**For Windows:**
- Download the latest release from GitHub
- Extract and add to PATH
- Or use cargo: `cargo install linera-sdk --locked`

**Verify installation:**
```powershell
linera --version
```

### 3. Install Node.js (if not already installed)

```powershell
node --version
# If not installed, download from https://nodejs.org/
```

## 📦 Deployment Steps

Once prerequisites are installed, run these commands:

### Step 1: Build Contracts

```powershell
# Navigate to project root
cd "C:\Users\Aditya singh\AxelarX"

# Build OrderBook contract
cd contracts\orderbook
cargo build --release --target wasm32-unknown-unknown
cd ..\..

# Build Settlement contract
cd contracts\settlement
cargo build --release --target wasm32-unknown-unknown
cd ..\..

# Build Bridge contract
cd contracts\bridge
cargo build --release --target wasm32-unknown-unknown
cd ..\..
```

### Step 2: Start Linera Network

```powershell
# Terminal 1: Start local Linera network
linera net up --with-faucet --faucet-port 8080
```

### Step 3: Initialize Wallet

```powershell
# Terminal 2: Initialize wallet
linera wallet init --faucet http://localhost:8080
```

### Step 4: Deploy Contracts

```powershell
# Option A: Use the PowerShell script
.\scripts\deploy-local.ps1

# Option B: Manual deployment (see DEPLOYMENT_GUIDE.md for details)
```

### Step 5: Configure Frontend

After deployment, create `frontend/.env.local` with your contract IDs:

```env
NEXT_PUBLIC_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
NEXT_PUBLIC_LINERA_FAUCET_URL=http://localhost:8080

# Replace with your actual chain and app IDs from deployment
NEXT_PUBLIC_BTC_USDT_CHAIN_ID=your-chain-id-here
NEXT_PUBLIC_BTC_USDT_ORDERBOOK_APP_ID=your-app-id-here
NEXT_PUBLIC_BTC_USDT_SETTLEMENT_APP_ID=your-app-id-here
```

### Step 6: Start Services

```powershell
# Terminal 3: Start GraphQL service
linera service --port 8080

# Terminal 4: Start frontend
cd frontend
npm install
npm run dev
```

### Step 7: Test

Open http://localhost:3000 in your browser and test the trading interface!

## 🔍 Current Status

**Status:** ⚠️ Prerequisites not installed

To proceed with deployment, please install:
1. ✅ Rust toolchain (rustup)
2. ✅ Linera CLI
3. ✅ Node.js

Once installed, run the commands above to deploy the contracts.

## 📝 Notes

- Keep the Linera network running in Terminal 1 while using the contracts
- Contract Application IDs will be displayed after deployment - save them for frontend configuration
- The frontend works with mock data if contracts aren't deployed yet
- See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting

