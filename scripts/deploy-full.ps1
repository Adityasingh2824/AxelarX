# Complete Deployment Script
# This script attempts to install prerequisites and deploy everything

$ErrorActionPreference = "Continue"

Write-Host "🚀 AxelarX Complete Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check and install Rust
Write-Host "Step 1: Checking Rust installation..." -ForegroundColor Yellow
$rustInstalled = $false

try {
    $null = rustc --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Rust is installed" -ForegroundColor Green
        $rustInstalled = $true
    }
} catch {
    Write-Host "❌ Rust is not installed" -ForegroundColor Red
    Write-Host "Attempting to install Rust..." -ForegroundColor Yellow
    
    try {
        winget install Rustlang.Rustup --accept-package-agreements --accept-source-agreements
        Write-Host "⚠️  Rust installation initiated. Please RESTART your terminal and run this script again." -ForegroundColor Yellow
        exit 1
    } catch {
        Write-Host "❌ Could not install Rust automatically" -ForegroundColor Red
        Write-Host "Please install Rust manually from: https://rustup.rs/" -ForegroundColor Yellow
        exit 1
    }
}

if ($rustInstalled) {
    # Check WASM target
    try {
        $wasmTarget = rustup target list --installed 2>&1 | Select-String "wasm32-unknown-unknown"
        if (-not $wasmTarget) {
            Write-Host "Installing WASM target..." -ForegroundColor Yellow
            rustup target add wasm32-unknown-unknown
        } else {
            Write-Host "✅ WASM target is installed" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Could not verify WASM target" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 2: Check Linera CLI
Write-Host "Step 2: Checking Linera CLI installation..." -ForegroundColor Yellow
$lineraInstalled = $false

try {
    $null = linera --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Linera CLI is installed" -ForegroundColor Green
        $lineraInstalled = $true
    }
} catch {
    Write-Host "❌ Linera CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Linera CLI must be installed manually:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://linera.dev/getting_started/installation.html" -ForegroundColor White
    Write-Host "2. Or install from source: cargo install linera-service --git https://github.com/linera-io/linera-protocol.git" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Cannot proceed without Linera CLI. Please install it and run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 3: Build contracts
Write-Host "Step 3: Building smart contracts..." -ForegroundColor Yellow
if (Test-Path "scripts\build-contracts.ps1") {
    & "scripts\build-contracts.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Contract build failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Build script not found. Building manually..." -ForegroundColor Yellow
    
    $contracts = @("orderbook", "settlement", "bridge")
    foreach ($contract in $contracts) {
        $path = "contracts\$contract"
        if (Test-Path $path) {
            Write-Host "Building $contract..." -ForegroundColor Gray
            Push-Location $path
            cargo build --release --target wasm32-unknown-unknown
            Pop-Location
        }
    }
}

Write-Host ""

# Step 4: Start Linera network (informational)
Write-Host "Step 4: Linera Network Setup" -ForegroundColor Yellow
Write-Host "⚠️  You need to start the Linera network manually in a separate terminal:" -ForegroundColor Yellow
Write-Host "   linera net up --with-faucet --faucet-port 8080" -ForegroundColor White
Write-Host ""
Write-Host "   Then in another terminal:" -ForegroundColor Yellow
Write-Host "   linera wallet init --faucet http://localhost:8080" -ForegroundColor White
Write-Host ""
$continue = Read-Host "Have you started the Linera network? (y/n)"
if ($continue -ne 'y' -and $continue -ne 'Y') {
    Write-Host "Please start the Linera network and run this script again." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Step 5: Deploy contracts
Write-Host "Step 5: Deploying contracts..." -ForegroundColor Yellow
if (Test-Path "scripts\deploy-local.ps1") {
    Write-Host "Running deployment script..." -ForegroundColor Gray
    & "scripts\deploy-local.ps1"
} else {
    Write-Host "⚠️  Deployment script not found" -ForegroundColor Yellow
    Write-Host "Please deploy contracts manually (see DEPLOYMENT_GUIDE.md)" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Configure frontend
Write-Host "Step 6: Configuring frontend..." -ForegroundColor Yellow
if (-not (Test-Path "frontend\.env.local")) {
    if (Test-Path "frontend\env.local.example") {
        Copy-Item "frontend\env.local.example" "frontend\.env.local"
        Write-Host "✅ Created .env.local file" -ForegroundColor Green
        Write-Host "⚠️  Please edit frontend\.env.local with your contract IDs" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ .env.local file exists" -ForegroundColor Green
}

Write-Host ""

# Step 7: Start services (informational)
Write-Host "Step 7: Starting Services" -ForegroundColor Yellow
Write-Host "⚠️  Start services manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 (GraphQL):" -ForegroundColor Cyan
Write-Host "   linera service --port 8080" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit frontend\.env.local with your contract IDs" -ForegroundColor White
Write-Host "2. Start Linera GraphQL service" -ForegroundColor White
Write-Host "3. Start frontend development server" -ForegroundColor White
Write-Host "4. Visit http://localhost:3000" -ForegroundColor White




