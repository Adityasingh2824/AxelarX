# ⚡ Deploy AxelarX - Quick Start

## 🎯 Goal
Deploy smart contracts and integrate with frontend for on-chain trading.

## ⚠️ Prerequisites Required

You **MUST** install these before deployment:

### 1. Rust (Required)
```powershell
winget install Rustlang.Rustup
```
Then restart terminal and run:
```powershell
rustup target add wasm32-unknown-unknown
```

### 2. Linera CLI (Required)
Visit: https://linera.dev/getting_started/installation.html

Or if you have Rust:
```powershell
cargo install linera-service --git https://github.com/linera-io/linera-protocol.git
```

## 🚀 Deployment (Once Prerequisites Installed)

### Quick Deploy:
```powershell
.\scripts\deploy-full.ps1
```

### Or Step-by-Step:

1. **Build Contracts:**
   ```powershell
   .\scripts\build-contracts.ps1
   ```

2. **Start Linera Network** (Terminal 1):
   ```powershell
   linera net up --with-faucet --faucet-port 8080
   ```

3. **Initialize Wallet** (Terminal 2):
   ```powershell
   linera wallet init --faucet http://localhost:8080
   ```

4. **Deploy Contracts:**
   ```powershell
   .\scripts\deploy-local.ps1
   ```

5. **Configure Frontend:**
   - Edit `frontend\.env.local` with contract IDs from deployment

6. **Start Services:**
   ```powershell
   # Terminal 3: GraphQL
   linera service --port 8080
   
   # Terminal 4: Frontend
   cd frontend
   npm run dev
   ```

7. **Test:**
   - Visit: http://localhost:3000

## ✅ What's Ready

- ✅ All smart contracts implemented
- ✅ Frontend integration complete
- ✅ Deployment scripts created
- ✅ Configuration files ready

## 🧪 Test Frontend Now (Mock Data)

You can test the UI immediately without contracts:

```powershell
cd frontend
npm run dev
```

Visit http://localhost:3000 - works with mock data until contracts are deployed.

## 📚 Documentation

- `DEPLOYMENT_STATUS.md` - Current status
- `CHECKLIST.md` - Detailed checklist  
- `DEPLOYMENT_GUIDE.md` - Full guide
- `AUTO_DEPLOY.md` - Automated deployment

---

**Status:** All code ready. Install prerequisites to deploy.













