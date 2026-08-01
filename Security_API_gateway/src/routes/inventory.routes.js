const express = require("express");
const axios   = require("axios");
const { logEvent }                          = require("../middleware/auditLogger");
const { inventoryLimiter }                  = require("../middleware/rateLimiter");
const { validateAdd, validateUpdate, validateDelete } = require("../validations/inventory.validation");
const { validateBulkInventory } = require("../validations/notification.validation");
const router  = express.Router();

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5000/api";

// ─── shared forward helper ────────────────────────────────────────────────────
const forwardRequest = async (req, res, backendPath) => {
    try {
        const response = await axios({
            method:  req.method,
            url:     `${BACKEND_API_URL}${backendPath}`,
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

// ─── GET /api/inventory ───────────────────────────────────────────────────────
router.get("/", async (req, res) => {
    logEvent("info", "Inventory List", {
        userId:   req.user ? req.user.id : "anonymous",
        ip:       req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status:   200,
        action:   "list"
    });
    await forwardRequest(req, res, "/inventory");
});

// ─── GET /api/inventory/low-stock ─────────────────────────────────────────────
// Proxy for the backend's dedicated low-stock endpoint.
router.get("/low-stock", async (req, res) => {
    logEvent("info", "Inventory Low-Stock Check", {
        userId:   req.user ? req.user.id : "anonymous",
        ip:       req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status:   200,
        action:   "low-stock"
    });
    await forwardRequest(req, res, "/inventory/low-stock");
});

// ─── POST /api/inventory/add ──────────────────────────────────────────────────
router.post("/add", inventoryLimiter, validateAdd, async (req, res) => {
    logEvent("info", "Inventory Change", {
        userId:   req.user.id,
        ip:       req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status:   201,
        action:   "create"
    });
    await forwardRequest(req, res, "/inventory/add");
});

// ─── PUT /api/inventory/update ────────────────────────────────────────────────
router.put("/update", inventoryLimiter, validateUpdate, async (req, res) => {
    logEvent("info", "Inventory Change", {
        userId:   req.user.id,
        ip:       req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status:   200,
        action:   "update"
    });
    await forwardRequest(req, res, "/inventory/update");
});

// ─── DELETE /api/inventory/delete ────────────────────────────────────────────
router.delete("/delete", inventoryLimiter, validateDelete, async (req, res) => {
    logEvent("info", "Inventory Delete", {
        userId:   req.user.id,
        ip:       req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status:   200,
        action:   "delete"
    });
    await forwardRequest(req, res, "/inventory/delete");
});

// ─── PATCH /api/inventory/bulk — bulk quantity update (Milestone 3) ──────────
router.patch("/bulk", validateBulkInventory,
    (req, res) => forwardRequest(req, res, "/inventory/bulk"));

module.exports = router;
