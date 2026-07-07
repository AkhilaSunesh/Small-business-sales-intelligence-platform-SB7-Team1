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