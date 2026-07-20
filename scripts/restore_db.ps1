# restore_db.ps1
# This script restores a local postgres database backup.
# Usage: .\restore_db.ps1 -BackupFile <path_to_sql_file>

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

if (-Not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file '$BackupFile' not found." -ForegroundColor Red
    exit 1
}

$ContainerName = "mmind-postgres"
$DbUser = "postgres"
$DbName = "marketmind_db"

Write-Host "Restoring $BackupFile to $DbName in container $ContainerName..."
Write-Host "Warning: This will drop the existing schema 'public' and recreate it." -ForegroundColor Yellow

# Drop the schema to ensure a clean restore, then recreate it.
docker exec -i $ContainerName psql -U $DbUser -d $DbName -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Pipe the backup file content into psql inside the container.
cat $BackupFile | docker exec -i $ContainerName psql -U $DbUser -d $DbName

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restore completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Restore encountered issues. Please check the logs." -ForegroundColor Red
}
