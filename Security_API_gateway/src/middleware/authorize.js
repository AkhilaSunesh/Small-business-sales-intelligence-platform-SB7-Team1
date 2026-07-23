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

const permissions = {
    1: { "*": ["GET", "POST", "PUT", "DELETE", "PATCH"] },    // Business Owner — full access
    2: {                                                        // Store Manager
        inventory:         ["GET", "POST", "PUT", "PATCH"],
        products:          ["GET", "POST", "PUT", "PATCH"],
        dashboard:         ["GET"],
        analytics:         ["GET"],
        customers:         ["GET"],
        sales:             ["GET"],
        invoices:          ["GET", "POST", "PATCH"],
        payments:          ["GET", "POST"],
        revenue:           ["GET"],
        forecast:          ["GET"],
        "customer-groups": ["GET"],
        churn:             ["GET"],
        recommendations:   ["GET"],
        "anomaly-detection": ["GET"]
    },
    3: {                                                        // Sales Executive
        sales:             ["GET", "POST"],
        customers:         ["GET"],
        products:          ["GET"],
        invoices:          ["GET", "POST"],
        payments:          ["POST"],
        revenue:           ["GET"]
    },
    4: { "*": ["GET", "POST", "PUT", "DELETE", "PATCH"] }      // System Administrator — full access
};

const authorize = (req, res, next) => {
    const user = req.user;
    if (!user || !user.roleId) {
        logEvent("warn", "Unauthorized Access", {
            userId: user ? user.id : "anonymous",
            ip: req.ip || req.headers["x-forwarded-for"],
            endpoint: req.originalUrl,
            status: 403,
            reason: "Missing role or unauthorized user"
        });

        return res.status(403).json({
            success: false,
            message: "Forbidden: Access denied."
        });
    }

    const roleId = Number(user.roleId);
    const resource = getResource(req);
    const method = req.method;

    const userRules = permissions[roleId];
    if (!userRules) {
        logEvent("warn", "Unauthorized Access", {
            userId: user.id,
            ip: req.ip || req.headers["x-forwarded-for"],
            endpoint: req.originalUrl,
            status: 403,
            reason: "Role has no permissions assigned"
        });

        return res.status(403).json({
            success: false,
            message: "Forbidden: No permissions assigned to this role."
        });
    }

    if (userRules["*"] && userRules["*"].includes(method)) {
        return next();
    }

    const allowedMethods = userRules[resource];
    if (allowedMethods && allowedMethods.includes(method)) {
        return next();
    }

    logEvent("warn", "Unauthorized Access", {
        userId: user.id,
        ip: req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status: 403,
        reason: `Role ${roleId} does not have permission to ${method} ${resource}`
    });

    return res.status(403).json({
        success: false,
        message: `Forbidden: Role ${roleId} does not have permission to ${method} ${resource}.`
    });
};

module.exports = authorize;
