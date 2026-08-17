const express = require("express");
const axios   = require("axios");
const { validateCreateInvoice, validateRecordPayment } = require("../validations/invoice.validation");
const { validateBulkInvoice } = require("../validations/notification.validation");
const router  = express.Router();
const { auditSuccessfulAction } = require("../middleware/auditLogger");

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

// GET /api/invoices — list invoices
router.get("/", (req, res) => forward(req, res, "/invoices"));

// GET /api/invoices/revenue/summary — revenue summary
router.get("/revenue/summary", (req, res) => forward(req, res, "/invoices/revenue/summary"));

// GET /api/invoices/status/:status — invoices by status
router.get("/status/:status", (req, res) => forward(req, res, `/invoices/status/${req.params.status}`));

// POST /api/invoices — create invoice
router.post("/",validateCreateInvoice,auditSuccessfulAction("Invoice Created", "create"),(req, res) => forward(req, res, "/invoices"));

// POST /api/invoices/overdue/check — check overdue
router.post("/overdue/check", (req, res) => forward(req, res, "/invoices/overdue/check"));

// PATCH /api/invoices/bulk — bulk status update (Milestone 3, Joi validated)
router.patch("/bulk", validateBulkInvoice,
    auditSuccessfulAction("Bulk Invoice Update", "bulk-update"),
    (req, res) => forward(req, res, "/invoices/bulk"));

// POST /api/invoices/:id/payments — record payment
router.post("/:id/payments",validateRecordPayment,auditSuccessfulAction("Invoice Payment Updated", "record-payment"),(req, res) => forward(req, res, `/invoices/${req.params.id}/payments`));

// GET /api/invoices/:id/download — download invoice file (binary-safe)
router.get("/:id/download", async (req, res) => {
    try {
        const response = await axios({
            method:       "GET",
            url:          `${BACKEND_API_URL}/invoices/${req.params.id}/download`,
            headers:      { Authorization: req.headers.authorization || "" },
            responseType: "arraybuffer",   // preserve binary/text content exactly
            timeout:      30000
        });

        // Forward the exact Content-Type and Content-Disposition from the backend
        const contentType        = response.headers["content-type"]        || "text/plain";
        const contentDisposition = response.headers["content-disposition"]  || `attachment; filename="invoice.txt"`;

        res.setHeader("Content-Type",        contentType);
        res.setHeader("Content-Disposition", contentDisposition);
        res.setHeader("Cache-Control",       "no-cache");

        return res.status(response.status).send(Buffer.from(response.data));
    } catch (error) {
        const status = error.response?.status || 500;
        // Error responses from backend are JSON — safe to decode
        let message = error.message;
        try {
            const decoded = JSON.parse(Buffer.from(error.response?.data || "{}").toString());
            message = decoded.message || message;
        } catch (_) {}
        return res.status(status).json({ success: false, message });
    }
});

// GET /api/invoices/:id — single invoice
router.get("/:id", (req, res) => forward(req, res, `/invoices/${req.params.id}`));

// DELETE /api/invoices/:id — delete invoice
router.delete("/:id", auditSuccessfulAction("Invoice Deleted", "delete"), (req, res) => forward(req, res, `/invoices/${req.params.id}`));

module.exports = router;