# Live Production Deployment & Monitoring Guide
**Platform:** MarketMind Sales Intelligence Platform  
**Target Hosts:** Render Cloud (Free Tier) & UptimeRobot Monitoring

---

## 1. Live Production Service Health Check Endpoints

| Service Name | Component | Public URL / Health Endpoint | Target Interval | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **MarketMind Frontend** | React SPA | `https://marketmind-frontend.onrender.com` | Every 5 min | `HTTP 200 OK` |
| **Security API Gateway** | API Gateway & Reverse Proxy | `https://marketmind-security-gateway.onrender.com` | Every 5 min | `{"status":"Running","version":"2.0"}` |
| **Backend Database API** | Node/Express + Prisma | `https://marketmind-backend-jkcl.onrender.com` | Every 5 min | `{"status":"Running","service":"MarketMind Backend API"}` |
| **AI Forecasting Service** | FastAPI (Prophet / Holt-Winters) | `https://marketmind-ai-service.onrender.com` | Every 5 min | `{"service":"ai-service","status":"running"}` |

> [!TIP]
> **Why Uptime Monitoring Prevents Free Tier Cold Starts**:
> Setting up a 5-minute HTTP ping on UptimeRobot prevents Render free-tier instances from spinning down due to inactivity, eliminating the 50-second cold-start latency.

---

## 2. UptimeRobot Monitoring Setup (Step-by-Step)

1. **Sign Up / Log In**:
   - Go to [UptimeRobot.com](https://uptimerobot.com) (100% Free - includes 50 monitors with 5-minute checks).
2. **Add Monitor 1 — Frontend**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `MarketMind - Frontend`
   - **URL (or IP)**: `https://marketmind-frontend.onrender.com`
   - **Monitoring Interval**: `5 minutes`
3. **Add Monitor 2 — Security API Gateway**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `MarketMind - Security Gateway`
   - **URL (or IP)**: `https://marketmind-security-gateway.onrender.com`
   - **Monitoring Interval**: `5 minutes`
4. **Add Monitor 3 — Backend API**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `MarketMind - Backend API`
   - **URL (or IP)**: `https://marketmind-backend-jkcl.onrender.com`
   - **Monitoring Interval**: `5 minutes`
5. **Add Monitor 4 — AI Service**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `MarketMind - AI Forecasting`
   - **URL (or IP)**: `https://marketmind-ai-service.onrender.com`
   - **Monitoring Interval**: `5 minutes`
6. **Set Alert Contacts**:
   - Choose email notifications to be alerted if any service returns non-200 responses.

---

## 3. Cloud Database Backup & Restore Procedure (Milestone 2/3/4)

The project includes automated scripts in `Devops_Integration/scripts/` to create and restore complete PostgreSQL database backups from local or remote cloud instances (e.g. Render Postgres / Supabase).

### Taking a Cloud Database Backup:
```powershell
# Using the dedicated cloud backup script
.\Devops_Integration\scripts\backup_cloud_db.ps1 -DatabaseUrl "<YOUR_LIVE_DATABASE_URL>"

# Or using local Docker (if testing against local container)
.\Devops_Integration\scripts\backup_db.ps1
```
- Outputs a timestamped SQL dump into `./backups/marketmind_cloud_backup_YYYYMMDD_HHMMSS.sql`.
- Includes all tables: `Product`, `Inventory`, `SalesTransaction`, `Customer`, `Invoice`, `User`, `Role`, `AuditLog`.

### Testing Restore Against Cloud Database:
```powershell
# Restores backup to target database
.\Devops_Integration\scripts\restore_cloud_db.ps1 -BackupFile "./backups/marketmind_cloud_backup_20260818_014935.sql" -DatabaseUrl "<TARGET_DATABASE_URL>"

# Or verify local restore
.\Devops_Integration\scripts\restore_db.ps1 -BackupFile "marketmind_backup.sql"
```

### Automated Dataset Repopulation:
On initial Render deployment or disaster recovery, the backend automatically runs:
```bash
npm run setup
```
Which executes `prisma/setup.js` to populate:
- 10+ standard retail Products across 5 categories
- Inventory stock records with realistic quantities & low-stock thresholds
- 100+ historical Sales Transactions spanning 1 year
- 20+ Customer Profiles and Invoices
- Seeded Admin, Analyst, and Sales Manager roles
