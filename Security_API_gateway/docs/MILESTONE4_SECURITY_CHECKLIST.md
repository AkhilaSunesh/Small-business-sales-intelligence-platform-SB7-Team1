# MarketMind AI — Milestone 4 Security Checklist
**Intern 2 — Security & API Gateway Developer**

> Complete every item in this checklist before the Milestone 4 live deployment goes public.
> Mark items ✅ only when actually verified — not just attempted.

---

## Pre-Deployment Checks

### Environment

- [ ] `JWT_SECRET` is at least 32 random characters — never the development value
- [ ] `REFRESH_TOKEN_SECRET` is different from `JWT_SECRET`
- [ ] `DATABASE_URL` points to the production database
- [ ] `.env` files are **not** committed to Git
- [ ] `NODE_ENV=production` is set in all deployed services
- [ ] All AI service URLs (`CUSTOMER_SEGMENTATION_URL` etc.) point to correct production hosts

---

## Authentication

- [ ] `POST /api/auth/login` with valid credentials → `200 { accessToken, refreshToken }`
- [ ] `POST /api/auth/login` with wrong password → `401 { "success": false }`
- [ ] `POST /api/auth/login` with unknown email → `401 { "success": false }`
- [ ] `POST /api/auth/refresh` with valid refresh token → `200 { accessToken }`
- [ ] `POST /api/auth/refresh` with expired/invalid token → `403`
- [ ] `GET /api/auth/me` with valid token → `200 { user }`
- [ ] `GET /api/auth/me` without token → `401`
- [ ] `POST /api/auth/logout` with valid token → `200` + audit log entry
- [ ] Auth rate limiter: 11 rapid login attempts from same IP → `429`

---

## JWT Verification

- [ ] Expired access token → `401 { "message": "Invalid or expired token." }`
- [ ] Token signed with wrong secret → `401`
- [ ] Token with missing `roleId` claim → `401 { "message": "Invalid authentication token." }`
- [ ] Token without `Bearer ` prefix → `401`
- [ ] Valid token is forwarded to backend (Authorization header passes through proxy)

---

## RBAC Verification

- [ ] Role 1 (Business Owner) can `DELETE /api/inventory/delete` → not 403
- [ ] Role 2 (Store Manager) can `GET /api/notifications` → not 403
- [ ] Role 2 can `GET /api/audit-summary` → not 403
- [ ] Role 3 (Sales Executive) **cannot** `PATCH /api/invoices/bulk` → `403`
- [ ] Role 3 **cannot** `GET /api/audit-summary` → `403`
- [ ] Role 3 **cannot** `GET /api/customer-groups` → `403`
- [ ] Role 3 **cannot** `POST /api/inventory/add` → `403`
- [ ] Role 4 (System Admin) can access all endpoints → not 403

---

## Notification API Tested

- [ ] `GET /api/notifications` without token → `401`
- [ ] `GET /api/notifications` with Role 3 token → `200` (Role 3 has read access)
- [ ] `GET /api/notifications/counts` → `200 { total, lowStock, overdueInvoices, critical }`
- [ ] `GET /api/notifications/low-stock` → `200 { data, pagination }`
- [ ] `GET /api/notifications/overdue-invoices` → `200 { data, pagination }`
- [ ] `GET /api/notifications?type=INVALID` → `400`

---

## Bulk APIs Tested

- [ ] `PATCH /api/invoices/bulk` — empty `ids` array → `400`
- [ ] `PATCH /api/invoices/bulk` — invalid `status` → `400`
- [ ] `PATCH /api/invoices/bulk` — non-UUID in ids → `400`
- [ ] `PATCH /api/invoices/bulk` — Role 3 token → `403`
- [ ] `PATCH /api/invoices/bulk` — malformed JSON body → `400` (not 500)
- [ ] `PATCH /api/inventory/bulk` — negative `quantity` → `400`
- [ ] `PATCH /api/inventory/bulk` — empty `updates` → `400`
- [ ] `PATCH /api/inventory/bulk` — Role 3 token → `403`

---

## Audit Summary Tested

- [ ] `GET /api/audit-summary` without token → `401`
- [ ] `GET /api/audit-summary` with Role 3 token → `403`
- [ ] `GET /api/audit-summary` with Role 1 token → `200`
- [ ] Response contains `eventCounts`, `userCounts`, `recentEntries`, `dateRange`
- [ ] `?limit=10` returns at most 10 recent entries

---

## Validation Tested

- [ ] `POST /api/auth/register` with missing `name` → `400 { errors: [...] }`
- [ ] `POST /api/auth/register` with `roleId: 99` → `400`
- [ ] `POST /api/invoices` with missing `customerId` → `400`
- [ ] `POST /api/invoices` with negative `unitPrice` → `400`
- [ ] `GET /api/sales?page=abc` → `400`
- [ ] `GET /api/sales?foo=bar` (unknown param) → `400`

---

## Security Tests Passed

- [ ] Run `npm test` in `Security_API_gateway/` → **all tests pass**
- [ ] Run `npm test` in `Backend_Databse/` → **all tests pass**
- [ ] No test is disabled or skipped

---

## Swagger Verified

- [ ] `GET http://localhost:7000/api-docs` loads Swagger UI
- [ ] All paths are visible: Auth, Inventory, Sales, Dashboard, Invoices, Notifications, AuditSummary, AI, Forecast
- [ ] `/api/customer-groups`, `/api/churn`, `/api/recommendations`, `/api/anomaly-detection` documented
- [ ] `/api/notifications`, `/api/notifications/counts`, `/api/notifications/low-stock`, `/api/notifications/overdue-invoices` documented
- [ ] `/api/invoices/bulk`, `/api/inventory/bulk` documented
- [ ] `/api/audit-summary` documented

---

## Final Sign-Off

- [ ] All checklist items above are marked ✅
- [ ] Security & Access Guide (`SECURITY_ACCESS_GUIDE.md`) is up to date
- [ ] No secrets are in the codebase
- [ ] Milestone 4 deployment configuration is reviewed and ready

**Signed off by:** __________________________ **Date:** ______________
