const express = require("express");

const router = express.Router();

const analyticsController = require("../controllers/analytics.controller");

router.get(
    "/summary",
    analyticsController.getAnalyticsSummary
);

router.get("/payment-methods", analyticsController.getPaymentMethods);
router.get("/categories",      analyticsController.getCategoryBreakdown);

module.exports = router;