---
title: MarketMind AI - Sales Intelligence Platform
emoji: 📊
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# MarketMind AI - Small Business Sales Intelligence Platform

MarketMind AI is an AI-powered sales intelligence platform designed to help small businesses, retail stores, supermarkets, and startups make better business decisions using data and Artificial Intelligence.

## 🚀 Quick Start Guide (Executing on your device using Docker / WSL)

Follow these instructions to run the entire stack (Frontend, Backend, AI Microservices, Gateway, and Database) on your local machine using Docker. This guide works for macOS, Linux, and Windows (via WSL2).

### Prerequisites
- **Docker** and **Docker Compose** must be installed and running on your system.
- If using Windows, ensure **WSL2 (Windows Subsystem for Linux)** is installed and Docker Desktop is configured to use the WSL2 backend.

### Step-by-Step Execution

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Small-business-sales-intelligence-platform-SB7-Team1
   ```

2. **Navigate to the Devops Folder:**
   The docker-compose file is located inside `Devops_Integration`.
   ```bash
   cd Devops_Integration
   ```

3. **Remove Previous Containers and Wiped Old Data:**
   If you have run this project before or want to start fresh with a clean database, completely remove the previous containers and volumes.
   ```bash
   docker-compose down -v
   ```

4. **Launch the Application Stack:**
   Run the following command to build and start all containers in detached mode:
   ```bash
   docker-compose up -d --build
   ```

5. **Import the Kaggle Dataset and Seed System Accounts:**
   Wait about 10-15 seconds for the PostgreSQL database to initialize. Then, run the following commands to import the real Kaggle dataset (100,000 transactions) and create the default admin user accounts:
   ```bash
   docker exec mmind-backend npm run import:kaggle
   docker exec mmind-backend npm run seed
   ```

6. **Access the Application:**
   Once the dataset finishes importing, you can access the platform via your browser:
   - **Frontend UI:** [http://localhost:3000](http://localhost:3000)
   - **Security API Gateway:** [http://localhost:7000](http://localhost:7000)
   - **Core Backend API:** [http://localhost:5000](http://localhost:5000)

   **Default Login Credentials:**
   - **Email:** `admin@marketmind.dev`
   - **Password:** `Password1!`
   *(Note: Remember to set the Interactive Filter on the dashboard to a Custom Range (2023-2024) to see the historical Kaggle dataset).*

### Useful Docker Commands

- **View live logs of all services:**
  ```bash
  docker-compose logs -f
  ```
- **Stop all services (without deleting data):**
  ```bash
  docker-compose down
  ```
- **Check status of containers:**
  ```bash
  docker-compose ps
  ```
