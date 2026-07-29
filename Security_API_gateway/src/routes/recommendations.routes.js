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
    "http://localhost:5012";

const forward = async (req, res, path) => {
    const target = `${SERVICE_URL}${path}`;
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
            timeout: 15000
        });
        console.log(`[recommendations] ← ${response.status} from ${target}`);
        res.status(response.status).json(response.data);
    } catch (error) {
<<<<<<< HEAD
        console.log("AI forward error:", error.response?.status, error.response?.data, error.message);
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
            console.warn(`[recommendations] Service unavailable: ${target} — ${error.message}`);
            return res.status(503).json({
                success: false,
                message: "Recommendation service is currently unavailable.",
                service: target
            });
        }
        console.error(`[recommendations] ← ${error.response.status} from ${target}`);
        res.status(error.response.status).json(
            error.response.data || { success: false, message: error.message }
        );
>>>>>>> b3e45e3 (Fix API gateway routing, RBAC permissions, AI service ports, dashboard endpoints, and error handling)
    }
};

router.get("/",             (req, res) => forward(req, res, "/recommendations"));
router.post("/for-product", (req, res) => forward(req, res, "/recommendations/for-product"));

module.exports = router;
