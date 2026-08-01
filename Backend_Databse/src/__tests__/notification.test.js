/**
 * notification.test.js — Milestone 3 Unit Tests
 *
 * Tests notification service logic with fully mocked Prisma.
 * No live DB required.
 */

jest.mock("../config/prisma", () => ({
    inventory: { findMany: jest.fn(), count: jest.fn() },
    invoice:   { findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
    payment:   { findMany: jest.fn() }
}));

const prisma = require("../config/prisma");
const { getLowStockAlerts, getOverdueInvoiceAlerts, getNotificationCounts } =
    require("../services/notification.service");

const mockRes = () => {
    const r = {};
    r.status = jest.fn().mockReturnValue(r);
    r.json   = jest.fn().mockReturnValue(r);
    return r;
};

beforeEach(() => jest.clearAllMocks());

// ─── getLowStockAlerts ────────────────────────────────────────────────────────
describe("getLowStockAlerts", () => {
    test("returns items where quantity <= lowStockThreshold", async () => {
        prisma.inventory.findMany.mockResolvedValue([
            { id: "i1", quantity: 3, lowStockThreshold: 10, product: { id: "p1", name: "Pen", productCode: "P001", category: "Books" } },
            { id: "i2", quantity: 50, lowStockThreshold: 10, product: { id: "p2", name: "Notebook", productCode: "P002", category: "Books" } }
        ]);

        const result = await getLowStockAlerts({ page: 1, limit: 20 });

        // Only item with qty 3 (≤ threshold 10) should appear
        expect(result.data).toHaveLength(1);
        expect(result.data[0].productName).toBe("Pen");
        expect(result.data[0].type).toBe("LOW_STOCK");
        expect(result.data[0].severity).toBe("WARNING");
    });

    test("marks quantity=0 items as CRITICAL", async () => {
        prisma.inventory.findMany.mockResolvedValue([
            { id: "i1", quantity: 0, lowStockThreshold: 10, product: { id: "p1", name: "Pen", productCode: "P001", category: "Books" } }
        ]);

        const result = await getLowStockAlerts({ page: 1, limit: 20 });

        expect(result.data[0].severity).toBe("CRITICAL");
        expect(result.data[0].currentQuantity).toBe(0);
    });

    test("returns empty array when no low-stock items", async () => {
        prisma.inventory.findMany.mockResolvedValue([
            { id: "i1", quantity: 100, lowStockThreshold: 10, product: { id: "p1", name: "Pen", productCode: "P001", category: "Books" } }
        ]);

        const result = await getLowStockAlerts({ page: 1, limit: 20 });
        expect(result.data).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
    });

    test("includes message string in each alert", async () => {
        prisma.inventory.findMany.mockResolvedValue([
            { id: "i1", quantity: 2, lowStockThreshold: 5, product: { id: "p1", name: "Widget", productCode: "W001", category: "Parts" } }
        ]);

        const result = await getLowStockAlerts({ page: 1, limit: 20 });
        expect(result.data[0].message).toContain("Widget");
        expect(result.data[0].message).toContain("2");
    });
});

// ─── getOverdueInvoiceAlerts ──────────────────────────────────────────────────
describe("getOverdueInvoiceAlerts", () => {
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

    test("returns overdue invoices with outstanding amount", async () => {
        prisma.invoice.count.mockResolvedValue(1);
        prisma.invoice.findMany.mockResolvedValue([{
            id: "inv1",
            invoiceNumber: "INV-2024-00001",
            totalAmount: 500,
            dueDate: pastDate,
            status: "UNPAID",
            customer: { id: "c1", name: "Alice", customerCode: "CUST-0001", email: "a@a.com" },
            payments: []
        }]);

        const result = await getOverdueInvoiceAlerts({ page: 1, limit: 20 });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].type).toBe("OVERDUE_INVOICE");
        expect(result.data[0].invoiceNumber).toBe("INV-2024-00001");
        expect(result.data[0].outstandingAmount).toBe(500);
        expect(result.data[0].daysOverdue).toBeGreaterThan(0);
    });

    test("calculates partial payment correctly", async () => {
        prisma.invoice.count.mockResolvedValue(1);
        prisma.invoice.findMany.mockResolvedValue([{
            id: "inv1",
            invoiceNumber: "INV-2024-00001",
            totalAmount: 1000,
            dueDate: pastDate,
            status: "PARTIALLY_PAID",
            customer: { id: "c1", name: "Bob", customerCode: "CUST-0002", email: "b@b.com" },
            payments: [{ amount: 400 }]
        }]);

        const result = await getOverdueInvoiceAlerts({ page: 1, limit: 20 });
        expect(result.data[0].amountPaid).toBe(400);
        expect(result.data[0].outstandingAmount).toBe(600);
    });

    test("marks invoices >30 days overdue as CRITICAL", async () => {
        const veryPast = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
        prisma.invoice.count.mockResolvedValue(1);
        prisma.invoice.findMany.mockResolvedValue([{
            id: "inv1", invoiceNumber: "INV-OLD", totalAmount: 100,
            dueDate: veryPast, status: "UNPAID",
            customer: { id: "c1", name: "Old Customer", customerCode: "OLD-001", email: "old@a.com" },
            payments: []
        }]);

        const result = await getOverdueInvoiceAlerts({ page: 1, limit: 20 });
        expect(result.data[0].severity).toBe("CRITICAL");
    });
});

// ─── getNotificationCounts ────────────────────────────────────────────────────
describe("getNotificationCounts", () => {
    test("returns correct counts", async () => {
        prisma.inventory.findMany.mockResolvedValue([
            { quantity: 3, lowStockThreshold: 10 },
            { quantity: 0, lowStockThreshold: 10 },
            { quantity: 50, lowStockThreshold: 10 }
        ]);
        prisma.invoice.count.mockResolvedValue(4);

        const counts = await getNotificationCounts();

        expect(counts.lowStock).toBe(2);        // qty 3 and qty 0 are both ≤ threshold 10
        expect(counts.overdueInvoices).toBe(4);
        expect(counts.total).toBe(6);
        expect(counts.critical).toBe(1);        // only qty 0 is critical
    });

    test("returns zeros when no alerts", async () => {
        prisma.inventory.findMany.mockResolvedValue([
            { quantity: 100, lowStockThreshold: 10 }
        ]);
        prisma.invoice.count.mockResolvedValue(0);

        const counts = await getNotificationCounts();
        expect(counts.total).toBe(0);
        expect(counts.lowStock).toBe(0);
        expect(counts.overdueInvoices).toBe(0);
    });
});
