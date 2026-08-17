# MarketMind AI — Security API Gateway

The single entry point for all authenticated API traffic in the MarketMind AI platform.
Built with **Node.js · Express · JWT · bcrypt · Prisma**, running on port **7000**.

The gateway handles user registration and login, issues JWT access and refresh tokens,
enforces role-based access control (RBAC) on every protected route, applies rate limiting,
logs all security events to an audit trail, and proxies validated requests to the internal
Backend service (port 5000) and AI microservices (ports 5010–5014).

---

## Overview

The Security API Gateway sits between the Frontend and all backend services.
No request reaches the backend or any AI service unless it first passes through
the gateway's `authenticate` and `authorize` middleware chain.

The only public endpoints are under `/api/auth` — registration, login, and token refresh.
Every other route requires a valid JWT access token and the appropriate role permission.

---

## Purpose

- **Single entry point** — the Frontend communicates exclusively with the gateway on port 7000
- **Authentication** — issues and verifies JWT access tokens (1-hour expiry) and refresh tokens (7-day expiry)
- **Authorization (RBAC)** — enforces a permission matrix across 4 user roles
- **Rate limiting** — 5 independent limiters protect auth, upload, inventory, general, and AI routes
- **Audit logging** — every 401, 403, 400, 429, and security-relevant 2xx event is written to `logs/audit.log`
- **Request validation** — Joi schemas reject malformed payloads before they reach the backend
- **Proxy** — forwards validated requests to backend (port 5000) and AI services (ports 5010–5014) via Axios
- **Schema synchronization** — maintains its own Prisma schema synchronized with the backend for auth operations

---

## Architecture

```
Frontend (port 3000)
        │
        ▼
Security API Gateway (port 7000)
        │
        ├── POST /api/auth/*        ← public (no auth required)
        │
        └── All other /api/*
                │
                ├── authenticate    ← verify JWT signature + payload
                │
                ├── authorize       ← RBAC: check role × resource × method
                │
                ├── apiLimiter      ← rate limit: 200 req / 15 min
                │
                └── proxy via Axios
                        │
                        ├──→ Backend API       (port 5000)
                        │
                        ├──→ AI Segmentation   (port 5010)
                        ├──→ AI Churn          (port 5011)
                        ├──→ AI Recommendations(port 5012)
                        ├──→ AI Anomaly        (port 5013)
                        └──→ AI Forecast       (port 5014, fallback → 5000)
```

### Service Port Map

| Service | Port | Environment Variable |
|---|---|---|
| Security API Gateway | 7000 | `PORT` |
| Backend API | 5000 | `BACKEND_API_URL` |
| AI Customer Segmentation | 5010 | `CUSTOMER_SEGMENTATION_URL` |
| AI Churn Prediction | 5011 | `CHURN_PREDICTION_URL` |
| AI Recommendations | 5012 | `RECOMMENDATION_URL` |
| AI Anomaly Detection | 5013 | `ANOMALY_DETECTION_URL` |
| AI Forecast | 5014 | `FORECAST_API_URL` |

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5.x | HTTP framework |
| JSON Web Tokens (JWT) | 9.x | Access and refresh token issuance/verification |
| bcrypt | 6.x | Password hashing (10 rounds) |
| Prisma ORM | 6.x | Database access for auth operations |
| PostgreSQL | 14+ | User/role storage (shared with backend) |
| Axios | 1.x | HTTP proxy to backend and AI services |
| Helmet | 8.x | HTTP security headers |
| express-rate-limit | 8.x | Route-level rate limiting |
| Joi | 18.x | Request validation |
| Multer | 2.x | CSV file forwarding |
| Morgan | 1.x | HTTP request logging |
| swagger-ui-express | 5.x | API documentation |
| Jest + Supertest | 29.x / 7.x | Testing |

---

## Project Structure

