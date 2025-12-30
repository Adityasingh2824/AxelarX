# Fix Vercel Root Directory and Deploy
# This script updates the Vercel project root directory and deploys

param(
    [string]$VercelToken
)

$ErrorActionPreference = "Stop"

Write-Host "🔧 Fixing Vercel Configuration and Deploying" -ForegroundColor Cyan
Write-Host ""

$projectId = "prj_72b8CtFiPQZLecJvecpqK7wDw9yy"
$orgId = "team_uPG8eh7WUVdrcE1gmL2WrX8c"

# Step 1: Update root directory
if ($VercelToken) {
    Write-Host "📝 Step 1: Updating root directory to 'frontend'..." -ForegroundColor Blue
    $headers = @{
        "Authorization" = "Bearer $VercelToken"
        "Content-Type" = "application/json"
    }
    $body = @{ rootDirectory = "frontend" } | ConvertTo-Json -Compress
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.vercel.com/v10/projects/$projectId?teamId=$orgId" -Method PATCH -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "✅ Root directory updated to 'frontend'!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to update root directory: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please update manually:" -ForegroundColor Yellow
        Write-Host "  1. Visit: https://vercel.com/aditya-singhs-projects-b64c1d72/axelar-x/settings/general" -ForegroundColor Yellow
        Write-Host "  2. Set 'Root Directory' to: frontend" -ForegroundColor Yellow
        Write-Host "  3. Save and run this script again" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
} else {
    Write-Host "⚠️  No Vercel token provided." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get your token:" -ForegroundColor Cyan
    Write-Host "  1. Visit: https://vercel.com/account/tokens" -ForegroundColor White
    Write-Host "  2. Create a new token" -ForegroundColor White
    Write-Host "  3. Run: .\fix-and-deploy-vercel.ps1 -VercelToken 'your-token'" -ForegroundColor White
    Write-Host ""
    Write-Host "OR update root directory manually:" -ForegroundColor Cyan
    Write-Host "  Visit: https://vercel.com/aditya-singhs-projects-b64c1d72/axelar-x/settings/general" -ForegroundColor White
    Write-Host "  Set 'Root Directory' to: frontend" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue with deployment anyway? (y/n)"
    if ($continue -ne "y") { 
        Write-Host "Exiting. Please update root directory first." -ForegroundColor Red
        exit 1 
    }
}

# Step 2: Deploy
Write-Host "🚀 Step 2: Deploying to Vercel..." -ForegroundColor Blue
Write-Host ""

vercel --prod --yes

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is live at:" -ForegroundColor Cyan
    Write-Host "  https://axelar-x.vercel.app" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check errors above." -ForegroundColor Red
    exit 1
}


