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
    "http://localhost:5010";

const forward = async (req, res, path) => {
    const target = `${SERVICE_URL}${path}`;
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
            timeout: 15000
        });
        console.log(`[customerGroups] ← ${response.status} from ${target}`);
        res.status(response.status).json(response.data);
    } catch (error) {
<<<<<<< HEAD
        console.log("AI forward error:", error.response?.status, error.response?.data, error.message);
        // AI service unavailable — return graceful empty response so the
        // frontend can render without crashing.
        if (!error.response) {
    return res.status(503).json({
        success: false,
        message: "AI service is currently unavailable."
    });
}
        const status = error.response.status || 500;
        res.status(status).json(error.response.data || { success: false, message: error.message });
=======
        if (!error.response) {
            // Network error — AI service is offline
            console.warn(`[customerGroups] Service unavailable: ${target} — ${error.message}`);
            return res.status(503).json({
                success: false,
                message: "Customer Segmentation service is currently unavailable.",
                service: target
            });
        }
        console.error(`[customerGroups] ← ${error.response.status} from ${target}`);
        res.status(error.response.status).json(
            error.response.data || { success: false, message: error.message }
        );
>>>>>>> b3e45e3 (Fix API gateway routing, RBAC permissions, AI service ports, dashboard endpoints, and error handling)
    }
};

router.get("/",          (req, res) => forward(req, res, "/customer-groups"));
router.post("/classify", (req, res) => forward(req, res, "/customer-groups/classify"));

module.exports = router;
