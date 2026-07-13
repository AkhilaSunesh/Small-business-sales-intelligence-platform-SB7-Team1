# MarketMind AI — Security API Gateway

Application gateway and security layer built with **Node.js · Express · Prisma · JWT · Joi**.

Runs on **port 7000**. All frontend and AIML requests must go through this service — never directly to the backend on port 5000.

---

## Architecture

```
Client (Frontend / AIML)
        │
        ▼
Security API Gateway  :7000
  ├─ POST  /api/auth/*          ← public (register, login, refresh, logout, me)
  ├─ authenticate middleware     ← JWT verification
  ├─ authorize middleware        ← RBAC (role vs resource vs method)
  ├─ apiLimiter                  ← 200 req / 15 min per IP
  ├─ Joi validation              ← rejects malformed payloads
  └─ axios reverse proxy
        │
        ▼
Backend Database API  :5000    ← never exposed publicly
```

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+ (shared database with Backend service)
- Backend service running on port 5000

### 2. Environment
```
PORT=7000
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/marketmind?schema=public"
JWT_SECRET=marketmind_security_2026
REFRESH_TOKEN_SECRET=marketmind_refresh_secret_2026
BACKEND_API=http://localhost:5000
BACKEND_API_URL=http://localhost:5000/api
```

### 3. Install
```bash
npm install
```

### 4. Generate Prisma client
```bash
npx prisma generate
```

### 5. Start
```bash
npm start          # production
npm run dev        # nodemon watch mode
```

### 6. Swagger UI
```
http://localhost:7000/api-docs
```

---

## API Overview

### Public routes (no token required)

| Method | Route                  | Description                  | Rate limit         |
|--------|------------------------|------------------------------|--------------------|
| POST   | /api/auth/register     | Create account               | 10 / 15 min        |
| POST   | /api/auth/login        | Issue access + refresh token | 10 / 15 min        |
| POST   | /api/auth/refresh      | Re-issue access token        | none               |

### Protected routes (Bearer JWT required)

| Method | Route                        | Min role | Description                            |
|--------|------------------------------|----------|----------------------------------------|
| GET    | /api/auth/me                 | any      | Current user profile with role name    |
| POST   | /api/auth/logout             | any      | Stateless logout (audit logged)        |
| GET    | /api/inventory               | 2        | All inventory + low-stock flags        |
| GET    | /api/inventory/low-stock     | 2        | Items at or below threshold only       |
| POST   | /api/inventory/add           | 2        | Increment stock                        |
| PUT    | /api/inventory/update        | 2        | Set absolute stock level               |
| DELETE | /api/inventory/delete        | 1        | Remove inventory record                |
| GET    | /api/sales                   | 2        | Paginated list (Joi query validation)  |
| GET    | /api/sales/:id               | 2        | Single transaction                     |
| POST   | /api/sales/upload            | 3        | CSV upload (5 / 15 min limit)          |
| GET    | /api/dashboard/summary       | 2        | KPI: customers, products, sales, rev   |
| GET    | /api/analytics/summary       | 2        | Revenue, count, top-5 products         |
| GET    | /api/products                | 2        | Product catalogue                      |
| GET    | /api/customers               | 2        | Customer list                          |

---

## JWT Token Structure

### Access Token — expires 1 hour
```json
{ "id": "uuid", "email": "user@example.com", "roleId": 2 }
```

### Refresh Token — expires 7 days
```json
{ "id": "uuid" }
```

---

## Role Permission Matrix

| Resource   | Method         | Role 1 (Owner) | Role 2 (Manager) | Role 3 (Sales Exec) | Role 4 (Admin) |
|------------|----------------|:--------------:|:----------------:|:-------------------:|:--------------:|
| inventory  | GET            | ✅             | ✅               | ❌                  | ✅             |
| inventory  | POST/PUT/DELETE | ✅            | ✅ (POST/PUT)    | ❌                  | ✅             |
| sales      | GET            | ✅             | ✅               | ✅                  | ✅             |
| sales      | POST (upload)  | ✅             | ❌               | ✅                  | ✅             |
| products   | GET            | ✅             | ✅               | ✅                  | ✅             |
| customers  | GET            | ✅             | ✅               | ✅                  | ✅             |
| dashboard  | GET            | ✅             | ✅               | ❌                  | ✅             |
| analytics  | GET            | ✅             | ✅               | ❌                  | ✅             |

---

## Rate Limits

