/**
 * invoice-ai-security.test.js
 *
 * Day 8 security test suite — Milestone 2.
 * Covers: wrong-role access, expired/invalid tokens, and missing auth
 * across all Invoice and AI report endpoints.
 *
 * All DB / backend calls are mocked — no live database required.
 */

process.env.JWT_SECRET = "testsecret";

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
// roleId: 1 = Business Owner, 2 = Store Manager, 3 = Sales Executive, 4 = Admin
const validToken   = (roleId = 1) => jwt.sign({ id: "u1", roleId }, SECRET, { expiresIn: "1h" });
const expiredToken = (roleId = 1) =>
    jwt.sign({ id: "u1", roleId, exp: Math.floor(Date.now() / 1000) - 60 }, SECRET);
const validInvoice = {
    customerId: "11111111-1111-4111-8111-111111111111",
    lineItems: [
        {
            productId: "22222222-2222-4222-8222-222222222222",
            quantity: 1,
            unitPrice: 10
        }
    ],
    dueDate: "2027-12-31"
};

beforeEach(() => {
    axios.mockResolvedValue({ status: 200, data: { success: true } });
});

// ─── 1. Invoice routes — auth checks ──────────────────────────────────────────
describe("Invoice routes — authentication", () => {
    test("GET /api/invoices returns 401 with no token", async () => {
        const res = await request(app).get("/api/invoices");
        expect(res.statusCode).toBe(401);
    });

    test("GET /api/invoices returns 401 with expired token", async () => {
        const res = await request(app)
            .get("/api/invoices")
            .set("Authorization", `Bearer ${expiredToken()}`);
        expect(res.statusCode).toBe(401);
    });

    test("POST /api/invoices returns 401 with invalid token", async () => {
        const res = await request(app)
            .post("/api/invoices")
            .set("Authorization", "Bearer not.a.real.token")
            .send(validInvoice);
        expect(res.statusCode).toBe(401);
    });
});

// ─── 2. Invoice routes — role-based access ────────────────────────────────────
describe("Invoice routes — RBAC", () => {
    test("Sales Executive (role 3) CAN create an invoice", async () => {
        const res = await request(app)
            .post("/api/invoices")
            .set("Authorization", `Bearer ${validToken(3)}`)
            .send(validInvoice);
        expect(res.statusCode).toBe(200);
    });

    test("Sales Executive (role 3) is BLOCKED from viewing revenue-only routes they don't own", async () => {
        // Sales Executive has no PATCH on invoices — should be forbidden
        const res = await request(app)
            .patch("/api/invoices/inv-1")
            .set("Authorization", `Bearer ${validToken(3)}`)
            .send({ status: "PAID" });
        expect(res.statusCode).toBe(403);
    });
});

// ─── 3. AI report routes — role-based access ──────────────────────────────────
describe("AI report routes — RBAC", () => {
    const aiRoutes = [
        "/api/customer-groups",
        "/api/churn",
        "/api/recommendations",
        "/api/anomaly-detection"
    ];

    aiRoutes.forEach((route) => {
        test(`Sales Executive (role 3) CAN read ${route} (GET is allowed per SRS)`, async () => {
            // Per SRS, Sales Executives have read access to AI insight routes
            const res = await request(app)
                .get(route)
                .set("Authorization", `Bearer ${validToken(3)}`);
            // Should pass RBAC (200 or 503 if AI service is offline — never 403)
            expect(res.statusCode).not.toBe(403);
        });

        test(`Store Manager (role 2) CAN access ${route}`, async () => {
            const res = await request(app)
                .get(route)
                .set("Authorization", `Bearer ${validToken(2)}`);
            expect(res.statusCode).not.toBe(403);
        });

        test(`Business Owner (role 1) CAN access ${route}`, async () => {
            const res = await request(app)
                .get(route)
                .set("Authorization", `Bearer ${validToken(1)}`);
            expect(res.statusCode).not.toBe(403);
        });

        test(`${route} returns 401 with no token`, async () => {
            const res = await request(app).get(route);
            expect(res.statusCode).toBe(401);
        });
    });
});

// ─── 4. Invoice validation still enforced under auth ──────────────────────────
describe("Invoice validation under authenticated requests", () => {
    test("Rejects negative invoice amount even with valid Business Owner token", async () => {
        const res = await request(app)
            .post("/api/invoices")
            .set("Authorization", `Bearer ${validToken(1)}`)
           .send({
    customerId: "11111111-1111-4111-8111-111111111111",
    lineItems: [
        {
            productId: "22222222-2222-4222-8222-222222222222",
            quantity: 1,
            unitPrice: -50
        }
    ]
});
        expect(res.statusCode).toBe(400);
    });

    test("Rejects invoice with missing customerId", async () => {
        const res = await request(app)
            .post("/api/invoices")
            .set("Authorization", `Bearer ${validToken(1)}`)
            .send({
    lineItems: [
        {
            productId: "22222222-2222-4222-8222-222222222222",
            quantity: 1,
            unitPrice: 10
        }
    ]
});
        expect(res.statusCode).toBe(400);
    });
});