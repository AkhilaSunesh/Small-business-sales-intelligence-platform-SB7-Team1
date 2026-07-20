# Database Backup and Restore Guide

This guide explains how to safely backup and restore your local Docker PostgreSQL database.

## Prerequisites
- Docker Desktop must be running.
- The containers must be up (`docker compose up -d`).

## How to Backup the Database
1. Open a PowerShell terminal in the project root directory.
2. Run the backup script:
   ```powershell
   .\scripts\backup_db.ps1
   ```
3. The script will output a success message and create a new SQL file in your current directory, for example: `marketmind_backup_20260720_121020.sql`. Keep this file safe.

## How to Restore the Database
> **WARNING:** Restoring a backup will **completely overwrite** your current local database data.

1. Open a PowerShell terminal in the project root directory.
2. Run the restore script, passing the exact name of the backup file you want to restore:
   ```powershell
   .\scripts\restore_db.ps1 -BackupFile marketmind_backup_20260720_121020.sql
   ```
3. You will see a series of SQL logs confirming tables are dropped and recreated. Once finished, it will display a green success message.
