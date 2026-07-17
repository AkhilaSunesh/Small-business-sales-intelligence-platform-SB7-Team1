# Database Design

## 1. Users Table

| Column | Data Type | Description |
|---------|-----------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR(100) | User Full Name |
| email | VARCHAR(100) | User Email |
| password | VARCHAR(255) | Encrypted Password |
| role_id | INT | References Roles Table |

---

## 2. Roles Table

| id | Role |
|----|------|
| 1 | Business Owner |
| 2 | Store Manager |
| 3 | Sales Executive |
| 4 | System Administrator |

---

## 3. Customers Table

| Column | Data Type |
|---------|-----------|
| customer_id | UUID |
| name | VARCHAR(100) |
| phone | VARCHAR(20) |
| email | VARCHAR(100) |
| address | TEXT |

---

## 4. Products Table

| Column | Data Type |
|---------|-----------|
| product_id | UUID |
| product_name | VARCHAR(100) |
| category | VARCHAR(50) |
| price | DECIMAL |
| stock | INT |

---

## 5. Inventory Table

| Column | Data Type |
|---------|-----------|
| inventory_id | UUID |
| product_id | UUID |
| quantity | INT |
| warehouse | VARCHAR(100) |

---

## 6. Sales Transactions Table

| Column | Data Type |
|---------|-----------|
| sale_id | UUID |
| customer_id | UUID |
| product_id | UUID |
| quantity | INT |
| amount | DECIMAL |
| sale_date | TIMESTAMP |

---

## 7. Invoice Table *(Milestone 2)*

| Column | Data Type | Description |
|---------|-----------|-------------|
| id | UUID | Primary Key |
| invoiceNumber | VARCHAR | Unique — format `INV-YYYYMM-XXXXX` |
| customerId | UUID | FK → Customers.id |
| salesTransactionId | UUID (nullable) | FK → SalesTransactions.id |
| createdById | UUID (nullable) | FK → Users.id |
| lineItems | JSON | Array of `{ productId, productName, quantity, unitPrice, lineTotal }` |
| subtotal | DECIMAL | Sum of line totals before adjustments |
| taxRate | DECIMAL | Percentage — default 18 (GST) |
| taxAmount | DECIMAL | Computed: subtotal × taxRate / 100 |
| discountRate | DECIMAL | Percentage — default 0 |
| discountAmount | DECIMAL | Computed: subtotal × discountRate / 100 |
| totalAmount | DECIMAL | subtotal + taxAmount − discountAmount |
| status | ENUM | `UNPAID` \| `PAID` \| `PARTIALLY_PAID` \| `OVERDUE` \| `CANCELLED` |
| dueDate | TIMESTAMP | Payment due date — defaults to 30 days from creation |
| createdAt | TIMESTAMP | Auto-set on insert |
| updatedAt | TIMESTAMP | Auto-updated on every change |

**Indexes:** customerId, status, dueDate, createdAt, invoiceNumber

**Relationships:**
- Invoice → Customer (many-to-one)
- Invoice → SalesTransaction (many-to-one, optional)
- Invoice → User/createdBy (many-to-one, optional)
- Invoice → Payment (one-to-many)

---

## 8. Payment Table *(Milestone 2)*

| Column | Data Type | Description |
|---------|-----------|-------------|
| id | UUID | Primary Key |
| invoiceId | UUID | FK → Invoice.id |
| recordedById | UUID (nullable) | FK → Users.id |
| amount | DECIMAL | Amount paid in this transaction |
| method | ENUM | `CASH` \| `CARD` \| `BANK_TRANSFER` \| `CHEQUE` \| `ONLINE` \| `OTHER` |
| reference | VARCHAR (nullable) | Bank ref, transaction ID, cheque number |
| note | TEXT (nullable) | Free-text note |
| paidAt | TIMESTAMP | When payment was made — default now() |
| createdAt | TIMESTAMP | Auto-set on insert |

**Indexes:** invoiceId, paidAt

**Relationships:**
- Payment → Invoice (many-to-one)
- Payment → User/recordedBy (many-to-one, optional)

---

## Entity Relationship Summary *(Milestone 2 additions)*

```
User ──────────┬──────────────────── creates ──► Invoice
               │                                     │
               └──────────────── records ──► Payment─┘
                                                     │
Customer ─────────────────────────────────────────► Invoice
                                                     │
SalesTransaction ────────────────── (optional) ──► Invoice
                                                     │
                                              lineItems[] ──► Product (via JSON)
```

**Invoice Status Flow:**
```
UNPAID
  ├─► (partial payment recorded)  ──► PARTIALLY_PAID
  ├─► (full payment recorded)     ──► PAID
  └─► (dueDate passed, no payment)──► OVERDUE (via POST /api/invoices/overdue/check)

PARTIALLY_PAID
  └─► (remaining balance paid)    ──► PAID

Any status ──► CANCELLED (manual)
```
