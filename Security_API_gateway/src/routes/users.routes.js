/**
 * users.routes.js — Gateway proxy for User Management API
 *
 * Forwards authenticated requests to Backend_Databse /api/users.
 * Authentication (JWT) and RBAC are enforced by gateway middleware
 * before this proxy runs.
 */

const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://127.0.0.1:5000/api";

const forward = async (req, res, backendPath) => {
    const target = `${BACKEND_API_URL}${backendPath}`;
    console.log(`[Gateway] Forwarding request: ${req.method} ${target}`);
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
        res.status(response.status).json(response.data);
    } catch (error) {
        if (!error.response) {
            const code = error.code || "UNKNOWN";
            if (code === "ECONNREFUSED") {
                console.warn(`[users] ECONNREFUSED — backend not running at ${target}`);
            } else if (code === "ECONNABORTED" || error.message?.includes("timeout")) {
                console.warn(`[users] Timeout — backend did not respond in time: ${target}`);
            } else {
                console.warn(`[users] Network error (${code}): ${error.message}`);
            }
            return res.status(503).json({
                success: false,
                message: "Backend service is currently unavailable.",
                service: target
            });
        }
        const status = error.response.status || 500;
        if (status === 404) console.warn(`[users] 404 Not Found: ${target}`);
        if (status === 503) console.warn(`[users] 503 Service Unavailable: ${target}`);
        res.status(status).json(
            error.response.data || { success: false, message: error.message }
        );
    }
};

// GET    /api/users              — list users (paginated)
router.get(    "/",               (req, res) => forward(req, res, "/users"));

// GET    /api/users/:id          — single user by UUID
router.get(    "/:id",            (req, res) => forward(req, res, `/users/${req.params.id}`));

// PATCH  /api/users/:id/profile  — update display name
router.patch(  "/:id/profile",    (req, res) => forward(req, res, `/users/${req.params.id}/profile`));

// PATCH  /api/users/:id/status   — toggle isActive
router.patch(  "/:id/status",     (req, res) => forward(req, res, `/users/${req.params.id}/status`));

// DELETE /api/users/:id          — soft-delete user
router.delete( "/:id",            (req, res) => forward(req, res, `/users/${req.params.id}`));

module.exports = router;
