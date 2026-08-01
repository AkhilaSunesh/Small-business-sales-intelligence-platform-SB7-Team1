/**
 * notification.controller.js — Milestone 3
 *
 * Handles all notification-related HTTP requests.
 * Uses existing Inventory and Invoice data — no new data created.
 */

const notificationService = require("../services/notification.service");

// ─── GET /api/notifications ───────────────────────────────────────────────────
// Returns combined low-stock + overdue-invoice notifications
// Query: ?page=1&limit=20&type=LOW_STOCK|OVERDUE_INVOICE
exports.getNotifications = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const type  = req.query.type || undefined;

        // Validate type if provided
        const validTypes = ["LOW_STOCK", "OVERDUE_INVOICE"];
        if (type && !validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(", ")}`
            });
        }

        const result = await notificationService.getAllNotifications({ page, limit, type });

        return res.status(200).json({
            success: true,
            data:       result.data,
            pagination: result.pagination,
            summary:    result.summary
        });
    } catch (error) {
        console.error("[notification.controller] getNotifications:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/notifications/low-stock ─────────────────────────────────────────
exports.getLowStockNotifications = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

        const result = await notificationService.getLowStockAlerts({ page, limit });

        return res.status(200).json({
            success: true,
            data:       result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error("[notification.controller] getLowStockNotifications:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/notifications/overdue-invoices ──────────────────────────────────
exports.getOverdueInvoiceNotifications = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

        const result = await notificationService.getOverdueInvoiceAlerts({ page, limit });

        return res.status(200).json({
            success: true,
            data:       result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error("[notification.controller] getOverdueInvoiceNotifications:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/notifications/counts ───────────────────────────────────────────
// Lightweight endpoint for header badge — returns counts only
exports.getNotificationCounts = async (req, res) => {
    try {
        const counts = await notificationService.getNotificationCounts();
        return res.status(200).json({ success: true, data: counts });
    } catch (error) {
        console.error("[notification.controller] getNotificationCounts:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
