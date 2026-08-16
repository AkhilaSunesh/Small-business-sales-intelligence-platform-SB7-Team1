/**
 * jwt.js — Token helper module
 *
 * Centralises all JWT creation so the rest of the codebase never
 * calls jwt.sign() directly.  Both tokens embed only the minimum
 * claims needed; the access token includes roleId so the gateway
 * can run RBAC without a DB round-trip.
 */

const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_EXPIRES_IN  = "1h";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const DEFAULT_JWT_SECRET       = "supersecretjwtkey123!";
const DEFAULT_REFRESH_SECRET   = "supersecretrefreshkey123!";

/**
 * Create a signed access token.
 * Claims: { id, email, roleId }
 * @param {{ id: string, email: string, roleId: number }} user
 * @returns {string}
 */
function createAccessToken(user) {
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    return jwt.sign(
        { id: user.id, email: user.email, roleId: user.roleId },
        secret,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
}

/**
 * Create a signed refresh token.
 * Claims: { id } — minimal payload; only used to re-issue access tokens.
 * @param {{ id: string }} user
 * @returns {string}
 */
function createRefreshToken(user) {
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || DEFAULT_REFRESH_SECRET;
    return jwt.sign(
        { id: user.id },
        secret,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
}

/**
 * Verify an access token and return the decoded payload.
 * Throws a JsonWebTokenError / TokenExpiredError on failure.
 * @param {string} token
 * @returns {object}
 */
function verifyAccessToken(token) {
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    return jwt.verify(token, secret);
}

/**
 * Verify a refresh token and return the decoded payload.
 * @param {string} token
 * @returns {object}
 */
function verifyRefreshToken(token) {
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || DEFAULT_REFRESH_SECRET;
    return jwt.verify(token, secret);
}

module.exports = {
    createAccessToken,
    createRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN
};
