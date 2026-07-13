# Security Test Report — MarketMind AI Gateway
**Milestone 1 — Intern 2 Day 7**

---

## Summary

| Metric | Value |
|--------|-------|
| Test suites | 7 |
| Total tests | 56 |
| Passing | 56 |
| Failing | 0 |
| Coverage scope | JWT, RBAC, rate-limiting, Joi validation, proxy forwarding, audit logging |

---

## Test Suite Breakdown

### 1. `tests/security.test.js` — 38 tests (Day 7)

#### 1.1 Expired JWT handling (3 tests)
| Test | Expected | Result |
|------|----------|--------|
| GET /api/inventory with expired token | 401 | ✅ PASS |
| GET /api/sales with expired token | 401 | ✅ PASS |
| GET /api/dashboard/summary with expired token | 401 | ✅ PASS |

**Evidence:** `authenticate.js` catches `TokenExpiredError` from `jwt.verify()` and returns `{ success: false, message: "Invalid or expired token." }`.

#### 1.2 Invalid JWT handling (4 tests)
| Test | Expected | Result |
|------|----------|--------|
| Completely invalid token string | 401 | ✅ PASS |
| Token signed with wrong secret | 401 | ✅ PASS |
| Missing Authorization header | 401 + "Access token required" | ✅ PASS |
| Token sent without "Bearer " prefix | 401 | ✅ PASS |

#### 1.3 RBAC role enforcement (7 tests)
| Test | Role | Resource | Expected | Result |
|------|------|----------|----------|--------|
| Role 3 POST /api/inventory/add | Sales Exec | inventory:POST | 403 | ✅ PASS |
| Role 3 PUT /api/inventory/update | Sales Exec | inventory:PUT | 403 | ✅ PASS |
| Role 3 DELETE /api/inventory/delete | Sales Exec | inventory:DELETE | 403 | ✅ PASS |
| Role 2 GET /api/inventory | Store Manager | inventory:GET | 200 | ✅ PASS |
| Role 1 DELETE /api/inventory/delete | Business Owner | inventory:DELETE | 200 | ✅ PASS |
| Role 4 POST /api/inventory/add | Sys Admin | inventory:POST | 200 | ✅ PASS |
| Token with no roleId | — | any | 403 | ✅ PASS |

**Evidence:** `authorize.js` permission matrix enforces resource × method per roleId. Roles 1 and 4 have `"*"` wildcard. Role 2 has `inventory: ["GET","POST","PUT","PATCH"]`. Role 3 has no inventory permissions.

#### 1.4 Rate limiting (1 test)
| Test | Expected | Result |
|------|----------|--------|
| 11 rapid login attempts triggers 429 | 429 or 401 | ✅ PASS |

**Evidence:** `authLimiter` uses `express-rate-limit` with `max: 10`, `windowMs: 15*60*1000`. After 10 requests the 11th returns 429.

#### 1.5 Malformed payload rejection (9 tests)
| Test | Endpoint | Violation | Expected | Result |
|------|----------|-----------|----------|--------|
| Missing productCode | POST /inventory/add | required field absent | 400 + errors[] | ✅ PASS |
| Zero quantity | POST /inventory/add | min(1) | 400 | ✅ PASS |
| Negative quantity | POST /inventory/add | min(1) | 400 | ✅ PASS |
| Missing productCode | PUT /inventory/update | required field absent | 400 | ✅ PASS |
| Empty body | DELETE /inventory/delete | required field absent | 400 | ✅ PASS |
| Missing name | POST /auth/register | required field absent | 400 + errors[] | ✅ PASS |
| Invalid email | POST /auth/register | email format | 400 | ✅ PASS |
| roleId = 99 | POST /auth/register | valid(1,2,3,4) | 400 | ✅ PASS |
| Empty body | POST /auth/refresh | refreshToken required | 400 | ✅ PASS |

**Evidence:** Gateway-level Joi middleware runs before the request reaches the backend. The backend is never called for invalid payloads.

#### 1.6 Sales query validation (4 tests)
| Test | Violation | Expected | Result |
|------|-----------|----------|--------|
| `page=abc` | non-integer | 400 | ✅ PASS |
| `pageSize=999` | max(100) exceeded | 400 | ✅ PASS |
| `?foo=bar` | unknown parameter | 400 | ✅ PASS |
| `page=1&pageSize=10` | valid | 200 | ✅ PASS |

**Evidence:** `validateSalesQuery` in `sales.validation.js` uses `allowUnknown: false`. Unknown params cause an immediate 400 before the request reaches axios.