```
Security_API_gateway/
├── prisma/
│   ├── schema.prisma              # Gateway Prisma schema (synced with backend)
│   └── migrations/                # Gateway schema migrations
├── src/
│   ├── server.js                  # HTTP server entry point (port 7000)
│   ├── app.js                     # Express app, route mounting, middleware
│   ├── auth/
│   │   ├── auth.controller.js     # register, login, refreshToken, me, logout, changePassword
│   │   └── jwt.js                 # createAccessToken, createRefreshToken helpers
│   ├── config/
│   │   └── prisma.js              # Prisma singleton (global._gatewayPrisma)
│   ├── middleware/
│   │   ├── authenticate.js        # JWT signature + payload verification
│   │   ├── authorize.js           # RBAC permission matrix enforcement
│   │   ├── rateLimiter.js         # 5 rate limiter instances
│   │   ├── auditLogger.js         # File + console audit trail
│   │   └── validator.js           # Joi validation factory
│   ├── routes/
│   │   ├── auth.routes.js         # /api/auth/* (public)
│   │   ├── users.routes.js        # /api/users proxy
│   │   ├── sales.routes.js        # /api/sales proxy
│   │   ├── inventory.routes.js    # /api/inventory proxy
│   │   ├── invoices.routes.js     # /api/invoices proxy
│   │   ├── dashboard.routes.js    # /api/dashboard proxy
│   │   ├── products.routes.js     # /api/products proxy
│   │   ├── customers.routes.js    # /api/customers proxy
│   │   ├── analytics.routes.js    # /api/analytics proxy
│   │   ├── forecast.routes.js     # /api/forecast (AI 5014 + backend fallback)
│   │   ├── notifications.routes.js# /api/notifications proxy
│   │   ├── auditSummary.routes.js # /api/audit-summary (reads audit.log)
│   │   ├── customerGroups.routes.js # /api/customer-groups → port 5010
│   │   ├── churn.routes.js        # /api/churn → port 5011
│   │   ├── recommendations.routes.js # /api/recommendations → port 5012
│   │   └── anomalyDetection.routes.js # /api/anomaly-detection → port 5013
│   └── validators/
│       ├── auth.validation.js
│       ├── inventory.validation.js
│       ├── invoice.validation.js
│       ├── sales.validation.js
│       └── notification.validation.js
├── tests/
│   ├── security.test.js           # 38 tests: JWT, RBAC, rate limit, validation
│   ├── auth.login.test.js
│   ├── auth.register.test.js
│   ├── app.routes.test.js
│   ├── gateway.integration.test.js
│   ├── authenticate.middleware.test.js
│   ├── authorize.middleware.test.js
│   ├── forecast.gateway.test.js
│   ├── invoice-ai-security.test.js
│   └── milestone3.security.test.js
├── logs/
│   └── audit.log                  # Auto-created; all security events
├── docs/
│   └── MILESTONE4_SECURITY_CHECKLIST.md
├── swagger.json                   # OpenAPI 3.0.3 spec
└── package.json
```

---

## Authentication

### Registration — `POST /api/auth/register`

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "secretpass",
  "roleId": 3
}
```

- Password is hashed with bcrypt (10 rounds) before storage
- New accounts are created with `isActive: false` and `isPending: true`
- **New users cannot log in until an administrator activates the account** (`isActive: true`)
- Returns `409` if the email address is already registered

### Login — `POST /api/auth/login`

```json
{
  "email": "jane@example.com",
  "password": "secretpass"
}
```

Successful response:
```json
{
  "success": true,
  "accessToken": "<jwt_access_token>",
  "refreshToken": "<jwt_refresh_token>",
  "user": { "id": "...", "email": "...", "roleId": 3, "role": { "name": "Sales Executive" } }
}
```

- Returns `401` for unknown email or wrong password
- Returns `403` if the account has `isActive: false` (disabled by an administrator)
- `lastLoginAt` is persisted to the database on every successful login
- All login attempts (success and failure) are written to the audit log

### Token Refresh — `POST /api/auth/refresh`

```json
{ "refreshToken": "<refresh_token>" }
```

Returns a new access token. The refresh token is verified against `REFRESH_TOKEN_SECRET`.

### Current User — `GET /api/auth/me`

Requires `Authorization: Bearer <access_token>`.

Returns the authenticated user's profile (id, name, email, roleId, role name).
Password is never returned.

### Logout — `POST /api/auth/logout`

Requires `Authorization: Bearer <access_token>`.

Logout is stateless — the server returns `200` and logs the event. The client is
responsible for discarding both tokens. No token blacklist is maintained.

### Change Password — `PATCH /api/auth/change-password`

Requires `Authorization: Bearer <access_token>`.

```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

