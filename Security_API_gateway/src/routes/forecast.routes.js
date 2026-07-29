/**
 * forecast.routes.js
 * Proxies /api/forecast → Forecast API service (port 5014)
 *
 * Falls back to the Backend_Databse forecast endpoint (:5000/api/forecast)
 * when the dedicated AI forecast service is offline — the backend implements
 * a simple SMA-based forecast using historical SalesTransaction data.
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const AI_FORECAST_URL  = process.env.FORECAST_API_URL  || "http://localhost:5014";
const BACKEND_API_URL  = process.env.BACKEND_API_URL   || "http://localhost:5000/api";

const forward = async (req, res, primaryPath, fallbackPath) => {
    const primaryTarget  = `${AI_FORECAST_URL}${primaryPath}`;
    const fallbackTarget = `${BACKEND_API_URL}${fallbackPath}`;

    console.log(`[forecast] ${req.method} ${req.originalUrl} → ${primaryTarget}`);

    try {
        const response = await axios({
            method:  req.method,
            url:     primaryTarget,
            params:  req.query,
            data:    req.body,
            headers: {
                Authorization:  req.headers.authorization || "",
                "Content-Type": req.headers["content-type"] || "application/json"
            },
            timeout: 15000
        });
        console.log(`[forecast] ← ${response.status} from ${primaryTarget}`);
        return res.status(response.status).json(response.data);
    } catch (aiError) {
        if (!aiError.response) {
            // AI forecast service offline — try backend SMA fallback
            console.warn(`[forecast] AI service unavailable (${primaryTarget}). Trying backend fallback: ${fallbackTarget}`);
            try {
                const fbResponse = await axios({
                    method:  req.method,
                    url:     fallbackTarget,
                    params:  req.query,
                    data:    req.body,
                    headers: {
                        Authorization:  req.headers.authorization || "",
                        "Content-Type": req.headers["content-type"] || "application/json"
                    },
                    timeout: 15000
                });
                console.log(`[forecast] ← ${fbResponse.status} from fallback ${fallbackTarget}`);
                return res.status(fbResponse.status).json(fbResponse.data);
            } catch (fbError) {
                console.error(`[forecast] Fallback also failed: ${fbError.message}`);
                return res.status(503).json({
                    success: false,
                    message: "Forecast service is currently unavailable.",
                    primary: primaryTarget,
                    fallback: fallbackTarget
                });
            }
        }
        console.error(`[forecast] ← ${aiError.response.status} from ${primaryTarget}`);
        res.status(aiError.response.status).json(
            aiError.response.data || { success: false, message: aiError.message }
        );
    }
};

// GET /api/forecast?days=30&lookback=90&window=7
router.get("/", (req, res) => forward(req, res, "/forecast", "/forecast"));

module.exports = router;
