const prisma = require("../config/prisma");

// ─── GET /api/dashboard/summary ───────────────────────────────────────────────
exports.getDashboardSummary = async (req, res) => {
    try {
        const [totalCustomers, totalProducts, totalSales, revenue] = await Promise.all([
            prisma.customer.count(),
            prisma.product.count(),
            prisma.salesTransaction.count(),
            prisma.salesTransaction.aggregate({ _sum: { totalAmount: true } })
        ]);

        res.json({
            success: true,
            data: {
                totalCustomers,
                totalProducts,
                totalSales,
                totalRevenue: revenue._sum.totalAmount || 0
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

        const topRaw = await prisma.salesTransaction.groupBy({
            by:       ["productId"],
            _sum:     { quantity: true, totalAmount: true },
            orderBy:  { _sum: { quantity: "desc" } },
            take:     limit
        });

        const productIds = topRaw.map((r) => r.productId);
        const products   = await prisma.product.findMany({ where: { id: { in: productIds } } });
        const productMap = new Map(products.map((p) => [p.id, p]));

        const data = topRaw.map((r) => {
            const product = productMap.get(r.productId);
            return {
                productId:    r.productId,
                productName:  product?.name     || "Unknown",
                category:     product?.category || "Unknown",
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
// Query: ?range=7d|30d|90d|1y  (default 30d)
exports.getSalesTrend = async (req, res) => {
    try {
        const rangeParam = req.query.range || "30d";

        // Parse range into number of days
        const rangeMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
        const days = rangeMap[rangeParam] || 30;

        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);

        // Fetch all transactions in the range
        const transactions = await prisma.salesTransaction.findMany({
            where:  { transactionDate: { gte: since } },
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
        const trend = [];
        for (let i = days; i >= 0; i--) {
            const d = new Date();
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
            range:   rangeParam,
            days
        });
    } catch (error) {
        console.error("[dashboard.controller] getSalesTrend error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
