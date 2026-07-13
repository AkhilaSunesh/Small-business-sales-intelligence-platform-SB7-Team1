/**
 * Unit tests — inventory controller
 * Prisma is fully mocked so no live DB is needed.
 */

// Mock the prisma singleton BEFORE requiring the controller
jest.mock("../config/prisma", () => ({
    inventory: {
        findMany: jest.fn(),
        update:   jest.fn(),
        deleteMany: jest.fn()
    },
    product: {
        findUnique: jest.fn()
    }
}));

const prisma = require("../config/prisma");
const controller = require("../controllers/inventory.controller");

// ─── helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
};

const mockReq = (body = {}, query = {}) => ({ body, query });

beforeEach(() => jest.clearAllMocks());

// ─── getInventory ─────────────────────────────────────────────────────────────
describe("getInventory", () => {
    test("returns inventory with lowStock flag annotated", async () => {
        prisma.inventory.findMany.mockResolvedValue([
            { id: "i1", quantity: 5,  lowStockThreshold: 10, product: { name: "Pen" } },
            { id: "i2", quantity: 50, lowStockThreshold: 10, product: { name: "Notebook" } }
        ]);

        const req = mockReq();
        const res = mockRes();

        await controller.getInventory(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const body = res.json.mock.calls[0][0];
        expect(body.success).toBe(true);
        expect(body.inventory[0].lowStock).toBe(true);   // qty 5 <= threshold 10
        expect(body.inventory[1].lowStock).toBe(false);  // qty 50 > threshold 10
        expect(body.summary.lowStockCount).toBe(1);
    });

    test("returns 500 on DB error", async () => {
        prisma.inventory.findMany.mockRejectedValue(new Error("DB failure"));

        const req = mockReq();
        const res = mockRes();

        await controller.getInventory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json.mock.calls[0][0].success).toBe(false);
    });
});

// ─── addStock ─────────────────────────────────────────────────────────────────
describe("addStock", () => {
    test("increments stock for a known product", async () => {
        prisma.product.findUnique.mockResolvedValue({ id: "p1", productCode: "PROD-0001" });
        prisma.inventory.update.mockResolvedValue({ id: "i1", quantity: 60, product: { name: "Notebook" } });

        const req = mockReq({ productCode: "PROD-0001", quantity: 10 });
        const res = mockRes();

        await controller.addStock(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0].success).toBe(true);
        expect(prisma.inventory.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { quantity: { increment: 10 } } })
        );
    });

    test("returns 404 when product not found", async () => {
        prisma.product.findUnique.mockResolvedValue(null);

        const req = mockReq({ productCode: "NONEXISTENT", quantity: 5 });
        const res = mockRes();

        await controller.addStock(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ─── updateStock ──────────────────────────────────────────────────────────────
describe("updateStock", () => {
    test("sets absolute stock for a known product", async () => {
        prisma.product.findUnique.mockResolvedValue({ id: "p1", productCode: "PROD-0001" });
        prisma.inventory.update.mockResolvedValue({ id: "i1", quantity: 25 });

        const req = mockReq({ productCode: "PROD-0001", quantity: 25 });
        const res = mockRes();

        await controller.updateStock(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(prisma.inventory.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { quantity: 25 } })
        );
    });

    test("returns 404 when product not found", async () => {
        prisma.product.findUnique.mockResolvedValue(null);

        const req = mockReq({ productCode: "NONEXISTENT", quantity: 5 });
        const res = mockRes();

        await controller.updateStock(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});

// ─── deleteInventory ──────────────────────────────────────────────────────────
describe("deleteInventory", () => {
    test("deletes inventory record for a known product", async () => {
        prisma.product.findUnique.mockResolvedValue({ id: "p1", productCode: "PROD-0001" });
        prisma.inventory.deleteMany.mockResolvedValue({ count: 1 });

        const req = mockReq({ productCode: "PROD-0001" });
        const res = mockRes();

        await controller.deleteInventory(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    test("returns 404 when product not found", async () => {
        prisma.product.findUnique.mockResolvedValue(null);

        const req = mockReq({ productCode: "NONEXISTENT" });
        const res = mockRes();

        await controller.deleteInventory(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
