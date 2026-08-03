# End-to-end integration test script for MarketMind Milestone 1 (PowerShell)

Write-Host "Waiting for services to be ready..."
Start-Sleep -Seconds 15 # Wait for containers to start up fully

Write-Host "Testing Database Health..."
try {
    $dbCheck = docker exec mmind-postgres pg_isready -U postgres -d marketmind_db
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database is UP"
    } else {
        Write-Host "❌ Database is DOWN"
        exit 1
    }
} catch {
    Write-Host "❌ Database is DOWN ($($_.Exception.Message))"
    exit 1
}

Write-Host "Testing Backend Health..."
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000/" -Method Get -UseBasicParsing -ErrorAction Stop
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend is UP"
    } else {
        Write-Host "❌ Backend is DOWN (HTTP $($backendResponse.StatusCode))"
        exit 1
    }
} catch {
    Write-Host "❌ Backend is DOWN ($($_.Exception.Message))"
    exit 1
}

Write-Host "Testing Security Gateway Health..."
try {
    $securityResponse = Invoke-WebRequest -Uri "http://localhost:6000/" -Method Get -UseBasicParsing -ErrorAction Stop
    if ($securityResponse.StatusCode -eq 200) {
        Write-Host "✅ Security Gateway is UP"
    } else {
        Write-Host "❌ Security Gateway is DOWN (HTTP $($securityResponse.StatusCode))"
        exit 1
    }
} catch {
    Write-Host "❌ Security Gateway is DOWN ($($_.Exception.Message))"
    exit 1
}

Write-Host "Testing AI Service Health..."
try {
    $aiResponse = Invoke-WebRequest -Uri "http://localhost:5001/" -Method Get -UseBasicParsing -ErrorAction Stop
    if ($aiResponse.StatusCode -eq 200) {
        Write-Host "✅ AI Service is UP"
    } else {
        Write-Host "❌ AI Service is DOWN (HTTP $($aiResponse.StatusCode))"
        exit 1
    }
} catch {
    Write-Host "❌ AI Service is DOWN ($($_.Exception.Message))"
    exit 1
}

Write-Host "Testing Frontend Application..."
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000/" -Method Get -UseBasicParsing -ErrorAction Stop
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend is UP"
    } else {
        Write-Host "❌ Frontend is DOWN (HTTP $($frontendResponse.StatusCode))"
        exit 1
    }
} catch {
    Write-Host "❌ Frontend is DOWN ($($_.Exception.Message))"
    exit 1
}

Write-Host "Testing Notifications Service Health..."
try {
    $notificationsResponse = Invoke-WebRequest -Uri "http://localhost:5007/" -Method Get -UseBasicParsing -ErrorAction Stop
    if ($notificationsResponse.StatusCode -eq 200) {
        Write-Host "✅ Notifications Service is UP"
    } else {
        Write-Host "❌ Notifications Service is DOWN (HTTP $($notificationsResponse.StatusCode))"
        exit 1
    }
} catch {
    Write-Host "❌ Notifications Service is DOWN ($($_.Exception.Message))"
    exit 1
}

Write-Host "🎉 All services are healthy!"
exit 0
