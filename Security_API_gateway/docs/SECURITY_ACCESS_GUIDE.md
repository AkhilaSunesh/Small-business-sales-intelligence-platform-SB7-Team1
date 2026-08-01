# MarketMind AI — Security & Access Guide
**Intern 2 — Security & API Gateway Developer | Milestone 3 Update**

---

## 1. Authentication — JWT

### Token Structure

All API access requires a Bearer JWT in the `Authorization` header:
```
Authorization: Bearer <accessToken>
```

**Access Token** — short-lived, expires in **1 hour**
```json
{ "id": "uuid", "email": "user@example.com", "roleId": 2 }
```

**Refresh Token** — long-lived, expires in **7 days**
```json
{ "id": "uuid" }
```

### Login Flow
1. `POST /api/auth/login` with `{ email, password }`
2. Gateway validates credentials (bcrypt, 10 rounds) against PostgreSQL
3. Returns `{ accessToken, refreshToken, user }`
4. Client stores tokens; all subsequent requests include `Authorization: Bearer <token>`
5. On 401 response: call `POST /api/auth/refresh` with `{ refreshToken }` to get a new access token

### Token Refresh
```
POST /api/auth/refresh
{ "refreshToken": "..." }
→ { "success": true, "accessToken": "..." }
```

### Logout
```
POST /api/auth/logout   (requires valid access token)
```
Stateless — server logs the event but does not blacklist the token. Client must discard both tokens.

---

## 2. RBAC — Role-Based Access Control

### Roles

| roleId | Role Name | Description |
|--------|-----------|-------------|
| 1 | Business Owner | Full access to everything |
| 2 | Store Manager | Inventory, sales views, all AI, notifications, audit |
| 3 | Sales Executive | Sales, invoices, customers, notifications (read-only) |
| 4 | System Administrator | Full access to everything |

### Permission Matrix (Milestone 1 + 2 + 3)

| Resource | Methods | Role 1 | Role 2 | Role 3 | Role 4 |
|----------|---------|:------:|:------:|:------:|:------:|
| `/api/inventory` | GET | ✅ | ✅ | ❌ | ✅ |
| `/api/inventory/add,update,delete` | POST/PUT/DELETE | ✅ | ✅ | ❌ | ✅ |
| `/api/inventory/bulk` | PATCH | ✅ | ✅ | ❌ | ✅ |
| `/api/sales` | GET | ✅ | ✅ | ✅ | ✅ |
| `/api/sales/upload` | POST | ✅ | ❌ | ✅ | ✅ |
| `/api/invoices` | GET, POST | ✅ | ✅ | ✅ | ✅ |
| `/api/invoices/bulk` | PATCH | ✅ | ✅ | ❌ | ✅ |
| `/api/customers` | GET | ✅ | ✅ | ✅ | ✅ |
| `/api/products` | GET | ✅ | ✅ | ✅ | ✅ |
| `/api/dashboard` | GET | ✅ | ✅ | ✅ | ✅ |
| `/api/analytics` | GET | ✅ | ✅ | ✅ | ✅ |
| `/api/forecast` | GET | ✅ | ✅ | ✅ | ✅ |
| `/api/notifications` | GET | ✅ | ✅ | ✅ | ✅ |
| `/api/audit-summary` | GET | ✅ | ✅ | ❌ | ✅ |
| `/api/customer-groups` | GET, POST | ✅ | ✅ | ❌ | ✅ |
| `/api/churn` | GET, POST | ✅ | ✅ | ❌ | ✅ |
| `/api/recommendations` | GET, POST | ✅ | ✅ | ❌ | ✅ |
| `/api/anomaly-detection` | GET, POST | ✅ | ✅ | ❌ | ✅ |

---

## 3. Protected APIs

All routes except `POST /api/auth/register`, `POST /api/auth/login`, and `POST /api/auth/refresh` require authentication.

**Middleware chain for every protected route:**
```
Request
  → authenticate      (JWT verify — 401 on failure)
  → authorize         (RBAC matrix check — 403 on failure)
  → apiLimiter        (200 req / 15 min — 429 on breach)
  → [route-specific limiter if applicable]
  → Joi validation    (400 on malformed payload)
  → axios proxy       (forwards to backend / AI service)
```

---

## 4. Bulk APIs (Milestone 3)

