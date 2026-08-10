# Healthcheck script for Milestone 3 Local Monitoring
Write-Host "========================================="
Write-Host "   MarketMind Local Service Health Monitor "
Write-Host "========================================="

$services = @(
    "mmind-postgres",
    "mmind-backend",
    "mmind-ai",
    "mmind-security-gateway",
    "mmind-invoice",
    "mmind-notifications",
    "mmind-ai-rf",
    "mmind-ai-xgb",
    "mmind-ai-hp",
    "mmind-ai-mc",
    "mmind-frontend"
)

foreach ($service in $services) {
    # Get the status using docker inspect
    $status = docker inspect -f '{{.State.Status}}' $service 2>$null
    if ($status -eq "running") {
        Write-Host "[OK] $service is running" -ForegroundColor Green
    } elseif ($status -eq "") {
        Write-Host "[NOT FOUND] $service container does not exist" -ForegroundColor DarkGray
    } else {
        Write-Host "[FAIL] $service is in state: $status" -ForegroundColor Red
    }
}

Write-Host "========================================="
Write-Host "Monitoring check complete."
