# AxelarX Prerequisites Installation Script for Windows
# This script helps install Rust and guide Linera CLI installation

Write-Host "🚀 AxelarX Prerequisites Setup" -ForegroundColor Cyan
Write-Host ""

# Check if Rust is installed
$rustInstalled = $false
try {
    $rustVersion = rustc --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Rust is already installed: $rustVersion" -ForegroundColor Green
        $rustInstalled = $true
    }
} catch {
    Write-Host "❌ Rust is not installed" -ForegroundColor Red
}

# Check if Linera CLI is installed
$lineraInstalled = $false
try {
    $lineraVersion = linera --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Linera CLI is already installed: $lineraVersion" -ForegroundColor Green
        $lineraInstalled = $true
    }
} catch {
    Write-Host "❌ Linera CLI is not installed" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Installation Steps:" -ForegroundColor Yellow
Write-Host ""

# Install Rust if needed
if (-not $rustInstalled) {
    Write-Host "1. Installing Rust..." -ForegroundColor Cyan
    Write-Host "   Please run this command in PowerShell (as Administrator):" -ForegroundColor Yellow
    Write-Host "   winget install Rustlang.Rustup" -ForegroundColor White
    Write-Host ""
    Write-Host "   Or visit: https://rustup.rs/" -ForegroundColor Gray
    Write-Host ""
    
    $installRust = Read-Host "Do you want to install Rust now? (y/n)"
    if ($installRust -eq 'y' -or $installRust -eq 'Y') {
        try {
            winget install Rustlang.Rustup
            Write-Host "✅ Rust installation initiated. Please restart your terminal after installation." -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to install Rust automatically. Please install manually from https://rustup.rs/" -ForegroundColor Red
        }
    }
} else {
    Write-Host "1. ✅ Rust is installed" -ForegroundColor Green
    
    # Check for WASM target
    try {
        $wasmTarget = rustup target list --installed | Select-String "wasm32-unknown-unknown"
        if ($wasmTarget) {
            Write-Host "   ✅ WASM target is installed" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  WASM target not installed. Installing..." -ForegroundColor Yellow
            rustup target add wasm32-unknown-unknown
            Write-Host "   ✅ WASM target installed" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Could not check WASM target. Run: rustup target add wasm32-unknown-unknown" -ForegroundColor Yellow
    }
}

Write-Host ""

# Install Linera CLI if needed
if (-not $lineraInstalled) {
    Write-Host "2. Installing Linera CLI..." -ForegroundColor Cyan
    Write-Host "   Linera CLI must be installed manually. Please follow these steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Visit: https://linera.dev/getting_started/installation.html" -ForegroundColor White
    Write-Host ""
    Write-Host "   For Windows, you may need to:" -ForegroundColor Gray
    Write-Host "   1. Install from source (requires Rust)" -ForegroundColor Gray
    Write-Host "   2. Or use WSL (Windows Subsystem for Linux)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "   If you have Rust installed, you can try:" -ForegroundColor Yellow
    Write-Host "   cargo install linera-service --git https://github.com/linera-io/linera-protocol.git" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "2. ✅ Linera CLI is installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 After installing prerequisites:" -ForegroundColor Cyan
Write-Host "   1. Restart your terminal" -ForegroundColor White
Write-Host "   2. Run: .\scripts\build-contracts.ps1" -ForegroundColor White
Write-Host "   3. Run: .\scripts\deploy-local.ps1" -ForegroundColor White
Write-Host ""
