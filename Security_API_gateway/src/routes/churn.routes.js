const express = require("express");
const axios   = require("axios");
const router  = express.Router();
const AI_API_URL = process.env.AI_API_URL || "http://localhost:5001";

const forward = async (req, res, backendPath) => {
    try {
        const response = await axios({
            method:  req.method,
            url:     `${AI_API_URL}${backendPath}`,
            params:  req.query,
            data:    req.body,
            headers: {
                Authorization:  req.headers.authorization || "",
                "Content-Type": req.headers["content-type"] || "application/json"
            }
        });
        res.status(response.status).json(response.data);
   } catch (error) {
    console.log("AI forward error:", error.response?.status, error.response?.data, error.message);

    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || !error.response) {
        return res.status(200).json({
            success: true,
            data: [],
            message: "AI service unavailable"
        });
    }

    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: error.message });
}
};

router.get("/", (req, res) => forward(req, res, "/churn"));
router.post("/check", (req, res) => forward(req, res, "/churn/check"));

module.exports = router;