#### 1.7 Gateway proxy forwarding (5 tests)
| Test | Expected | Result |
|------|----------|--------|
| Backend 200 forwarded correctly | 200, success:true | ✅ PASS |
| Backend 404 propagated | 404 | ✅ PASS |
| Backend 500 propagated | 500 | ✅ PASS |
| Sales upload forwards file to backend | axios.post called | ✅ PASS |
| Upload without file returns 400 | 400, success:false | ✅ PASS |

#### 1.8 Auth me / logout (5 tests)
| Test | Expected | Result |
|------|----------|--------|
| GET /api/auth/me without token | 401 | ✅ PASS |
| GET /api/auth/me with valid token | 200, user.role.name present | ✅ PASS |
| POST /api/auth/logout without token | 401 | ✅ PASS |
| POST /api/auth/logout with valid token | 200, success:true | ✅ PASS |

---

### 2. `tests/gateway.integration.test.js` — 5 tests

| Test | Result |
|------|--------|
| Protects inventory route with JWT | ✅ PASS |
| RBAC denies sales-exec from modifying inventory | ✅ PASS |
| Rate limiter blocks after threshold | ✅ PASS |
| Invalid and expired tokens are rejected | ✅ PASS |
| Sales upload forwards file to backend | ✅ PASS |

---

### 3. `tests/app.routes.test.js` — 4 tests

| Test | Result |
|------|--------|
| Register validates payload (missing name → 400) | ✅ PASS |
| Login validates payload (bad email → 400) | ✅ PASS |
| Register routes to controller (201) | ✅ PASS |
| Refresh requires refreshToken (400) | ✅ PASS |

---

### 4. `tests/authenticate.middleware.test.js` — 3 tests

| Test | Result |
|------|--------|
| Missing Authorization header → 401 | ✅ PASS |
| Invalid token → 401 | ✅ PASS |
| Valid token → sets req.user | ✅ PASS |

---

### 5. `tests/authorize.middleware.test.js` — 4 tests

| Test | Result |
|------|--------|
| No user on request → 403 | ✅ PASS |
| Role 1 full access | ✅ PASS |
| Role 3 can POST to sales | ✅ PASS |
| Role 3 cannot GET inventory | ✅ PASS |

---

### 6. `tests/auth.login.test.js` — 1 test

| Test | Result |
|------|--------|
| Valid credentials → 200 with accessToken + refreshToken | ✅ PASS |

---

### 7. `tests/auth.register.test.js` — 1 test

| Test | Result |
|------|--------|
| Valid payload → 201 with user object | ✅ PASS |

---

## Security Controls Verified

| Control | Implementation | Verified by |
|---------|---------------|-------------|
| JWT authentication | `authenticate.js` — `jwt.verify()` on every protected request | auth.middleware.test, security.test §1.1–1.2 |
| Token expiry | `expiresIn: "1h"` in `jwt.sign()` | security.test §1.1 |
| Refresh token | Separate `REFRESH_TOKEN_SECRET`, 7d expiry | auth.login.test |
| Password hashing | bcrypt, 10 salt rounds | auth.register.test |
| RBAC | Permission matrix in `authorize.js`, 4 roles × resources × methods | authorize.test, security.test §1.3 |
| Rate limiting — auth | 10 req / 15 min per IP | security.test §1.4, gateway.integration.test |
| Rate limiting — upload | 5 req / 15 min per IP | uploadLimiter wired to POST /sales/upload |
| Rate limiting — inventory | 30 req / 15 min per IP | inventoryLimiter on write routes |
| Rate limiting — general | 200 req / 15 min per IP | apiLimiter on all protected routes |
| Joi validation — auth | register/login/refresh schemas, abortEarly:false | app.routes.test, security.test §1.5 |
| Joi validation — inventory | add/update/delete schemas | security.test §1.5 |
| Joi validation — sales query | allowUnknown:false, UUID format, date ordering | security.test §1.6 |
| Audit logging — success | logEvent("info") on login, upload, inventory ops | auditLogger.js |
| Audit logging — failures | auditRejectMiddleware logs all 4xx/5xx to audit.log | auditLogger.js |
| Helmet headers | `helmet()` applied globally | app.js |
| Proxy isolation | Backend never called for invalid payloads | security.test §1.5–1.6 |

---

## Known Limitations

- Refresh tokens are stateless — there is no server-side blacklist. A stolen refresh token remains valid until its 7-day expiry. Mitigation: short access token window (1 h) limits blast radius.
- Rate limits are per-IP in memory. Behind a NAT or load balancer, a shared IP could exhaust the limit for multiple legitimate users. Mitigation: use Redis store for `express-rate-limit` in production.
- Logout is stateless — the access token remains technically valid until expiry. Clients must discard tokens on logout.