### PATCH /api/invoices/bulk
- **Who:** Roles 1, 2, 4 (Role 3 gets 403)
- **Body:** `{ "ids": ["uuid", ...], "status": "PAID" }`
- **Validation:** Joi at gateway — ids must be UUIDs, max 100, status must be valid enum
- **Audit:** Logged as `"Bulk Invoice Update"` on success

### PATCH /api/inventory/bulk
- **Who:** Roles 1, 2, 4 (Role 3 gets 403)
- **Body:** `{ "updates": [{ "productCode": "P001", "quantity": 50 }, ...] }`
- **Validation:** Joi at gateway — productCode required, quantity integer ≥ 0, max 100

---

## 5. Notifications API (Milestone 3)

All roles (1–4) can read notifications.

| Endpoint | Description |
|----------|-------------|
| `GET /api/notifications` | Combined low-stock + overdue invoices. Supports `?type=LOW_STOCK\|OVERDUE_INVOICE&page=&limit=` |
| `GET /api/notifications/counts` | Badge counts only: `{ total, lowStock, overdueInvoices, critical }` |
| `GET /api/notifications/low-stock` | Only inventory items ≤ their threshold |
| `GET /api/notifications/overdue-invoices` | Only invoices past dueDate with unpaid/partial status |

---

## 6. Audit Summary API (Milestone 3)

- **Who:** Roles 1, 2, 4 only (Role 3 gets 403 — Sales Executives cannot access audit logs)
- **Endpoint:** `GET /api/audit-summary?limit=50`
- **Returns:** `{ totalEntries, eventCounts, userCounts, levelCounts, recentEntries, dateRange }`
- **Source:** Reads `logs/audit.log` — the same log written by `auditLogger.js`

---

## 7. Rate Limiting

| Limiter | Applied to | Window | Max |
|---------|-----------|--------|-----|
| `authLimiter` | POST /api/auth/register, /api/auth/login | 15 min | 10 |
| `uploadLimiter` | POST /api/sales/upload | 15 min | 5 |
| `inventoryLimiter` | POST/PUT/DELETE /api/inventory/* | 15 min | 30 |
| `apiLimiter` | All protected routes | 15 min | 200 |
| `aiLimiter` | All /api/customer-groups, /api/churn, /api/recommendations, /api/anomaly-detection | 15 min | 30 |

Rate-limit breaches return `429 { "success": false, "message": "Too many requests..." }` and are recorded in the audit log.

---

## 8. Joi Validation (Gateway Layer)

Malformed requests are rejected at the gateway before reaching the backend.

| Schema | Used on | Key rules |
|--------|---------|-----------|
| `validateRegister` | POST /api/auth/register | name required, email format, password min 6, roleId in [1,2,3,4] |
| `validateLogin` | POST /api/auth/login | email format, password required |
| `validateRefresh` | POST /api/auth/refresh | refreshToken required |
| `validateCreateInvoice` | POST /api/invoices | customerId UUID, lineItems min 1, unitPrice > 0 |
| `validateRecordPayment` | POST /api/invoices/:id/payments | amount > 0, method enum |
| `validateBulkInvoice` | PATCH /api/invoices/bulk | ids array of UUIDs min 1 max 100, status enum |
| `validateBulkInventory` | PATCH /api/inventory/bulk | updates array min 1 max 100, quantity ≥ 0 |
| `validateAdd` | POST /api/inventory/add | productCode required, quantity ≥ 1 |
| `validateUpdate` | PUT /api/inventory/update | productCode required, quantity ≥ 0 |
| `validateDelete` | DELETE /api/inventory/delete | productCode required |
| `validateSalesQuery` | GET /api/sales | page ≥ 1, pageSize max 100, UUID format, ISO dates |

All validators use `abortEarly: false` — all errors are returned at once.

---

## 9. Known Limitations

- **Refresh token blacklist:** Not implemented. Stolen refresh tokens remain valid until expiry (7 days). Mitigation: short access token (1 h) limits blast radius.
- **Rate limits in memory:** Per-IP, in-memory. Behind NAT/load-balancer, use Redis store for production.
- **Audit log rotation:** No rotation implemented. `logs/audit.log` grows indefinitely. Add `logrotate` or a cron job in production.

---

*Last updated: Milestone 3*
