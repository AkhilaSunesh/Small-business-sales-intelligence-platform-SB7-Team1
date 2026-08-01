/**
 * bulk.controller.js — Milestone 3
 *
 * Bulk-update operations on existing records.
 * No new data is created — only existing records are updated.
 */

const prisma = require("../config/prisma");

// ─── PATCH /api/invoices/bulk ─────────────────────────────────────────────────
// Body: { ids: string[], status: InvoiceStatus }
// Marks multiple invoices as paid/cancelled/etc. in one request.
exports.bulkUpdateInvoices = async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "ids must be a non-empty array of invoice UUIDs"
            });
        }

        const validStatuses = ["PAID", "UNPAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `status must be one of: ${validStatuses.join(", ")}`
            });
        }

        if (ids.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Cannot update more than 100 invoices at once"
            });
        }

        // Verify all IDs exist
        const existing = await prisma.invoice.findMany({
            where: { id: { in: ids } },
            select: { id: true }
        });

        const foundIds    = existing.map(i => i.id);
        const missingIds  = ids.filter(id => !foundIds.includes(id));

        if (missingIds.length > 0) {
            return res.status(404).json({
                success: false,
                message: `Invoice(s) not found: ${missingIds.join(", ")}`
            });
        }

        const result = await prisma.invoice.updateMany({
            where: { id: { in: ids } },
            data:  { status }
        });

        return res.status(200).json({
            success: true,
            message: `${result.count} invoice(s) updated to ${status}`,
            data: { updatedCount: result.count, status }
        });
    } catch (error) {
        console.error("[bulk.controller] bulkUpdateInvoices:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PATCH /api/inventory/bulk ────────────────────────────────────────────────
// Body: { updates: [{ productCode: string, quantity: number }] }
// Adjusts stock levels for multiple products in one request.
exports.bulkUpdateInventory = async (req, res) => {
    try {
        const { updates } = req.body;

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "updates must be a non-empty array of { productCode, quantity }"
            });
        }

        if (updates.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Cannot update more than 100 inventory records at once"
            });
        }

        // Validate each entry
        for (const u of updates) {
            if (!u.productCode || u.quantity === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "Each update must have productCode and quantity"
                });
            }
            if (typeof u.quantity !== "number" || u.quantity < 0) {
                return res.status(400).json({
                    success: false,
                    message: `quantity must be a non-negative number (got ${u.quantity} for ${u.productCode})`
                });
            }
        }

        // Resolve productCodes to inventory records
        const productCodes = updates.map(u => u.productCode);
        const products     = await prisma.product.findMany({
            where: { productCode: { in: productCodes } },
            select: { id: true, productCode: true }
        });

        const productMap   = new Map(products.map(p => [p.productCode, p.id]));
        const notFound     = productCodes.filter(c => !productMap.has(c));

        if (notFound.length > 0) {
            return res.status(404).json({
                success: false,
                message: `Product(s) not found: ${notFound.join(", ")}`
            });
        }

        // Execute all updates in a single transaction
        let updatedCount = 0;
        await prisma.$transaction(async (tx) => {
            for (const u of updates) {
                const productId = productMap.get(u.productCode);
                await tx.inventory.update({
                    where: { productId },
                    data:  { quantity: Number(u.quantity) }
                });
                updatedCount++;
            }
        });

        return res.status(200).json({
            success: true,
            message: `${updatedCount} inventory record(s) updated`,
            data: { updatedCount }
        });
    } catch (error) {
        console.error("[bulk.controller] bulkUpdateInventory:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
