const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { logEvent } = require("../middleware/auditLogger");

const ACCESS_TOKEN_EXPIRES_IN = "1h";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

function createAccessToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            roleId: user.roleId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRES_IN
        }
    );
}

function createRefreshToken(user) {
    return jwt.sign(
        {
            id: user.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES_IN
        }
    );
}

function respondServerError(res, error) {
    console.error(error);
    return res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
}

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

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
                roleId: 3
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
            decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
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
                id:     true,
                name:   true,
                email:  true,
                roleId: true,
                role:   { select: { name: true } }
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
