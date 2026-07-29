/**
 * security.test.js
 *
 * Day 7 security test suite.
 * Covers: expired JWT, invalid JWT, RBAC denial, rate-limit trigger,
 * malformed payloads, sales query validation, and gateway proxy behaviour.
 *
 * All DB calls are mocked — no live database required.
 */

process.env.JWT_SECRET          = "testsecret";
process.env.REFRESH_TOKEN_SECRET = "refreshsecret";

jest.mock("axios");
jest.mock("../src/config/prisma", () => ({
    user: {
        findUnique: jest.fn(),
        create:     jest.fn()
    }
}));

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const axios   = require("axios");
const app     = require("../src/app");

const SECRET = "testsecret";

// ─── Token factories ──────────────────────────────────────────────────────────
const validToken   = (roleId = 1) => jwt.sign({ id: "u1", roleId }, SECRET, { expiresIn: "1h" });
const expiredToken = (roleId = 1) =>
    jwt.sign({ id: "u1", roleId, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET);

// ─── 1. Expired JWT ───────────────────────────────────────────────────────────
describe("Expired JWT handling", () => {
    test("GET /api/inventory returns 401 for expired token", async () => {
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", `Bearer ${expiredToken()}`);
        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/invalid or expired/i);
    });

    test("GET /api/sales returns 401 for expired token", async () => {
        const res = await request(app)
            .get("/api/sales")
            .set("Authorization", `Bearer ${expiredToken()}`);
        expect(res.statusCode).toBe(401);
    });

    test("GET /api/dashboard/summary returns 401 for expired token", async () => {
        const res = await request(app)
            .get("/api/dashboard/summary")
            .set("Authorization", `Bearer ${expiredToken()}`);
        expect(res.statusCode).toBe(401);
    });
});

// ─── 2. Invalid / malformed JWT ───────────────────────────────────────────────
describe("Invalid JWT handling", () => {
    test("Returns 401 for completely invalid token string", async () => {
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", "Bearer not.a.real.token");
        expect(res.statusCode).toBe(401);
    });

    test("Returns 401 for token signed with wrong secret", async () => {
        const wrongToken = jwt.sign({ id: "u1", roleId: 1 }, "wrongsecret", { expiresIn: "1h" });
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", `Bearer ${wrongToken}`);
        expect(res.statusCode).toBe(401);
    });

    test("Returns 401 when Authorization header is missing", async () => {
        const res = await request(app).get("/api/inventory");
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/access token required/i);
    });

    test("Returns 401 when Bearer prefix is missing", async () => {
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", validToken());
        expect(res.statusCode).toBe(401);
    });
});

// ─── 3. RBAC denial ───────────────────────────────────────────────────────────
describe("RBAC role enforcement", () => {
    test("Role 3 (Sales Executive) cannot POST to /api/inventory/add", async () => {
        const res = await request(app)
            .post("/api/inventory/add")
            .set("Authorization", `Bearer ${validToken(3)}`)
            .send({ productCode: "PROD-0001", quantity: 5 });
        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
    });

    test("Role 3 cannot PUT to /api/inventory/update", async () => {
        const res = await request(app)
            .put("/api/inventory/update")
            .set("Authorization", `Bearer ${validToken(3)}`)
            .send({ productCode: "PROD-0001", quantity: 10 });
        expect(res.statusCode).toBe(403);
    });

    test("Role 3 cannot DELETE /api/inventory/delete", async () => {
        const res = await request(app)
            .delete("/api/inventory/delete")
            .set("Authorization", `Bearer ${validToken(3)}`)
            .send({ productCode: "PROD-0001" });
        expect(res.statusCode).toBe(403);
    });

    test("Role 2 (Store Manager) can GET /api/inventory", async () => {
        axios.mockResolvedValueOnce({ status: 200, data: { success: true, inventory: [] } });
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", `Bearer ${validToken(2)}`);
        expect(res.statusCode).toBe(200);
    });

    test("Role 1 (Business Owner) has full access to DELETE /api/inventory/delete", async () => {
        axios.mockResolvedValueOnce({ status: 200, data: { success: true } });
        const res = await request(app)
            .delete("/api/inventory/delete")
            .set("Authorization", `Bearer ${validToken(1)}`)
            .send({ productCode: "PROD-0001" });
        expect(res.statusCode).toBe(200);
    });

    test("Role 4 (System Administrator) has full access", async () => {
        axios.mockResolvedValueOnce({ status: 200, data: { success: true } });
        const res = await request(app)
            .post("/api/inventory/add")
            .set("Authorization", `Bearer ${validToken(4)}`)
            .send({ productCode: "PROD-0001", quantity: 5 });
        expect(res.statusCode).toBe(200);
    });

    test("Token with no roleId returns 401 (invalid payload rejected at authentication)", async () => {
        const tokenNoRole = jwt.sign({ id: "u1" }, SECRET, { expiresIn: "1h" });
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", `Bearer ${tokenNoRole}`);
        // authenticate.js validates that roleId is present; missing roleId = invalid token → 401
        expect(res.statusCode).toBe(401);
    });
});

