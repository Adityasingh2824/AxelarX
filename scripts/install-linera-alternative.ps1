# Alternative Linera Installation Methods

Write-Host "🔍 Trying alternative Linera CLI installation methods..." -ForegroundColor Cyan
Write-Host ""

# Method 1: Try installing specific binary
Write-Host "Method 1: Installing linera binary directly..." -ForegroundColor Yellow
try {
    cargo install --git https://github.com/linera-io/linera-protocol.git --bin linera
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Linera CLI installed successfully!" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "❌ Method 1 failed: $_" -ForegroundColor Red
}

Write-Host ""

# Method 2: Try installing from crates.io if available
Write-Host "Method 2: Checking crates.io..." -ForegroundColor Yellow
try {
    cargo search linera-service 2>&1 | Select-String "linera"
    Write-Host "⚠️  Linera may not be on crates.io. Trying manual build..." -ForegroundColor Yellow
} catch {
    Write-Host "❌ Method 2 not available" -ForegroundColor Red
}

Write-Host ""

# Method 3: Manual build instructions
Write-Host "Method 3: Manual Build Instructions" -ForegroundColor Yellow
Write-Host ""
Write-Host "For Windows, Linera CLI may need to be built manually:" -ForegroundColor White
Write-Host ""
Write-Host "1. Clone the repository:" -ForegroundColor Cyan
Write-Host "   git clone https://github.com/linera-io/linera-protocol.git" -ForegroundColor White
Write-Host "   cd linera-protocol" -ForegroundColor White
Write-Host ""
Write-Host "2. Build the binary:" -ForegroundColor Cyan
Write-Host "   cargo build --release --bin linera" -ForegroundColor White
Write-Host ""
Write-Host "3. Copy to cargo bin:" -ForegroundColor Cyan
Write-Host "   Copy-Item target\release\linera.exe $env:USERPROFILE\.cargo\bin\" -ForegroundColor White
Write-Host ""




