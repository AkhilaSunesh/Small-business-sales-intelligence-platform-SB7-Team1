/**
 * login.js
 *
 * Thin re-export so external code can import the login and
 * refreshToken handlers directly from the auth/ directory.
 *
 * Usage:
 *   const { login, refreshToken } = require('./login');
 */

const { login, refreshToken } = require("./auth.controller");

module.exports = { login, refreshToken };
