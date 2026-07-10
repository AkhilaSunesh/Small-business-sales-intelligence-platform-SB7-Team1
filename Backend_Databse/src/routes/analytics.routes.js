const express = require("express");

const router = express.Router();

const analyticsController = require("../controllers/analytics.controller");


router.get(
    "/summary",
    analyticsController.getAnalyticsSummary
);


module.exports = router;