| Limiter          | Routes                    | Window   | Max    |
|------------------|---------------------------|----------|--------|
| `authLimiter`    | /api/auth/register, login | 15 min   | 10     |
| `uploadLimiter`  | /api/sales/upload         | 15 min   | 5      |
| `inventoryLimiter` | inventory write ops     | 15 min   | 30     |
| `apiLimiter`     | all protected routes      | 15 min   | 200    |

---

## Audit Logging

All security events are written to `logs/audit.log`:

| Event                        | Trigger                            | Level  |
|------------------------------|------------------------------------|--------|
| User Login                   | Successful login                   | INFO   |
| Login Failure                | Bad credentials / unknown user     | WARN   |
| User Logout                  | POST /api/auth/logout              | INFO   |
| Sales Upload                 | Successful CSV upload              | INFO   |
| Sales List                   | GET /api/sales                     | INFO   |
| Inventory List               | GET /api/inventory                 | INFO   |
| Inventory Low-Stock Check    | GET /api/inventory/low-stock       | INFO   |
| Inventory Change             | POST/PUT inventory                 | INFO   |
| Inventory Delete             | DELETE inventory                   | INFO   |
| Unauthorized Access          | Missing/invalid/expired token      | WARN   |
| Unauthorized Access (RBAC)   | Role lacks permission              | WARN   |
| Rate Limit Triggered         | 429 from any limiter               | WARN   |
| Bad Request Validation Failure | Joi rejection                    | ERROR  |

---

## Running Tests

```bash
npm test                   # all 6 test suites
npm test -- --coverage     # with coverage report
```

### Test suites

| File                                  | Tests | Coverage area                         |
|---------------------------------------|-------|---------------------------------------|
| tests/security.test.js                | 38    | Expired JWT, RBAC, rate-limit, Joi, proxy |
| tests/gateway.integration.test.js     | 5     | End-to-end gateway flows              |
| tests/app.routes.test.js              | 4     | Auth route wiring                     |
| tests/authenticate.middleware.test.js | 3     | JWT middleware unit                   |
| tests/authorize.middleware.test.js    | 4     | RBAC middleware unit                  |
| tests/auth.login.test.js              | 1     | Login controller unit                 |
| tests/auth.register.test.js           | 1     | Register controller unit              |

---

## Project Structure

```
Security_API_gateway/
├── src/
│   ├── app.js                    # Express app — middleware stack + route mounting
│   ├── server.js                 # HTTP server entry point
│   ├── auth/
│   │   ├── auth.controller.js    # register, login, refresh, me, logout
│   │   ├── jwt.js                # createAccessToken, createRefreshToken, verify*
│   │   ├── login.js              # thin re-export of login/refreshToken
│   │   └── register.js           # thin re-export of register
│   ├── services/
│   │   └── auth.service.js       # DB-level auth business logic
│   ├── config/
│   │   └── prisma.js             # Prisma singleton
│   ├── middleware/
│   │   ├── authenticate.js       # JWT verification → req.user
│   │   ├── authorize.js          # RBAC permission matrix
│   │   ├── auditLogger.js        # logEvent() + auditRejectMiddleware
│   │   └── rateLimiter.js        # authLimiter, uploadLimiter, inventoryLimiter, apiLimiter
│   ├── routes/
│   │   ├── auth.routes.js        # /api/auth/*
│   │   ├── inventory.routes.js   # /api/inventory/* (proxy + audit)
│   │   ├── sales.routes.js       # /api/sales/* (proxy + Joi query validation + audit)
│   │   ├── dashboard.routes.js   # /api/dashboard/*
│   │   ├── products.routes.js    # /api/products/*
│   │   ├── customers.routes.js   # /api/customers/*
│   │   └── analytics.routes.js   # /api/analytics/*
│   └── validations/
│       ├── auth.validation.js    # register, login, refresh Joi schemas
│       ├── inventory.validation.js # add, update, delete Joi schemas
│       └── sales.validation.js   # validateSalesQuery Joi schema
├── prisma/
│   └── schema.prisma             # mirrors Backend schema (auth queries only)
├── tests/                        # Jest test suites
├── logs/                         # audit.log written here at runtime
├── swagger.json                  # OpenAPI 3.0.3 — all 17 endpoints
├── postman_collection.json        # Importable Postman collection
├── Auth_Strategy.md              # Authentication design document
├── Roles_Table.md                # Role and permission reference
└── jest.config.js
```
