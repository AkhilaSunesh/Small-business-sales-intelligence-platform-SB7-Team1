/**
 * seed.js — System Data Only
 *
 * Seeds ONLY the mandatory system tables that cannot come from the
 * Kaggle dataset:
 *
 *   1. Roles  — business role definitions (Business Owner, Store Manager, etc.)
 *   2. Users  — one system account per role for development / testing
 *
 * Business data (Customers, Products, Inventory, SalesTransactions,
 * Invoices, Payments) is imported exclusively by importKaggle.js which
 * reads dataset/Retail_Transaction_Dataset.csv.
 *
 * Run order:
 *   npm run import:kaggle   ← business data from Kaggle CSV
 *   npm run seed            ← system roles and user accounts
 *
 * Or use the combined command:
 *   npm run setup           ← runs both in sequence
 *
 * This script is idempotent — safe to run multiple times.
 */

require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ─── System roles ──────────────────────────────────────────────────────────────
const SYSTEM_ROLES = [
    { id: 1, name: "Business Owner" },
    { id: 2, name: "Store Manager" },
    { id: 3, name: "Sales Executive" },
    { id: 4, name: "System Administrator" }
];

// ─── System user accounts ──────────────────────────────────────────────────────
// Password is hashed at runtime with bcrypt (cost 10) so it never drifts.
// Plain-text password for all system accounts: Password1!
const PLAIN_PASSWORD = "Password1!";

const SYSTEM_USERS = [
    { id: "4005dfa6-3c04-4e2d-8ee8-7f38536d23b0", name: "Business Owner",  email: "owner@marketmind.dev",   roleId: 1 },
    { id: "4c49c904-69ff-43ea-a26d-18d47fd354ff", name: "Store Manager",   email: "manager@marketmind.dev", roleId: 2 },
    { id: "5bf90d45-a1e6-487a-9615-3c80c3502161", name: "Sales Executive", email: "sales@marketmind.dev",   roleId: 3 },
    { id: "f7eb3703-0645-49d4-be71-962b3d283cba", name: "System Admin",    email: "admin@marketmind.dev",   roleId: 4 },
    { id: "usr-admin-001",                         name: "MarketMind Admin", email: "admin@marketmind.ai",    roleId: 4 }
];

const bcrypt = require("bcrypt");

async function main() {
    console.log("🔧 Seeding system data …\n");

    // ── 1. Roles ───────────────────────────────────────────────────────────────
    for (const role of SYSTEM_ROLES) {
        await prisma.role.upsert({
            where:  { id: role.id },
            update: { name: role.name },
            create: { id: role.id, name: role.name }
        });
    }
    console.log(`  ✔ ${SYSTEM_ROLES.length} system roles seeded`);

    // ── 2. Users ───────────────────────────────────────────────────────────────
    // Hash is computed fresh every run so it can never be a stale/wrong value.
    const hashedPassword = await bcrypt.hash(PLAIN_PASSWORD, 10);

    for (const u of SYSTEM_USERS) {
        await prisma.user.upsert({
            where:  { email: u.email },
            // Always update the password to ensure it matches PLAIN_PASSWORD.
            // This fixes any existing account that may have a stale hash.
            update: { password: hashedPassword },
            create: {
                id:       u.id,
                name:     u.name,
                email:    u.email,
                password: hashedPassword,
                roleId:   u.roleId
            }
        });
    }
    console.log(`  ✔ ${SYSTEM_USERS.length} system user accounts seeded`);
    console.log("\n  System accounts (all use password: Password1!)");
    SYSTEM_USERS.forEach(u => console.log(`    ${u.email}  (role ${u.roleId})`));

    console.log("\n✅ System seed complete");
    console.log("   Run 'npm run import:kaggle' to load business data from the Kaggle dataset.");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
