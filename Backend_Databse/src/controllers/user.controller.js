/**
 * user.controller.js
 *
 * Provides user management data from PostgreSQL via Prisma.
 *
 * SECURITY: password field is explicitly excluded from every query.
 * This controller NEVER returns password hashes or authentication tokens.
 */

const prisma = require("../config/prisma");

// ─── Role name → display label mapping ───────────────────────────────────────
const ROLE_LABELS = {
    1: "Owner",
    2: "Store Manager",
    3: "Sales Executive",
    4: "Admin"
};

// ─── GET /api/users ───────────────────────────────────────────────────────────
// Returns all users from PostgreSQL with role name.
// Query: ?page, ?limit, ?search (name or email), ?role (roleId)
// NEVER returns: password, passwordHash, tokens
exports.getUsers = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip  = (page - 1) * limit;

        // Build where clause
        const where = {};
        if (req.query.search) {
            where.OR = [
                { name:  { contains: req.query.search, mode: "insensitive" } },
                { email: { contains: req.query.search, mode: "insensitive" } }
            ];
        }
        if (req.query.role) {
            const roleId = parseInt(req.query.role, 10);
            if (!isNaN(roleId)) {
                where.roleId = roleId;
            }
        }

        const [total, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
                // Explicitly select only safe fields — password is NOT selected
                select: {
                    id:     true,
                    name:   true,
                    email:  true,
                    roleId: true,
                    role:   { select: { id: true, name: true } }
                }
            })
        ]);

        // Map to frontend-compatible shape
        const data = users.map(u => ({
            id:        u.id,
            name:      u.name,
            email:     u.email,
            roleId:    u.roleId,
            role:      u.role?.name || ROLE_LABELS[u.roleId] || "Unknown",
            // The Prisma User model has no status or lastLogin fields.
            // Return safe defaults so the frontend shape is consistent.
            status:    "Active",
            lastLogin: "N/A"
        }));

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("[user.controller] getUsers:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/users/:id ───────────────────────────────────────────────────────
// Returns a single user by ID.
// NEVER returns: password, passwordHash, tokens
exports.getUserById = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id:     true,
                name:   true,
                email:  true,
                roleId: true,
                role:   { select: { id: true, name: true } }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            data: {
                id:        user.id,
                name:      user.name,
                email:     user.email,
                roleId:    user.roleId,
                role:      user.role?.name || ROLE_LABELS[user.roleId] || "Unknown",
                status:    "Active",
                lastLogin: "N/A"
            }
        });
    } catch (error) {
        console.error("[user.controller] getUserById:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