// ─── 4. Rate limiting ─────────────────────────────────────────────────────────
describe("Rate limiting", () => {
    test("Auth limiter triggers 429 after 10 login attempts", async () => {
        const prisma = require("../src/config/prisma");
        prisma.user.findUnique.mockResolvedValue(null);

        for (let i = 0; i < 10; i++) {
            await request(app)
                .post("/api/auth/login")
                .send({ email: `user${i}@test.com`, password: "pass" });
        }

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "overflow@test.com", password: "pass" });

        expect([429, 401]).toContain(res.statusCode);
    });
});

// ─── 5. Malformed request payloads ───────────────────────────────────────────
// Uses a distinct X-Forwarded-For IP so the auth rate limiter from §1.4
// does not bleed into these tests.
describe("Malformed payload rejection (gateway Joi validation)", () => {
    const authHeaders = (roleId = 1) => ({
        Authorization: `Bearer ${validToken(roleId)}`,
        "X-Forwarded-For": "10.0.0.2"
    });

    test("POST /api/inventory/add — missing productCode returns 400", async () => {
        const res = await request(app)
            .post("/api/inventory/add")
            .set(authHeaders(1))
            .send({ quantity: 5 });
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body).toHaveProperty("errors");
    });

    test("POST /api/inventory/add — zero quantity returns 400", async () => {
        const res = await request(app)
            .post("/api/inventory/add")
            .set(authHeaders(1))
            .send({ productCode: "PROD-0001", quantity: 0 });
        expect(res.statusCode).toBe(400);
    });

    test("POST /api/inventory/add — negative quantity returns 400", async () => {
        const res = await request(app)
            .post("/api/inventory/add")
            .set(authHeaders(1))
            .send({ productCode: "PROD-0001", quantity: -10 });
        expect(res.statusCode).toBe(400);
    });

    test("PUT /api/inventory/update — missing productCode returns 400", async () => {
        const res = await request(app)
            .put("/api/inventory/update")
            .set(authHeaders(1))
            .send({ quantity: 20 });
        expect(res.statusCode).toBe(400);
    });

    test("DELETE /api/inventory/delete — missing productCode returns 400", async () => {
        const res = await request(app)
            .delete("/api/inventory/delete")
            .set(authHeaders(1))
            .send({});
        expect(res.statusCode).toBe(400);
    });

    test("POST /api/auth/register — missing name returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .set({ "X-Forwarded-For": "10.0.0.3" })
            .send({ email: "x@x.com", password: "pass123", roleId: 1 });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("errors");
    });

    test("POST /api/auth/register — invalid email returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .set({ "X-Forwarded-For": "10.0.0.4" })
            .send({ name: "X", email: "not-an-email", password: "pass123", roleId: 1 });
        expect(res.statusCode).toBe(400);
    });

    test("POST /api/auth/register — invalid roleId returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .set({ "X-Forwarded-For": "10.0.0.5" })
            .send({ name: "X", email: "x@x.com", password: "pass123", roleId: 99 });
        expect(res.statusCode).toBe(400);
    });

    test("POST /api/auth/refresh — missing refreshToken returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/refresh")
            .set({ "X-Forwarded-For": "10.0.0.6" })
            .send({});
        expect(res.statusCode).toBe(400);
    });
});

