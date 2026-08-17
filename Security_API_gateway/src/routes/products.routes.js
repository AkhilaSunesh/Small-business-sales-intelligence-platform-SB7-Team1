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

// GET /api/products/with-stock — products + current inventory quantity
router.get("/with-stock", (req, res) => forward(req, res, "/products/with-stock"));

// GET /api/products
router.get("/", (req, res) => forward(req, res, "/products"));

module.exports = router;
