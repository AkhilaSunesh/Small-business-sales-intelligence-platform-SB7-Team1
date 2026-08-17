const express = require("express");
const router  = express.Router();

const userController = require("../controllers/user.controller");

// GET /api/users              — list all users (paginated, searchable)
router.get("/",    userController.getUsers);

// GET /api/users/:id          — single user by UUID
router.get("/:id", userController.getUserById);

// PUT & PATCH /api/users/:id  — update user details (name, email, role, status)
router.put("/:id",   userController.updateUser);
router.patch("/:id", userController.updateUser);

// PATCH /api/users/:id/profile — update display name only (email is read-only)
router.patch("/:id/profile", userController.updateUserProfile);

// PATCH /api/users/:id/status — toggle isActive (activate / deactivate)
router.patch("/:id/status",  userController.updateUserStatus);

// DELETE /api/users/:id       — soft-delete (sets isActive = false)
router.delete("/:id",        userController.deleteUser);

module.exports = router;
