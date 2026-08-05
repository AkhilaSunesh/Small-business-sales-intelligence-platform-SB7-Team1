/**
 * recommendations.routes.js
 * Proxies /api/recommendations → Recommendation service (port 5012)
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const SERVICE_URL =
    process.env.RECOMMENDATION_URL ||
    process.env.AI_API_URL         ||
    "http://127.0.0.1:5012";

const forward = async (req, res, path) => {
    const target = `${SERVICE_URL}${path}`;
    console.log(`[Gateway] Forwarding request: ${target}`);
    console.log(`[recommendations] ${req.method} ${req.originalUrl} → ${target}`);
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
        console.log(`[recommendations] ← ${response.status} from ${target}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            const code = error.code || "UNKNOWN";
            if (code === "ECONNREFUSED") {
                console.warn(`[recommendations] ECONNREFUSED — service not running at ${target}`);
            } else if (code === "ECONNABORTED" || error.message.includes("timeout")) {
                console.warn(`[recommendations] TIMEOUT — service did not respond within 30s at ${target}`);
            } else {
                console.warn(`[recommendations] Network error (${code}) — ${target}: ${error.message}`);
            }
            return res.status(503).json({
                success: false,
                message: "Recommendation service is currently unavailable.",
                service: target
            });
        }
        if (error.response.status === 404) {
            console.error(`[recommendations] 404 Not Found — endpoint missing at ${target}`);
        } else if (error.response.status === 503) {
            console.error(`[recommendations] 503 from upstream service at ${target}`);
        } else {
            console.error(`[recommendations] ← ${error.response.status} from ${target}`);
        }
        res.status(error.response.status).json(
            error.response.data || { success: false, message: error.message }
        );
    }
};

// Route mapping: /api/recommendations → /recommendations
router.get("/",             (req, res) => forward(req, res, "/recommendations"));
router.post("/for-product", (req, res) => forward(req, res, "/recommendations/for-product"));

module.exports = router;
