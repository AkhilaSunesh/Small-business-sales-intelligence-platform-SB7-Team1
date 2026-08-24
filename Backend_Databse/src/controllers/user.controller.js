/**
 * user.controller.js
 *
 * Provides user management data from PostgreSQL via Prisma.
 *
 * SECURITY: password field is explicitly excluded from every query.
 * This controller NEVER returns password hashes or authentication tokens.
 */

const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

// ─── Role name → display label mapping ───────────────────────────────────────
const ROLE_LABELS = {
    1: "Owner",
    2: "Store Manager",
    3: "Sales Executive",
    4: "Admin"
};

// ─── Safe user select — never includes password ───────────────────────────────
const SAFE_SELECT = {
    id:          true,
    name:        true,
    email:       true,
    roleId:      true,
    isActive:    true,
    isPending:   true,
    lastLoginAt: true,
    role:        { select: { id: true, name: true } }
};

// ─── Map Prisma row → API shape ───────────────────────────────────────────────
function mapUser(u) {
    return {
        id:        u.id,
        name:      u.name,
        email:     u.email,
        roleId:    u.roleId,
        role:      u.role?.name || ROLE_LABELS[u.roleId] || "Unknown",
        status:    u.isPending ? "Pending" : (u.isActive ? "Active" : "Inactive"),
        lastLogin: u.lastLoginAt
            ? new Date(u.lastLoginAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
            : "N/A"
    };
}

// ─── GET /api/users ───────────────────────────────────────────────────────────
// Returns all users from PostgreSQL with role name.
// Query: ?page, ?limit, ?search (name or email), ?role (roleId)
exports.getUsers = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip  = (page - 1) * limit;

        const where = { isDeleted: false };
        if (req.query.search) {
            where.OR = [
                { name:  { contains: req.query.search, mode: "insensitive" } },
                { email: { contains: req.query.search, mode: "insensitive" } }
            ];
        }
        if (req.query.role) {
            const roleId = parseInt(req.query.role, 10);
            if (!isNaN(roleId)) where.roleId = roleId;
        }

        const [total, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: "asc" },
                select: SAFE_SELECT
            })
        ]);

        return res.status(200).json({
            success: true,
            data: users.map(mapUser),
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
exports.getUserById = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where:  { id: req.params.id },
            select: SAFE_SELECT
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({ success: true, data: mapUser(user) });
    } catch (error) {
        console.error("[user.controller] getUserById:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PATCH /api/users/:id/status ─────────────────────────────────────────────
// Toggles isActive on the user record.
// Body (optional): { isActive: boolean }  — if omitted, toggles current value.
exports.updateUserStatus = async (req, res) => {
    try {
        const existing = await prisma.user.findUnique({
            where:  { id: req.params.id },
            select: { id: true, isActive: true }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Caller can supply explicit value; otherwise toggle
        const nextActive =
            typeof req.body.isActive === "boolean"
                ? req.body.isActive
                : !existing.isActive;

        const updated = await prisma.user.update({
            where:  { id: req.params.id },
            data:   { isActive: nextActive, isPending: false },
            select: SAFE_SELECT
        });

        return res.status(200).json({
            success: true,
            message: `User ${nextActive ? "activated" : "deactivated"} successfully.`,
            data:    mapUser(updated)
        });
    } catch (error) {
        console.error("[user.controller] updateUserStatus:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DELETE /api/users/:id ────────────────────────────────────────────────────
// Soft-deletes a user by setting isActive = false.
// Hard delete is avoided because User has FK relations to SalesTransaction,
// Invoice and Payment (all nullable but safer to preserve referential integrity).
exports.deleteUser = async (req, res) => {
    try {
        const existing = await prisma.user.findUnique({
            where:  { id: req.params.id },
            select: { id: true }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const updated = await prisma.user.update({
            where:  { id: req.params.id },
            data:   { isActive: false, isDeleted: true },
            select: SAFE_SELECT
        });

        return res.status(200).json({
            success: true,
            message: "User deleted (deactivated) successfully.",
            data:    mapUser(updated)
        });
    } catch (error) {
        console.error("[user.controller] deleteUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PATCH /api/users/:id/profile ────────────────────────────────────────────
// Updates the user's display name only.
// Email is NOT editable through this endpoint.
// Body: { name: string }
exports.updateUserProfile = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "A valid name (min 2 characters) is required."
            });
        }

        const existing = await prisma.user.findUnique({
            where:  { id: req.params.id },
            select: { id: true }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const updated = await prisma.user.update({
            where:  { id: req.params.id },
            data:   { name: name.trim() },
            select: SAFE_SELECT
        });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data:    mapUser(updated)
        });
    } catch (error) {
        console.error("[user.controller] updateUserProfile:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PUT / PATCH /api/users/:id ──────────────────────────────────────────────
// Updates user details: name, roleId/role, status (isActive/isPending), email
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role, roleId, status } = req.body;

        const existing = await prisma.user.findUnique({
            where:  { id: req.params.id },
            select: { id: true, email: true }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const dataToUpdate = {};

        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "A valid name (min 2 characters) is required."
                });
            }
            dataToUpdate.name = name.trim();
        }

        if (email !== undefined && email.trim() !== existing.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid email address."
                });
            }
            const duplicate = await prisma.user.findUnique({
                where: { email: email.trim().toLowerCase() }
            });
            if (duplicate && duplicate.id !== req.params.id) {
                return res.status(409).json({
                    success: false,
                    message: "Email address is already in use by another user."
                });
            }
            dataToUpdate.email = email.trim().toLowerCase();
        }

        // Role update by roleId (number) or role name (string)
        if (roleId !== undefined) {
            const parsedRoleId = parseInt(roleId, 10);
            if (!isNaN(parsedRoleId)) {
                dataToUpdate.roleId = parsedRoleId;
            }
        } else if (role !== undefined) {
            const roleMap = {
                'Owner': 1,
                'Business Owner': 1,
                'Store Manager': 2,
                'Sales Executive': 3,
                'Admin': 4,
                'System Administrator': 4,
                'System Admin': 4
            };
            if (roleMap[role]) {
                dataToUpdate.roleId = roleMap[role];
            }
        }

        // Status update
        if (status !== undefined) {
            if (status === 'Active') {
                dataToUpdate.isActive = true;
                dataToUpdate.isPending = false;
            } else if (status === 'Inactive') {
                dataToUpdate.isActive = false;
                dataToUpdate.isPending = false;
            } else if (status === 'Pending') {
                dataToUpdate.isActive = false;
                dataToUpdate.isPending = true;
            }
        }

        const updated = await prisma.user.update({
            where:  { id: req.params.id },
            data:   dataToUpdate,
            select: SAFE_SELECT
        });

        return res.status(200).json({
            success: true,
            message: "User updated successfully.",
            data:    mapUser(updated)
        });
    } catch (error) {
        console.error("[user.controller] updateUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/users ──────────────────────────────────────────────────────────
// Creates a new user in PostgreSQL database.
exports.createUser = async (req, res) => {
    try {
        const { name, email, role, roleId, status, password } = req.body;

        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: "A valid name (min 2 characters) is required."
            });
        }

        if (!email || typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Email address is already in use by another user."
            });
        }

        // Determine roleId
        let parsedRoleId = 3; // default: Sales Executive
        if (roleId !== undefined) {
            const parsed = parseInt(roleId, 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) parsedRoleId = parsed;
        } else if (role) {
            const roleMap = {
                'Owner': 1,
                'Business Owner': 1,
                'Store Manager': 2,
                'Sales Executive': 3,
                'Admin': 4,
                'System Administrator': 4,
                'System Admin': 4
            };
            if (roleMap[role]) parsedRoleId = roleMap[role];
        }

        // Determine active/pending status
        let isActive = true;
        let isPending = false;
        if (status === 'Inactive') {
            isActive = false;
            isPending = false;
        } else if (status === 'Pending') {
            isActive = false;
            isPending = true;
        }

        const rawPassword = password && typeof password === "string" && password.length >= 6
            ? password
            : "Password1!";
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                roleId: parsedRoleId,
                isActive,
                isPending,
                isDeleted: false
            },
            select: SAFE_SELECT
        });

        return res.status(201).json({
            success: true,
            message: `User "${newUser.name}" created successfully.`,
            data: mapUser(newUser)
        });
    } catch (error) {
        console.error("[user.controller] createUser:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

