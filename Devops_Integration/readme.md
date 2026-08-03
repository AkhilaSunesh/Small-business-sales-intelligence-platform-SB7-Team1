# MarketMind Devops & Integration

This folder contains all the configuration files, scripts, and documentation required to run, test, and deploy the full MarketMind platform. 

## Final Demo Day Setup Notes

If you are asked to demo the system, follow these steps to bring up the environment with a single command and prove everything works:

### 1. Start the Platform
Make sure Docker Desktop is running, then execute:
```bash
docker-compose up -d --build
```
This single command builds and spins up all 5 main pieces of our architecture:
1. **Frontend** (Port 3000)
2. **Backend Database API** (Port 5000)
3. **Security API Gateway** (Port 6000)
4. **AI Services** (Ports 5001, 5003-5006)
5. **Invoice Service** (Port 5002)

### 2. Verify Health
Run the end-to-end integration script to verify every service is responding:
**Windows (PowerShell):**
```powershell
.\e2e_test.ps1
```
**Mac/Linux:**
```bash
./e2e_test.sh
```

### 3. Database Backup & Restore
If asked to demonstrate our backup procedure, navigate to the `scripts` folder and use the provided tools:
*   To Backup: `.\scripts\backup_db.ps1` (This generates a `.sql` dump of the current database)
*   To Restore: `.\scripts\restore_db.ps1` (This wipes and re-imports the database from the backup)

### 4. CI/CD & Cloud Deployment
*   **GitHub Actions:** Any push to the repository automatically triggers our `.github/workflows/ci.yml` pipeline. This tests the Backend, Frontend, Security Gateway, AI Services, and the Invoice Service.
*   **Cloud Deployment:** The platform is configured for free-tier deployment on Render using the `render.yaml` configuration file included in this directory.

Everything is fully integrated and ready to demo!
