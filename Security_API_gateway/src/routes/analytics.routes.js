const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const { BACKEND_API_URL } = require("../config/services.config");

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

// GET /api/analytics/summary
router.get("/summary", (req, res) => forward(req, res, "/analytics/summary"));

// GET /api/analytics/payment-methods — real payment method distribution
router.get("/payment-methods", (req, res) => forward(req, res, "/analytics/payment-methods"));

// GET /api/analytics/categories — real sales by category
router.get("/categories", (req, res) => forward(req, res, "/analytics/categories"));

module.exports = router;
