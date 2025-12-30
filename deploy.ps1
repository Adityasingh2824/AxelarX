# AxelarX Deployment Script
# This script automates the deployment process

param(
    [switch]$SkipBuild,
    [switch]$SkipNetwork,
    [string]$Market = "BTC_USDT"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 AxelarX Deployment Script" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Blue

$missing = @()

# Check Rust
try {
    $rustVersion = cargo --version 2>&1
    Write-Host "✅ Rust installed: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust not found. Please install from https://rustup.rs/" -ForegroundColor Red
    $missing += "Rust"
}

# Check Linera CLI
try {
    $lineraVersion = linera --version 2>&1
    Write-Host "✅ Linera CLI installed: $lineraVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Linera CLI not found. Please install from https://linera.dev" -ForegroundColor Red
    $missing += "Linera CLI"
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    $missing += "Node.js"
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing prerequisites: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Please install the missing tools and try again." -ForegroundColor Yellow
    Write-Host "See SETUP_AND_DEPLOY.md for installation instructions." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ All prerequisites met!" -ForegroundColor Green
Write-Host ""

# Build contracts
if (-not $SkipBuild) {
    Write-Host "🔨 Building contracts..." -ForegroundColor Blue
    
    $contracts = @("orderbook", "settlement", "bridge")
    
    foreach ($contract in $contracts) {
        Write-Host "  Building $contract..." -ForegroundColor Yellow
        Set-Location "contracts\$contract"
        
        try {
            cargo build --release --target wasm32-unknown-unknown
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ $contract built successfully" -ForegroundColor Green
            } else {
                Write-Host "  ❌ Failed to build $contract" -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "  ❌ Error building $contract: $_" -ForegroundColor Red
            exit 1
        }
        
        Set-Location "..\.."
    }
    
    Write-Host ""
    Write-Host "✅ All contracts built!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping build (using --SkipBuild)" -ForegroundColor Yellow
    Write-Host ""
}

# Check if network is running
if (-not $SkipNetwork) {
    Write-Host "🌐 Checking Linera network..." -ForegroundColor Blue
    
    $networkRunning = $false
    try {
        $result = linera wallet show 2>&1
        if ($LASTEXITCODE -eq 0) {
            $networkRunning = $true
            Write-Host "✅ Linera network appears to be running" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Linera network not running or wallet not initialized" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To start the network:" -ForegroundColor Cyan
        Write-Host "  1. Open a new terminal" -ForegroundColor White
        Write-Host "  2. Run: linera net up --with-faucet --faucet-port 8080" -ForegroundColor White
        Write-Host "  3. In another terminal, run: linera wallet init --faucet http://localhost:8080" -ForegroundColor White
        Write-Host ""
        $response = Read-Host "Press Enter to continue anyway (you'll need to deploy manually) or Ctrl+C to exit"
    }
}

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Linera network (if not running):" -ForegroundColor White
Write-Host "   linera net up --with-faucet --faucet-port 8080" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Initialize wallet (if not done):" -ForegroundColor White
Write-Host "   linera wallet init --faucet http://localhost:8080" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Deploy contracts for each market:" -ForegroundColor White
Write-Host "   See QUICK_START.md for deployment commands" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Update frontend/.env.local with contract IDs" -ForegroundColor White
Write-Host ""
Write-Host "5. Start services:" -ForegroundColor White
Write-Host "   Terminal 1: linera service --port 8080" -ForegroundColor Gray
Write-Host "   Terminal 2: cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""

