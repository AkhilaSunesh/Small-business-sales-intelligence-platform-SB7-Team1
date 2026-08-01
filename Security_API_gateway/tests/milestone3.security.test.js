/**
 * milestone3.security.test.js — Milestone 3 Security Tests
 *
 * Covers 10+ endpoints across Milestone 3 new features:
 *   - /api/notifications
 *   - /api/audit-summary
 *   - PATCH /api/invoices/bulk
 *   - PATCH /api/inventory/bulk
 *
 * Tests:
 *   - 401 for no/expired/invalid token
 *   - 403 for wrong role
 *   - 400 for malformed payloads (gateway-level Joi validation)
 *   - 200/proxy for authorized roles
 */

process.env.JWT_SECRET           = "testsecret";
process.env.REFRESH_TOKEN_SECRET = "refreshsecret";

jest.mock("axios");
jest.mock("../src/config/prisma", () => ({
    user: { findUnique: jest.fn(), create: jest.fn() }
}));

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const axios   = require("axios");
const app     = require("../src/app");

const SECRET   = "testsecret";
const token    = (roleId = 1) => jwt.sign({ id: "u1", roleId }, SECRET, { expiresIn: "1h" });
const expired  = () => jwt.sign({ id: "u1", roleId: 1, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET);

beforeEach(() => {
    jest.clearAllMocks();
    axios.mockResolvedValue({ status: 200, data: { success: true } });
});

// ─── 1. Notifications — auth guard ───────────────────────────────────────────
describe("GET /api/notifications — auth guard", () => {
    test("returns 401 without token", async () => {
        const res = await request(app).get("/api/notifications");
        expect(res.statusCode).toBe(401);
    });

    test("returns 401 with expired token", async () => {
        const res = await request(app)
            .get("/api/notifications")
            .set("Authorization", `Bearer ${expired()}`);
        expect(res.statusCode).toBe(401);
    });

    test("returns 401 with completely invalid token", async () => {
        const res = await request(app)
            .get("/api/notifications")
            .set("Authorization", "Bearer not.a.token");
        expect(res.statusCode).toBe(401);
    });
});

// ─── 2. Notifications — RBAC ─────────────────────────────────────────────────
describe("GET /api/notifications — RBAC", () => {
    test("Role 1 (Business Owner) can access notifications", async () => {
        const res = await request(app)
            .get("/api/notifications")
            .set("Authorization", `Bearer ${token(1)}`);
        expect([200, 503]).toContain(res.statusCode);
    });

    test("Role 2 (Store Manager) can access notifications", async () => {
        const res = await request(app)
            .get("/api/notifications")
            .set("Authorization", `Bearer ${token(2)}`);
        expect([200, 503]).toContain(res.statusCode);
    });

    test("Role 3 (Sales Executive) can access notifications", async () => {
        const res = await request(app)
            .get("/api/notifications")
            .set("Authorization", `Bearer ${token(3)}`);
        expect([200, 503]).toContain(res.statusCode);
    });

    test("Role 4 (System Admin) can access notifications", async () => {
        const res = await request(app)
            .get("/api/notifications")
            .set("Authorization", `Bearer ${token(4)}`);
        expect([200, 503]).toContain(res.statusCode);
    });
});

// ─── 3. Notification sub-routes — auth guard ─────────────────────────────────
describe("Notification sub-routes — auth guard", () => {
    test("GET /api/notifications/counts returns 401 without token", async () => {
        const res = await request(app).get("/api/notifications/counts");
        expect(res.statusCode).toBe(401);
    });

    test("GET /api/notifications/low-stock returns 401 without token", async () => {
        const res = await request(app).get("/api/notifications/low-stock");
        expect(res.statusCode).toBe(401);
    });

    test("GET /api/notifications/overdue-invoices returns 401 without token", async () => {
        const res = await request(app).get("/api/notifications/overdue-invoices");
        expect(res.statusCode).toBe(401);
    });
});

// ─── 4. Audit Summary — auth + RBAC ─────────────────────────────────────────
describe("GET /api/audit-summary", () => {
    test("returns 401 without token", async () => {
        const res = await request(app).get("/api/audit-summary");
        expect(res.statusCode).toBe(401);
    });

    test("Role 3 (Sales Exec) is forbidden from audit-summary", async () => {
        const res = await request(app)
            .get("/api/audit-summary")
            .set("Authorization", `Bearer ${token(3)}`);
        expect(res.statusCode).toBe(403);
    });

    test("Role 2 (Store Manager) can access audit-summary", async () => {
        const res = await request(app)
            .get("/api/audit-summary")
            .set("Authorization", `Bearer ${token(2)}`);
        expect([200, 503]).toContain(res.statusCode);
    });

    test("Role 1 (Business Owner) can access audit-summary", async () => {
        const res = await request(app)
            .get("/api/audit-summary")
            .set("Authorization", `Bearer ${token(1)}`);
        expect([200, 503]).toContain(res.statusCode);
    });
});

// ─── 5. PATCH /api/invoices/bulk — auth + validation ─────────────────────────
describe("PATCH /api/invoices/bulk", () => {
    test("returns 401 without token", async () => {
        const res = await request(app).patch("/api/invoices/bulk").send({});
        expect(res.statusCode).toBe(401);
    });

    test("returns 401 with expired token", async () => {
        const res = await request(app)
            .patch("/api/invoices/bulk")
            .set("Authorization", `Bearer ${expired()}`)
            .send({ ids: ["00000000-0000-0000-0000-000000000001"], status: "PAID" });
        expect(res.statusCode).toBe(401);
    });

    test("returns 400 when ids is empty", async () => {
        const res = await request(app)
            .patch("/api/invoices/bulk")
            .set("Authorization", `Bearer ${token(1)}`)
            .send({ ids: [], status: "PAID" });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("errors");
    });

    test("returns 400 when status is invalid", async () => {
        const res = await request(app)
            .patch("/api/invoices/bulk")
            .set("Authorization", `Bearer ${token(1)}`)
            .send({ ids: ["00000000-0000-0000-0000-000000000001"], status: "INVALID_STATUS" });
        expect(res.statusCode).toBe(400);
    });

    test("returns 400 when ids contains non-uuid", async () => {
        const res = await request(app)
            .patch("/api/invoices/bulk")
            .set("Authorization", `Bearer ${token(1)}`)
            .send({ ids: ["not-a-uuid"], status: "PAID" });
        expect(res.statusCode).toBe(400);
    });

    test("Role 3 (Sales Exec) is forbidden from bulk invoice update", async () => {
        const res = await request(app)
            .patch("/api/invoices/bulk")
            .set("Authorization", `Bearer ${token(3)}`)
            .send({ ids: ["00000000-0000-0000-0000-000000000001"], status: "PAID" });
        expect(res.statusCode).toBe(403);
    });

    test("Role 1 with valid payload proxies to backend", async () => {
        const res = await request(app)
            .patch("/api/invoices/bulk")
            .set("Authorization", `Bearer ${token(1)}`)
            .send({ ids: ["00000000-0000-0000-0000-000000000001"], status: "PAID" });
        expect([200, 201, 503]).toContain(res.statusCode);
    });
});

// ─── 6. PATCH /api/inventory/bulk — validation ───────────────────────────────
describe("PATCH /api/inventory/bulk", () => {
    test("returns 401 without token", async () => {
        const res = await request(app).patch("/api/inventory/bulk").send({});
        expect(res.statusCode).toBe(401);
    });

    test("returns 400 when updates is empty", async () => {
        const res = await request(app)
            .patch("/api/inventory/bulk")
            .set("Authorization", `Bearer ${token(1)}`)
            .send({ updates: [] });
        expect(res.statusCode).toBe(400);
    });

    test("returns 400 when quantity is negative", async () => {
        const res = await request(app)
            .patch("/api/inventory/bulk")
            .set("Authorization", `Bearer ${token(1)}`)
            .send({ updates: [{ productCode: "P001", quantity: -10 }] });
        expect(res.statusCode).toBe(400);
    });

    test("returns 400 when productCode is missing", async () => {
        const res = await request(app)
            .patch("/api/inventory/bulk")
            .set("Authorization", `Bearer ${token(1)}`)
            .send({ updates: [{ quantity: 10 }] });
        expect(res.statusCode).toBe(400);
    });

    test("Role 3 is forbidden from bulk inventory update", async () => {
        const res = await request(app)
            .patch("/api/inventory/bulk")
            .set("Authorization", `Bearer ${token(3)}`)
            .send({ updates: [{ productCode: "P001", quantity: 10 }] });
        expect(res.statusCode).toBe(403);
    });
});
