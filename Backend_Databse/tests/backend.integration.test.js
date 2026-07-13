/**
 * Backend integration tests
 *
 * These tests verify route behaviour WITHOUT hitting a real database.
 * Every Prisma call is mocked at the module level.
 */

process.env.JWT_SECRET = "testsecret";

// ─── Mock Prisma before any module that uses it loads ─────────────────────────
jest.mock("../src/config/prisma", () => ({
    salesTransaction: {
        findMany:  jest.fn().mockResolvedValue([]),
        count:     jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null)
    },
    inventory: {
        findMany:  jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update:    jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 })
    },
    product: {
        findMany:  jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        count:     jest.fn().mockResolvedValue(0)
    },
    customer: {
        findMany:  jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        count:     jest.fn().mockResolvedValue(0)
    }
}));

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const app     = require("../src/app");

const SECRET = "testsecret";
const makeToken = (roleId = 1) =>
    jwt.sign({ id: "user-test-id", roleId }, SECRET, { expiresIn: "1h" });

// ─── Auth guard ───────────────────────────────────────────────────────────────
describe("Authentication guard", () => {
    test("GET /api/inventory returns 401 without token", async () => {
        const res = await request(app).get("/api/inventory");
        expect(res.statusCode).toBe(401);
    });

    test("GET /api/sales returns 401 without token", async () => {
        const res = await request(app).get("/api/sales");
        expect(res.statusCode).toBe(401);
    });

    test("GET /api/products returns 401 without token", async () => {
        const res = await request(app).get("/api/products");
        expect(res.statusCode).toBe(401);
    });

    test("GET /api/customers returns 401 without token", async () => {
        const res = await request(app).get("/api/customers");
        expect(res.statusCode).toBe(401);
    });
});

// ─── Inventory routes ─────────────────────────────────────────────────────────
describe("GET /api/inventory", () => {
    test("returns 200 with valid token", async () => {
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.inventory)).toBe(true);
    });

    test("response includes summary object", async () => {
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.body).toHaveProperty("summary");
        expect(res.body.summary).toHaveProperty("total");
        expect(res.body.summary).toHaveProperty("lowStockCount");
    });
});

describe("GET /api/inventory/low-stock", () => {
    test("returns 200 with valid token", async () => {
        const res = await request(app)
            .get("/api/inventory/low-stock")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe("POST /api/inventory/add — validation", () => {
    test("returns 400 when productCode is missing", async () => {
        const res = await request(app)
            .post("/api/inventory/add")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ quantity: 10 });
        expect(res.statusCode).toBe(400);
    });

    test("returns 400 when quantity is zero", async () => {
        const res = await request(app)
            .post("/api/inventory/add")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ productCode: "PROD-0001", quantity: 0 });
        expect(res.statusCode).toBe(400);
    });
});

describe("PUT /api/inventory/update — validation", () => {
    test("returns 400 when productCode is missing", async () => {
        const res = await request(app)
            .put("/api/inventory/update")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ quantity: 5 });
        expect(res.statusCode).toBe(400);
    });
});

// ─── Sales routes ─────────────────────────────────────────────────────────────
describe("GET /api/sales", () => {
    test("returns 200 with valid token", async () => {
        const res = await request(app)
            .get("/api/sales")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("pagination meta is present", async () => {
        const res = await request(app)
            .get("/api/sales?page=1&pageSize=10")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.body).toHaveProperty("pagination");
        expect(res.body.pagination).toHaveProperty("total");
        expect(res.body.pagination).toHaveProperty("totalPages");
    });
});

describe("GET /api/sales/:id — not found", () => {
    test("returns 404 for unknown id", async () => {
        const res = await request(app)
            .get("/api/sales/00000000-0000-0000-0000-000000000000")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(404);
    });
});

// ─── Sales upload — file validation ──────────────────────────────────────────
describe("POST /api/sales/upload — file guard", () => {
    test("returns 400 when no file is attached", async () => {
        const res = await request(app)
            .post("/api/sales/upload")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

// ─── Products / Customers ─────────────────────────────────────────────────────
describe("GET /api/products", () => {
    test("returns 200 with valid token", async () => {
        const res = await request(app)
            .get("/api/products")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe("GET /api/customers", () => {
    test("returns 200 with valid token", async () => {
        const res = await request(app)
            .get("/api/customers")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── Token expiry ─────────────────────────────────────────────────────────────
describe("Expired token handling", () => {
    test("returns 401 for expired token", async () => {
        const expired = jwt.sign(
            { id: "u1", roleId: 1, exp: Math.floor(Date.now() / 1000) - 60 },
            SECRET
        );
        const res = await request(app)
            .get("/api/inventory")
            .set("Authorization", `Bearer ${expired}`);
        expect(res.statusCode).toBe(401);
    });
});
