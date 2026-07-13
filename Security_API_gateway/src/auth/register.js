/**
 * register.js
 *
 * Thin re-export so external code can import the register handler
 * directly from the auth/ directory without going through the
 * controller bundle.
 *
 * Usage:
 *   const { register } = require('./register');
 */

const { register } = require("./auth.controller");

module.exports = { register };
