const fs = require("fs");
const path = require("path");

const logDirectory = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

const logFile = path.join(logDirectory, "audit.log");

const logEvent = (level, event, details) => {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level.toUpperCase()}] Event: ${event} | Details: ${JSON.stringify(details)}\n`;
    
    // Print to console
    console.log(logLine.trim());
    
    // Append to file
    fs.appendFile(logFile, logLine, (err) => {
        if (err) {
            console.error("Failed to write to audit log file:", err.message);
        }
    });
};

// Express middleware to capture rejected requests
const auditRejectMiddleware = (req, res, next) => {
    // Intercept finish event to log failures
    res.on("finish", () => {
        if (res.statusCode >= 400) {
            const level = res.statusCode === 429 ? "warn" : "error";
            const details = {
                ip: req.ip || req.headers["x-forwarded-for"],
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                userId: req.user ? req.user.id : "anonymous"
            };
            
            let event = "Rejected Request";
            if (res.statusCode === 401) event = "Unauthorized Attempt";
            else if (res.statusCode === 403) event = "Forbidden Attempt";
            else if (res.statusCode === 400) event = "Bad Request Validation Failure";
            else if (res.statusCode === 429) event = "Rate Limit Triggered";

            logEvent(level, event, details);
        }
    });
    next();
};

module.exports = {
    logEvent,
    auditRejectMiddleware
};
