const express = require("express");
const router = express.Router();

const invoiceController = require("../controllers/invoice.controller");

// ── Specific static routes before parameterised routes ──────────────────────

// GET /api/invoices — list invoices with pagination, search, filters
router.get("/", invoiceController.getInvoices);

// GET /api/invoices/revenue/summary — revenue summary statistics
router.get("/revenue/summary", invoiceController.getRevenueSummary);

// GET /api/invoices/status/:status — list invoices by status
router.get("/status/:status", invoiceController.getInvoicesByStatus);

// POST /api/invoices — create a manual invoice
router.post("/", invoiceController.createInvoice);

// POST /api/invoices/overdue/check — check and update overdue invoices
router.post("/overdue/check", invoiceController.checkOverdueInvoices);

// POST /api/invoices/:id/payments — record a payment
router.post("/:id/payments", invoiceController.recordPayment);

// GET /api/invoices/:id — single invoice by id (must be last under /api/invoices)
router.get("/:id", invoiceController.getInvoiceById);

module.exports = router;
