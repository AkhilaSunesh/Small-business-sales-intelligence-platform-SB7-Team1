/**
 * forecast.routes.js
 * Proxies /api/forecast → Forecast API service (port 5014)
 *
 * Falls back to the Backend_Databse forecast endpoint (127.0.0.1:5000/api/forecast)
 * when the dedicated AI forecast service is offline — the backend implements
 * a simple SMA-based forecast using historical SalesTransaction data.
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const { FORECAST_API_URL: AI_FORECAST_URL, BACKEND_API_URL } = require("../config/services.config");

const forward = async (req, res, primaryPath, fallbackPath) => {
    const primaryTarget  = `${AI_FORECAST_URL}${primaryPath}`;
    const fallbackTarget = `${BACKEND_API_URL}${fallbackPath}`;

    console.log(`[Gateway] Forwarding request: ${primaryTarget}`);
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
            timeout: 30000
        });
        console.log(`[forecast] ← ${response.status} from ${primaryTarget}`);
        return res.status(response.status).json(response.data);
    } catch (aiError) {
        if (!aiError.response) {
            const code = aiError.code || "UNKNOWN";
            if (code === "ECONNREFUSED") {
                console.warn(`[forecast] ECONNREFUSED — AI service not running at ${primaryTarget}. Trying backend fallback.`);
            } else if (code === "ECONNABORTED" || aiError.message.includes("timeout")) {
                console.warn(`[forecast] TIMEOUT — AI service at ${primaryTarget} did not respond within 30s. Trying backend fallback.`);
            } else {
                console.warn(`[forecast] Network error (${code}) at ${primaryTarget}: ${aiError.message}. Trying backend fallback.`);
            }

            console.log(`[Gateway] Forwarding request: ${fallbackTarget}`);
            console.log(`[forecast] Fallback → ${fallbackTarget}`);

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
                    timeout: 30000
                });
                console.log(`[forecast] ← ${fbResponse.status} from fallback ${fallbackTarget}`);
                return res.status(fbResponse.status).json(fbResponse.data);
            } catch (fbError) {
                const fbCode = fbError.code || "UNKNOWN";
                if (fbCode === "ECONNREFUSED") {
                    console.error(`[forecast] ECONNREFUSED — fallback backend not running at ${fallbackTarget}`);
                } else if (fbCode === "ECONNABORTED" || fbError.message.includes("timeout")) {
                    console.error(`[forecast] TIMEOUT — fallback backend at ${fallbackTarget} did not respond within 30s`);
                } else {
                    console.error(`[forecast] Fallback also failed (${fbCode}): ${fbError.message}`);
                }
                return res.status(503).json({
                    success: false,
                    message: "Forecast service is currently unavailable.",
                    primary: primaryTarget,
                    fallback: fallbackTarget
                });
            }
        }

        if (aiError.response.status === 404) {
            console.error(`[forecast] 404 Not Found — endpoint missing at ${primaryTarget}`);
        } else if (aiError.response.status === 503) {
            console.error(`[forecast] 503 from upstream AI service at ${primaryTarget}`);
        } else {
            console.error(`[forecast] ← ${aiError.response.status} from ${primaryTarget}`);
        }
        res.status(aiError.response.status).json(
            aiError.response.data || { success: false, message: aiError.message }
        );
    }
};

// Route mapping: /api/forecast → /forecast
router.get("/", (req, res) => forward(req, res, "/forecast", "/forecast"));

module.exports = router;
