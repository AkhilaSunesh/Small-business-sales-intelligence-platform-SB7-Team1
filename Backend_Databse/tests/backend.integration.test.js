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
        findMany:   jest.fn().mockResolvedValue([]),
        count:      jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null)
    },
    inventory: {
        findMany:   jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update:     jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        count:      jest.fn().mockResolvedValue(0)
    },
    product: {
        findMany:   jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        count:      jest.fn().mockResolvedValue(0)
    },
    customer: {
        findMany:   jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        count:      jest.fn().mockResolvedValue(0)
    },
    invoice: {
        findMany:    jest.fn().mockResolvedValue([]),
        findUnique:  jest.fn().mockResolvedValue(null),
        findFirst:   jest.fn().mockResolvedValue(null),
        count:       jest.fn().mockResolvedValue(0),
        create:      jest.fn().mockResolvedValue({ id: "inv-1", invoiceNumber: "INV-202407-00001", status: "UNPAID", totalAmount: 118, subtotal: 100, taxRate: 18, taxAmount: 18, discountRate: 0, discountAmount: 0, dueDate: new Date(), createdAt: new Date(), lineItems: [] }),
        updateMany:  jest.fn().mockResolvedValue({ count: 0 }),
        aggregate:   jest.fn().mockResolvedValue({ _sum: { totalAmount: 0 } })
    },
    payment: {
        findMany:  jest.fn().mockResolvedValue([]),
        create:    jest.fn().mockResolvedValue({ id: "pay-1", amount: 118, method: "CASH" }),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } })
    },
    $transaction: jest.fn().mockImplementation((fn) => {
        const tx = {
            invoice:     { create: jest.fn().mockResolvedValue({ id: "inv-1", invoiceNumber: "INV-202407-00001", status: "UNPAID", totalAmount: 118, subtotal: 100, taxRate: 18, taxAmount: 18, discountRate: 0, discountAmount: 0, dueDate: new Date(), lineItems: [] }), update: jest.fn(), updateMany: jest.fn(), count: jest.fn().mockResolvedValue(0), findUnique: jest.fn().mockResolvedValue(null) },
            payment:     { create: jest.fn().mockResolvedValue({ id: "pay-1", amount: 118, method: "CASH" }) },
            inventory:   { findUnique: jest.fn().mockResolvedValue({ productId: "p1", quantity: 100, lowStockThreshold: 10 }), update: jest.fn() }
        };
        return typeof fn === "function" ? fn(tx) : Promise.all(fn);
    })
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

// ─── Invoice routes ───────────────────────────────────────────────────────────

describe("GET /api/invoices — auth guard", () => {
    test("returns 401 without token", async () => {
        const res = await request(app).get("/api/invoices");
        expect(res.statusCode).toBe(401);
    });

    test("POST /api/invoices returns 401 without token", async () => {
        const res = await request(app).post("/api/invoices").send({});
        expect(res.statusCode).toBe(401);
    });

    test("GET /api/invoices/revenue/summary returns 401 without token", async () => {
        const res = await request(app).get("/api/invoices/revenue/summary");
        expect(res.statusCode).toBe(401);
    });
});

describe("GET /api/invoices", () => {
    test("returns 200 with valid token", async () => {
        const res = await request(app)
            .get("/api/invoices")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("pagination meta is present", async () => {
        const res = await request(app)
            .get("/api/invoices?page=1&pageSize=10")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.body).toHaveProperty("pagination");
        expect(res.body.pagination).toHaveProperty("total");
        expect(res.body.pagination).toHaveProperty("totalPages");
    });
});

describe("GET /api/invoices/status/:status", () => {
    test("returns 200 for PAID status", async () => {
        const res = await request(app)
            .get("/api/invoices/status/paid")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test("returns 200 for UNPAID status", async () => {
        const res = await request(app)
            .get("/api/invoices/status/unpaid")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
    });

    test("returns 200 for PARTIALLY_PAID status", async () => {
        const res = await request(app)
            .get("/api/invoices/status/partially_paid")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
    });

    test("returns 400 for invalid status", async () => {
        const res = await request(app)
            .get("/api/invoices/status/invalid_status")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

describe("GET /api/invoices/:id", () => {
    test("returns 404 for unknown invoice id", async () => {
        const res = await request(app)
            .get("/api/invoices/00000000-0000-0000-0000-000000000000")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

describe("GET /api/invoices/revenue/summary", () => {
    test("returns 200 with revenue data", async () => {
        const res = await request(app)
            .get("/api/invoices/revenue/summary")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("totalRevenue");
        expect(res.body.data).toHaveProperty("outstandingAmount");
        expect(res.body.data).toHaveProperty("dailyCollections");
    });
});

describe("POST /api/invoices/overdue/check", () => {
    test("returns 200 with updatedCount", async () => {
        const res = await request(app)
            .post("/api/invoices/overdue/check")
            .set("Authorization", `Bearer ${makeToken()}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("updatedCount");
    });
});

describe("POST /api/invoices — validation", () => {
    test("returns 400 when customerId is missing", async () => {
        const res = await request(app)
            .post("/api/invoices")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ lineItems: [{ productId: "00000000-0000-0000-0000-000000000001", quantity: 1, unitPrice: 50 }] });
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("returns 400 when lineItems is empty", async () => {
        const res = await request(app)
            .post("/api/invoices")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ customerId: "00000000-0000-0000-0000-000000000001", lineItems: [] });
        expect(res.statusCode).toBe(400);
    });

    test("returns 400 when lineItem has invalid productId (not uuid)", async () => {
        const res = await request(app)
            .post("/api/invoices")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({
                customerId: "00000000-0000-0000-0000-000000000001",
                lineItems: [{ productId: "not-a-uuid", quantity: 1, unitPrice: 50 }]
            });
        expect(res.statusCode).toBe(400);
    });

    test("returns 201 with valid payload", async () => {
        const res = await request(app)
            .post("/api/invoices")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({
                customerId: "00000000-0000-0000-0000-000000000001",
                lineItems: [{ productId: "00000000-0000-0000-0000-000000000002", quantity: 2, unitPrice: 50 }]
            });
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("invoiceNumber");
    });
});

describe("POST /api/invoices/:id/payments — validation", () => {
    test("returns 400 when amount is missing", async () => {
        const res = await request(app)
            .post("/api/invoices/00000000-0000-0000-0000-000000000001/payments")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ method: "CASH" });
        expect(res.statusCode).toBe(400);
    });

    test("returns 400 when amount is zero", async () => {
        const res = await request(app)
            .post("/api/invoices/00000000-0000-0000-0000-000000000001/payments")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ amount: 0 });
        expect(res.statusCode).toBe(400);
    });

    test("returns 400 when payment method is invalid", async () => {
        const res = await request(app)
            .post("/api/invoices/00000000-0000-0000-0000-000000000001/payments")
            .set("Authorization", `Bearer ${makeToken()}`)
            .send({ amount: 50, method: "INVALID_METHOD" });
        expect(res.statusCode).toBe(400);
    });
});
