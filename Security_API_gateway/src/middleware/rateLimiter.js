const rateLimit = require("express-rate-limit");
const { logEvent } = require("./auditLogger");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logEvent("warn", "Rate limit blocked", {
            ip: req.ip || req.headers["x-forwarded-for"],
            route: req.originalUrl,
            method: req.method,
            status: 429
        });
        res.status(429).json({
            success: false,
            message: "Too many requests. Please try again later."
        });
    }
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logEvent("warn", "Rate limit blocked", {
            ip: req.ip || req.headers["x-forwarded-for"],
            route: req.originalUrl,
            method: req.method,
            status: 429
        });
        res.status(429).json({
            success: false,
            message: "Too many upload requests. Please try again later."
        });
    }
});

const inventoryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logEvent("warn", "Rate limit blocked", {
            ip: req.ip || req.headers["x-forwarded-for"],
            route: req.originalUrl,
            method: req.method,
            status: 429
        });
        res.status(429).json({
            success: false,
            message: "Too many requests. Please try again later."
        });
    }
});

module.exports = {
    authLimiter,
    uploadLimiter,
    inventoryLimiter
};
