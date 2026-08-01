/**
 * invoice.logic.test.js — Milestone 3 Unit Tests
 *
 * Tests invoice creation, payment recording, revenue summary, and
 * overdue-check logic using fully mocked Prisma.
 */

jest.mock("../config/prisma", () => ({
    invoice:  {
        findMany:   jest.fn(),
        findUnique: jest.fn(),
        count:      jest.fn(),
        create:     jest.fn(),
        updateMany: jest.fn(),
        aggregate:  jest.fn()
    },
    payment: {
        create:    jest.fn(),
        aggregate: jest.fn()
    },
    inventory: {
        findUnique: jest.fn(),
        update:     jest.fn()
    },
    $transaction: jest.fn()
}));

const prisma = require("../config/prisma");
const invoiceService = require("../services/invoice.service");

beforeEach(() => jest.clearAllMocks());

// ─── Revenue Summary ──────────────────────────────────────────────────────────
describe("getRevenueSummary", () => {
    test("returns correct revenue, outstanding, and daily figures", async () => {
        prisma.invoice.aggregate
            .mockResolvedValueOnce({ _sum: { totalAmount: 10000 } })   // totalRevenue
            .mockResolvedValueOnce({ _sum: { totalAmount: 3000 } });   // outstanding
        prisma.payment.aggregate
            .mockResolvedValueOnce({ _sum: { amount: 500 } });         // daily

        const summary = await invoiceService.getRevenueSummary();

        expect(summary.totalRevenue).toBe(10000);
        expect(summary.outstandingAmount).toBe(3000);
        expect(summary.dailyCollections).toBe(500);
    });

    test("handles null aggregate sums gracefully", async () => {
        prisma.invoice.aggregate
            .mockResolvedValue({ _sum: { totalAmount: null } });
        prisma.payment.aggregate
            .mockResolvedValue({ _sum: { amount: null } });

        const summary = await invoiceService.getRevenueSummary();

        expect(summary.totalRevenue).toBe(0);
        expect(summary.outstandingAmount).toBe(0);
        expect(summary.dailyCollections).toBe(0);
    });
});

// ─── Update overdue invoices ──────────────────────────────────────────────────
describe("updateOverdueInvoices", () => {
    test("marks unpaid past-due invoices as OVERDUE", async () => {
        prisma.invoice.updateMany.mockResolvedValue({ count: 3 });

        const result = await invoiceService.updateOverdueInvoices();

        expect(result.updatedCount).toBe(3);
        expect(prisma.invoice.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { status: "OVERDUE" }
            })
        );
    });

    test("returns zero when no invoices are overdue", async () => {
        prisma.invoice.updateMany.mockResolvedValue({ count: 0 });
        const result = await invoiceService.updateOverdueInvoices();
        expect(result.updatedCount).toBe(0);
    });
});

// ─── generateInvoiceNumber ────────────────────────────────────────────────────
describe("generateInvoiceNumber", () => {
    test("generates a correctly formatted invoice number", async () => {
        prisma.invoice.count.mockResolvedValue(4);

        const num = await invoiceService.generateInvoiceNumber();
        const now = new Date();
        const year  = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");

        expect(num).toBe(`INV-${year}${month}-00005`);
    });
});

// ─── listInvoices ─────────────────────────────────────────────────────────────
describe("listInvoices — pagination + filters", () => {
    beforeEach(() => {
        prisma.invoice.count.mockResolvedValue(42);
        prisma.invoice.findMany.mockResolvedValue([]);
    });

    test("returns correct pagination meta", async () => {
        const result = await invoiceService.listInvoices({ page: 2, pageSize: 10 });
        expect(result.pagination.page).toBe(2);
        expect(result.pagination.total).toBe(42);
        expect(result.pagination.totalPages).toBe(5);
    });

    test("applies status filter to where clause", async () => {
        await invoiceService.listInvoices({ status: "PAID" });
        expect(prisma.invoice.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.objectContaining({ status: "PAID" }) })
        );
    });

    test("applies date range filter", async () => {
        await invoiceService.listInvoices({ dateFrom: "2024-01-01", dateTo: "2024-12-31" });
        expect(prisma.invoice.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ createdAt: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }) })
            })
        );
    });
});
