/**
 * anomalyDetection.routes.js
 * Proxies /api/anomaly-detection → Anomaly Detection service (port 5013)
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const { ANOMALY_DETECTION_URL: SERVICE_URL } = require("../config/services.config");

const forward = async (req, res, path) => {
    const target = `${SERVICE_URL}${path}`;
    console.log(`[Gateway] Forwarding request: ${target}`);
    console.log(`[anomalyDetection] ${req.method} ${req.originalUrl} → ${target}`);
    try {
        const response = await axios({
            method:  req.method,
            url:     target,
            params:  req.query,
            data:    req.body,
            headers: {
                Authorization:  req.headers.authorization || "",
                "Content-Type": req.headers["content-type"] || "application/json"
            },
            timeout: 30000
        });
        console.log(`[anomalyDetection] ← ${response.status} from ${target}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            const code = error.code || "UNKNOWN";
            if (code === "ECONNREFUSED") {
                console.warn(`[anomalyDetection] ECONNREFUSED — service not running at ${target}`);
            } else if (code === "ECONNABORTED" || error.message.includes("timeout")) {
                console.warn(`[anomalyDetection] TIMEOUT — service did not respond within 30s at ${target}`);
            } else {
                console.warn(`[anomalyDetection] Network error (${code}) — ${target}: ${error.message}`);
            }
            return res.status(503).json({
                success: false,
                message: "Anomaly Detection service is currently unavailable.",
                service: target
            });
        }
        if (error.response.status === 404) {
            console.error(`[anomalyDetection] 404 Not Found — endpoint missing at ${target}`);
        } else if (error.response.status === 503) {
            console.error(`[anomalyDetection] 503 from upstream service at ${target}`);
        } else {
            console.error(`[anomalyDetection] ← ${error.response.status} from ${target}`);
        }
        res.status(error.response.status).json(
            error.response.data || { success: false, message: error.message }
        );
    }
};

// Route mapping: /api/anomaly-detection → /anomaly-detection
router.get("/",       (req, res) => forward(req, res, "/anomaly-detection"));
router.post("/check", (req, res) => forward(req, res, "/anomaly-detection/check"));

module.exports = router;
