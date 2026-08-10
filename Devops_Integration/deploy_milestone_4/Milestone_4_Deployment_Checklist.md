# Milestone 4 Deployment Checklist

> [!WARNING]  
> **Milestone 4 — not yet deployed**
> This file is for preparation only. DO NOT deploy this configuration during Milestone 3.

## Pre-Deployment Steps
- [ ] 1. Provision cloud server (e.g., Render, AWS EC2, DigitalOcean).
- [ ] 2. Provision managed database (e.g., Supabase, RDS) or set up a persistent volume for Postgres.
- [ ] 3. Ensure Domain Name is registered and DNS points to the cloud server IP.
- [ ] 4. Populate `.env.production` based on `.env.prod.example` with actual secrets (JWT secret, DB passwords, API keys).

## Deployment Execution
- [ ] 1. Clone the repository on the production server.
- [ ] 2. Copy `.env.production` to the server securely.
- [ ] 3. Run `docker compose -f deploy_milestone_4/docker-compose.prod.yml --env-file .env.production up -d --build`.
- [ ] 4. Wait for services to become healthy (`docker ps`).

## Post-Deployment Verification
- [ ] 1. Run database migrations on production DB.
- [ ] 2. Access the frontend via domain name (HTTPS).
- [ ] 3. Test a full user flow (sign up, dashboard load).
- [ ] 4. Review logs for any unexpected errors (`docker compose logs -f`).