- Verifies `currentPassword` with bcrypt before accepting the change
- Enforces minimum 6-character length on new password
- Stores the new bcrypt hash; the old password immediately stops working

---

## JWT Access Tokens

### Structure

Access tokens are signed JWTs with the following payload:

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "roleId": 2,
  "iat": 1234567890,
  "exp": 1234571490
}
```

### Expiry

| Token | Expiry | Secret Variable |
|---|---|---|
| Access token | 1 hour | `JWT_SECRET` |
| Refresh token | 7 days | `REFRESH_TOKEN_SECRET` |

### Sending Tokens

All protected requests must include:

```
Authorization: Bearer <access_token>
```

---

## Refresh Tokens

Refresh tokens contain only `{ id }` in their payload and are signed with a separate
`REFRESH_TOKEN_SECRET`. They are used exclusively to obtain new access tokens.

Refresh tokens are returned at login and must be stored securely by the client.
They are not stored in the database — there is no server-side refresh token invalidation.

---

## Authorization

### Role-Based Access Control (RBAC)

Every authenticated request goes through `authorize.js` after `authenticate.js`.
The middleware extracts the `resource` from the URL path and checks it against the
permission matrix for the user's `roleId`.

### User Roles

| Role ID | Role Name | Access Level |
|---|---|---|
| 1 | Business Owner | Full access (all methods, all resources) |
| 2 | Store Manager | Read/write inventory, products, invoices, analytics, AI services; read-only customers, sales, users |
| 3 | Sales Executive | Read/write sales and invoices; read-only customers, products, dashboard; AI insights read-only |
| 4 | System Administrator | Full access (all methods, all resources) |

### Permission Matrix

| Resource | Owner (1) | Store Manager (2) | Sales Exec (3) | Admin (4) |
|---|---|---|---|---|
| inventory | All | GET POST PUT PATCH | — | All |
| products | All | GET POST PUT PATCH | GET | All |
| customers | All | GET | GET | All |
| sales | All | GET | GET POST | All |
| invoices | All | GET POST PATCH | GET POST | All |
| payments | All | GET POST | POST | All |
| dashboard | All | GET | GET | All |
| analytics | All | GET | GET | All |
| notifications | All | GET | GET | All |
| audit-summary | All | GET | — | All |
| users | All | GET | — | All |
| forecast | All | GET POST | GET | All |
| customer-groups | All | GET POST | GET | All |
| churn | All | GET POST | GET | All |
| recommendations | All | GET POST | GET | All |
| anomaly-detection | All | GET POST | GET | All |

Forbidden requests receive a `403` response and are logged to the audit trail.

---

## Protected Routes

### Public Routes (no token required)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account |
| `POST` | `/api/auth/login` | Authenticate and receive tokens |
| `POST` | `/api/auth/refresh` | Exchange refresh token for new access token |

### Protected Auth Routes

| Method | Path | Min Role | Description |
|---|---|---|---|
| `GET` | `/api/auth/me` | Any | Current user profile |
| `POST` | `/api/auth/logout` | Any | Log out (stateless) |
| `PATCH` | `/api/auth/change-password` | Any | Change own password |

### Protected Backend Proxy Routes

All routes below require `Authorization: Bearer <access_token>` and appropriate role:

| Method | Path | Min Role | Proxied To |
|---|---|---|---|
| `GET` | `/api/sales` | Sales Exec | Backend `/api/sales` |
| `GET` | `/api/sales/:id` | Sales Exec | Backend `/api/sales/:id` |
| `POST` | `/api/sales/upload` | Sales Exec | Backend `/api/sales/upload` |
| `GET` | `/api/inventory` | Store Manager | Backend `/api/inventory` |
| `GET` | `/api/inventory/low-stock` | Store Manager | Backend `/api/inventory/low-stock` |
| `POST` | `/api/inventory/add` | Store Manager | Backend `/api/inventory/add` |
| `PUT` | `/api/inventory/update` | Store Manager | Backend `/api/inventory/update` |
| `DELETE` | `/api/inventory/delete` | Owner/Admin | Backend `/api/inventory/delete` |
| `PATCH` | `/api/inventory/bulk` | Store Manager | Backend `/api/inventory/bulk` |
| `GET` | `/api/invoices` | Sales Exec | Backend `/api/invoices` |
| `POST` | `/api/invoices` | Sales Exec | Backend `/api/invoices` |
| `GET` | `/api/invoices/revenue/summary` | Sales Exec | Backend `/api/invoices/revenue/summary` |
| `GET` | `/api/invoices/status/:status` | Sales Exec | Backend `/api/invoices/status/:status` |
| `GET` | `/api/invoices/:id` | Sales Exec | Backend `/api/invoices/:id` |
| `GET` | `/api/invoices/:id/download` | Sales Exec | Backend `/api/invoices/:id/download` |
| `POST` | `/api/invoices/:id/payments` | Sales Exec | Backend `/api/invoices/:id/payments` |
| `POST` | `/api/invoices/overdue/check` | Store Manager | Backend `/api/invoices/overdue/check` |
| `PATCH` | `/api/invoices/bulk` | Store Manager | Backend `/api/invoices/bulk` |
| `GET` | `/api/dashboard/summary` | Sales Exec | Backend `/api/dashboard/summary` |
| `GET` | `/api/dashboard/total-revenue` | Sales Exec | Backend `/api/dashboard/total-revenue` |
| `GET` | `/api/dashboard/top-products` | Sales Exec | Backend `/api/dashboard/top-products` |
| `GET` | `/api/dashboard/sales-trend` | Sales Exec | Backend `/api/dashboard/sales-trend` |
| `GET` | `/api/products` | Sales Exec | Backend `/api/products` |
| `GET` | `/api/products/with-stock` | Sales Exec | Backend `/api/products/with-stock` |
| `GET` | `/api/customers` | Sales Exec | Backend `/api/customers` |
| `GET` | `/api/analytics/summary` | Sales Exec | Backend `/api/analytics/summary` |
| `GET` | `/api/analytics/payment-methods` | Sales Exec | Backend `/api/analytics/payment-methods` |
| `GET` | `/api/analytics/categories` | Sales Exec | Backend `/api/analytics/categories` |
| `GET` | `/api/notifications` | Sales Exec | Backend `/api/notifications` |
| `GET` | `/api/notifications/counts` | Sales Exec | Backend `/api/notifications/counts` |
| `GET` | `/api/notifications/low-stock` | Sales Exec | Backend `/api/notifications/low-stock` |
| `GET` | `/api/notifications/overdue-invoices` | Sales Exec | Backend `/api/notifications/overdue-invoices` |
| `GET` | `/api/forecast` | Sales Exec | AI 5014 → fallback Backend |
| `GET` | `/api/audit-summary` | Store Manager | Gateway (reads audit.log) |
| `GET` | `/api/users` | Store Manager | Backend `/api/users` |
| `GET` | `/api/users/:id` | Store Manager | Backend `/api/users/:id` |
| `PATCH` | `/api/users/:id/profile` | Owner/Admin | Backend `/api/users/:id/profile` |
| `PATCH` | `/api/users/:id/status` | Owner/Admin | Backend `/api/users/:id/status` |
| `DELETE` | `/api/users/:id` | Owner/Admin | Backend `/api/users/:id` |

### AI Microservice Routes

| Method | Path | Min Role | AI Service |
|---|---|---|---|
| `GET/POST` | `/api/customer-groups` | Store Manager | Port 5010 |
| `GET/POST` | `/api/churn` | Store Manager | Port 5011 |
| `GET/POST` | `/api/recommendations` | Store Manager | Port 5012 |
| `GET/POST` | `/api/anomaly-detection` | Store Manager | Port 5013 |

AI routes additionally apply `aiLimiter` (30 req / 15 min) and log an
`"AI Report Requested"` audit event on success.

---

## API Gateway Routing

The gateway proxies requests using Axios. Each request forwarded to the backend or an
AI service:

1. Attaches the original `Authorization` header (the backend re-validates the JWT independently)
2. Forwards query parameters (`req.query`) and request body (`req.body`) unchanged
3. Sets a 30-second Axios timeout
4. Returns the upstream response status and body directly to the client

### Forecast Route — Dual-Source Fallback

`GET /api/forecast` attempts the AI Forecast service (port 5014) first.
If that service is unreachable (ECONNREFUSED) or times out, the request is transparently
retried against the Backend's SMA forecast endpoint (port 5000). The client always
receives a response — the fallback is invisible.

### Audit Summary — `GET /api/audit-summary`

This route is served directly by the gateway (not proxied). It reads and parses
`logs/audit.log`, returning structured event counts, user activity summary,
severity breakdown, and recent log entries. Supports `?limit=` (default 50, max 500).
Returns an empty data structure if no log file exists yet.

---

## Rate Limiting

Five independent rate limiters are applied at the route level:

| Limiter | Limit | Window | Applied To |
|---|---|---|---|
| `authLimiter` | 10 requests | 15 minutes | `POST /api/auth/login`, `POST /api/auth/register` |
| `uploadLimiter` | 5 requests | 15 minutes | `POST /api/sales/upload` |
| `inventoryLimiter` | 30 requests | 15 minutes | Inventory write routes (add, update, delete) |
| `apiLimiter` | 200 requests | 15 minutes | All protected backend routes |
| `aiLimiter` | 30 requests | 15 minutes | All AI microservice routes |

Rate-limit triggers return `429 Too Many Requests` and are logged to the audit trail as
`"Rate limit blocked"` events.

The app sets `trust proxy: 1` so that rate limiting uses the real client IP from
`X-Forwarded-For` rather than the gateway's own IP.

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When |
|---|---|---|
| 400 | Bad Request | Joi validation failed — missing or invalid fields |
| 401 | Unauthorized | JWT missing, expired, invalid signature, or malformed payload |
| 403 | Forbidden | Valid JWT but role lacks permission for the requested resource/method |
| 403 | Forbidden | Account `isActive: false` (disabled by administrator) |
| 404 | Not Found | Route does not exist in the gateway |
| 409 | Conflict | Email already registered during `POST /api/auth/register` |
| 429 | Too Many Requests | Rate limit exceeded |
| 503 | Service Unavailable | Backend or AI service unreachable (ECONNREFUSED or timeout) |
| 500 | Internal Server Error | Unhandled gateway error |

### 401 Response Shape

```json
{
  "success": false,
  "message": "Invalid or expired token."
}
```

### 403 Response Shape

```json
{
  "success": false,
  "message": "Forbidden: Role 3 does not have permission to POST inventory."
}
```

### 400 Validation Response Shape

```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["\"email\" must be a valid email address"]
}
```

### 503 Upstream Unavailable

```json
{
  "success": false,
  "message": "Backend service is currently unavailable.",
  "service": "http://127.0.0.1:5000/api/inventory"
}
```

---

## Audit Logging

All security-relevant events are appended to `Security_API_gateway/logs/audit.log`.
The directory is created automatically on first run.

### Log Format

```
[2026-07-13T10:00:00.000Z] [WARN] Event: Unauthorized Access | Details: {"userId":"anonymous","ip":"127.0.0.1","endpoint":"/api/inventory","status":401,"reason":"Invalid or expired token"}
```

### Logged Events

| Event | Level | Trigger |
|---|---|---|
| Login Success | INFO | Successful `POST /api/auth/login` |
| Login Failure | WARN | Wrong password or user not found |
| User Logout | INFO | `POST /api/auth/logout` |
| Password Changed | INFO | Successful `PATCH /api/auth/change-password` |
| Password Change Failure | WARN | Incorrect current password |
| Unauthorized Access | WARN | 401 response on any route |
| Forbidden Attempt | WARN | 403 response on any route |
| Bad Request Validation Failure | ERROR | 400 validation error on any route |
| Rate Limit Triggered | WARN | 429 rate-limit response |
| Rate limit blocked | WARN | Rate limit middleware triggered |
| Unauthorized Attempt | ERROR | 401 captured by `auditRejectMiddleware` |
| Invoice Created | INFO | Successful `POST /api/invoices` |
| Invoice Payment Updated | INFO | Successful `POST /api/invoices/:id/payments` |
| Bulk Invoice Update | INFO | Successful `PATCH /api/invoices/bulk` |
| Inventory Change | INFO | Successful `POST /api/inventory/add` or `PUT /api/inventory/update` |
| Inventory Delete | INFO | Successful `DELETE /api/inventory/delete` |
| Inventory Low-Stock Check | INFO | `GET /api/inventory/low-stock` |
| Sales Upload | INFO | Successful `POST /api/sales/upload` |
| Notifications Accessed | INFO | `GET /api/notifications` |
| AI Report Requested | INFO | Any AI microservice route (2xx) |

The `auditRejectMiddleware` captures all 4xx/5xx responses via `res.on("finish")`,
so every failed request is logged regardless of which middleware rejected it.

---

## Security Considerations

- **Helmet** adds security-related HTTP response headers on every request
- **CORS** is enabled (configure origin in production)
- **bcrypt** with 10 rounds is used for all password hashing — plaintext passwords are never stored
- **Dual JWT validation**: gateway verifies the token and the backend re-verifies it independently — a request that bypasses the gateway still cannot reach backend data without a valid token
- **Stateless logout**: no server-side token storage or blacklist; token expiry (1h) is the primary revocation mechanism
- **New account activation gate**: registered users have `isActive: false` by default — a disabled account receives `403` at login even with the correct password
- **Server-side price enforcement**: invoice creation fetches product prices from the database — client-supplied prices cannot affect invoice totals
- **Unknown query parameter rejection**: the sales query validator uses `allowUnknown: false`, returning `400` for any unexpected parameter
- **`.env` files not tracked**: all sensitive configuration is excluded from Git and provided through deployment secrets

---

## Environment Configuration

The gateway reads its environment from `.env` in the `Security_API_gateway/` directory
(or the project root `.env` as a fallback).

> **Never commit `.env` files.** The root `.gitignore` excludes `.env` and all `.env.*`
> variants. Production secrets must be provided through deployment environment variables
> or a secrets manager.

### Required Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (same database as backend) |
| `JWT_SECRET` | Signs and verifies JWT access tokens |
| `REFRESH_TOKEN_SECRET` | Signs and verifies JWT refresh tokens (must differ from JWT_SECRET) |
| `BACKEND_API_URL` | Internal URL of the Backend API |
| `PORT` | Gateway server port (default: 7000) |

### Optional AI Service Variables

| Variable | Default | Description |
|---|---|---|
| `CUSTOMER_SEGMENTATION_URL` | `http://127.0.0.1:5010` | AI customer segmentation service |
| `CHURN_PREDICTION_URL` | `http://127.0.0.1:5011` | AI churn prediction service |
| `RECOMMENDATION_URL` | `http://127.0.0.1:5012` | AI recommendations service |
| `ANOMALY_DETECTION_URL` | `http://127.0.0.1:5013` | AI anomaly detection service |
| `FORECAST_API_URL` | `http://127.0.0.1:5014` | AI forecast service (fallback: backend) |

