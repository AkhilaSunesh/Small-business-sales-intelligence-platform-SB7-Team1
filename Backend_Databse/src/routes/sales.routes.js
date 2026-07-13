const express = require("express");
const router  = express.Router();

const salesController = require("../controllers/sales.controller");
const upload = require("../middleware/upload.middleware");

// GET /api/sales — list transactions with pagination & optional filters
// Query: page, pageSize, customerId, productId, startDate, endDate
router.get("/", salesController.getSales);

// GET /api/sales/:id — single transaction by id
router.get("/:id", salesController.getSaleById);

// POST /api/sales/upload — parse and store a CSV of sales rows
router.post(
    "/upload",
    upload.single("file"),
    salesController.uploadSales
);

module.exports = router;
