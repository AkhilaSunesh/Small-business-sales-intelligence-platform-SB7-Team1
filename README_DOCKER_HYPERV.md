# MarketMind AI - Docker Setup for Windows (Without WSL)

This guide provides detailed instructions on how to install and run the MarketMind AI stack using Docker Desktop on a Windows machine that **does not** have WSL (Windows Subsystem for Linux) installed. Instead of WSL, we will use Docker's traditional **Hyper-V** backend.

## 1. Prerequisites

- **Windows Edition**: You must have Windows 10 or Windows 11 **Pro, Enterprise, or Education**. Hyper-V is not officially supported on Windows Home editions.
- **Hardware Virtualization**: Ensure hardware virtualization is enabled in your BIOS/UEFI settings.

## 2. Enable Hyper-V

Before installing Docker, you need to enable the Hyper-V feature in Windows.

1. Open PowerShell as an **Administrator**.
2. Run the following command:
   ```powershell
   Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
   ```
3. After the installation completes, **restart your computer**.

## 3. Install Docker Desktop (Without WSL)

1. Download the Docker Desktop installer for Windows from the [official website](https://docs.docker.com/desktop/install/windows-install/).
2. Run the `Docker Desktop Installer.exe`.
3. **CRITICAL STEP**: On the Configuration page during installation, **UNCHECK** the option that says **"Use WSL 2 instead of Hyper-V (recommended)"**.
4. Follow the rest of the installation prompts and click "Close" when finished.
5. Open Docker Desktop. 
6. Go to **Settings** (the gear icon) > **General**.
7. Verify that the **"Use the WSL 2 based engine"** option is unchecked. If you had to uncheck it, click "Apply & Restart".

## 4. Clone the Repository

Open PowerShell or Command Prompt and clone the project repository:

```powershell
git clone <repository-url>
cd Small-business-sales-intelligence-platform-SB7-Team1
```

## 5. Environment Variables Setup

A default `.env.example` file is provided in the `Devops_Integration` folder. Copy it to the root directory as `.env`:

```powershell
copy Devops_Integration\.env.example .env
```
*(Docker Compose is configured to use default fallback values for everything, so you don't necessarily need to edit the `.env` file for a quick start).*

## 6. Launch the Application Stack

Docker Compose will build the containers for the Frontend, Backend, API Gateway, Database, and all Python AI microservices. 

Run the following command from the **root** of the project:

```powershell
docker compose -f Devops_Integration/docker-compose.yml up -d --build
```
*Note: The `-d` flag runs the containers in detached mode (in the background).*

## 7. Seed the Database

The database migrations run automatically when the backend container starts. However, to populate the database with system roles, test users, and the Kaggle retail dataset, you should run the setup script inside the backend container.

Run this command in PowerShell:
```powershell
docker exec -it mmind-backend npm run setup
```

## 8. Access the Application

Once all containers are successfully running, open your web browser and access the services:

- **Frontend UI (React):** [http://localhost:3000](http://localhost:3000)
- **Security API Gateway:** [http://localhost:7000](http://localhost:7000)
- **Core Backend API:** [http://localhost:5000](http://localhost:5000)

## Useful Docker Commands

- **Check container status:**
  ```powershell
  docker compose -f Devops_Integration/docker-compose.yml ps
  ```
- **View live logs of all services:**
  ```powershell
  docker compose -f Devops_Integration/docker-compose.yml logs -f
  ```
- **Stop all services:**
  ```powershell
  docker compose -f Devops_Integration/docker-compose.yml down
  ```
