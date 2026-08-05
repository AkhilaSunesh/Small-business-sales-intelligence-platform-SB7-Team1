/**
 * customerGroups.routes.js
 * Proxies /api/customer-groups → Customer Segmentation service (port 5010)
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

// Each AI service has its own port. Falls back to legacy AI_API_URL if not set.
const SERVICE_URL =
    process.env.CUSTOMER_SEGMENTATION_URL ||
    process.env.AI_API_URL                ||
    "http://127.0.0.1:5010";

const forward = async (req, res, path) => {
    const target = `${SERVICE_URL}${path}`;
    console.log(`[Gateway] Forwarding request: ${target}`);
    console.log(`[customerGroups] ${req.method} ${req.originalUrl} → ${target}`);
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
        console.log(`[customerGroups] ← ${response.status} from ${target}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            const code = error.code || "UNKNOWN";
            if (code === "ECONNREFUSED") {
                console.warn(`[customerGroups] ECONNREFUSED — service not running at ${target}`);
            } else if (code === "ECONNABORTED" || error.message.includes("timeout")) {
                console.warn(`[customerGroups] TIMEOUT — service did not respond within 30s at ${target}`);
            } else {
                console.warn(`[customerGroups] Network error (${code}) — ${target}: ${error.message}`);
            }
            return res.status(503).json({
                success: false,
                message: "Customer Segmentation service is currently unavailable.",
                service: target
            });
        }
        if (error.response.status === 404) {
            console.error(`[customerGroups] 404 Not Found — endpoint missing at ${target}`);
        } else if (error.response.status === 503) {
            console.error(`[customerGroups] 503 from upstream service at ${target}`);
        } else {
            console.error(`[customerGroups] ← ${error.response.status} from ${target}`);
        }
        res.status(error.response.status).json(
            error.response.data || { success: false, message: error.message }
        );
    }
};

// Route mapping: /api/customer-groups → /customer-groups
router.get("/",          (req, res) => forward(req, res, "/customer-groups"));
router.post("/classify", (req, res) => forward(req, res, "/customer-groups/classify"));

module.exports = router;
