/**
 * auth.service.js
 *
 * Business-logic layer for authentication.
 * The controller stays thin — it only handles HTTP concerns.
 * All DB queries and token creation live here.
 */

const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { createAccessToken, createRefreshToken, verifyRefreshToken } = require("../auth/jwt");

const SALT_ROUNDS = 10;

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Create a new user account.
 * @throws {Error} with code "EMAIL_TAKEN" if email already exists.
 */
async function registerUser({ name, email, password, roleId }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        const err = new Error("Email already registered.");
        err.code  = "EMAIL_TAKEN";
        throw err;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, roleId: Number(roleId) }
    });

    return { id: user.id, name: user.name, email: user.email, roleId: user.roleId };
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Validate credentials and issue tokens.
 * @throws {Error} with code "INVALID_CREDENTIALS" if user not found or password wrong.
 */
async function loginUser({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        const err = new Error("Invalid email or password.");
        err.code  = "INVALID_CREDENTIALS";
        throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const err = new Error("Invalid email or password.");
        err.code  = "INVALID_CREDENTIALS";
        throw err;
    }

    const accessToken  = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return {
        accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, email: user.email, roleId: user.roleId }
    };
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

/**
 * Issue a new access token from a valid refresh token.
 * @throws {Error} with code "INVALID_REFRESH_TOKEN" if token is bad or user not found.
 */
async function refreshAccessToken(refreshToken) {
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (_) {
        const err = new Error("Invalid refresh token.");
        err.code  = "INVALID_REFRESH_TOKEN";
        throw err;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
        const err = new Error("Invalid refresh token.");
        err.code  = "INVALID_REFRESH_TOKEN";
        throw err;
    }

    return { accessToken: createAccessToken(user) };
}

// ─── Get current user ─────────────────────────────────────────────────────────

/**
 * Fetch a user by id, returning only safe public fields.
 * @throws {Error} with code "USER_NOT_FOUND" if id does not exist.
 */
async function getUserById(id) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, roleId: true, role: { select: { name: true } } }
    });

    if (!user) {
        const err = new Error("User not found.");
        err.code  = "USER_NOT_FOUND";
        throw err;
    }

    return user;
}

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    getUserById
};
