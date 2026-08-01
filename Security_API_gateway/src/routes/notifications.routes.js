/**
 * notifications.routes.js — Milestone 3
 * Proxies /api/notifications → Backend_Databse (port 5000)
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const { logEvent } = require("../middleware/auditLogger");

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5000/api";

const forward = async (req, res, backendPath) => {
    try {
        const response = await axios({
            method:  req.method,
            url:     `${BACKEND_API_URL}${backendPath}`,
            params:  req.query,
            data:    req.body,
            headers: {
                Authorization:  req.headers.authorization || "",
                "Content-Type": req.headers["content-type"] || "application/json"
            },
            timeout: 15000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        res.status(status).json(
            error.response?.data || { success: false, message: error.message }
        );
    }
};

// GET /api/notifications/counts       — badge counts (lightweight)
router.get("/counts",           (req, res) => forward(req, res, "/notifications/counts"));

// GET /api/notifications/low-stock    — low-stock alerts only
router.get("/low-stock",        (req, res) => forward(req, res, "/notifications/low-stock"));

// GET /api/notifications/overdue-invoices
router.get("/overdue-invoices", (req, res) => forward(req, res, "/notifications/overdue-invoices"));

// GET /api/notifications              — combined (?type=, ?page=, ?limit=)
router.get("/", (req, res) => {
    logEvent("info", "Notifications Accessed", {
        userId:   req.user ? req.user.id : "anonymous",
        ip:       req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        method:   req.method
    });
    return forward(req, res, "/notifications");
});

module.exports = router;
