# Authentication Strategy

## Authentication Method

JSON Web Token (JWT)

---

## Login Flow

1. User enters email and password.

2. Security API Gateway receives the request.

3. Credentials are verified.

4. JWT Token is generated.

5. Token is returned to the client.

6. Client stores the token.

7. Client sends the token in every request.

8. Security Gateway validates the token.

9. If valid → Request forwarded to Backend.

10. If invalid → Return 401 Unauthorized.

---

## Protected Routes
The following APIs require authentication.
- Products
- Inventory
- Sales
- Customers
- Invoices (create, view, update, payments)
- Revenue Summary
- AI Reports: Customer Groups, Churn Risk, Recommendations, Anomaly Detection
---
## Public Routes
- Login
- Register
---
## Role-Based Access Summary (Milestone 2)

| Feature | Business Owner | Store Manager | Sales Executive | Administrator |
|---|:---:|:---:|:---:|:---:|
| Invoices | Full | Full | Create/View only | Full |
| Payments | Full | Full | Record only | Full |
| Revenue Summary | Yes | Yes | Yes | Yes |
| AI Reports (all 4) | Yes | Yes | No | Yes |

See `Roles_Table.md` for the complete permission matrix.
---
## Security Testing (Day 8)

All invoice and AI routes are covered by an automated security test suite
(`tests/invoice-ai-security.test.js`), verifying:

- Requests are rejected (401) when no token, an invalid token, or an
  expired token is provided.
- Role-based access is enforced correctly — for example, Sales Executives
  cannot access AI report endpoints, and cannot update invoices they did
  not create.
- Invoice validation (negative amounts, missing customer info) is still
  enforced even for authenticated, authorized users.

23/23 tests passing as of the last run.