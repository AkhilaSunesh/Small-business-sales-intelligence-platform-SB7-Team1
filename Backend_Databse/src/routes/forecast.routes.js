const express  = require("express");
const router   = express.Router();

const forecastController = require("../controllers/forecast.controller");

// GET /api/forecast?days=30&lookback=90&window=7
router.get("/", forecastController.getForecast);

module.exports = router;
