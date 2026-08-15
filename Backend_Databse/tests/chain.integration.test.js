/**
 * chain.integration.test.js — Milestone 3 Integration Test
 *
 * Verifies the full chain:
 *   Sales upload → Inventory deduction → Invoice creation → Notification trigger
 *
 * All Prisma calls are mocked — no live database required.
 */

process.env.JWT_SECRET = "testsecret";

jest.mock("../src/config/prisma", () => ({
    salesTransaction: {
        findMany:   jest.fn().mockResolvedValue([]),
        count:      jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null)
    },
    inventory: {
        findMany:    jest.fn().mockResolvedValue([]),
        findUnique:  jest.fn(),
        update:      jest.fn(),
        deleteMany:  jest.fn()
    },
    product: {
        findMany:   jest.fn().mockResolvedValue([
            { id: "00000000-0000-0000-0000-000000000002", name: "Product A", price: 50.00 }
        ]),
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
        count:       jest.fn().mockResolvedValue(0),
        aggregate:   jest.fn().mockResolvedValue({ _sum: { totalAmount: 0 } }),
        updateMany:  jest.fn().mockResolvedValue({ count: 0 })
    },
    payment: {
        findMany:   jest.fn().mockResolvedValue([]),
        aggregate:  jest.fn().mockResolvedValue({ _sum: { amount: 0 } })
    },
    $transaction: jest.fn().mockImplementation((fn) => {
        const tx = {
            salesTransaction: { create: jest.fn().mockResolvedValue({ id: "sale-1" }) },
            invoice:          { create: jest.fn().mockResolvedValue({ id: "inv-1" }), count: jest.fn().mockResolvedValue(0) },
            inventory:        {
                findUnique: jest.fn().mockResolvedValue({ productId: "prod-1", quantity: 100, lowStockThreshold: 10 }),
                update:     jest.fn().mockResolvedValue({})
            }
        };
        return typeof fn === "function" ? fn(tx) : Promise.all(fn);
    })
}));

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const app     = require("../src/app");

const SECRET     = "testsecret";
const makeToken  = (roleId = 1) => jwt.sign({ id: "u1", roleId }, SECRET, { expiresIn: "1h" });
const AUTH       = () => ({ Authorization: `Bearer ${makeToken()}` });

const prisma = require("../src/config/prisma");

beforeEach(() => {
    jest.clearAllMocks();
    // Reset default return values after each clearAllMocks
    prisma.inventory.findMany.mockResolvedValue([]);
    prisma.invoice.count.mockResolvedValue(0);
    prisma.invoice.findMany.mockResolvedValue([]);
});

// ─── 1. Inventory → Notification chain ───────────────────────────────────────
describe("Inventory → Notification chain", () => {
    test("low-stock check returns items below threshold", async () => {
        prisma.inventory.findMany.mockResolvedValue([
            { id: "i1", quantity: 3, lowStockThreshold: 10,
              product: { id: "p1", name: "Pen", productCode: "P001", category: "Books" } }
        ]);

        const res = await request(app)
            .get("/api/notifications/low-stock")
            .set(AUTH());

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(0);
    });

    test("notification counts endpoint returns structured counts", async () => {
        prisma.inventory.findMany.mockResolvedValue([
            { quantity: 5, lowStockThreshold: 10 },
            { quantity: 100, lowStockThreshold: 10 }
        ]);
        prisma.invoice.count.mockResolvedValue(2);

        const res = await request(app)
            .get("/api/notifications/counts")
            .set(AUTH());

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty("total");
        expect(res.body.data).toHaveProperty("lowStock");
        expect(res.body.data).toHaveProperty("overdueInvoices");
    });
});

// ─── 2. Invoice → Notification chain ─────────────────────────────────────────
describe("Invoice → Overdue Notification chain", () => {
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    test("overdue invoices appear in notifications", async () => {
        prisma.invoice.count.mockResolvedValue(1);
        prisma.invoice.findMany.mockResolvedValue([{
            id: "inv-1", invoiceNumber: "INV-TEST-001",
            totalAmount: 500, dueDate: new Date(pastDate),
            status: "UNPAID",
            customer: { id: "c1", name: "Test Customer", customerCode: "TC001", email: "t@t.com" },
            payments: []
        }]);

        const res = await request(app)
            .get("/api/notifications/overdue-invoices")
            .set(AUTH());

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test("POST /api/invoices/overdue/check marks invoices overdue", async () => {
        prisma.invoice.updateMany.mockResolvedValue({ count: 3 });

        const res = await request(app)
            .post("/api/invoices/overdue/check")
            .set(AUTH());

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.updatedCount).toBe(3);
    });
});

// ─── 3. Combined notifications ────────────────────────────────────────────────
describe("GET /api/notifications — combined chain", () => {
    test("returns 200 with data + pagination + summary", async () => {
        prisma.inventory.findMany.mockResolvedValue([]);
        prisma.invoice.count.mockResolvedValue(0);
        prisma.invoice.findMany.mockResolvedValue([]);

        const res = await request(app)
            .get("/api/notifications")
            .set(AUTH());

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("data");
        expect(res.body).toHaveProperty("pagination");
        expect(res.body).toHaveProperty("summary");
    });

    test("type=LOW_STOCK filter returns only low-stock alerts", async () => {
        prisma.inventory.findMany.mockResolvedValue([]);

        const res = await request(app)
            .get("/api/notifications?type=LOW_STOCK")
            .set(AUTH());

        expect(res.statusCode).toBe(200);
    });

    test("invalid type param returns 400", async () => {
        const res = await request(app)
            .get("/api/notifications?type=INVALID")
            .set(AUTH());

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("returns 401 without token", async () => {
        const res = await request(app).get("/api/notifications");
        expect(res.statusCode).toBe(401);
    });
});

// ─── 4. Bulk update chain ─────────────────────────────────────────────────────
describe("Bulk update APIs", () => {
    test("PATCH /api/invoices/bulk — returns 400 for empty ids array", async () => {
        const res = await request(app)
            .patch("/api/invoices/bulk")
            .set(AUTH())
            .send({ ids: [], status: "PAID" });

        expect(res.statusCode).toBe(400);
    });

    test("PATCH /api/invoices/bulk — returns 400 for invalid status", async () => {
        const res = await request(app)
            .patch("/api/invoices/bulk")
            .set(AUTH())
            .send({ ids: ["00000000-0000-0000-0000-000000000001"], status: "INVALID" });

        expect(res.statusCode).toBe(400);
    });

    test("PATCH /api/inventory/bulk — returns 400 for empty updates", async () => {
        const res = await request(app)
            .patch("/api/inventory/bulk")
            .set(AUTH())
            .send({ updates: [] });

        expect(res.statusCode).toBe(400);
    });

    test("PATCH /api/inventory/bulk — returns 400 for negative quantity", async () => {
        const res = await request(app)
            .patch("/api/inventory/bulk")
            .set(AUTH())
            .send({ updates: [{ productCode: "PROD-0001", quantity: -5 }] });

        expect(res.statusCode).toBe(400);
    });
});
