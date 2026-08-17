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

const forward = async (req, res) => {
    // Backend Database implements the actual historical forecast logic based on Prisma SalesTransaction data
    const backendTarget = `${BACKEND_API_URL}/forecast`;
    const aiTarget      = `${AI_FORECAST_URL}/forecast`;

    console.log(`[forecast] Forwarding request to: ${backendTarget}`);

    try {
        const response = await axios({
            method:  req.method,
            url:     backendTarget,
            params:  req.query,
            data:    req.body,
            headers: {
                Authorization:  req.headers.authorization || "",
                "Content-Type": req.headers["content-type"] || "application/json"
            },
            timeout: 30000
        });
        return res.status(response.status).json(response.data);
    } catch (backendError) {
        console.warn(`[forecast] Backend forecast failed (${backendError.response?.status || backendError.code}): ${backendError.message}. Trying AI forecast fallback.`);

        try {
            const aiResponse = await axios({
                method:  req.method,
                url:     aiTarget,
                params:  req.query,
                data:    req.body,
                headers: {
                    Authorization:  req.headers.authorization || "",
                    "Content-Type": req.headers["content-type"] || "application/json"
                },
                timeout: 30000
            });
            return res.status(aiResponse.status).json(aiResponse.data);
        } catch (aiError) {
            const status = backendError.response?.status || 500;
            return res.status(status).json(
                backendError.response?.data || { success: false, message: backendError.message }
            );
        }
    }
};

// Route mapping: /api/forecast
router.get("/", (req, res) => forward(req, res));

module.exports = router;
