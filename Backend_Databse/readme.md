# MarketMind AI — Backend

Internal REST API service for the MarketMind AI small-business intelligence platform.
Built with **Node.js · Express · Prisma · PostgreSQL**, running on port **5000**.

All API routes require a valid JWT issued by the **Security API Gateway** (port 7000).
The backend is not intended to be directly exposed to the public internet.

---

## Overview

The Backend is the data and business-logic layer of MarketMind AI.
It owns the PostgreSQL database, all Prisma models, and all REST endpoints that serve sales,
inventory, invoice, customer, product, analytics, forecast, notification, and user data.

Requests arrive through the Security API Gateway, which validates the JWT and checks
role-based access before forwarding to the backend. The backend re-validates the JWT a
second time to ensure no request bypasses the gateway.

---

## Backend Responsibilities

- Defining and maintaining the Prisma schema and all database migrations
- Importing the original Kaggle Retail Transaction Dataset into PostgreSQL
- Exposing authenticated REST APIs for every business entity
- Enforcing business rules (invoice pricing, inventory deduction, payment status)
- Generating sales forecasts using a simple moving average on real transaction history
- Emitting low-stock and overdue-invoice notifications derived from live database state
- Serving Swagger/OpenAPI documentation at `/api-docs`

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5.x | HTTP framework |
| Prisma ORM | 6.x | Database access and migrations |
| PostgreSQL | 14+ | Primary database |
| JSON Web Tokens (JWT) | 9.x | Request authentication |
| Joi | 18.x | Request body/query validation |
| Multer | 2.x | CSV file upload handling |
| csv-parser | 3.x | CSV stream parsing |
| bcrypt | 6.x | Password hashing |
| swagger-ui-express | 5.x | API documentation |
| Morgan | 1.x | HTTP request logging |
| Jest + Supertest | 30.x / 7.x | Testing |

---

## Architecture

```
Frontend (port 3000)
        │
        ▼
Security API Gateway (port 7000)   ← JWT issued here
        │  authenticate + authorize
        ▼
Backend API (port 5000)            ← JWT re-validated here
        │
        ▼
Prisma ORM
        │
        ▼
PostgreSQL (port 5432)
```

All traffic entering the backend carries a `Authorization: Bearer <token>` header.
The backend's `authenticate` middleware verifies the JWT on every protected route.

---

## Project Structure

```
Backend_Databse/
├── prisma/
│   ├── schema.prisma              # All 8 models + 2 enums
│   ├── migrations/                # 14 migration folders
│   ├── importKaggle.js            # Kaggle dataset importer
│   ├── createInventory.js         # Inventory seeding script
│   └── seed.js                    # Development seed script
├── dataset/
│   └── Retail_Transaction_Dataset.csv   # Original Kaggle dataset
├── src/
│   ├── server.js                  # HTTP server entry point (port 5000)
│   ├── app.js                     # Express app, route mounting, middleware
│   ├── config/
│   │   └── prisma.js              # Prisma singleton (global._prisma)
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── sales.controller.js
│   │   ├── inventory.controller.js
│   │   ├── invoice.controller.js
│   │   ├── customer.controller.js
│   │   ├── product.controller.js
│   │   ├── analytics.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── forecast.controller.js
│   │   ├── notification.controller.js
│   │   └── bulk.controller.js
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── sales.routes.js
│   │   ├── inventory.routes.js
│   │   ├── invoice.routes.js
│   │   ├── customer.routes.js
│   │   ├── product.routes.js
│   │   ├── analytics.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── forecast.routes.js
│   │   └── notification.routes.js
│   ├── middleware/
│   │   ├── authenticate.js        # JWT verification
│   │   └── upload.middleware.js   # Multer CSV upload (10 MB limit)
│   ├── services/
│   │   ├── invoice.service.js     # Invoice business logic + transactions
│   │   ├── forecast.service.js    # Simple moving average forecast
│   │   └── notification.service.js
│   ├── validators/
│   │   ├── inventory.validation.js
│   │   ├── invoice.validation.js
│   │   └── sales.validation.js
│   ├── utils/
│   │   └── csvValidator.js
│   └── uploads/                   # Temporary CSV upload staging
├── tests/
│   ├── backend.integration.test.js
│   ├── chain.integration.test.js
│   └── csvValidator.test.js
├── src/__tests__/
│   ├── inventory.test.js
│   └── sales.validation.test.js
├── docs/
│   └── MILESTONE4_DEPLOYMENT_NOTES.md
├── swagger.json                   # OpenAPI 3.0.3 spec
└── package.json
```

