const prisma = require("../config/prisma");

// Helper to parse filters into Prisma where clause
function buildWhereClause(req) {
    const { range, category, startDate, endDate } = req.query;
    let where = {};

    // 1. Date Range
    let since = null;
    let until = null;

    if (range === "custom" && startDate && endDate) {
        since = new Date(startDate);
        until = new Date(endDate);
        until.setUTCHours(23, 59, 59, 999);
    } else {
        const rangeMap = { "7d": 7, "30d": 30, "90d": 90, "3m": 90, "6m": 180, "1y": 365 };
        const days = rangeMap[range] || (range === "today" ? 1 : 365);

        since = new Date();
        if (range === "today") {
            since.setUTCHours(0, 0, 0, 0);
        } else {
            since.setUTCDate(since.getUTCDate() - days);
        }
    }

    if (since) {
        where.transactionDate = { gte: since };
        if (until) where.transactionDate.lte = until;
    }

    // 2. Category
    if (category && category !== 'all') {
        where.product = { category };
    }

    return where;
}

// ─── GET /api/dashboard/summary ───────────────────────────────────────────────
exports.getDashboardSummary = async (req, res) => {
    try {
        const where = buildWhereClause(req);

        const [totalSales, revenueAgg, totalCustomers] = await Promise.all([
            prisma.salesTransaction.count({ where }),
            prisma.salesTransaction.aggregate({ _sum: { totalAmount: true }, where }),
            prisma.customer.count()
        ]);

        // Get total products (optionally filtered by category)
        let productWhere = {};
        if (req.query.category && req.query.category !== 'all') {
            productWhere.category = req.query.category;
        }
        const totalProducts = await prisma.product.count({ where: productWhere });

        const totalRevenue = revenueAgg._sum.totalAmount || 0;
        const avgOrderValue = totalSales > 0 ? (totalRevenue / totalSales) : 0;

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalOrders: totalSales,
                totalSales,
                totalCustomers,
                avgOrderValue,
                activeProducts: totalProducts
            }
        });
    } catch (error) {
        console.error("[dashboard.controller] getDashboardSummary error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/dashboard/total-revenue ────────────────────────────────────────
exports.getTotalRevenue = async (req, res) => {
    try {
        const revenue = await prisma.salesTransaction.aggregate({
            _sum: { totalAmount: true }
        });

        res.json({
            success: true,
            data: {
                totalRevenue: revenue._sum.totalAmount || 0
            }
        });
    } catch (error) {
        console.error("[dashboard.controller] getTotalRevenue error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/dashboard/top-products ─────────────────────────────────────────
exports.getTopProducts = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
        const where = buildWhereClause(req);

        const topRaw = await prisma.salesTransaction.groupBy({
            by:       ["productId"],
            _sum:     { quantity: true, totalAmount: true },
            where,
            orderBy:  { _sum: { quantity: "desc" } },
            take:     limit
        });

        const productIds = topRaw.map((r) => r.productId);
        const products   = await prisma.product.findMany({ where: { id: { in: productIds } } });
        const productMap = new Map(products.map((p) => [p.id, p]));

        const data = topRaw.map((r) => {
            const prod = productMap.get(r.productId);
            return {
                productId:    r.productId,
                product:      prod?.name        || "Unknown",
                productName:  prod?.name        || "Unknown",
                category:     prod?.category    || "Unknown",
                quantitySold: r._sum.quantity   || 0,
                revenue:      r._sum.totalAmount || 0
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error("[dashboard.controller] getTopProducts error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/dashboard/sales-trend ──────────────────────────────────────────
exports.getSalesTrend = async (req, res) => {
    try {
        const where = buildWhereClause(req);

        // Fetch all transactions in the range
        const transactions = await prisma.salesTransaction.findMany({
            where,
            select: { transactionDate: true, totalAmount: true, quantity: true }
        });

        // Aggregate by day
        const buckets = new Map();
        for (const tx of transactions) {
            const day = tx.transactionDate.toISOString().slice(0, 10);
            if (!buckets.has(day)) {
                buckets.set(day, { date: day, revenue: 0, transactions: 0, quantity: 0 });
            }
            const b = buckets.get(day);
            b.revenue      += tx.totalAmount;
            b.transactions += 1;
            b.quantity     += tx.quantity;
        }

        // Build a contiguous daily series (fill missing days with 0)
        // Get number of days in range for padding
        const start = where.transactionDate?.gte || new Date(new Date().setDate(new Date().getDate() - 30));
        const end = where.transactionDate?.lte || new Date();
        const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

        const trend = [];
        for (let i = days; i >= 0; i--) {
            const d = new Date(end);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const val = buckets.get(key) || { date: key, revenue: 0, transactions: 0, quantity: 0 };
            trend.push({
                date:         val.date,
                revenue:      parseFloat(val.revenue.toFixed(2)),
                transactions: val.transactions,
                quantity:     val.quantity
            });
        }

        res.json({
            success: true,
            data:    trend,
            range:   req.query.range || "30d",
            days
        });
    } catch (error) {
        console.error("[dashboard.controller] getSalesTrend error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
