const express = require("express");
const axios   = require("axios");
const router  = express.Router();

const AI_API_URL = process.env.AI_API_URL || "http://localhost:5001";

const forwardToAI = async (req, res, aiPath) => {
    try {
        const response = await axios({
            method:  req.method,
            url:     `${AI_API_URL}${aiPath}`,
            params:  req.query,
            data:    req.body,
            headers: {
                Authorization:  req.headers.authorization || "",
                "Content-Type": req.headers["content-type"] || "application/json"
            },
            timeout: 10000
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.log("AI forward error:", error.response?.status, error.response?.data, error.message);
       if (!error.response) {
           return res.status(503).json({
               success: false,
               message: "AI service is currently unavailable."
           });
        }
        const status = error.response.status || 500;
        res.status(status).json(error.response.data || { success: false, message: error.message });
    }
};

// Mounted at /api/churn
router.get("/",       (req, res) => forwardToAI(req, res, "/churn"));
router.post("/check", (req, res) => forwardToAI(req, res, "/churn/check"));

module.exports = router;
