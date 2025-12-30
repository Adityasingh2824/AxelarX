# 🚀 Deploy AxelarX Now - Step by Step

Since Rust and Linera CLI are not currently installed, here's what we need to do:

## Current Status ✅
- ✅ Integration code complete
- ✅ Frontend ready
- ✅ Deployment scripts created
- ❌ Rust not installed
- ❌ Linera CLI not installed

## Installation Steps

### 1. Install Rust (Required)

**Option A: Using Windows Package Manager (Recommended)**
```powershell
winget install Rustlang.Rustup
```

**Option B: Manual Installation**
1. Visit: https://rustup.rs/
2. Download and run `rustup-init.exe`
3. Follow the installer prompts

**After installation:**
```powershell
# Restart your terminal, then verify:
rustc --version

# Add WASM compilation target:
rustup target add wasm32-unknown-unknown
```

### 2. Install Linera CLI (Required)

Linera CLI installation varies by platform. For Windows:

**Option A: Install from Source (Requires Rust)**
```powershell
cargo install linera-service --git https://github.com/linera-io/linera-protocol.git
```

**Option B: Follow Official Guide**
1. Visit: https://linera.dev/getting_started/installation.html
2. Follow the Windows-specific instructions
3. This may require WSL (Windows Subsystem for Linux) in some cases

**Verify installation:**
```powershell
linera --version
```

### 3. Build Contracts

Once Rust is installed, run:
```powershell
.\scripts\build-contracts.ps1
```

This will build:
- OrderBook contract
- Settlement contract  
- Bridge contract

### 4. Start Linera Network

```powershell
# Terminal 1: Start network
linera net up --with-faucet --faucet-port 8080

# Terminal 2: Initialize wallet
linera wallet init --faucet http://localhost:8080
```

### 5. Deploy Contracts

```powershell
.\scripts\deploy-local.ps1
```

This will:
- Create microchains for each market
- Deploy all contracts
- Generate configuration file

### 6. Configure Frontend

The deployment script will create a `deployment-config.json` file. Copy the values to:

```powershell
# Copy template
Copy-Item frontend\env.local.example frontend\.env.local

# Edit frontend\.env.local with your contract IDs
```

### 7. Start Services

```powershell
# Terminal 3: GraphQL Service
linera service --port 8080

# Terminal 4: Frontend
cd frontend
npm install
npm run dev
```

### 8. Access Application

Open: http://localhost:3000

## Alternative: Development Mode (Without Contracts)

If you want to test the frontend UI without deploying contracts:

```powershell
cd frontend
npm install
npm run dev
```

The frontend will use mock data automatically.

## Scripts Available

- `scripts/setup-prerequisites.ps1` - Helps install Rust and Linera CLI
- `scripts/build-contracts.ps1` - Builds all contracts
- `scripts/deploy-local.ps1` - Deploys contracts to local network

## Need Help?

- See `DEPLOYMENT_GUIDE.md` for detailed instructions
- See `QUICK_START.md` for quick reference
- See `INTEGRATION_STATUS.md` for current status

---

**Next Action:** Install Rust first, then proceed with the steps above.




