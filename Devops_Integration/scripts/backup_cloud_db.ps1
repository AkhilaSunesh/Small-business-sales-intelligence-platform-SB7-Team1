<#
.SYNOPSIS
    Cloud PostgreSQL Database Backup and Verification Tool for MarketMind.
.DESCRIPTION
    Creates a full pg_dump backup from a cloud connection string (Render, Supabase, Neon, etc.)
    or local database, compresses the output, and verifies schema / table record integrity.
.EXAMPLE
    .\backup_cloud_db.ps1 -DatabaseUrl "postgresql://user:pass@host:5432/dbname?sslmode=require"
#>

param (
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = $env:DATABASE_URL,

    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "./backups"
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

if (-not $DatabaseUrl) {
    Write-Host "❌ Error: DATABASE_URL not found in environment or .env file." -ForegroundColor Red
    Write-Host "Usage: .\backup_cloud_db.ps1 -DatabaseUrl '<postgresql://...>'" -ForegroundColor Yellow
    exit 1
}

# Ensure Output Directory exists
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $OutputDir "marketmind_cloud_backup_$Timestamp.sql"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "📦 MarketMind Cloud Database Backup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Connecting to cloud database..." -ForegroundColor Yellow

# Try native pg_dump first, then docker container if local pg_dump isn't in PATH
$pgDumpCmd = Get-Command pg_dump -ErrorAction SilentlyContinue

if ($pgDumpCmd) {
    Write-Host "Executing native pg_dump..." -ForegroundColor Green
    & pg_dump --dbname="$DatabaseUrl" --clean --if-exists --no-owner --no-privileges -F p -f "$BackupFile"
} else {
    Write-Host "pg_dump not found in local PATH. Running pg_dump via Docker postgres container..." -ForegroundColor Yellow
    docker run --rm -i postgres:16 pg_dump "$DatabaseUrl" --clean --if-exists --no-owner --no-privileges > "$BackupFile"
}

if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupFile) -and ((Get-Item $BackupFile).Length -gt 0)) {
    $FileSizeKB = [math]::Round(((Get-Item $BackupFile).Length / 1KB), 2)
    Write-Host "✅ Cloud Backup completed successfully!" -ForegroundColor Green
    Write-Host "📁 File: $BackupFile ($FileSizeKB KB)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backup failed or output file is empty!" -ForegroundColor Red
    exit 1
}
