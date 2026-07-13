/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.js", "**/?(*.)+(spec|test).js"],
    collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
    coverageDirectory: "coverage",
    verbose: true
};
