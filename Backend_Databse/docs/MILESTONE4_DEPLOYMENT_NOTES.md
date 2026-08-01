# MarketMind AI — Milestone 4 Deployment Notes
**Intern 1 — Backend & Database Developer**

> These notes document everything the Backend service needs for Milestone 4 live deployment.
> Nothing is deployed yet — deployment is intentionally deferred to Milestone 4.

---

## 1. Required Services

| Service | Technology | Default Port | Role |
|---------|-----------|-------------|------|
| PostgreSQL | PostgreSQL 14+ | 5432 | Primary database |
| Backend API | Node.js 18+ / Express | 5000 | Business logic, Prisma ORM |
| Security API Gateway | Node.js 18+ / Express | 7000 | JWT auth, RBAC, reverse proxy |
| Customer Segmentation | Python / Flask | 5010 | AI — customer grouping |
| Churn Prediction | Python / Flask | 5011 | AI — churn risk |
| Recommendations | Python / Flask | 5012 | AI — product recommendations |
| Anomaly Detection | Python / Flask | 5013 | AI — anomaly flagging |
| Forecast API | Python / FastAPI | 5014 | AI — sales forecasting |

---

## 2. Startup Order

Services must start in this order to avoid dependency failures:

```
1. PostgreSQL          — database must be ready before any service connects
2. Backend_Databse     — waits for Prisma DB connection
3. Security_API_gateway — waits for Backend to be up (proxy target)
4. AI services (5010–5014) — independent; gateway returns 503 if they are offline
5. Frontend (Vite / static host) — waits for Gateway to be up
```

For Docker Compose, use `depends_on` with `healthcheck` conditions.

---

## 3. Environment Variables

### Backend_Databse (.env)

```env
# Database
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/marketmind"

# Authentication (must match Security_API_gateway)
JWT_SECRET=<strong-random-secret-min-32-chars>

# Server
PORT=5000
NODE_ENV=production
```

### Security_API_gateway (.env)

```env
PORT=7000
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/marketmind?schema=public"

JWT_SECRET=<SAME-VALUE-AS-BACKEND>
REFRESH_TOKEN_SECRET=<strong-random-secret-min-32-chars>

BACKEND_API=http://backend:5000
BACKEND_API_URL=http://backend:5000/api

CUSTOMER_SEGMENTATION_URL=http://segmentation:5010
CHURN_PREDICTION_URL=http://churn:5011
RECOMMENDATION_URL=http://recommendations:5012
ANOMALY_DETECTION_URL=http://anomaly:5013
FORECAST_API_URL=http://forecast:5014
```

> **Security rule:** Never commit `.env` files to Git. Use a secrets manager (e.g., Railway Variables, Render Environment, GitHub Actions Secrets) in production.

---

## 4. Database Migration

Run Prisma migrations before starting the Backend service:

```bash
# Inside Backend_Databse container / environment
npx prisma migrate deploy
```

For Milestone 4 initial deployment, also run the Kaggle importer and seed:

```bash
npm run setup   # = importKaggle.js then seed.js
```

---

## 5. Health Checks

| Endpoint | Expected | Checks |
|----------|----------|--------|
| `GET http://backend:5000/` | `{ "status": "Running" }` | Backend alive |
| `GET http://gateway:7000/` | `{ "status": "Running" }` | Gateway alive |
| `GET http://segmentation:5010/` | `{ "message": "..." }` | AI segmentation alive |
| `GET http://churn:5011/` | `{ "message": "..." }` | AI churn alive |
| `GET http://recommendations:5012/` | `{ "message": "..." }` | AI recommendations alive |
| `GET http://anomaly:5013/` | `{ "message": "..." }` | AI anomaly alive |
| `GET http://forecast:5014/` | `{ "message": "..." }` | AI forecast alive |

Docker Compose health check example:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 15s
```

---

## 6. Deployment Verification Steps

After deploying to Milestone 4 hosting (Render / Railway / Fly.io):

1. `GET /` on Gateway → `{ "status": "Running" }` ✅
2. `POST /api/auth/login` with seeded credentials → returns JWT ✅
3. `GET /api/dashboard/summary` with JWT → returns KPI data ✅
4. `GET /api/notifications` with JWT → returns alert list ✅
5. `GET /api/invoices` with JWT → returns invoice list ✅
6. `GET /api/forecast` with JWT → returns forecast data ✅
7. `GET /api/customer-groups` with JWT → returns 200 or 503 (AI offline is acceptable) ✅
8. `GET /api/audit-summary` with Business Owner JWT → returns audit log summary ✅

---

## 7. Rollback Steps

If a deployment causes regressions:

```bash
# 1. Revert to previous Docker image tag
docker pull marketmind-backend:<previous-tag>
docker-compose up -d backend

# 2. If a bad migration was applied, revert using Prisma
npx prisma migrate resolve --rolled-back <migration-name>

# 3. Restore database from daily backup (Milestone 3 backup procedure)
pg_restore -U postgres -d marketmind backup_<YYYYMMDD>.dump

# 4. Verify service health after rollback
curl http://localhost:5000/
```

---

## 8. Free Hosting Options (Milestone 4 targets)

| Layer | Free Option | Notes |
|-------|-------------|-------|
| Backend + Gateway | Render free tier / Railway free tier | Cold starts on free tier — acceptable |
| Database | Neon / Supabase / ElephantSQL free tier | Already configured in Milestone 2 |
| Frontend | Netlify / Vercel / GitHub Pages | Static build |
| AI services | Render free tier (one per service) | May need 5 separate services |

---

*Last updated: Milestone 3 — deployment not yet executed. Execute in Milestone 4.*
