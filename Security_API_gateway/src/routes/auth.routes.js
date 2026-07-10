const express = require("express");
const router = express.Router();

const authController = require("../auth/auth.controller");
const { validateRegister, validateLogin, validateRefresh } = require("../validations/auth.validation");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, validateRegister, authController.register);

router.post("/login", authLimiter, validateLogin, authController.login);

router.post("/refresh", validateRefresh, authController.refreshToken);

module.exports = router;