---

## Database

### PostgreSQL Database

- Database name: `marketmind`
- Default port: `5432`
- Managed entirely through Prisma migrations

### Prisma Schema Models

| Model | Key Fields | Relations |
|---|---|---|
| `Role` | `id Int`, `name String @unique` | → `User[]` |
| `User` | `id UUID`, `email @unique`, `password`, `roleId`, `isActive`, `isDeleted`, `isPending`, `lastLoginAt` | → `SalesTransaction[]`, `Invoice[]`, `Payment[]` |
| `Customer` | `id UUID`, `customerCode @unique`, `name`, `email?`, `phone?`, `address?` | → `SalesTransaction[]`, `Invoice[]` |
| `Product` | `id UUID`, `productCode @unique`, `name`, `category`, `price Float` | → `Inventory?`, `SalesTransaction[]` |
| `Inventory` | `id UUID`, `productId @unique`, `quantity Int`, `lowStockThreshold Int @default(10)` | → `Product` |
| `SalesTransaction` | `id UUID`, `invoiceNo @unique`, `customerId`, `productId`, `userId?`, `quantity`, `totalAmount`, `transactionDate` | → `Customer`, `Product`, `User?`, `Invoice[]` |
| `Invoice` | `id UUID`, `invoiceNumber @unique`, `customerId`, `lineItems Json`, `subtotal`, `taxRate`, `taxAmount`, `discountRate`, `discountAmount`, `totalAmount`, `status InvoiceStatus`, `dueDate`, `createdById?` | → `Customer`, `SalesTransaction?`, `Payment[]`, `User?` |
| `Payment` | `id UUID`, `invoiceId`, `amount Float`, `method PaymentMethod`, `reference?`, `paidAt`, `recordedById?` | → `Invoice`, `User?` |

### Enums

```
InvoiceStatus: UNPAID | PAID | PARTIALLY_PAID | OVERDUE | CANCELLED
PaymentMethod: CASH | CARD | BANK_TRANSFER | CHEQUE | ONLINE | OTHER
```

### Database Indexes

The `Invoice` model has database indexes on `customerId`, `status`, `dueDate`, `createdAt`, and `invoiceNumber` for query performance.
The `Payment` model has indexes on `invoiceId` and `paidAt`.

### Migrations

14 migrations have been applied in sequence:

| Migration | Description |
|---|---|
| `20260707142042_initial_schema` | Initial schema: Role, User, Customer, Product, Inventory, SalesTransaction |
| `20260709144745_kaggle_schema_update` | Kaggle dataset compatibility updates |
| `20260709145707_add_kaggle_codes` | Added `customerCode`, `productCode` unique fields |
| `20260709173742_add_invoice_no` | Added `invoiceNo` to SalesTransaction |
| `20260710042328_add_password` | Added `password` to User |
| `20260710042552_add_password` | Password field refinement |
| `20260710043755_add_customer_fields` | Added `email`, `phone`, `address` to Customer |
| `20260710044021_add_product_category` | Added `category` to Product |
| `20260710062958_add_transaction_date` | Added `transactionDate` to SalesTransaction |
| `20260710070233_add_low_stock_threshold` | Added `lowStockThreshold` to Inventory |
| `20260713152402_make_user_id_optional` | Made `userId` nullable on SalesTransaction |
| `20260715162504_add_invoice_payment` | Added Invoice and Payment models |
| `20260815071842_add_user_lastlogin_isactive` | Added `lastLoginAt`, `isActive` to User |
| `20260816181600_add_user_isdeleted_ispending` | Added `isDeleted`, `isPending` to User |

