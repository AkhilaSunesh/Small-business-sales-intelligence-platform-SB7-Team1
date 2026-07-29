/**
 * anomalyDetection.routes.js
 * Proxies /api/anomaly-detection → Anomaly Detection service (port 5013)
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const SERVICE_URL =
    process.env.ANOMALY_DETECTION_URL ||
    process.env.AI_API_URL            ||
    "http://localhost:5013";

const forward = async (req, res, path) => {
    const target = `${SERVICE_URL}${path}`;
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
            timeout: 15000
        });
        console.log(`[anomalyDetection] ← ${response.status} from ${target}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            console.warn(`[anomalyDetection] Service unavailable: ${target} — ${error.message}`);
            return res.status(503).json({
                success: false,
                message: "Anomaly Detection service is currently unavailable.",
                service: target
            });
        }
        console.error(`[anomalyDetection] ← ${error.response.status} from ${target}`);
        res.status(error.response.status).json(
            error.response.data || { success: false, message: error.message }
        );
    }
};

router.get("/",       (req, res) => forward(req, res, "/anomaly-detection"));
router.post("/check", (req, res) => forward(req, res, "/anomaly-detection/check"));

module.exports = router;
