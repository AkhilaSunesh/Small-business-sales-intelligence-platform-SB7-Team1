/**
 * notification.service.js — Milestone 3
 *
 * Generates two types of alerts from existing database data:
 *   1. Low-stock alerts   — Inventory items at or below their threshold
 *   2. Overdue invoices   — UNPAID/PARTIALLY_PAID invoices past their dueDate
 *
 * No new data is created. Uses the same Kaggle-seeded dataset.
 */

const prisma = require("../config/prisma");

// ─── Low-stock alerts ─────────────────────────────────────────────────────────
async function getLowStockAlerts({ page = 1, limit = 20 } = {}) {
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));

    // Single query — field-to-field comparison handled in JS after fetch
    const allItems = await prisma.inventory.findMany({
        include: { product: { select: { id: true, name: true, productCode: true, category: true } } },
        orderBy: { quantity: "asc" }
    });

    // Filter: quantity <= lowStockThreshold
    const filtered = allItems.filter(item => item.quantity <= item.lowStockThreshold);
    const paginated = filtered.slice(skip, skip + take);

    return {
        data: paginated.map(item => ({
            type:             "LOW_STOCK",
            severity:         item.quantity === 0 ? "CRITICAL" : "WARNING",
            inventoryId:      item.id,
            productId:        item.product.id,
            productName:      item.product.name,
            productCode:      item.product.productCode,
            category:         item.product.category,
            currentQuantity:  item.quantity,
            threshold:        item.lowStockThreshold,
            message:          item.quantity === 0
                ? `Product "${item.product.name}" is OUT OF STOCK`
                : `Product "${item.product.name}" is low on stock (${item.quantity} remaining, threshold ${item.lowStockThreshold})`
        })),
        pagination: {
            total: filtered.length,
            page:  Math.max(1, page),
            limit: take,
            totalPages: Math.ceil(filtered.length / take)
        }
    };
}

// ─── Overdue invoice alerts ───────────────────────────────────────────────────
async function getOverdueInvoiceAlerts({ page = 1, limit = 20 } = {}) {
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));
    const now  = new Date();

    const [total, invoices] = await Promise.all([
        prisma.invoice.count({
            where: {
                dueDate: { lt: now },
                status:  { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] }
            }
        }),
        prisma.invoice.findMany({
            where: {
                dueDate: { lt: now },
                status:  { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] }
            },
            skip,
            take,
            orderBy: { dueDate: "asc" },
            include: {
                customer: { select: { id: true, name: true, customerCode: true, email: true } },
                payments: { select: { amount: true } }
            }
        })
    ]);

    return {
        data: invoices.map(inv => {
            const totalPaid   = inv.payments.reduce((s, p) => s + p.amount, 0);
            const outstanding = inv.totalAmount - totalPaid;
            const daysOverdue = Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));

            return {
                type:           "OVERDUE_INVOICE",
                severity:       daysOverdue > 30 ? "CRITICAL" : "WARNING",
                invoiceId:      inv.id,
                invoiceNumber:  inv.invoiceNumber,
                customerId:     inv.customer.id,
                customerName:   inv.customer.name,
                customerCode:   inv.customer.customerCode,
                customerEmail:  inv.customer.email,
                totalAmount:    inv.totalAmount,
                amountPaid:     totalPaid,
                outstandingAmount: outstanding,
                dueDate:        inv.dueDate,
                daysOverdue,
                status:         inv.status,
                message:        `Invoice ${inv.invoiceNumber} for ${inv.customer.name} is ${daysOverdue} day(s) overdue. Outstanding: ${outstanding.toFixed(2)}`
            };
        }),
        pagination: {
            total,
            page:  Math.max(1, page),
            limit: take,
            totalPages: Math.ceil(total / take)
        }
    };
}

// ─── Combined notifications ───────────────────────────────────────────────────
async function getAllNotifications({ page = 1, limit = 20, type } = {}) {
    if (type === "LOW_STOCK") {
        const result = await getLowStockAlerts({ page, limit });
        return { ...result, summary: buildSummary(result.data, []) };
    }
    if (type === "OVERDUE_INVOICE") {
        const result = await getOverdueInvoiceAlerts({ page, limit });
        return { ...result, summary: buildSummary([], result.data) };
    }

    // Both types — fetch separately then merge for summary
    const [lowStock, overdue] = await Promise.all([
        getLowStockAlerts({ page: 1, limit: 1000 }),
        getOverdueInvoiceAlerts({ page: 1, limit: 1000 })
    ]);

    const allNotifications = [...lowStock.data, ...overdue.data]
        .sort((a, b) => {
            const severityOrder = { CRITICAL: 0, WARNING: 1 };
            return (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2);
        });

    const totalItems = allNotifications.length;
    const take       = Math.min(100, Math.max(1, limit));
    const skip       = (Math.max(1, page) - 1) * take;
    const paginated  = allNotifications.slice(skip, skip + take);

    return {
        data: paginated,
        pagination: {
            total:      totalItems,
            page:       Math.max(1, page),
            limit:      take,
            totalPages: Math.ceil(totalItems / take)
        },
        summary: buildSummary(lowStock.data, overdue.data)
    };
}

function buildSummary(lowStockItems, overdueItems) {
    return {
        totalNotifications: lowStockItems.length + overdueItems.length,
        lowStockCount:      lowStockItems.length,
        overdueInvoiceCount: overdueItems.length,
        criticalCount:      [...lowStockItems, ...overdueItems].filter(n => n.severity === "CRITICAL").length,
        warningCount:       [...lowStockItems, ...overdueItems].filter(n => n.severity === "WARNING").length
    };
}

// ─── Notification counts (for badge/header display) ───────────────────────────
async function getNotificationCounts() {
    const now = new Date();

    const [lowStockItems, overdueCount] = await Promise.all([
        prisma.inventory.findMany({ select: { quantity: true, lowStockThreshold: true } }),
        prisma.invoice.count({
            where: {
                dueDate: { lt: now },
                status:  { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] }
            }
        })
    ]);

    const lowStockCount = lowStockItems.filter(i => i.quantity <= i.lowStockThreshold).length;
    const criticalCount = lowStockItems.filter(i => i.quantity === 0).length;

    return {
        total:         lowStockCount + overdueCount,
        lowStock:      lowStockCount,
        overdueInvoices: overdueCount,
        critical:      criticalCount
    };
}

module.exports = {
    getLowStockAlerts,
    getOverdueInvoiceAlerts,
    getAllNotifications,
    getNotificationCounts
};
