# Build Smart Contracts Script
# Builds all contracts to WASM format

$ErrorActionPreference = "Stop"

Write-Host "🔨 Building AxelarX Smart Contracts..." -ForegroundColor Cyan
Write-Host ""

# Check if Rust is installed
try {
    $rustVersion = rustc --version
    Write-Host "✅ Rust detected: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust is not installed. Please install Rust first." -ForegroundColor Red
    Write-Host "   Run: .\scripts\setup-prerequisites.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if WASM target is installed
try {
    $wasmTarget = rustup target list --installed | Select-String "wasm32-unknown-unknown"
    if (-not $wasmTarget) {
        Write-Host "⚠️  WASM target not installed. Installing..." -ForegroundColor Yellow
        rustup target add wasm32-unknown-unknown
    } else {
        Write-Host "✅ WASM target is installed" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not verify WASM target. Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

$contracts = @(
    @{ Name = "OrderBook"; Path = "contracts\orderbook" },
    @{ Name = "Settlement"; Path = "contracts\settlement" },
    @{ Name = "Bridge"; Path = "contracts\bridge" }
)

$successCount = 0
$failCount = 0

foreach ($contract in $contracts) {
    Write-Host "Building $($contract.Name) contract..." -ForegroundColor Yellow
    
    if (-not (Test-Path $contract.Path)) {
        Write-Host "  ❌ Contract directory not found: $($contract.Path)" -ForegroundColor Red
        $failCount++
        continue
    }
    
    try {
        Push-Location $contract.Path
        
        # Clean previous builds
        Write-Host "  🧹 Cleaning previous builds..." -ForegroundColor Gray
        cargo clean 2>&1 | Out-Null
        
        # Build contract
        Write-Host "  🔨 Building contract (this may take a few minutes)..." -ForegroundColor Gray
        cargo build --release --target wasm32-unknown-unknown
        
        if ($LASTEXITCODE -eq 0) {
            $wasmPath = "target\wasm32-unknown-unknown\release"
            $contractWasm = "axelarx-$($contract.Name.ToLower()).wasm"
            $serviceWasm = "axelarx-$($contract.Name.ToLower())_service.wasm"
            
            if ((Test-Path "$wasmPath\$contractWasm") -and (Test-Path "$wasmPath\$serviceWasm")) {
                Write-Host "  ✅ $($contract.Name) contract built successfully!" -ForegroundColor Green
                Write-Host "     Contract: $wasmPath\$contractWasm" -ForegroundColor Gray
                Write-Host "     Service: $wasmPath\$serviceWasm" -ForegroundColor Gray
                $successCount++
            } else {
                Write-Host "  ⚠️  Build completed but WASM files not found" -ForegroundColor Yellow
                $failCount++
            }
        } else {
            Write-Host "  ❌ Build failed" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  ❌ Error building contract: $_" -ForegroundColor Red
        $failCount++
    } finally {
        Pop-Location
    }
    
    Write-Host ""
}

Write-Host "📊 Build Summary:" -ForegroundColor Cyan
Write-Host "   Successful: $successCount" -ForegroundColor Green
Write-Host "   Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })

if ($successCount -eq $contracts.Count) {
    Write-Host ""
    Write-Host "🎉 All contracts built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Ensure Linera network is running: linera net up --with-faucet --faucet-port 8080" -ForegroundColor White
    Write-Host "  2. Deploy contracts: .\scripts\deploy-local.ps1" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Some contracts failed to build. Please check the errors above." -ForegroundColor Yellow
}













