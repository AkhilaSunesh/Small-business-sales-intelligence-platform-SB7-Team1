const rateLimit = require("express-rate-limit");
const { logEvent } = require("./auditLogger");

// ─── helper: builds a rate-limiter with consistent logging ───────────────────
function makeLimiter(windowMs, max, message) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders:   false,
        handler: (req, res) => {
            logEvent("warn", "Rate limit blocked", {
                ip:     req.ip || req.headers["x-forwarded-for"],
                route:  req.originalUrl,
                method: req.method,
                status: 429
            });
            res.status(429).json({ success: false, message });
        }
    });
}

// ─── Auth routes: 10 attempts per 15 min ─────────────────────────────────────
const authLimiter = makeLimiter(
    15 * 60 * 1000,
    10,
    "Too many requests. Please try again later."
);

// ─── CSV upload: 5 uploads per 15 min ────────────────────────────────────────
const uploadLimiter = makeLimiter(
    15 * 60 * 1000,
    5,
    "Too many upload requests. Please try again later."
);

// ─── Inventory write ops: 30 per 15 min ──────────────────────────────────────
const inventoryLimiter = makeLimiter(
    15 * 60 * 1000,
    30,
    "Too many requests. Please try again later."
);

// ─── General API limiter: 200 requests per 15 min ────────────────────────────
// Applied to all protected routes as a broad safety net.
const apiLimiter = makeLimiter(
    15 * 60 * 1000,
    200,
    "Too many requests. Please slow down and try again later."
);

// ─── AI report routes: 30 requests per 15 min ────────────────────────────────
// AI calls may take longer, so they use a separate limit.
const aiLimiter = makeLimiter(
    15 * 60 * 1000,
    30,
    "Too many AI report requests. Please wait a few minutes and try again."
);

module.exports = {
    authLimiter,
    uploadLimiter,
    inventoryLimiter,
    apiLimiter,
    aiLimiter
};
