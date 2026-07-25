const express = require("express");
const router  = express.Router();

const dashboardController = require("../controllers/dashboard.controller");

// GET /api/dashboard/summary         — full KPI bundle
router.get("/summary",       dashboardController.getDashboardSummary);

// GET /api/dashboard/total-revenue   — total revenue only
router.get("/total-revenue", dashboardController.getTotalRevenue);

// GET /api/dashboard/top-products    — top N products by quantity sold
router.get("/top-products",  dashboardController.getTopProducts);

// GET /api/dashboard/sales-trend     — daily aggregated sales (?range=7d|30d|90d|1y)
router.get("/sales-trend",   dashboardController.getSalesTrend);

module.exports = router;
