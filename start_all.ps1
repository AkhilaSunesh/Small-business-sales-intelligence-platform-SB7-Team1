# ============================================================
# MarketMind AI — Start All System Services (Frontend, Gateway, Backend, AI)
# ============================================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$venvPath = Join-Path $root "Devops_Integration\venv\Scripts\Activate.ps1"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MarketMind AI — Starting All Services" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Helper to start a service in a separate window
function Start-ServiceWindow {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [boolean]$UseVenv = $false
    )
    Write-Host "Starting $Name..." -ForegroundColor Green
    $fullPath = Join-Path $root $Path
    
    $fullCommand = if ($UseVenv) {
        ". '$venvPath'; $Command"
    } else {
        $Command
    }

    Start-Process powershell -ArgumentList `
        "-NoExit", `
        "-Command", `
        "cd '$fullPath'; Write-Host '[$Name] Starting...' -ForegroundColor Cyan; $fullCommand" `
        -WindowStyle Normal
    Start-Sleep -Milliseconds 500
}

# 1. Start Backend Database Service (port 5000)
Start-ServiceWindow -Name "Backend Database Service" -Path "Backend_Databse" -Command "npm run dev"

# 2. Start Security API Gateway Service (port 7000)
Start-ServiceWindow -Name "Security API Gateway" -Path "Security_API_gateway" -Command "npm run dev"

# 3. Start Frontend Dev Server (port 5173)
Start-ServiceWindow -Name "Frontend Server" -Path "Frontend" -Command "npm run dev"

# 4. Start DevOps Integration AI Service (port 5001)
Start-ServiceWindow -Name "Devops AI Service" -Path "Devops_Integration" -Command "uvicorn ai_service:app --host 0.0.0.0 --port 5001" -UseVenv $true

# 5. Start Customer Segmentation (port 5010)
Start-ServiceWindow -Name "Customer Segmentation" -Path "AIML\api\segmentation" -Command "python app.py" -UseVenv $true

# 6. Start Churn Prediction (port 5011)
Start-ServiceWindow -Name "Churn Prediction" -Path "AIML\api\churn" -Command "python app.py" -UseVenv $true

# 7. Start Product Recommendations (port 5012)
Start-ServiceWindow -Name "Product Recommendations" -Path "AIML\api\recommendation" -Command "python app.py" -UseVenv $true

# 8. Start Anomaly Detection (port 5013)
Start-ServiceWindow -Name "Anomaly Detection" -Path "AIML\api\anomaly" -Command "python app.py" -UseVenv $true

# 9. Start Sales Forecast (port 5014)
Start-ServiceWindow -Name "Sales Forecast" -Path "AIML\api\forecast" -Command "python app.py" -UseVenv $true

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  All 9 services have been started in separate windows!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
