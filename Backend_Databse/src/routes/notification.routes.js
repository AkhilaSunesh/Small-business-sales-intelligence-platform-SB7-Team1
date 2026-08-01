const express = require("express");
const router  = express.Router();

const notificationController = require("../controllers/notification.controller");

// GET /api/notifications/counts  — lightweight badge counts (must be before /)
router.get("/counts",            notificationController.getNotificationCounts);

// GET /api/notifications/low-stock
router.get("/low-stock",         notificationController.getLowStockNotifications);

// GET /api/notifications/overdue-invoices
router.get("/overdue-invoices",  notificationController.getOverdueInvoiceNotifications);

// GET /api/notifications          — combined, paginated, optional ?type=
router.get("/",                  notificationController.getNotifications);

module.exports = router;
