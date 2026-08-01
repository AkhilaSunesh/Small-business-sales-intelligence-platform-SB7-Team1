const express = require("express");
const router  = express.Router();

const invoiceController = require("../controllers/invoice.controller");
const { validateCreateInvoice, validateRecordPayment } = require("../validations/invoice.validation");

// ── Static routes must come before parameterised routes ──────────────────────

// GET  /api/invoices                — list with pagination, search, filters
router.get("/", invoiceController.getInvoices);

// GET  /api/invoices/revenue/summary — revenue summary statistics
router.get("/revenue/summary", invoiceController.getRevenueSummary);

// GET  /api/invoices/status/:status  — filter by PAID | UNPAID | PARTIALLY_PAID | OVERDUE | CANCELLED
router.get("/status/:status", invoiceController.getInvoicesByStatus);

// POST /api/invoices                 — create a manual invoice (Joi validated)
router.post("/", validateCreateInvoice, invoiceController.createInvoice);

// POST /api/invoices/overdue/check   — mark past-due UNPAID/PARTIALLY_PAID → OVERDUE
router.post("/overdue/check", invoiceController.checkOverdueInvoices);

// PATCH /api/invoices/bulk            — bulk status update (Milestone 3)
router.patch("/bulk", require("../controllers/bulk.controller").bulkUpdateInvoices);

// POST /api/invoices/:id/payments    — record a payment against an invoice (Joi validated)
router.post("/:id/payments", validateRecordPayment, invoiceController.recordPayment);

// GET  /api/invoices/:id             — single invoice by UUID (must be last)
router.get("/:id", invoiceController.getInvoiceById);

module.exports = router;
