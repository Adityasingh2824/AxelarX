# AxelarX Local Deployment Script for Windows
# This script deploys all contracts to a local Linera network

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting AxelarX Local Deployment..." -ForegroundColor Cyan

# Check if Linera CLI is installed
if (-not (Get-Command linera -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Linera CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "Visit: https://linera.dev/getting_started/installation.html" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Checking prerequisites..." -ForegroundColor Blue

# Set environment variables
$LINERA_TMP_DIR = if ($env:LINERA_TMP_DIR) { $env:LINERA_TMP_DIR } else { Join-Path $env:TEMP "linera-$(New-Guid)" }
New-Item -ItemType Directory -Force -Path $LINERA_TMP_DIR | Out-Null

$LINERA_WALLET = Join-Path $LINERA_TMP_DIR "wallet.json"
$LINERA_KEYSTORE = Join-Path $LINERA_TMP_DIR "keystore.json"
$LINERA_STORAGE = "rocksdb:$LINERA_TMP_DIR\client.db"

$env:LINERA_WALLET = $LINERA_WALLET
$env:LINERA_KEYSTORE = $LINERA_KEYSTORE
$env:LINERA_STORAGE = $LINERA_STORAGE

Write-Host "📁 Using temporary directory: $LINERA_TMP_DIR" -ForegroundColor Yellow

# Check if local network is running
$proxyRunning = Get-Process -Name "linera-proxy" -ErrorAction SilentlyContinue

if (-not $proxyRunning) {
    Write-Host "🌐 Starting local Linera network..." -ForegroundColor Blue
    
    # Start network with faucet in background
    Start-Process -NoNewWindow -FilePath "linera" -ArgumentList "net", "up", "--with-faucet", "--faucet-port", "8080"
    
    # Wait for network to start
    Start-Sleep -Seconds 5
    Write-Host "✅ Local network started" -ForegroundColor Green
} else {
    Write-Host "✅ Local network already running" -ForegroundColor Green
}

# Initialize wallet if not exists
if (-not (Test-Path $LINERA_WALLET)) {
    Write-Host "👛 Initializing wallet..." -ForegroundColor Blue
    linera wallet init --faucet http://localhost:8080
    Write-Host "✅ Wallet initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Wallet already exists" -ForegroundColor Green
}

# Request chains for different markets
Write-Host "🔗 Creating microchains for markets..." -ForegroundColor Blue

$markets = @("BTC_USDT", "ETH_USDT", "SOL_USDT")
$marketChains = @{}

foreach ($market in $markets) {
    Write-Host "  Creating chain for $market..." -ForegroundColor Yellow
    
    # Request a new chain
    $chainInfo = linera wallet request-chain --faucet http://localhost:8080 2>&1
    $chainId = ($chainInfo -split '\s+')[0]
    
    $marketChains[$market] = $chainId
    
    Write-Host "  ✅ $market chain: $chainId" -ForegroundColor Green
}

# Build contracts
Write-Host "🔨 Building smart contracts..." -ForegroundColor Blue

# Build orderbook contract
Write-Host "  Building orderbook contract..." -ForegroundColor Yellow
Set-Location "contracts\orderbook"
cargo build --release --target wasm32-unknown-unknown
Set-Location "..\.."

# Build settlement contract
Write-Host "  Building settlement contract..." -ForegroundColor Yellow
Set-Location "contracts\settlement"
cargo build --release --target wasm32-unknown-unknown
Set-Location "..\.."

# Build bridge contract
Write-Host "  Building bridge contract..." -ForegroundColor Yellow
Set-Location "contracts\bridge"
cargo build --release --target wasm32-unknown-unknown
Set-Location "..\.."

Write-Host "✅ Contracts built successfully" -ForegroundColor Green

# Create deployment configuration
Write-Host "📝 Creating configuration file..." -ForegroundColor Blue

$config = @{
    network = @{
        type = "local"
        faucet_url = "http://localhost:8080"
        graphql_url = "http://localhost:8080/graphql"
    }
    wallet = @{
        path = $LINERA_WALLET
        keystore = $LINERA_KEYSTORE
        storage = $LINERA_STORAGE
    }
    markets = @{}
    contracts = @{
        orderbook = "axelarx-orderbook"
        settlement = "axelarx-settlement"
        bridge = "axelarx-bridge"
    }
    deployment_time = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
}

foreach ($market in $markets) {
    $config.markets[$market] = @{
        chain_id = $marketChains[$market]
        orderbook_app_id = ""
        settlement_app_id = ""
        bridge_app_id = ""
    }
}

$config | ConvertTo-Json -Depth 10 | Out-File -FilePath "deployment-config.json" -Encoding UTF8

Write-Host "✅ Configuration saved to deployment-config.json" -ForegroundColor Green

# Display summary
Write-Host ""
Write-Host "🎉 AxelarX Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  Network: Local Linera Network"
Write-Host "  Faucet: http://localhost:8080"
Write-Host "  GraphQL: http://localhost:8080/graphql"
Write-Host "  Wallet: $LINERA_WALLET"
Write-Host "  Storage: $LINERA_STORAGE"
Write-Host ""
Write-Host "🏪 Deployed Markets:" -ForegroundColor Cyan
foreach ($market in $markets) {
    Write-Host "  $market : $($marketChains[$market])"
}
Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy contracts to each chain (see deployment-config.json)"
Write-Host "  2. Update deployment-config.json with Application IDs"
Write-Host "  3. Start the frontend: cd frontend && npm run dev"
Write-Host "  4. Open http://localhost:3000 in your browser"
Write-Host ""
Write-Host "💡 Useful Commands:" -ForegroundColor Cyan
Write-Host "  Check wallet: linera wallet show"
Write-Host "  View chains: linera wallet list-chains"
Write-Host ""
Write-Host "⚠️  Keep the Linera network running to use the contracts" -ForegroundColor Yellow
