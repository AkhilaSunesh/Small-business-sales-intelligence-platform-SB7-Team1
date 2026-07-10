const express = require("express");
const axios = require("axios");
const { logEvent } = require("../middleware/auditLogger");
const { inventoryLimiter } = require("../middleware/rateLimiter");
const { validateAdd, validateUpdate, validateDelete } = require("../validations/inventory.validation");
const router = express.Router();

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5000/api";

const forwardRequest = async (req, res, backendPath) => {
    try {
        const response = await axios({
            method: req.method,
            url: `${BACKEND_API_URL}${backendPath}`,
            params: req.query,
            data: req.body,
            headers: {
                Authorization: req.headers.authorization || "",
                "Content-Type": req.headers["content-type"] || "application/json"
            }
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        res.status(status).json(error.response?.data || {
            success: false,
            message: error.message
        });
    }
};

router.get("/", async (req, res) => {
    await forwardRequest(req, res, "/inventory");
});

router.post("/add", inventoryLimiter, validateAdd, async (req, res) => {
    logEvent("info", "Inventory Change", {
        userId: req.user.id,
        ip: req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status: 201,
        action: "create"
    });
    await forwardRequest(req, res, "/inventory/add");
});

router.put("/update", inventoryLimiter, validateUpdate, async (req, res) => {
    logEvent("info", "Inventory Change", {
        userId: req.user.id,
        ip: req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status: 200,
        action: "update"
    });
    await forwardRequest(req, res, "/inventory/update");
});

router.delete("/delete", inventoryLimiter, validateDelete, async (req, res) => {
    logEvent("info", "Inventory Delete", {
        userId: req.user.id,
        ip: req.ip || req.headers["x-forwarded-for"],
        endpoint: req.originalUrl,
        status: 200,
        action: "delete"
    });
    await forwardRequest(req, res, "/inventory/delete");
});

module.exports = router;
