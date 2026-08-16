const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { logEvent } = require("../middleware/auditLogger");

const ACCESS_TOKEN_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const DEFAULT_JWT_SECRET = "supersecretjwtkey123!";
const DEFAULT_REFRESH_SECRET = "supersecretrefreshkey123!";

function createAccessToken(user) {
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            roleId: user.roleId
        },
        secret,
        {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN
        }
    );
}

function createRefreshToken(user) {
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || DEFAULT_REFRESH_SECRET;
    return jwt.sign(
        {
            id: user.id
        },
        secret,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN
        }
    );
}

function respondServerError(res, error) {
    console.error("[authController] Internal Server Error:", error);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        details: process.env.NODE_ENV !== "production" ? (error?.message || String(error)) : undefined
    });
}

exports.register = async (req, res) => {
    try {
        const { name, email, password, roleId } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                roleId: roleId,
                isActive: false,
                isPending: true
            }
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roleId: user.roleId
            }
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            logEvent("warn", "Login Failure", {
                userId: "unknown",
                ip: req.ip || req.headers["x-forwarded-for"],
                endpoint: req.originalUrl,
                status: 401,
                reason: "User not found",
                email: req.body.email
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Reject login for deactivated accounts
        if (user.isActive === false) {
            logEvent("warn", "Login Failure", {
                userId: user.id,
                ip: req.ip || req.headers["x-forwarded-for"],
                endpoint: req.originalUrl,
                status: 403,
                reason: "Account disabled"
            });

            return res.status(403).json({
                success: false,
                message: "Your account has been disabled. Please contact an administrator."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logEvent("warn", "Login Failure", {
                userId: user.id,
                ip: req.ip || req.headers["x-forwarded-for"],
                endpoint: req.originalUrl,
                status: 401,
                reason: "Invalid password"
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Persist last login timestamp
        await prisma.user.update({
            where: { id: user.id },
            data:  { lastLoginAt: new Date() }
        });

        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        logEvent("info", "User Login", {
            userId: user.id,
            ip: req.ip || req.headers["x-forwarded-for"],
            endpoint: req.originalUrl,
            status: 200
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roleId: user.roleId
            }
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required."
            });
        }

        let decoded;
        try {
            const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || DEFAULT_REFRESH_SECRET;
            decoded = jwt.verify(refreshToken, secret);
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: "Invalid refresh token."
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(403).json({
                success: false,
                message: "Invalid refresh token."
            });
        }

        const accessToken = createAccessToken(user);

        return res.status(200).json({
            success: true,
            accessToken
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};


// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Returns the profile of the currently authenticated user.
// req.user is populated by the authenticate middleware.
exports.me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where:  { id: req.user.id },
            select: {
                id:          true,
                name:        true,
                email:       true,
                roleId:      true,
                isActive:    true,
                lastLoginAt: true,
                role:        { select: { name: true } }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        return respondServerError(res, error);
    }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
// Stateless logout — the client discards its tokens.
// Logged in audit trail for traceability.
exports.logout = (req, res) => {
    logEvent("info", "User Logout", {
        userId:   req.user ? req.user.id : "anonymous",
        ip:       req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status:   200
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully. Please discard your tokens."
    });
};

// ─── PATCH /api/auth/change-password ─────────────────────────────────────────
// Allows an authenticated user to change their own password.
// Body: { currentPassword, newPassword }
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "currentPassword and newPassword are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters."
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            logEvent("warn", "Password Change Failure", {
                userId:   user.id,
                ip:       req.ip || req.headers["x-forwarded-for"],
                endpoint: req.originalUrl,
                status:   401,
                reason:   "Incorrect current password"
            });
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        const hashedNew = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data:  { password: hashedNew }
        });

        logEvent("info", "Password Changed", {
            userId:   user.id,
            ip:       req.ip || req.headers["x-forwarded-for"],
            endpoint: req.originalUrl,
            status:   200
        });

        return res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });
    } catch (error) {
        return respondServerError(res, error);
    }
};
