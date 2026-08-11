# MarketMind AI - Local Windows Setup Guide (No Docker / No WSL)

This guide provides step-by-step instructions to run the entire MarketMind AI stack locally on a Windows machine natively, without using Docker or WSL.

## 1. Prerequisites

Before starting, ensure you have the following installed on your Windows machine:
- **Node.js** (v18 or higher recommended) - [Download here](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download here](https://www.python.org/downloads/windows/) (Ensure you check "Add Python to PATH" during installation)
- **PostgreSQL** - [Download here](https://www.postgresql.org/download/windows/) (Install the Windows version using the EDB installer)
- **Git** - [Download here](https://git-scm.com/download/win)

## 2. Database Setup

1. Open **pgAdmin** (which comes with the PostgreSQL installation) or use the SQL Shell (`psql`).
2. Create a new database named `marketmind_db`.
   If using SQL Shell:
   ```sql
   CREATE DATABASE marketmind_db;
   ```
*(Note: These instructions assume your PostgreSQL username is `postgres` and password is `postgres`. If yours are different, you will need to update the connection string in the `.env` file.)*

## 3. Clone the Repository

Open PowerShell or Command Prompt and clone the repository:
```powershell
git clone <repository-url>
cd Small-business-sales-intelligence-platform-SB7-Team1
```

## 4. Environment Variables Setup

Create a `.env` file in the **root** folder of the project. You can copy the contents of `.env.development` if it exists, or manually create a `.env` file and paste the following:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketmind_db?schema=public
JWT_SECRET=dev-secret-change-me
JWT_EXPIRES_IN=7d
VITE_API_BASE_URL=http://localhost:7000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=marketmind_db
POSTGRES_PORT=5432
BACKEND_PORT=5000
FRONTEND_PORT=3000
AI_SERVICE_PORT=5001
LOG_LEVEL=debug
```

## 5. Install Node.js Dependencies

Open PowerShell from the root folder of the project and run the following commands to install dependencies for each Node.js service:

```powershell
# Install Frontend dependencies
cd Frontend
npm install
cd ..

# Install Backend dependencies
cd Backend_Databse
npm install
cd ..

# Install Security API Gateway dependencies
cd Security_API_gateway
npm install
cd ..
```

## 6. Database Migration and Seeding

We need to push the Prisma schema to your newly created PostgreSQL database and seed it with system roles, test users, and the Kaggle dataset.

```powershell
cd Backend_Databse
npx prisma db push
npm run setup
cd ..
```

## 7. Setup Python Virtual Environment (for AI Services)

The startup script expects a Python virtual environment located inside the `Devops_Integration` folder.

Run these commands from the **root** of the project in PowerShell:

```powershell
# Create the virtual environment
python -m venv Devops_Integration\venv

# Activate the virtual environment
.\Devops_Integration\venv\Scripts\Activate.ps1

# Install required Python packages
pip install fastapi "uvicorn[standard]" pandas scikit-learn xgboost statsmodels joblib
```
*(Note: If you receive a script execution policy error when trying to run `Activate.ps1`, you may need to run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` first.)*

## 8. Start the Application

Once everything is installed and the database is seeded, you can launch all the services using the provided PowerShell script. From the **root** folder, run:

```powershell
.\start_all.ps1
```

This script will open several new PowerShell windows, each running a different service (Frontend, Backend, API Gateway, and various AI models).

### Accessing the Application

- **Frontend UI:** [http://localhost:3000](http://localhost:3000) (or `http://localhost:5173` depending on the Vite config output)
- **Security API Gateway:** [http://localhost:7000](http://localhost:7000)
- **Core Backend API:** [http://localhost:5000](http://localhost:5000)

## 9. Stopping the Services

To stop the application, simply close all the PowerShell windows that were opened by the `start_all.ps1` script.
