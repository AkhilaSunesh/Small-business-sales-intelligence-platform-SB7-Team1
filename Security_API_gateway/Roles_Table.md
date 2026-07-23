# Roles Table

| Role ID | Role Name |
|----------|-----------|
| 1 | Business Owner |
| 2 | Store Manager |
| 3 | Sales Executive |
| 4 | System Administrator |

---

## Permissions

### Business Owner

- Full Access

### Store Manager

- Manage Inventory
- Manage Products
- View Sales

### Sales Executive

- Add Customers
- Create Sales
- View Products

### System Administrator

- Manage Users
- Manage Roles
- System Configuration

---

## Milestone 2 Access Overview

The following access rules apply to the invoice, payment, revenue and AI-reporting modules introduced in Milestone 2.

| Role | Access |
|---|---|
| Business Owner | Full access across all Milestone 2 modules. |
| Store Manager | Can manage invoices and payments, view revenue information, and access AI reports. |
| Sales Executive | Can create and view invoices, record payments, and view revenue information. AI reports are not available for this role. |
| System Administrator | Full access across all Milestone 2 modules. |

---

## Permission Matrix

| Module | Business Owner | Store Manager | Sales Executive | System Administrator |
|---|:---:|:---:|:---:|:---:|
| Invoice viewing and creation | Yes | Yes | Yes | Yes |
| Invoice updates | Yes | Yes | No | Yes |
| Payment viewing | Yes | Yes | No | Yes |
| Payment recording | Yes | Yes | Yes | Yes |
| Revenue summary | Yes | Yes | Yes | Yes |
| Customer Groups | Yes | Yes | No | Yes |
| Churn Risk | Yes | Yes | No | Yes |
| Recommendations | Yes | Yes | No | Yes |
| Anomaly Detection | Yes | Yes | No | Yes |