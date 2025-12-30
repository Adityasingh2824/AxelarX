# 🚀 Automated Deployment Instructions

I've created scripts to help automate the deployment process. However, **Rust and Linera CLI must be installed first** as they are system-level dependencies.

## Quick Deploy (Once Prerequisites are Installed)

### Option 1: Run Full Deployment Script

```powershell
.\scripts\deploy-full.ps1
```

This script will:
- ✅ Check for Rust and try to install it
- ✅ Check for Linera CLI
- ✅ Build all contracts
- ✅ Guide you through deployment
- ✅ Configure frontend

### Option 2: Step-by-Step Manual

#### 1. Install Prerequisites

**Install Rust:**
```powershell
winget install Rustlang.Rustup
```
Restart terminal, then:
```powershell
rustup target add wasm32-unknown-unknown
```

**Install Linera CLI:**
Visit: https://linera.dev/getting_started/installation.html

#### 2. Build Contracts

```powershell
.\scripts\build-contracts.ps1
```

#### 3. Start Linera Network

Terminal 1:
```powershell
linera net up --with-faucet --faucet-port 8080
```

Terminal 2:
```powershell
linera wallet init --faucet http://localhost:8080
```

#### 4. Deploy Contracts

```powershell
.\scripts\deploy-local.ps1
```

#### 5. Configure Frontend

The deployment script creates `deployment-config.json`. Update `frontend\.env.local`:

```env
NEXT_PUBLIC_LINERA_GRAPHQL_URL=http://localhost:8080/graphql
NEXT_PUBLIC_BTC_USDT_CHAIN_ID=<from deployment-config.json>
NEXT_PUBLIC_BTC_USDT_ORDERBOOK_APP_ID=<from deployment-config.json>
```

#### 6. Start Services

Terminal 3 (GraphQL):
```powershell
linera service --port 8080
```

Terminal 4 (Frontend):
```powershell
cd frontend
npm run dev
```

## Current Status

- ✅ **All code ready**: Smart contracts, frontend integration, deployment scripts
- ❌ **Prerequisites needed**: Rust and Linera CLI must be installed manually

## What I've Prepared

1. ✅ Complete smart contract implementations
2. ✅ Full frontend integration layer
3. ✅ Deployment scripts:
   - `scripts/build-contracts.ps1`
   - `scripts/deploy-local.ps1`
   - `scripts/deploy-full.ps1`
   - `scripts/setup-prerequisites.ps1`
4. ✅ Configuration templates
5. ✅ Documentation

## Test Frontend Now (Without Contracts)

The frontend works with mock data. You can test it right now:

```powershell
cd frontend
npm install  # If not already done
npm run dev
```

Visit http://localhost:3000 - it will use mock data until contracts are deployed.

## Need Help?

- See `DEPLOYMENT_STATUS.md` for current status
- See `CHECKLIST.md` for detailed checklist
- See `DEPLOYMENT_GUIDE.md` for comprehensive guide

---

**Action Required:** Install Rust and Linera CLI, then run `.\scripts\deploy-full.ps1`




