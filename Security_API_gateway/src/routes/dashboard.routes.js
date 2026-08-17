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

// GET /api/dashboard/summary
router.get("/summary",       (req, res) => forward(req, res, "/dashboard/summary"));

// GET /api/dashboard/total-revenue
router.get("/total-revenue", (req, res) => forward(req, res, "/dashboard/total-revenue"));

// GET /api/dashboard/top-products
router.get("/top-products",  (req, res) => forward(req, res, "/dashboard/top-products"));

// GET /api/dashboard/sales-trend?range=30d
router.get("/sales-trend",   (req, res) => forward(req, res, "/dashboard/sales-trend"));

module.exports = router;