### Example `.env` (placeholders only)

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
BACKEND_API_URL=http://127.0.0.1:5000/api
PORT=7000
```

---

## Backend Integration

The gateway shares the same PostgreSQL database as the backend.
It uses its own Prisma client singleton (`global._gatewayPrisma`) for auth operations
(user lookup, `lastLoginAt` update, password hash comparison).

The gateway Prisma schema (`Security_API_gateway/prisma/schema.prisma`) is kept in sync
with the backend schema. The gateway schema uses `String` for `Invoice.status` and
`Payment.method` (instead of enums) to decouple enum migrations between the two services
— both still read and write the same underlying column values.

---

## Testing

```bash
npm test
```

Runs all Jest test suites with `--runInBand`.

| Test File | Tests | What it covers |
|---|---|---|
| `tests/security.test.js` | 38 | Expired JWT, invalid JWT, RBAC by role, rate limiting, malformed payloads, sales query validation, proxy forwarding, `/me`, logout, forecast |
| `tests/gateway.integration.test.js` | 5 | Full middleware chain: 401 without token, 200 with token, RBAC 403, rate limiter 429, invalid/expired token rejection, file upload forwarding |
| `tests/app.routes.test.js` | 4 | Auth route registration, login, refresh validation |
| `tests/auth.login.test.js` | 1 | Login with mocked Prisma — returns tokens on valid credentials |
| `tests/auth.register.test.js` | 1 | Registration with mocked Prisma — returns 201 on success |
| `tests/authenticate.middleware.test.js` | 3 | Missing header → 401, invalid token → 401, valid token → req.user set |
| `tests/authorize.middleware.test.js` | 4 | RBAC middleware unit tests |
| `tests/forecast.gateway.test.js` | — | Forecast proxy: AI service upstream, fallback, query forwarding, error propagation |
| `tests/invoice-ai-security.test.js` | — | Invoice + AI route security tests |
| `tests/milestone3.security.test.js` | — | Milestone 3 security regression suite |

Current test count: **116 tests passing** across 10 suites.

---

## Docker / Deployment

The gateway is containerized via `Devops_Integration/Dockerfile.security`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY Security_API_gateway/package*.json ./
RUN npm install
COPY Security_API_gateway/ ./
RUN npx prisma generate
EXPOSE 7000
CMD ["node", "src/server.js"]
```