---

## Prisma ORM

Prisma is used for all database access. A singleton pattern prevents multiple client
instances during hot-reload in development:

```js
// src/config/prisma.js
if (!global._prisma) {
    global._prisma = new PrismaClient();
}
module.exports = global._prisma;
```

**Applying migrations:**
```bash
npx prisma migrate deploy       # production / Docker
npx prisma migrate dev          # development (creates new migration if schema changed)
```

**Regenerating the Prisma Client after schema changes:**
```bash
npx prisma generate
```

---

## Dataset Integration

### Original Dataset

The application uses the
[Kaggle Retail Transaction Dataset](https://www.kaggle.com/datasets/fahadrehman07/retail-transaction-dataset)
by Fahad Rehman as its primary data source.

The dataset CSV (`dataset/Retail_Transaction_Dataset.csv`) is included in the repository
and contains real retail transaction records covering customers, products, quantities,
prices, and transaction dates.

### Import Script — `prisma/importKaggle.js`

Run via:
```bash
npm run import:kaggle
```

The importer processes the dataset in this order to respect foreign-key constraints:

```
Retail_Transaction_Dataset.csv
        ↓
Parse & deduplicate rows
        ↓
Upsert Roles (4 system roles)
        ↓
Create System User
        ↓
Upsert Customers (customerCode: CUST-XXXXXXXX)
        ↓
Upsert Products  (productCode: PROD-XXXXXXXX, price, category)
        ↓
Create Inventory (1,000 units per product)
        ↓
Create SalesTransactions (invoiceNo: KGL-XXXXXXXX)
        ↓
Create Invoices  (18% GST applied, 30-day due date)
        ↓
Create Payments  (status: PAID for most records)
        ↓
PostgreSQL (marketmind database)
```

- Import is **idempotent** — uses `skipDuplicates: true`; safe to re-run
- Transaction years are shifted from 2023→2025 and 2024→2026 for date relevance
- Chunk sizes: 10,000 customers; 5,000 sales/invoices/payments per batch

> **Note:** `prisma/importSales.js` is a deprecated earlier version and no longer
> functions with the current schema. Use `npm run import:kaggle` instead.

### Development Seed

```bash
npm run seed
```

Loads structured CSV files from `seed_data/` (Roles, Users, Customers, Products,
Inventory, SalesTransactions) in foreign-key order. Suitable for local development
without the full dataset import.

---

## API Modules

All routes require `Authorization: Bearer <token>` from the Security API Gateway.

### Sales

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/sales` | List all sales. Supports `?page`, `?limit`, `?sort`, `?order`, `?startDate`, `?endDate`, `?customerId`, `?productId`, `?category` |
| `GET` | `/api/sales/:id` | Single sale transaction by UUID |
| `POST` | `/api/sales/upload` | Upload a CSV file of sales rows (multipart/form-data) |

**CSV Upload required columns:**

| Column | Type | Example |
|---|---|---|
| `CustomerID` | string | `CUST-00000001` |
| `ProductID` | string | `PROD-00000001` |
| `Quantity` | integer ≥ 1 | `5` |
| `Price` | decimal > 0 | `19.99` |
| `TransactionDate` | ISO date | `2026-06-15` |

Upload response includes a full summary: rows read, records inserted, duplicates skipped, invalid rows, and per-row validation errors. Each valid uploaded row automatically creates a linked invoice (18% GST, 30-day due date) and deducts inventory — all within a single Prisma transaction.

### Inventory

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/inventory` | All inventory items with `lowStock` flag. Supports `?page`, `?limit`, `?sort` |
| `GET` | `/api/inventory/low-stock` | Items at or below their `lowStockThreshold` |
| `POST` | `/api/inventory/add` | Increment stock: `{ productCode, quantity }` |
| `PUT` | `/api/inventory/update` | Set absolute stock level: `{ productCode, quantity }` |
| `DELETE` | `/api/inventory/delete` | Remove inventory record: `{ productCode }` |
| `PATCH` | `/api/inventory/bulk` | Bulk update multiple products in one request |

### Invoices

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/invoices` | List invoices. Supports `?page`, `?limit`, `?status`, `?customerId`, `?startDate`, `?endDate`, `?search` |
| `GET` | `/api/invoices/revenue/summary` | Revenue summary: total, outstanding, daily collections |
| `GET` | `/api/invoices/status/:status` | Filter by `UNPAID`, `PAID`, `PARTIALLY_PAID`, `OVERDUE`, `CANCELLED` |
| `GET` | `/api/invoices/:id` | Single invoice with all payments and line items |
| `GET` | `/api/invoices/:id/download` | Download invoice as a plain-text receipt file |
| `POST` | `/api/invoices` | Create a manual invoice (validates inventory, ignores client price) |
| `POST` | `/api/invoices/overdue/check` | Mark all past-due unpaid invoices as `OVERDUE` |
| `POST` | `/api/invoices/:id/payments` | Record a payment, auto-updates invoice status |
| `PATCH` | `/api/invoices/bulk` | Bulk status update: `{ ids: [uuid,...], status }` |

### Customers

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/customers` | Customer list. Supports `?page`, `?limit`, `?sort`, `?order`, `?search`, `?email` |

### Products

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/products` | Full product catalogue |
| `GET` | `/api/products/with-stock` | Products joined with inventory, includes `quantity`, `inStock`, `priceDisplay` |

### Dashboard

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | KPIs: total customers, products, sales, revenue |
| `GET` | `/api/dashboard/total-revenue` | Total revenue figure |
| `GET` | `/api/dashboard/top-products` | Top-selling products |
| `GET` | `/api/dashboard/sales-trend` | Sales trend time series |

### Analytics

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/analytics/summary` | Revenue totals, sales count, top-5 products |
| `GET` | `/api/analytics/payment-methods` | Breakdown by payment method |
| `GET` | `/api/analytics/categories` | Sales breakdown by product category |

### Forecast

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/forecast` | 30-day sales forecast. Supports `?days` (1–365), `?lookback` (7–365), `?window` (2–30), `?category` |

The forecast endpoint uses a simple moving average (SMA) calculated from real historical
`SalesTransaction` data in the database. The Security API Gateway routes this endpoint
to the AI Python service (port 5014) first and falls back to this endpoint automatically
if the AI service is offline.

### Notifications

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notifications` | All alerts. Supports `?type=LOW_STOCK\|OVERDUE_INVOICE`, `?page`, `?limit` |
| `GET` | `/api/notifications/counts` | Lightweight counts: `{ total, lowStock, overdueInvoices, critical }` |
| `GET` | `/api/notifications/low-stock` | Inventory items at or below threshold |
| `GET` | `/api/notifications/overdue-invoices` | Invoices past due date with outstanding amounts |

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users` | List users. Supports `?page`, `?limit`, `?search`, `?role` |
| `GET` | `/api/users/:id` | Single user by UUID |
| `PATCH` | `/api/users/:id/profile` | Update display name (email is read-only) |
| `PATCH` | `/api/users/:id/status` | Activate or deactivate an account (toggles `isActive`) |
| `DELETE` | `/api/users/:id` | Soft-delete: sets `isActive: false`, `isDeleted: true` |

Password is **never** returned in any user response. The `SAFE_SELECT` constant in the
controller explicitly excludes the `password` field from all queries.

---

## Authentication

The backend authenticates every request using the `authenticate` middleware:

```
Authorization: Bearer <access_token>
```

The middleware verifies the JWT signature using `JWT_SECRET`, extracts `{ id, email, roleId }`
from the payload, and attaches it to `req.user`. Requests with missing, malformed, or expired
tokens receive a `401` response.

JWT tokens are **issued by the Security API Gateway** — the backend does not have a
registration or login endpoint. It only verifies tokens.

---

## Invoice & Sales Workflow

### Auto-Invoice on CSV Upload

When a CSV row is uploaded via `POST /api/sales/upload`, the following happens atomically
within a single Prisma transaction:

```
CSV Row Parsed & Validated
        ↓
Duplicate Check (invoiceNo in DB)
        ↓
SalesTransaction Created
        ↓
Inventory Quantity Decremented (product.quantity - row.quantity)
        ↓
Invoice Auto-Generated
  • subtotal = quantity × price
  • taxRate  = 18% (GST)
  • dueDate  = transactionDate + 30 days
  • status   = UNPAID
        ↓
Database Commit
```

If any step fails, the entire transaction is rolled back.

### Manual Invoice Creation — `POST /api/invoices`

```json
{
  "customerId": "uuid",
  "lineItems": [
    { "productId": "uuid", "quantity": 2, "unitPrice": 50.00 }
  ],
  "discountRate": 10,
  "taxRate": 18,
  "dueDate": "2026-08-01T00:00:00.000Z"
}
```

**Security:** The `unitPrice` supplied by the client is validated structurally but the
authoritative price used for the invoice total is always fetched from the database
(`Product.price`). This prevents price manipulation through tampered requests.

**Inventory:** Stock availability is validated before the invoice is created. If any
line item exceeds available inventory, the request is rejected with an
`INSUFFICIENT_STOCK` error before any database write occurs.

### Payment Recording — `POST /api/invoices/:id/payments`

```json
{
  "amount": 150.00,
  "method": "BANK_TRANSFER",
  "reference": "TXN-20260801"
}
```

The payment service atomically creates the payment record and recalculates invoice status:
- Total payments = invoice total → `PAID`
- Total payments < invoice total → `PARTIALLY_PAID`
- No payments and past due date → `OVERDUE` (via `/api/invoices/overdue/check`)

### Invoice Number Format

```
INV-YYYYMM-NNNNN
e.g. INV-202607-00001
```

---

## Inventory Management

Inventory is managed per-product. Each `Inventory` record stores:
- `quantity` — current stock level
- `lowStockThreshold` — alert threshold (default: 10 units)
- A `lowStock` boolean flag is computed dynamically and returned in API responses

The `notification.service.js` queries inventory at request time to build low-stock alerts.
No background job is required — notifications are always derived from current database state.

---

## Validation & Data Integrity

Joi schemas are used for all write operations:

| Validator | Checks |
|---|---|
| `inventory.validation.js` | `productCode` required, `quantity` ≥ 1 for add, ≥ 0 for update |
| `invoice.validation.js` | `customerId` UUID, `lineItems` array min 1, `unitPrice` positive, `discountRate` 0–100, `taxRate` 0–100, `dueDate` ISO in future |
| `sales.validation.js` | `CustomerID` and `ProductID` required strings, `Quantity` int ≥ 1, `Price` positive, `TransactionDate` valid ISO date |

Validators use `Joi.unknown(true)` for CSV rows (Kaggle data contains extra columns)
and `Joi.unknown(false)` for API request bodies (unknown fields rejected with 400).

---

## Testing

```bash
npm test
```

Runs all Jest test suites with `--runInBand`.

| Test File | Type | What it covers |
|---|---|---|
| `tests/backend.integration.test.js` | Integration | All protected routes — auth guard, pagination, 404 handling, validation |
| `tests/chain.integration.test.js` | Integration | Inventory→Notification chain, Invoice→Overdue chain, bulk update APIs |
| `tests/csvValidator.test.js` | Unit | CSV row validation: valid rows, missing fields, invalid values |
| `src/__tests__/inventory.test.js` | Unit | Inventory controller: mock Prisma, error handling, add/update/delete |
| `src/__tests__/sales.validation.test.js` | Unit | Sales row Joi schema: all valid/invalid field combinations |

Current test count: **91 tests passing** across all suites.

---

## Docker / Deployment

The backend is containerized via `Devops_Integration/Dockerfile.backend`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY Backend_Databse/package*.json ./
RUN npm install
COPY Backend_Databse/ ./
RUN npx prisma generate
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
```

The container **automatically applies pending migrations** (`prisma migrate deploy`) before
starting the server. This ensures the database schema is always current on deployment.

### Docker Compose

```bash
# From project root
docker compose -f Devops_Integration\docker-compose.yml up -d
```

The backend service depends on `postgres` reaching the healthy state (pg_isready check)
before starting. The `postgres_data` Docker volume persists database state across restarts.

### Service Port Map

| Service | Port |
|---|---|
| PostgreSQL | 5432 |
| Backend API | 5000 |
| Security Gateway | 7000 |
| AI Forecast | 5014 |
| AI Segmentation | 5010 |
| AI Churn | 5011 |
| AI Recommendations | 5012 |
| AI Anomaly Detection | 5013 |
| Frontend | 3000 |

---

## Environment Configuration

The backend reads its environment from `.env` in the `Backend_Databse/` directory.

> **Never commit `.env` files.** The root `.gitignore` excludes `.env` and all `.env.*`
> variants. Production secrets must be provided through deployment environment variables
> or a secrets manager.

### Required Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for verifying JWTs issued by the gateway |
| `PORT` | Backend server port (default: 5000) |

### Example `.env` (placeholders only)

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

---

## Running the Backend

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running with database `marketmind` created
- `.env` file configured

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Apply database migrations
npx prisma migrate deploy

# 3. Import the Kaggle dataset (first run)
npm run import:kaggle

# 4. Start the server
npm start               # production
npm run dev             # development (nodemon auto-reload)
```

Server starts on **http://localhost:5000**

**Swagger UI:** http://localhost:5000/api-docs

---

## API Development Notes

### JWT Verification

The `authenticate` middleware in `src/middleware/authenticate.js` verifies every protected
request. It reads the `Authorization: Bearer <token>` header and verifies the signature
against `JWT_SECRET`. The decoded payload (`{ id, email, roleId }`) is attached to
`req.user` for use by controllers.

### Prisma Singleton

The Prisma client is instantiated once via a global singleton to prevent connection pool
exhaustion during development hot-reloads. In production (Docker), only a single process
runs, so this has no effect.

### JSON Parse Error Handling

A custom Express error handler positioned before route mounting intercepts malformed JSON
request bodies and returns `400` instead of the default Express `500`.

### Health Check

```
GET http://localhost:5000/
```

Returns:
```json
{ "success": true, "service": "MarketMind Backend API", "status": "Running" }
```

---

## Milestone 1 — Backend Foundation

**Focus:** Establishing the backend project and its role in the overall architecture.

- Node.js/Express application structure set up with modular routes, controllers, and middleware
- PostgreSQL database `marketmind` provisioned and connected via Prisma ORM
- Initial Prisma schema created covering `Role`, `User`, `Customer`, `Product`, `Inventory`, and `SalesTransaction` models
- `authenticate` middleware implemented — validates JWT on all protected routes
- Core REST API routes established for sales and inventory
- Health check endpoint at `GET /`
- Swagger UI integrated at `/api-docs`
- `morgan` request logging enabled
- CORS configured
- Backend server starts on port 5000
- Agreed backend/gateway JWT contract: tokens issued by gateway, verified by backend

---

## Milestone 2 — Database & Business APIs

**Focus:** Completing the data layer and all business entity APIs backed by real dataset data.

- Full Prisma schema finalized: 8 models (`Role`, `User`, `Customer`, `Product`, `Inventory`, `SalesTransaction`, `Invoice`, `Payment`), 2 enums (`InvoiceStatus`, `PaymentMethod`)
- 14 database migrations applied in sequence — schema evolved incrementally without data loss
- **Kaggle dataset imported** via `prisma/importKaggle.js` (`npm run import:kaggle`):
  - Original [Retail Transaction Dataset](https://www.kaggle.com/datasets/fahadrehman07/retail-transaction-dataset) processed into PostgreSQL
  - Customers, Products, Inventory, SalesTransactions, Invoices, and Payments all populated from the dataset
  - 18% GST applied to all imported invoices; inventory initialized at 1,000 units per product
- REST APIs implemented and documented for all business entities: sales, inventory, customers, products, dashboard, analytics
- Paginated responses with `{ success, data, pagination }` structure across all list endpoints
- CSV sales upload endpoint (`POST /api/sales/upload`) with full validation, duplicate detection, and per-row error reporting
- Invoice and Payment models added to the schema; `Invoice` and `Payment` REST APIs implemented
- `invoiceService` built with atomic Prisma transactions for invoice creation and payment recording
- Auto-invoice generation on CSV upload — each valid sale creates a linked invoice atomically
- Revenue summary endpoint (`GET /api/invoices/revenue/summary`)
- Dashboard KPI endpoint (`GET /api/dashboard/summary`) serves data sourced entirely from PostgreSQL
- Development seed script (`npm run seed`) using structured CSV files for fast local setup

---

## Milestone 3 — Security Integration

**Focus:** Integrating with the Security API Gateway and completing the business API surface.

- Backend confirmed as internal-only service — all external traffic routes through the gateway on port 7000
- Forecast endpoint implemented (`GET /api/forecast`): SMA calculated from real `SalesTransaction.transactionDate` data
- Notification endpoints added: low-stock alerts from `Inventory`, overdue-invoice alerts from `Invoice` where `dueDate < now`
- Notification counts endpoint for lightweight polling (`GET /api/notifications/counts`)
- Bulk update APIs added: `PATCH /api/invoices/bulk`, `PATCH /api/inventory/bulk`
- Invoice download endpoint (`GET /api/invoices/:id/download`) generates a formatted plain-text receipt
- Overdue check endpoint (`POST /api/invoices/overdue/check`) bulk-updates past-due invoices to `OVERDUE` status
- Backend integration tests written covering auth guards, pagination metadata, validation rejection, 404 handling
- Chain integration tests covering: Inventory→Notification chain, Invoice→Overdue Notification chain, bulk update APIs

---

## Milestone 4 — Integration & Production Readiness

**Focus:** End-to-end integration, security hardening, and deployment preparation.

### Invoice & Inventory Integration

- `createManualInvoice` in `invoice.service.js` enforces server-side price fetch from the database:
  client-supplied `unitPrice` is validated structurally but **the authoritative price is always read from `Product.price`** in the database — this prevents price manipulation
- Inventory availability is checked **before** any database write; requests are rejected with `INSUFFICIENT_STOCK` if stock is insufficient
- All invoice creation is wrapped in a `prisma.$transaction` — partial failures roll back completely

### User Management APIs

- `GET /api/users`, `GET /api/users/:id` — paginated, searchable, role-filterable user directory
- `PATCH /api/users/:id/profile` — name-only update (email cannot be changed via API)
- `PATCH /api/users/:id/status` — activate/deactivate account (`isActive` toggle)
- `DELETE /api/users/:id` — soft-delete (`isActive: false`, `isDeleted: true`)
- `User.lastLoginAt` persisted to the database on each successful login (handled by the gateway)
- Password never returned in any user API response

### Schema Updates (Milestones 3–4)

- Migration `20260815071842`: Added `lastLoginAt DateTime?` and `isActive Boolean @default(true)` to `User`
- Migration `20260816181600`: Added `isDeleted Boolean @default(false)` and `isPending Boolean @default(false)` to `User`

### Environment Security

- `.env` files removed from Git tracking
- Root `.gitignore` excludes `.env` and `.env.*` (with `.env.example` exception)
- `Devops_Integration/.env.example` sanitized to contain only placeholder values — no real credentials
- All sensitive configuration (database URL, JWT secrets) provided through deployment environment variables

### Deployment

- `Devops_Integration/Dockerfile.backend` builds a production-ready Node.js 18 Alpine image
- Container runs `npx prisma migrate deploy` automatically before starting — schema always current
- `Devops_Integration/docker-compose.yml` orchestrates all services with health checks, startup ordering, and a shared `logs` volume
- Backend depends on postgres `healthy` state before starting
- PostgreSQL data persisted in `postgres_data` Docker volume — survives container restarts and rebuilds
- See `docs/MILESTONE4_DEPLOYMENT_NOTES.md` for the full deployment checklist and rollback procedures
