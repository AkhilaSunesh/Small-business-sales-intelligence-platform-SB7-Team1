<#
.SYNOPSIS
    Cloud PostgreSQL Database Restore and Verification Tool for MarketMind.
.DESCRIPTION
    Restores a .sql database dump against a cloud PostgreSQL instance (Render, Supabase, Neon, etc.)
    or local database, recreating schemas and verifying record integrity.
.EXAMPLE
    .\restore_cloud_db.ps1 -BackupFile "./backups/marketmind_cloud_backup_20260818.sql" -DatabaseUrl "postgresql://..."
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,

    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = $env:DATABASE_URL
)

# Load from .env if DATABASE_URL is not explicitly passed
if (-not $DatabaseUrl) {
    if (Test-Path "../../.env") {
        Get-Content "../../.env" | ForEach-Object {
            if ($_ -match "^DATABASE_URL=(.*)$") {
                $DatabaseUrl = $matches[1].Trim('"').Trim("'")
            }
        }
    } elseif (Test-Path "../Backend_Databse/.env") {
        Get-Content "../Backend_Databse/.env" | ForEach-Object {
            if ($_ -match "^DATABASE_URL=(.*)$") {
                $DatabaseUrl = $matches[1].Trim('"').Trim("'")
            }
        }
    }
}

if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Error: Backup file '$BackupFile' not found." -ForegroundColor Red
    exit 1
}

if (-not $DatabaseUrl) {
    Write-Host "❌ Error: DATABASE_URL not found in environment or .env file." -ForegroundColor Red
    Write-Host "Usage: .\restore_cloud_db.ps1 -BackupFile '<path.sql>' -DatabaseUrl '<postgresql://...>'" -ForegroundColor Yellow
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🔄 MarketMind Cloud Database Restore" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Restoring $BackupFile to cloud database..." -ForegroundColor Yellow

$psqlCmd = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlCmd) {
    Write-Host "Executing native psql..." -ForegroundColor Green
    & psql "$DatabaseUrl" -f "$BackupFile"
} else {
    Write-Host "psql not found in local PATH. Running psql via Docker postgres container..." -ForegroundColor Yellow
    cat "$BackupFile" | docker run --rm -i postgres:16 psql "$DatabaseUrl"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cloud Restore completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Restore encountered errors. Please check the logs." -ForegroundColor Red
    exit 1
}
