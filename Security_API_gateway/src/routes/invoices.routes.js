const express = require("express");
const axios   = require("axios");
const router  = express.Router();

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
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        res.status(status).json(error.response?.data || { success: false, message: error.message });
    }
};

// GET /api/invoices — list invoices
router.get("/", (req, res) => forward(req, res, "/invoices"));

// GET /api/invoices/revenue/summary — revenue summary
router.get("/revenue/summary", (req, res) => forward(req, res, "/invoices/revenue/summary"));

// GET /api/invoices/status/:status — invoices by status
router.get("/status/:status", (req, res) => forward(req, res, `/invoices/status/${req.params.status}`));

// POST /api/invoices — create invoice
router.post("/", (req, res) => forward(req, res, "/invoices"));

// POST /api/invoices/overdue/check — check overdue
router.post("/overdue/check", (req, res) => forward(req, res, "/invoices/overdue/check"));

// POST /api/invoices/:id/payments — record payment
router.post("/:id/payments", (req, res) => forward(req, res, `/invoices/${req.params.id}/payments`));

// GET /api/invoices/:id — single invoice
router.get("/:id", (req, res) => forward(req, res, `/invoices/${req.params.id}`));

module.exports = router;