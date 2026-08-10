# MarketMind AI - Small Business Sales Intelligence Platform

MarketMind AI is an AI-powered sales intelligence platform designed to help small businesses, retail stores, supermarkets, and startups make better business decisions using data and Artificial Intelligence.

## 🚀 Quick Start Guide (Executing on your device)

Follow these instructions to run the entire stack (Frontend, Backend, AI Microservices, Gateway, and Database) on your local machine using Docker.

### Prerequisites
- **Docker** and **Docker Compose** must be installed and running on your system.
- Git (to clone the repository)

### Step-by-Step Execution

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Small-business-sales-intelligence-platform-SB7-Team1
   ```

2. **Set up Environment Variables:**
   A `.env.example` file is provided in the `Devops_Integration` folder. If needed, copy it to `.env`:
   ```bash
   cp Devops_Integration/.env.example .env
   ```
   *(By default, the docker-compose setup provides fallback values for everything, so this is optional for a quick start).*

3. **Launch the Application Stack:**
   Run the following command from the root of the project to build and start all containers in detached mode:
   ```bash
   docker compose -f Devops_Integration/docker-compose.yml up -d --build
   ```

4. **Access the Application:**
   Once the containers are up and running, you can access the different services via your browser:
   - **Frontend UI:** [http://localhost:3000](http://localhost:3000)
   - **Security API Gateway:** [http://localhost:7000](http://localhost:7000)
   - **Core Backend API:** [http://localhost:5000](http://localhost:5000)

### Useful Docker Commands

- **View live logs of all services:**
  ```bash
  docker compose -f Devops_Integration/docker-compose.yml logs -f
  ```
- **Stop all services:**
  ```bash
  docker compose -f Devops_Integration/docker-compose.yml down
  ```
- **Check status of containers:**
  ```bash
  docker compose -f Devops_Integration/docker-compose.yml ps
  ```

---
*Note: The frontend supports hot-reloading if you run it outside Docker (`npm run dev` in the `Frontend` folder).*
