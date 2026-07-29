/**
 * churn.routes.js
 * Proxies /api/churn → Churn Prediction service (port 5011)
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const SERVICE_URL =
    process.env.CHURN_PREDICTION_URL ||
    process.env.AI_API_URL           ||
    "http://localhost:5011";

const forward = async (req, res, path) => {
    const target = `${SERVICE_URL}${path}`;
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
            timeout: 15000
        });
        console.log(`[churn] ← ${response.status} from ${target}`);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            console.warn(`[churn] Service unavailable: ${target} — ${error.message}`);
            return res.status(503).json({
                success: false,
                message: "Churn Prediction service is currently unavailable.",
                service: target
            });
        }
        console.error(`[churn] ← ${error.response.status} from ${target}`);
        res.status(error.response.status).json(
            error.response.data || { success: false, message: error.message }
        );
    }
};

router.get("/",       (req, res) => forward(req, res, "/churn"));
router.post("/check", (req, res) => forward(req, res, "/churn/check"));

module.exports = router;
