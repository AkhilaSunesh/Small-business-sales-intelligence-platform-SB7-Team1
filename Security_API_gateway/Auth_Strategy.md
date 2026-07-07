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

---

## Public Routes

- Login
- Register