# Install Rust Script for Windows
Write-Host "Installing Rust..." -ForegroundColor Cyan

# Check if winget is available
try {
    $wingetVersion = winget --version 2>&1
    Write-Host "✅ Windows Package Manager found" -ForegroundColor Green
    
    Write-Host "Installing Rust via winget..." -ForegroundColor Yellow
    winget install Rustlang.Rustup --accept-package-agreements --accept-source-agreements
    
    Write-Host ""
    Write-Host "✅ Rust installation initiated!" -ForegroundColor Green
    Write-Host "⚠️  Please RESTART your terminal and then run:" -ForegroundColor Yellow
    Write-Host "   rustup target add wasm32-unknown-unknown" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Could not install Rust automatically" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Rust manually:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://rustup.rs/" -ForegroundColor White
    Write-Host "2. Download and run rustup-init.exe" -ForegroundColor White
    Write-Host "3. Follow the installation prompts" -ForegroundColor White
    Write-Host "4. Restart your terminal" -ForegroundColor White
}













