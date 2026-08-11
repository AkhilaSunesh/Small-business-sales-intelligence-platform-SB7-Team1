# MarketMind AI - Complete Windows Setup Guide (Docker + WSL)

This guide provides step-by-step instructions for Windows users to install **WSL (Windows Subsystem for Linux)**, install **Docker Desktop**, and run the entire MarketMind AI application stack. 

This is the recommended, most modern, and most performant way to run Docker on Windows (and it does not require enabling Hyper-V manually).

## 1. Install WSL (Windows Subsystem for Linux)

WSL 2 provides a lightweight Linux environment on your Windows machine, which Docker Desktop uses behind the scenes to run containers extremely efficiently.

1. Open **PowerShell** or **Command Prompt** as an **Administrator**.
   *(Right-click the Start button -> Select "Terminal (Admin)" or "Windows PowerShell (Admin)").*
2. Run the following command:
   ```powershell
   wsl --install
   ```
   *Note: This command will enable the required optional components, download the latest Linux kernel, set WSL 2 as your default, and install a Linux distribution (usually Ubuntu by default).*
3. **Restart your computer** when the installation finishes.
4. After restarting, a console window will automatically open asking you to set up a username and password for your new Linux distribution. Follow the prompts.

## 2. Install Docker Desktop

1. Download the Docker Desktop installer for Windows from the [official website](https://docs.docker.com/desktop/install/windows-install/).
2. Double-click `Docker Desktop Installer.exe` to run the installer.
3. **CRITICAL STEP**: On the Configuration page, ensure that the option **"Use WSL 2 instead of Hyper-V (recommended)"** is **CHECKED**.
4. Follow the installation prompts and click "Close" when finished.
5. Open Docker Desktop from your Start Menu.
6. Accept the terms and wait for the Docker engine to start (the Docker icon in your system tray will stop animating and turn solid).

## 3. Clone the Repository

You can now clone the repository. Open PowerShell, Command Prompt, or your new WSL terminal and run:

```powershell
git clone <repository-url>
cd Small-business-sales-intelligence-platform-SB7-Team1
```

## 4. Environment Variables Setup

A default `.env.example` file is provided in the `Devops_Integration` folder. Copy it to the root directory as `.env`:

**If using PowerShell/CMD:**
```powershell
copy Devops_Integration\.env.example .env
```

**If using WSL / Bash:**
```bash
cp Devops_Integration/.env.example .env
```
*(Docker Compose is configured to use default fallback values for everything, so modifying this file is optional for a quick start).*

## 5. Launch the Application Stack

Docker Compose will build and orchestrate the containers for the Frontend, Backend, API Gateway, Database, and all Python AI microservices. 

Run the following command from the **root** of the project:

```powershell
docker compose -f Devops_Integration/docker-compose.yml up -d --build
```
*Note: The `-d` flag runs the containers in detached mode (in the background).*

## 6. Seed the Database

The database structure is created automatically when the backend container starts. However, to populate the database with required system roles, test users, and the Kaggle retail dataset, you should run the setup script inside the backend container.

Run this command:
```powershell
docker exec -it mmind-backend npm run setup
```

## 7. Access the Application

Once everything is up and running, open your web browser and access the services:

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
- **Stop and remove all services:**
  ```powershell
  docker compose -f Devops_Integration/docker-compose.yml down
  ```
