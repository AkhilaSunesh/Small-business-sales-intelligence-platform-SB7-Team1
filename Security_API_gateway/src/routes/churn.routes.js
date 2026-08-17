/**
 * churn.routes.js
 * Proxies /api/churn → Churn Prediction service (port 5011)
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const { CHURN_PREDICTION_URL: SERVICE_URL } = require("../config/services.config");

const forward = async (req, res, path) => {
    const target = `${SERVICE_URL}${path}`;
    console.log(`[Gateway] Forwarding request: ${target}`);
    console.log(`[churn] ${req.method} ${req.originalUrl} → ${target}`);
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
        console.log(`[churn] ← ${response.status} from ${target}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            const code = error.code || "UNKNOWN";
            if (code === "ECONNREFUSED") {
                console.warn(`[churn] ECONNREFUSED — service not running at ${target}`);
            } else if (code === "ECONNABORTED" || error.message.includes("timeout")) {
                console.warn(`[churn] TIMEOUT — service did not respond within 30s at ${target}`);
            } else {
                console.warn(`[churn] Network error (${code}) — ${target}: ${error.message}`);
            }
            return res.status(503).json({
                success: false,
                message: "Churn Prediction service is currently unavailable.",
                service: target
            });
        }
        if (error.response.status === 404) {
            console.error(`[churn] 404 Not Found — endpoint missing at ${target}`);
        } else if (error.response.status === 503) {
            console.error(`[churn] 503 from upstream service at ${target}`);
        } else {
            console.error(`[churn] ← ${error.response.status} from ${target}`);
        }
        res.status(error.response.status).json(
            error.response.data || { success: false, message: error.message }
        );
    }
};

// Route mapping: /api/churn → /churn
router.get("/",       (req, res) => forward(req, res, "/churn"));
router.post("/check", (req, res) => forward(req, res, "/churn/check"));

module.exports = router;
