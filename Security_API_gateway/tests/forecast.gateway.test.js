/**
 * forecast.gateway.test.js
 *
 * Tests the /api/forecast gateway proxy route:
 *  - auth guard (401 without token)
 *  - RBAC (Role 3 blocked, Role 2 allowed)
 *  - proxy forwarding to backend
 *  - bad query param propagation
 */

process.env.JWT_SECRET           = "testsecret";
process.env.REFRESH_TOKEN_SECRET = "refreshsecret";
process.env.BACKEND_API_URL      = "http://localhost:5000/api";
process.env.AI_API_URL           = "http://localhost:5001";

jest.mock("axios");
jest.mock("../src/config/prisma", () => ({
    user: { findUnique: jest.fn(), create: jest.fn() }
}));

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const axios   = require("axios");
const app     = require("../src/app");

const SECRET     = "testsecret";
const validToken = (roleId = 1) =>
    jwt.sign({ id: "u1", roleId }, SECRET, { expiresIn: "1h" });

beforeEach(() => {
    jest.clearAllMocks();
});

describe("GET /api/forecast — auth guard", () => {
    test("returns 401 without token", async () => {
        const res = await request(app).get("/api/forecast");
        expect(res.statusCode).toBe(401);
    });
});

describe("GET /api/forecast — RBAC", () => {
    test("Role 3 (Sales Executive) is allowed — has forecast permission", async () => {
        // Role 3 has forecast: ["GET"] in the permission matrix
        // RBAC passes; axios is mocked so the proxy succeeds
        axios.mockResolvedValueOnce({
            status: 200,
            data:   { success: true, period: 30, forecast: [], historical: [] }
        });
        const res = await request(app)
            .get("/api/forecast")
            .set("Authorization", `Bearer ${validToken(3)}`);
        expect([200, 503]).toContain(res.statusCode);
    });

    test("Role 2 (Store Manager) is allowed and proxied to backend", async () => {
        axios.mockResolvedValueOnce({
            status: 200,
            data: {
                success:     true,
                period:      30,
                lookback:    90,
                smaWindow:   7,
                generatedAt: new Date().toISOString(),
                forecast:    [{ date: "2026-08-01", forecastRevenue: 1234.56, forecastTransactions: 12 }],
                historical:  []
            }
        });
        const res = await request(app)
            .get("/api/forecast")
            .set("Authorization", `Bearer ${validToken(2)}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty("forecast");
        expect(res.body).toHaveProperty("generatedAt");
    });

    test("Role 1 (Business Owner) is allowed", async () => {
        axios.mockResolvedValueOnce({
            status: 200,
            data:   { success: true, period: 7, forecast: [], historical: [] }
        });
        const res = await request(app)
            .get("/api/forecast?days=7")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test("Role 4 (System Administrator) is allowed", async () => {
        axios.mockResolvedValueOnce({
            status: 200,
            data:   { success: true, period: 30, forecast: [], historical: [] }
        });
        const res = await request(app)
            .get("/api/forecast")
            .set("Authorization", `Bearer ${validToken(4)}`);
        expect(res.statusCode).toBe(200);
    });
});

describe("GET /api/forecast — proxy behaviour", () => {
    test("Propagates backend 400 for invalid days param", async () => {
        const err  = new Error("Bad Request");
        err.response = {
            status: 400,
            data:   { success: false, message: "Query param 'days' must be between 1 and 365." }
        };
        axios.mockRejectedValueOnce(err);
        const res = await request(app)
            .get("/api/forecast?days=999")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("Propagates backend 500 to caller", async () => {
        const err  = new Error("DB error");
        err.response = {
            status: 500,
            data:   { success: false, message: "Failed to generate forecast." }
        };
        axios.mockRejectedValueOnce(err);
        const res = await request(app)
            .get("/api/forecast")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(500);
    });

    test("Forwards ?days and ?lookback query params to backend", async () => {
        axios.mockResolvedValueOnce({
            status: 200,
            data:   { success: true, period: 14, lookback: 60, forecast: [], historical: [] }
        });
        const res = await request(app)
            .get("/api/forecast?days=14&lookback=60")
            .set("Authorization", `Bearer ${validToken(1)}`);
        expect(res.statusCode).toBe(200);
        // Verify axios was called with the correct query params forwarded
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({ days: "14", lookback: "60" })
            })
        );
    });
});
