# AxelarX Setup and Deployment Script
# This script checks prerequisites and guides you through setup and deployment

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     AxelarX Setup and Deployment Helper                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check prerequisites
Write-Host "📋 Checking Prerequisites..." -ForegroundColor Blue
Write-Host ""

$prerequisites = @{
    "Node.js" = @{
        Command = "node"
        Check = { Test-Command "node" }
        Install = "Download from https://nodejs.org/ and install"
        VersionCheck = { node --version 2>$null }
    }
    "Rust (cargo)" = @{
        Command = "cargo"
        Check = { Test-Command "cargo" }
        Install = "Run: winget install Rustlang.Rustup (or visit https://rustup.rs/)"
        VersionCheck = { cargo --version 2>$null }
    }
    "Linera CLI" = @{
        Command = "linera"
        Check = { Test-Command "linera" }
        Install = "Visit https://linera.dev/getting_started/installation.html"
        VersionCheck = { linera --version 2>$null }
    }
}

$missing = @()
$installed = @()

foreach ($prereq in $prerequisites.Keys) {
    $info = $prerequisites[$prereq]
    $isInstalled = & $info.Check
    
    if ($isInstalled) {
        $version = & $info.VersionCheck
        Write-Host "✅ $prereq " -ForegroundColor Green -NoNewline
        if ($version) {
            Write-Host "($version)" -ForegroundColor Gray
        } else {
            Write-Host "(installed)" -ForegroundColor Gray
        }
        $installed += $prereq
    } else {
        Write-Host "❌ $prereq " -ForegroundColor Red -NoNewline
        Write-Host "- NOT INSTALLED" -ForegroundColor Yellow
        Write-Host "   Install: $($info.Install)" -ForegroundColor Gray
        $missing += $prereq
    }
}

Write-Host ""

if ($missing.Count -gt 0) {
    Write-Host "⚠️  Missing Prerequisites:" -ForegroundColor Yellow
    foreach ($item in $missing) {
        Write-Host "   - $item" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please install the missing prerequisites and run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick Install Commands:" -ForegroundColor Cyan
    Write-Host ""
    
    if ($missing -contains "Rust (cargo)") {
        Write-Host "   Rust:" -ForegroundColor White
        Write-Host "   winget install Rustlang.Rustup" -ForegroundColor Gray
        Write-Host "   # Then restart terminal and run:" -ForegroundColor Gray
        Write-Host "   rustup target add wasm32-unknown-unknown" -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($missing -contains "Node.js") {
        Write-Host "   Node.js:" -ForegroundColor White
        Write-Host "   # Download from https://nodejs.org/" -ForegroundColor Gray
        Write-Host ""
    }
    
    if ($missing -contains "Linera CLI") {
        Write-Host "   Linera CLI:" -ForegroundColor White
        Write-Host "   # Visit https://linera.dev/getting_started/installation.html" -ForegroundColor Gray
        Write-Host "   # Or install via cargo (after Rust is installed):" -ForegroundColor Gray
        Write-Host "   cargo install linera-sdk --locked" -ForegroundColor Gray
        Write-Host ""
    }
    
    exit 1
}

Write-Host "✅ All prerequisites are installed!" -ForegroundColor Green
Write-Host ""

# Check WASM target for Rust
if ($installed -contains "Rust (cargo)") {
    Write-Host "🔍 Checking WASM target..." -ForegroundColor Blue
    $wasmTarget = rustup target list --installed 2>$null | Select-String "wasm32-unknown-unknown"
    
    if (-not $wasmTarget) {
        Write-Host "⚠️  WASM target not installed. Installing..." -ForegroundColor Yellow
        rustup target add wasm32-unknown-unknown
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ WASM target installed" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to install WASM target" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ WASM target is installed" -ForegroundColor Green
    }
    Write-Host ""
}

# Ask user if they want to proceed with deployment
Write-Host "📦 Ready to deploy!" -ForegroundColor Cyan
Write-Host ""
$response = Read-Host "Do you want to proceed with building and deploying contracts? (Y/N)"

if ($response -ne "Y" -and $response -ne "y") {
    Write-Host ""
    Write-Host "Deployment cancelled. Run this script again when ready." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Build contracts
Write-Host "Step 1/4: Building contracts..." -ForegroundColor Blue
Write-Host ""

$contracts = @("orderbook", "settlement", "bridge")

foreach ($contract in $contracts) {
    Write-Host "  Building $contract contract..." -ForegroundColor Yellow
    Set-Location "contracts\$contract"
    
    $buildOutput = cargo build --release --target wasm32-unknown-unknown 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $contract built successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to build $contract" -ForegroundColor Red
        Write-Host $buildOutput
        Set-Location "../.."
        exit 1
    }
    
    Set-Location "../.."
}

Write-Host ""
Write-Host "✅ All contracts built successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Check if Linera network is needed
Write-Host "Step 2/4: Checking Linera network..." -ForegroundColor Blue
Write-Host ""

$networkRunning = Get-Process -Name "linera-proxy" -ErrorAction SilentlyContinue

if (-not $networkRunning) {
    Write-Host "⚠️  Linera network is not running." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to start the Linera network in a separate terminal:" -ForegroundColor White
    Write-Host "  linera net up --with-faucet --faucet-port 8080" -ForegroundColor Gray
    Write-Host ""
    $networkResponse = Read-Host "Have you started the Linera network? (Y/N)"
    
    if ($networkResponse -ne "Y" -and $networkResponse -ne "y") {
        Write-Host ""
        Write-Host "Please start the Linera network and run the deployment script again." -ForegroundColor Yellow
        Write-Host "Or run: .\scripts\deploy-local.ps1" -ForegroundColor Cyan
        exit 0
    }
}

# Step 3: Run deployment script
Write-Host ""
Write-Host "Step 3/4: Deploying contracts..." -ForegroundColor Blue
Write-Host ""

if (Test-Path "scripts\deploy-local.ps1") {
    Write-Host "Running deployment script..." -ForegroundColor Yellow
    & ".\scripts\deploy-local.ps1"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deployment completed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Deployment script completed with warnings. Check output above." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Deployment script not found. Please deploy manually:" -ForegroundColor Yellow
    Write-Host "   See DEPLOYMENT_GUIDE.md for manual deployment steps" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 4/4: Setup frontend configuration..." -ForegroundColor Blue
Write-Host ""

if (Test-Path "deployment-config.json") {
    Write-Host "✅ Deployment configuration found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy contract IDs from deployment-config.json" -ForegroundColor White
    Write-Host "2. Create frontend/.env.local with your contract IDs" -ForegroundColor White
    Write-Host "3. Start GraphQL service: linera service --port 8080" -ForegroundColor White
    Write-Host "4. Start frontend: cd frontend && npm run dev" -ForegroundColor White
} else {
    Write-Host "⚠️  deployment-config.json not found" -ForegroundColor Yellow
    Write-Host "   You may need to configure frontend manually" -ForegroundColor Gray
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              Setup Complete!                               ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

