# backup_db.ps1
# This script creates a backup of the local postgres database running in docker.

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "marketmind_backup_$Timestamp.sql"
$ContainerName = "mmind-postgres"
$DbUser = "postgres"
$DbName = "marketmind_db"

Write-Host "Creating backup of $DbName in container $ContainerName..."

# We execute pg_dump inside the container and pipe the output to a file on the host.
docker exec $ContainerName pg_dump -U $DbUser -d $DbName > $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully! Saved as $BackupFile" -ForegroundColor Green
} else {
    Write-Host "Backup failed!" -ForegroundColor Red
}
