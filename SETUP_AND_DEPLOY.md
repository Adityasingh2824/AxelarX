# Complete Setup and Deployment Guide

## Step 1: Install Rust (Required for building contracts)

### On Windows:

**Option A: Using rustup-init (Recommended)**
1. Download rustup-init from: https://rustup.rs/
2. Run the installer and follow the prompts
3. Or use winget:
   ```powershell
   winget install Rustlang.Rustup
   ```

**Option B: Using Chocolatey**
```powershell
choco install rust
```

After installation, open a NEW PowerShell window and verify:
```powershell
rustc --version
rustup --version
cargo --version
```

### Install WASM target:
```powershell
rustup target add wasm32-unknown-unknown
```

## Step 2: Install Linera CLI

Visit: https://linera.dev/getting_started/installation.html

For Windows, you'll typically need to:
1. Install from the official source
2. Or build from source (requires Rust)

After installation, verify:
```powershell
linera --version
```

## Step 3: Build Contracts

Once Rust and WASM target are installed:

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

## Step 4: Start Linera Network

Open a new PowerShell terminal:

```powershell
# Start Linera network with faucet
linera net up --with-faucet --faucet-port 8080
```

Keep this terminal open. In another terminal:

```powershell
# Initialize wallet
linera wallet init --faucet http://localhost:8080
```

## Step 5: Deploy Contracts

You can either:

**Option A: Use the PowerShell script**
```powershell
.\scripts\deploy-local.ps1
```

**Option B: Deploy manually** (see detailed steps in DEPLOYMENT_GUIDE.md)

After deployment, note down:
- Chain IDs for each market
- Application IDs for OrderBook contracts
- Application IDs for Settlement contracts

## Step 6: Configure Frontend

Update `frontend/.env.local` with your deployment information (see the file we'll create below).

## Step 7: Start Services

**Terminal 1: Linera GraphQL Service**
```powershell
linera service --port 8080
```

**Terminal 2: Frontend Development Server**
```powershell
cd frontend
npm install
npm run dev
```

## Step 8: Test

Open http://localhost:3000 in your browser and test the trading interface.

---

## Troubleshooting

### Rust not found after installation
- Close and reopen your PowerShell terminal
- Verify PATH includes Rust: `$env:PATH`
- Restart your computer if needed

### Contracts won't build
- Ensure WASM target is installed: `rustup target add wasm32-unknown-unknown`
- Check Rust version: `rustc --version` (should be 1.70+)
- Try: `cargo clean` then rebuild

### Linera CLI not found
- Check installation instructions for your platform
- Verify it's in your PATH
- May need to restart terminal/computer

### Port 8080 already in use
- Stop any services using port 8080
- Or change the port in deployment commands and configuration

---

**Next: Once Rust and Linera are installed, run the build and deployment steps above.**

