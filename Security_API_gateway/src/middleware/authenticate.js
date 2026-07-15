const jwt = require("jsonwebtoken");
const { logEvent } = require("./auditLogger");

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logEvent("warn", "Unauthorized Access", {
            userId: "anonymous",
            ip: req.ip || req.headers["x-forwarded-for"],
            endpoint: req.originalUrl,
            status: 401,
            reason: "Missing or malformed Authorization header"
        });

        return res.status(401).json({
            success: false,
            message: "Access token required."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);

if (!decoded.id || !decoded.roleId) {
    logEvent("warn", "Unauthorized Access", {
        userId: "anonymous",
        ip: req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status: 401,
        reason: "Invalid JWT payload"
    });

    return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
    });
}

req.user = decoded;
next();
    } catch (error) {
        logEvent("warn", "Unauthorized Access", {
            userId: "anonymous",
            ip: req.ip || req.headers["x-forwarded-for"],
            endpoint: req.originalUrl,
            status: 401,
            reason: "Invalid or expired token"
        });

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

module.exports = authenticate;
