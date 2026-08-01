const router = require("express").Router();

const controller = require("../controllers/inventory.controller");
const { validateAdd, validateUpdate, validateDelete } = require("../validations/inventory.validation");

// GET /api/inventory — all inventory with lowStock annotation
router.get("/", controller.getInventory);

// GET /api/inventory/low-stock — only items at or below their threshold
router.get("/low-stock", controller.getLowStock);

// POST /api/inventory/add — increment stock
router.post("/add", validateAdd, controller.addStock);

// PUT /api/inventory/update — set absolute stock level
router.put("/update", validateUpdate, controller.updateStock);

// DELETE /api/inventory/delete — remove inventory record
router.delete("/delete", validateDelete, controller.deleteInventory);

// PATCH /api/inventory/bulk   — bulk quantity update (Milestone 3)
router.patch("/bulk", require("../controllers/bulk.controller").bulkUpdateInventory);

module.exports = router;