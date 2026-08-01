const prisma = require("../config/prisma");

// ─── GET /api/customers ────────────────────────────────────────────────────────
// Supports: ?page, ?limit, ?sort, ?order, ?search, ?email
exports.getCustomers = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit = Math.min(100, Math.max(1,
            parseInt(req.query.limit,    10) ||
            parseInt(req.query.pageSize, 10) ||
            20
        ));
        const skip  = (page - 1) * limit;

        // Sorting
        const allowedSortFields = ["name", "createdAt", "email", "customerCode"];
        const sortBy  = allowedSortFields.includes(req.query.sort) ? req.query.sort : "name";
        const sortOrder = req.query.order === "desc" ? "desc" : "asc";

        // Filtering / search
        const where = {};
        if (req.query.search) {
            where.OR = [
                { name:         { contains: req.query.search, mode: "insensitive" } },
                { customerCode: { contains: req.query.search, mode: "insensitive" } },
                { email:        { contains: req.query.search, mode: "insensitive" } }
            ];
        }
        if (req.query.email) {
            where.email = { contains: req.query.email, mode: "insensitive" };
        }

        const [total, customers] = await Promise.all([
            prisma.customer.count({ where }),
            prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder }
            })
        ]);

        return res.status(200).json({
            success: true,
            data: customers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("[customer.controller] getCustomers:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
