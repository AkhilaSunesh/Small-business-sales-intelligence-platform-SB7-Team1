/**
 * setup.js — Combined setup runner (cross-platform)
 *
 * Runs importKaggle.js then seed.js in sequence.
 * Use this instead of chaining with && which fails on Windows cmd.
 *
 * Usage:  npm run setup
 */

const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");

function run(script) {
    console.log(`\n▶ Running: node ${script}\n${"─".repeat(50)}`);
    execSync(`node "${path.join(__dirname, script)}"`, {
        stdio: "inherit",
        cwd:   root
    });
}

run("importKaggle.js");
run("seed.js");

console.log("\n✅ Setup complete. Database is ready.");