`npx prisma generate` runs during the Docker build so the Prisma client is compiled for
the Alpine Linux environment. Schema migrations are handled by the Backend container at
startup — the gateway does not run migrations.

### Docker Compose Commands

```bash
# Start the full stack
docker compose -f Devops_Integration\docker-compose.yml up -d

# Rebuild only the security gateway (after schema or code changes)
docker compose -f Devops_Integration\docker-compose.yml build --no-cache security-gateway

# Check container health
docker compose -f Devops_Integration\docker-compose.yml ps

# Check gateway logs
docker compose -f Devops_Integration\docker-compose.yml logs --tail=50 security-gateway

# Stop the stack (preserves postgres_data volume)
docker compose -f Devops_Integration\docker-compose.yml down
```

The gateway depends on both `postgres` (healthy) and `backend` (healthy) before starting.
A shared Docker `logs` volume is mounted between the backend and gateway containers.

---

## Running the Security API Gateway

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running (same instance as the backend)
- Backend API running on port 5000
- `.env` file configured with all required variables

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Start the gateway
npm start               # production
npm run dev             # development (nodemon auto-reload)
```

Gateway starts on **http://localhost:7000**

**Swagger UI:** http://localhost:7000/api-docs

**Health check:** `GET http://localhost:7000/` returns service info and resolved port map.

