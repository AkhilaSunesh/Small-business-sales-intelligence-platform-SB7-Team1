const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { logEvent } = require("../middleware/auditLogger");
const { uploadLimiter } = require("../middleware/rateLimiter");
const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:5000/api";

router.post(
    "/upload",
    uploadLimiter,
    upload.single("file"),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "CSV file required"
            });
        }

        const form = new FormData();
        form.append("file", fs.createReadStream(req.file.path), req.file.originalname);

        try {
            const response = await axios.post(`${BACKEND_API_URL}/sales/upload`, form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: req.headers.authorization || ""
                }
            });

            logEvent("info", "Sales Upload", {
                userId: req.user.id,
                ip: req.ip || req.headers["x-forwarded-for"],
                endpoint: req.originalUrl,
                status: response.status,
                action: "upload"
            });

            res.status(response.status).json(response.data);
        } catch (error) {
            const status = error.response?.status || 500;
            res.status(status).json(error.response?.data || {
                success: false,
                message: error.message
            });
        } finally {
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, () => {});
            }
        }
    }
);

module.exports = router;
