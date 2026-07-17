# MarketMind AI — Backend Database Service

Internal REST API built with **Node.js · Express · Prisma · PostgreSQL**.  
All routes are protected by JWT. Tokens are issued by the **Security API Gateway** (port 7000).

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally
- Database `marketmind` created

### 2. Environment
Copy `.env` and verify values:
```
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/marketmind"
JWT_SECRET="marketmind_security_2026"
PORT=5000
```

### 3. Install dependencies
```bash
npm install
```

### 4. Apply migrations
```bash
npx prisma migrate deploy
```

### 5. Seed the database

**Option A — seed_data CSVs (recommended for development)**
```bash
npm run seed
```
Loads `seed_data/Role.csv`, `User.csv`, `Customer.csv`, `Product.csv`,
`Inventory.csv`, `SalesTransaction.csv` in FK order.

**Option B — Kaggle retail dataset**
```bash
npm run import:kaggle
```
Imports the full Retail Transaction Dataset from `dataset/Retail_Transaction_Dataset.csv`.

### 6. Start the server
```bash
npm start          # production
npx nodemon src/server.js   # development with auto-reload
```

Server runs on **http://localhost:5000**

### 7. Swagger UI
```
http://localhost:5000/api-docs
```

---

## API Overview

All routes require `Authorization: Bearer <JWT>`.

| Method | Route                        | Description                            |
|--------|------------------------------|----------------------------------------|
| GET    | /api/sales                   | List sales (paginated, filterable)     |
| GET    | /api/sales/:id               | Single sale by ID                      |
| POST   | /api/sales/upload            | Upload CSV of sales rows               |
| GET    | /api/inventory               | All inventory with low-stock flags     |
| GET    | /api/inventory/low-stock     | Items at or below threshold only       |
| POST   | /api/inventory/add           | Increment stock for a product          |
| PUT    | /api/inventory/update        | Set absolute stock level               |
| DELETE | /api/inventory/delete        | Remove inventory record                |
| GET    | /api/dashboard/summary       | KPI: customers, products, sales, revenue |
| GET    | /api/analytics/summary       | Revenue, sales count, top-5 products  |
| GET    | /api/products                | Product catalogue                      |
| GET    | /api/customers               | Customer list (max 100)                |
| GET    | /api/invoices                | List invoices (paginated, searchable, filterable) |
| GET    | /api/invoices/revenue/summary| Revenue summary: total, outstanding, daily collections |
| GET    | /api/invoices/status/:status | Invoices filtered by PAID/UNPAID/PARTIALLY_PAID/OVERDUE/CANCELLED |
| GET    | /api/invoices/:id            | Single invoice with payments and line items |
| POST   | /api/invoices                | Create a manual invoice (validates, deducts inventory) |
| POST   | /api/invoices/overdue/check  | Mark past-due invoices OVERDUE         |
| POST   | /api/invoices/:id/payments   | Record a payment, auto-updates status  |

---

## CSV Upload Format

`POST /api/sales/upload` accepts `multipart/form-data` with a `.csv` file.

Required columns:

| Column          | Type    | Example          |
|-----------------|---------|------------------|
| CustomerID      | string  | CUST-0001        |
| ProductID       | string  | PROD-0001        |
| Quantity        | integer | 5                |
| Price           | decimal | 19.99            |
| TransactionDate | ISO date| 2024-06-15       |

The response includes a full upload summary:
```json
{
  "success": true,
  "message": "Sales uploaded successfully",
  "summary": {
    "filename": "sales.csv",
    "uploadedAt": "2026-07-13T10:00:00.000Z",
    "totalRowsRead": 100,
    "recordsInserted": 90,
    "duplicatesRemoved": 5,
    "invalidRows": 5,
    "validationErrors": [
      { "row": 3, "reason": "CustomerID 'X999' not found", "data": {} }
    ]
  }
}
```

---

## Invoice API

### Create Invoice — `POST /api/invoices`

```json
{
  "customerId": "uuid",
  "lineItems": [
    { "productId": "uuid", "quantity": 2, "unitPrice": 50.00 }
  ],
  "discountRate": 10,
  "taxRate": 18,
  "dueDate": "2026-08-13T00:00:00.000Z",
  "notes": "Optional notes"
}
```

### Record Payment — `POST /api/invoices/:id/payments`

```json
{
  "amount": 100.00,
  "method": "CASH",
  "reference": "TXN-001",
  "note": "First instalment"
}
```

Valid `method` values: `CASH` | `CARD` | `BANK_TRANSFER` | `CHEQUE` | `ONLINE` | `OTHER`

### Invoice Status Flow

```
UNPAID → (payment recorded) → PARTIALLY_PAID → (full payment) → PAID
UNPAID → (past dueDate, POST /overdue/check) → OVERDUE
```

### Auto-Invoice on CSV Upload

Every sale row in `POST /api/sales/upload` automatically generates an invoice with 18% GST applied to (subtotal − discount). Due date is set 30 days from the transaction date.

---

## Running Tests

```bash
npm test                  # all tests
npm test -- --coverage    # with coverage report
```

Test suites:
- `src/__tests__/inventory.test.js` — unit tests, Prisma mocked
- `src/__tests__/sales.validation.test.js` — Joi schema unit tests
- `tests/backend.integration.test.js` — route integration tests, Prisma mocked
- `tests/csvValidator.test.js` — csvValidator utility unit tests

---

## Project Structure

```
Backend_Databse/
├── prisma/
│   ├── schema.prisma        # Prisma schema (Role, User, Customer, Product, Inventory, SalesTransaction)
│   ├── migrations/          # Applied DB migrations
│   ├── seed.js              # Seed from seed_data/ CSVs
│   └── importKaggle.js      # One-time Kaggle dataset importer
├── seed_data/               # CSV files: Role, User, Customer, Product, Inventory, SalesTransaction
├── dataset/                 # Kaggle Retail_Transaction_Dataset.csv
├── src/
│   ├── app.js               # Express app, route mounting, Swagger
│   ├── server.js            # HTTP server entry point
│   ├── config/prisma.js     # Prisma singleton
│   ├── controllers/         # Business logic
│   ├── routes/              # Express routers
│   ├── middleware/
│   │   ├── authenticate.js  # JWT verification
│   │   └── upload.middleware.js  # Multer CSV upload
│   ├── validations/         # Joi schemas
│   └── utils/csvValidator.js    # CSV column + row validators
├── tests/                   # Integration tests
├── swagger.json             # OpenAPI 3.0 spec
└── jest.config.js
```