---

## Environment Variables

See the [Environment Configuration](#environment-configuration) section above.

Summary of variable names (no values — provide these through your deployment environment):

```
DATABASE_URL
JWT_SECRET
REFRESH_TOKEN_SECRET
BACKEND_API_URL
PORT
CUSTOMER_SEGMENTATION_URL
CHURN_PREDICTION_URL
RECOMMENDATION_URL
ANOMALY_DETECTION_URL
FORECAST_API_URL
```

---

## Milestone 1 — Security Foundation

**Focus:** Establishing the authentication and project structure alongside the backend.

- Node.js/Express gateway project created on port 7000
- JWT strategy agreed: gateway issues tokens, backend verifies them
- 4 user roles defined: Business Owner (1), Store Manager (2), Sales Executive (3), System Administrator (4)
- Role table created in PostgreSQL (shared database)
- Prisma schema set up to mirror the backend User/Role models
- `POST /api/auth/register` implemented with bcrypt password hashing and duplicate-email check
- `POST /api/auth/login` implemented — verifies credentials, issues both access and refresh tokens
- `GET /api/auth/me` implemented — returns authenticated user profile
- `authenticate` middleware implemented — verifies JWT and attaches `req.user`
- Gateway project structure established with modular routes, controllers, middleware, and config

---

## Milestone 2 — Backend Integration

**Focus:** Connecting the gateway to the backend API and implementing authorization.

- `authorize.js` RBAC middleware implemented with the full 4-role × resource permission matrix
- All backend API routes proxied through the gateway: sales, inventory, dashboard, products, customers, analytics, invoices
- `POST /api/auth/refresh` implemented — accepts refresh token, issues new access token
- JWT token helpers centralized in `src/auth/jwt.js` (`createAccessToken`, `createRefreshToken`)
- Request validation with Joi added for inventory, invoice, and sales query parameters
- Axios proxy layer implemented with 30-second timeout and `Authorization` header forwarding
- `Multer` file forwarding implemented for CSV upload proxy (`POST /api/sales/upload`)
- Helmet security headers added to all gateway responses
- Rate limiters configured: `authLimiter` (10/15min), `uploadLimiter` (5/15min), `inventoryLimiter` (30/15min), `apiLimiter` (200/15min)
- `auditLogger.js` implemented: writes all security events to `logs/audit.log`
- `auditRejectMiddleware` captures all 4xx/5xx responses on `res.on("finish")`

---

## Milestone 3 — Security API Gateway

**Focus:** Completing the gateway as the sole entry point with full audit, AI routing, and advanced security features.

- AI microservice proxy routes added — one dedicated route file per service, one port per service:
  - `/api/customer-groups` → port 5010
  - `/api/churn` → port 5011
  - `/api/recommendations` → port 5012
  - `/api/anomaly-detection` → port 5013
  - `/api/forecast` → port 5014 with transparent fallback to backend SMA
- `aiLimiter` added (30 req / 15 min) applied separately to AI routes
- `auditSuccessfulAction` factory implemented — logs 2xx audit events for key write operations
- `/api/audit-summary` endpoint added — reads and summarizes `logs/audit.log` with event/user/level counts
- Notification proxy routes added: `/api/notifications`, `/api/notifications/counts`, `/api/notifications/low-stock`, `/api/notifications/overdue-invoices`
- Bulk invoice and inventory proxy routes added with Joi validation: `PATCH /api/invoices/bulk`, `PATCH /api/inventory/bulk`
- Invoice download proxy (`GET /api/invoices/:id/download`) uses `responseType: "arraybuffer"` to preserve binary content
- Sales query validation tightened — `allowUnknown: false` rejects unexpected query parameters with 400
- Notification validation schema added covering type filtering and bulk operations
- Gateway startup environment check warns on missing `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `BACKEND_API_URL`
- Service URL map logged on startup for deployment debugging
- Full test suite: 10 test suites, 116 tests covering JWT, RBAC, rate limiting, validation, proxy forwarding
- Swagger/OpenAPI documentation (`swagger.json`) covering all 17+ gateway endpoints

---

## Milestone 4 — Security & Production Readiness

**Focus:** Security hardening, user management integration, and deployment preparation.

### Account Lifecycle Security

- `isActive` check added to login — disabled accounts receive `403` before password comparison
- `isPending: true` set on registration — new accounts cannot log in until activated
- `lastLoginAt` written atomically to the database on every successful login
- `POST /api/auth/logout` audit-logged with user ID and IP
- `PATCH /api/auth/change-password` implemented with bcrypt verification and minimum-length enforcement

### User Management Proxy

- `/api/users` proxy routes added: list, get by ID, update profile, toggle status, soft-delete
- RBAC permissions configured: Store Manager (GET only), Owner/Admin (full access)

### Gateway Schema Synchronization

- Security gateway `prisma/schema.prisma` updated to match backend schema additions:
  - `lastLoginAt DateTime?` added to `User` model
  - `isActive Boolean @default(true)` added to `User` model
  - `isDeleted Boolean @default(false)` added to `User` model
  - `isPending Boolean @default(false)` added to `User` model
- Gateway Prisma client regenerated — resolves `PrismaClientValidationError: Unknown argument 'lastLoginAt'` in Docker

### Environment Security

- `.env` files removed from Git tracking across the repository
- Root `.gitignore` excludes `.env` and `.env.*` (with `.env.example` exception)
- `Devops_Integration/.env.example` sanitized — contains only placeholder variable names, no real values
- All secrets (`JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `DATABASE_URL`) must be provided through deployment environment variables

### Docker

- `Devops_Integration/Dockerfile.security` builds a production Node.js 18 Alpine image
- `npx prisma generate` runs at build time — Prisma client compiled for Alpine Linux
- Gateway container depends on postgres healthy + backend healthy before starting
- Shared `logs` Docker volume between backend and gateway for audit log persistence
- See `docs/MILESTONE4_SECURITY_CHECKLIST.md` for the pre-deployment verification checklist
