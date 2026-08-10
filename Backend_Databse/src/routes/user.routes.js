const express = require("express");
const router  = express.Router();

const userController = require("../controllers/user.controller");

// GET /api/users          — list all users (paginated, searchable)
router.get("/",    userController.getUsers);

// GET /api/users/:id      — single user by UUID
router.get("/:id", userController.getUserById);

module.exports = router;
