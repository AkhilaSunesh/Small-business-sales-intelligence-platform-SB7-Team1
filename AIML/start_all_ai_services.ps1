# ============================================================
# MarketMind AI — Start All AI Microservices
# ============================================================
# Launches all 5 AI services in separate PowerShell windows.
#
# Port mapping:
#   segmentation   → 5010  (Customer Segmentation)
#   churn          → 5011  (Churn Prediction)
#   recommendation → 5012  (Product Recommendations)
#   anomaly        → 5013  (Anomaly Detection)
#   forecast       → 5014  (Sales Forecast — FastAPI + uvicorn)
#
# Prerequisites:
#   pip install flask pandas fastapi uvicorn joblib prophet
#
# Usage:
#   .\start_all_ai_services.ps1
# ============================================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$api  = Join-Path $root "api"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MarketMind AI — Starting All AI Services" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── Helper: open a new terminal window for each service ──────────────────────
function Start-AIService {
    param(
        [string]$Name,
        [string]$Dir,
        [string]$Command,
        [int]$Port
    )
    Write-Host "Starting $Name on port $Port ..." -ForegroundColor Green
    $fullDir = Join-Path $api $Dir
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$fullDir'; Write-Host '[$Name] Starting on port $Port' -ForegroundColor Cyan; $Command" -WindowStyle Normal
    Start-Sleep -Milliseconds 500
}

# ── 1. Customer Segmentation (Flask) — port 5010 ─────────────────────────────
Start-AIService `
    -Name        "Customer Segmentation" `
    -Dir         "segmentation" `
    -Command     "python app.py" `
    -Port        5010

# ── 2. Churn Prediction (Flask) — port 5011 ──────────────────────────────────
Start-AIService `
    -Name        "Churn Prediction" `
    -Dir         "churn" `
    -Command     "python app.py" `
    -Port        5011

# ── 3. Product Recommendations (Flask) — port 5012 ───────────────────────────
Start-AIService `
    -Name        "Product Recommendations" `
    -Dir         "recommendation" `
    -Command     "python app.py" `
    -Port        5012

# ── 4. Anomaly Detection (Flask) — port 5013 ─────────────────────────────────
Start-AIService `
    -Name        "Anomaly Detection" `
    -Dir         "anomaly" `
    -Command     "python app.py" `
    -Port        5013

# ── 5. Sales Forecast (FastAPI + uvicorn) — port 5014 ────────────────────────
Start-AIService `
    -Name        "Sales Forecast" `
    -Dir         "forecast" `
    -Command     "uvicorn app:app --host 0.0.0.0 --port 5014 --reload" `
    -Port        5014

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  All AI services are starting in separate windows." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Endpoints:" -ForegroundColor Yellow
Write-Host "    Customer Segmentation  → http://localhost:5010/customer-groups" -ForegroundColor White
Write-Host "    Churn Prediction       → http://localhost:5011/churn" -ForegroundColor White
Write-Host "    Recommendations        → http://localhost:5012/recommendations" -ForegroundColor White
Write-Host "    Anomaly Detection      → http://localhost:5013/anomaly-detection" -ForegroundColor White
Write-Host "    Sales Forecast         → http://localhost:5014/forecast" -ForegroundColor White
Write-Host ""
Write-Host "  Via Security API Gateway (port 7000):" -ForegroundColor Yellow
Write-Host "    GET http://localhost:7000/api/customer-groups" -ForegroundColor White
Write-Host "    GET http://localhost:7000/api/churn" -ForegroundColor White
Write-Host "    GET http://localhost:7000/api/recommendations" -ForegroundColor White
Write-Host "    GET http://localhost:7000/api/anomaly-detection" -ForegroundColor White
Write-Host "    GET http://localhost:7000/api/forecast" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
