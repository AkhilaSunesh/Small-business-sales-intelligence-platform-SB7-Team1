const express = require("express");
const router  = express.Router();

const authController = require("../auth/auth.controller");
const { validateRegister, validateLogin, validateRefresh } = require("../validations/auth.validation");
const { authLimiter }  = require("../middleware/rateLimiter");
const authenticate     = require("../middleware/authenticate");

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/register", authLimiter, validateRegister, authController.register);
router.post("/login",    authLimiter, validateLogin,    authController.login);
router.post("/refresh",              validateRefresh,   authController.refreshToken);

// ── Protected ─────────────────────────────────────────────────────────────────
// GET /api/auth/me — current user profile (requires valid access token)
router.get( "/me",     authenticate, authController.me);

// POST /api/auth/logout — stateless logout (requires valid access token)
router.post("/logout", authenticate, authController.logout);

// PATCH /api/auth/change-password — update own password (requires valid access token)
router.patch("/change-password", authenticate, authController.changePassword);

module.exports = router;