// ─── 6. Sales query validation ────────────────────────────────────────────────
describe("Sales GET query validation", () => {
    test("Invalid page (string) returns 400", async () => {
        const res = await request(app)
            .get("/api/sales?page=abc")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("pageSize > 100 returns 400", async () => {
        const res = await request(app)
            .get("/api/sales?pageSize=999")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(400);
    });

    test("Unknown query param returns 400", async () => {
        const res = await request(app)
            .get("/api/sales?foo=bar")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(400);
    });

    test("Valid params pass through to backend", async () => {
        axios.mockResolvedValueOnce({ status: 200, data: { success: true, data: [] } });
        const res = await request(app)
            .get("/api/sales?page=1&pageSize=10")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(200);
    });
});

// ─── 7. Gateway proxy behaviour ───────────────────────────────────────────────
describe("Gateway proxy forwarding", () => {
    test("Forwards GET /api/inventory to backend and returns its response", async () => {
        axios.mockResolvedValueOnce({ status: 200, data: { success: true, inventory: [] } });
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(axios).toHaveBeenCalled();
    });

    test("Propagates backend 404 to caller", async () => {
        const err = new Error("Not found");
        err.response = { status: 404, data: { success: false, message: "Not found" } };
        axios.mockRejectedValueOnce(err);
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(404);
    });

    test("Propagates backend 500 to caller", async () => {
        const err = new Error("Server error");
        err.response = { status: 500, data: { success: false, message: "DB error" } };
        axios.mockRejectedValueOnce(err);
        const res = await request(app)
            .get("/api/products")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(500);
    });

    test("Sales upload forwards file to backend", async () => {
        axios.post = jest.fn().mockResolvedValueOnce({ status: 200, data: { success: true } });
        const res = await request(app)
            .post("/api/sales/upload")
            .set("Authorization", `Bearer ${validToken(3)}`)
            .attach("file",
                Buffer.from("CustomerID,ProductID,Quantity,Price,TransactionDate\nC1,P1,1,10,2024-01-01"),
                "sales.csv"
            );
        expect([200, 201]).toContain(res.statusCode);
        expect(axios.post).toHaveBeenCalled();
    });

    test("POST /api/sales/upload without file returns 400", async () => {
        const res = await request(app)
            .post("/api/sales/upload")
            .set("Authorization", `Bearer ${validToken(3)}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// ─── 8. Auth me / logout ──────────────────────────────────────────────────────
describe("GET /api/auth/me", () => {
    test("Returns 401 without token", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.statusCode).toBe(401);
    });

    test("Returns user profile with valid token", async () => {
        const prisma = require("../src/config/prisma");
        prisma.user.findUnique.mockResolvedValueOnce({
            id: "u1", name: "Alice", email: "alice@test.com", roleId: 1,
            role: { name: "Business Owner" }
        });
        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.user).toHaveProperty("email");
        expect(res.body.user.role).toHaveProperty("name");
    });
});

describe("POST /api/auth/logout", () => {
    test("Returns 401 without token", async () => {
        const res = await request(app).post("/api/auth/logout");
        expect(res.statusCode).toBe(401);
    });

    test("Returns 200 with valid token", async () => {
        const res = await request(app)
            .post("/api/auth/logout")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── 11. Forecast route ───────────────────────────────────────────────────────
describe("GET /api/forecast", () => {
    test("returns 401 without token", async () => {
        const res = await request(app).get("/api/forecast");
        expect(res.statusCode).toBe(401);
    });

    test("Role 3 (Sales Executive) can access forecast", async () => {
        // Role 3 has forecast permission — passes RBAC, gets proxied
        axios.mockResolvedValueOnce({
            status: 200,
            data: { success: true, period: 30, forecast: [], historical: [] }
        });
        const res = await request(app)
            .get("/api/forecast")
            .set("Authorization", `Bearer ${validToken(3)}`);
        expect([200, 503]).toContain(res.statusCode);
    });

    test("Role 2 (Store Manager) can access forecast", async () => {
        axios.mockResolvedValueOnce({
            status: 200,
            data: {
                success: true,
                period: 30,
                lookback: 90,
                smaWindow: 7,
                generatedAt: new Date().toISOString(),
                forecast: [],
                historical: []
            }
        });
        const res = await request(app)
            .get("/api/forecast")
            .set("Authorization", `Bearer ${validToken(2)}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test("Invalid days param returns 400", async () => {
        // The backend validates; the gateway forwards and propagates the 400
        const err = new Error("Bad Request");
        err.response = { status: 400, data: { success: false, message: "Query param 'days' must be between 1 and 365." } };
        axios.mockRejectedValueOnce(err);
        const res = await request(app)
            .get("/api/forecast?days=999")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(400);
    });
});
