const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const AI_API_URL = process.env.AI_API_URL || "http://localhost:5001";

const forward = async (req, res, backendPath) => {
    try {
        const response = await axios({
            method:  req.method,
            url:     `${AI_API_URL}${backendPath}`,
            params:  req.query,
            data:    req.body,
            headers: {
                Authorization:  req.headers.authorization || "",
                "Content-Type": req.headers["content-type"] || "application/json"
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        res.status(status).json(error.response?.data || { success: false, message: error.message });
    }
};

// These routes are mounted at different base paths in app.js:
//   /api/customer-groups
//   /api/churn
//   /api/recommendations
//   /api/anomaly-detection
//
// Therefore each route handler here corresponds to a sub-path under those mounts.

// ── Customer Groups ──────────────────────────────────────────────────────────
router.get("/", (req, res) => forward(req, res, "/customer-groups"));
router.post("/classify", (req, res) => forward(req, res, "/customer-groups/classify"));

// ── Churn ────────────────────────────────────────────────────────────────────
router.get("/", (req, res) => forward(req, res, "/churn"));
router.post("/check", (req, res) => forward(req, res, "/churn/check"));

// ── Recommendations ──────────────────────────────────────────────────────────
router.get("/", (req, res) => forward(req, res, "/recommendations"));
router.post("/for-product", (req, res) => forward(req, res, "/recommendations/for-product"));

// ── Anomaly Detection ────────────────────────────────────────────────────────
router.get("/", (req, res) => forward(req, res, "/anomaly-detection"));
router.post("/check", (req, res) => forward(req, res, "/anomaly-detection/check"));

module.exports = router;