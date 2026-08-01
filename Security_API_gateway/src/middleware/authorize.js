const { logEvent } = require("./auditLogger");

const getResource = (req) => {
    const base = req.baseUrl || req.originalUrl || req.path || "";
    const parts = base.split("/").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts[0] === "api" && parts[1]) {
        return parts[1].toLowerCase();
    }
    return parts[0].toLowerCase();
};

// ─── Permission matrix ────────────────────────────────────────────────────────
// Role 1: Business Owner   — full access (wildcard)
// Role 2: Store Manager    — inventory, products, all dashboard, analytics, AI
// Role 3: Sales Executive  — sales, customers, invoices, basic dashboard, AI insights
// Role 4: System Admin     — full access (wildcard)
const permissions = {

    1: { "*": ["GET", "POST", "PUT", "DELETE", "PATCH"] },

    2: {
        // Core backend resources
        inventory:            ["GET", "POST", "PUT", "PATCH"],
        products:             ["GET", "POST", "PUT", "PATCH"],
        customers:            ["GET"],
        sales:                ["GET"],
        invoices:             ["GET", "POST", "PATCH"],
        payments:             ["GET", "POST"],

        // Dashboard sub-resources
        dashboard:            ["GET"],
        "total-revenue":      ["GET"],
        "top-products":       ["GET"],
        "sales-trend":        ["GET"],

        // Analytics & reporting
        analytics:            ["GET"],
        revenue:              ["GET"],

        // Milestone 3 additions
        notifications:        ["GET"],
        "audit-summary":      ["GET"],

        // AI insight services
        forecast:             ["GET"],
        "customer-groups":    ["GET", "POST"],
        churn:                ["GET", "POST"],
        recommendations:      ["GET", "POST"],
        "anomaly-detection":  ["GET", "POST"]
    },

    3: {
        // Core backend resources
        sales:           ["GET", "POST"],
        customers:       ["GET"],
        products:        ["GET"],
        invoices:        ["GET", "POST"],
        payments:        ["POST"],

        // Dashboard sub-resources
        dashboard:       ["GET"],
        "total-revenue": ["GET"],
        "top-products":  ["GET"],
        "sales-trend":   ["GET"],

        // Analytics & reporting
        analytics:       ["GET"],
        revenue:         ["GET"],

        // Milestone 3 — Sales Exec can view notifications
        notifications:   ["GET"],

        // AI insight services (read-only for Sales Executive)
        forecast:             ["GET"],
        "customer-groups":    ["GET"],
        churn:                ["GET"],
        recommendations:      ["GET"],
        "anomaly-detection":  ["GET"]
    },

    4: { "*": ["GET", "POST", "PUT", "DELETE", "PATCH"] }
};

const authorize = (req, res, next) => {
    const user = req.user;
    if (!user || !user.roleId) {
        logEvent("warn", "Unauthorized Access", {
            userId:   user ? user.id : "anonymous",
            ip:       req.ip || req.headers["x-forwarded-for"],
            endpoint: req.originalUrl,
            status:   403,
            reason:   "Missing role or unauthorized user"
        });
        return res.status(403).json({
            success: false,
            message: "Forbidden: Access denied."
        });
    }

    const roleId   = Number(user.roleId);
    const resource = getResource(req);
    const method   = req.method;

    const userRules = permissions[roleId];
    if (!userRules) {
        logEvent("warn", "Unauthorized Access", {
            userId:   user.id,
            ip:       req.ip || req.headers["x-forwarded-for"],
            endpoint: req.originalUrl,
            status:   403,
            reason:   "Role has no permissions assigned"
        });
        return res.status(403).json({
            success: false,
            message: "Forbidden: No permissions assigned to this role."
        });
    }

    // Wildcard — role has full access
    if (userRules["*"] && userRules["*"].includes(method)) {
        return next();
    }

    // Resource-level check
    const allowedMethods = userRules[resource];
    if (allowedMethods && allowedMethods.includes(method)) {
        return next();
    }

    logEvent("warn", "Unauthorized Access", {
        userId:   user.id,
        ip:       req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status:   403,
        reason:   `Role ${roleId} does not have permission to ${method} ${resource}`
    });

    return res.status(403).json({
        success: false,
        message: `Forbidden: Role ${roleId} does not have permission to ${method} ${resource}.`
    });
};

module.exports = authorize;
