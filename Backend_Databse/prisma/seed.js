/**
 * Seed script — MarketMind AI
 *
 * Loads data from seed_data/ CSVs in the correct FK order:
 *   Role → User → Customer → Product → Inventory → SalesTransaction
 *
 * Run with:  npm run seed
 *
 * Notes
 * ─────
 * • Customer.csv has no customerCode column — we derive it from the row index.
 * • Product.csv has no productCode column — we derive it from the row index.
 * • Inventory.csv references productId by UUID from Product.csv.
 * • SalesTransaction.csv uses "saleDate"; the schema uses "transactionDate".
 *   We map saleDate → transactionDate when inserting.
 * • All upserts are idempotent — safe to run multiple times.
 */

require("dotenv").config();

const fs      = require("fs");
const path    = require("path");
const csv     = require("csv-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ─── CSV helper ────────────────────────────────────────────────────────────────
function readCsv(filename) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(path.join(__dirname, "../seed_data", filename))
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end",  ()    => resolve(rows))
            .on("error", (e)  => reject(e));
    });
}

// ─── main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log("🌱 Seeding database from seed_data/ CSVs …\n");

    // ── 1. Roles ───────────────────────────────────────────────────────────────
    const roleRows = await readCsv("Role.csv");
    for (const r of roleRows) {
        await prisma.role.upsert({
            where:  { id: Number(r.id) },
            update: { name: r.name },
            create: { id: Number(r.id), name: r.name }
        });
    }
    console.log(`  ✔ ${roleRows.length} roles seeded`);

    // ── 2. Users ───────────────────────────────────────────────────────────────
    const userRows = await readCsv("User.csv");
    for (const u of userRows) {
        await prisma.user.upsert({
            where:  { email: u.email },
            update: {},
            create: {
                id:     u.id,
                name:   u.name,
                email:  u.email,
                password: u.password,   // already bcrypt-hashed in CSV
                roleId: Number(u.roleId)
            }
        });
    }
    console.log(`  ✔ ${userRows.length} users seeded`);

    // ── 3. Customers ───────────────────────────────────────────────────────────
    // CSV columns: id, name, email, phone, address, createdAt
    // customerCode is NOT in the CSV — derive as SEED-CUST-{i+1}
    const customerRows = await readCsv("Customer.csv");
    for (let i = 0; i < customerRows.length; i++) {
        const c = customerRows[i];
        const customerCode = `SEED-CUST-${String(i + 1).padStart(4, "0")}`;
        await prisma.customer.upsert({
            where:  { customerCode },
            update: {},
            create: {
                id:           c.id,
                customerCode,
                name:         c.name,
                email:        c.email     || null,
                phone:        c.phone     || null,
                address:      c.address   || null
            }
        });
    }
    console.log(`  ✔ ${customerRows.length} customers seeded`);

    // ── 4. Products ────────────────────────────────────────────────────────────
    // CSV columns: id, name, category, price, createdAt
    // productCode is NOT in the CSV — derive as SEED-PROD-{i+1}
    const productRows = await readCsv("Product.csv");
    for (let i = 0; i < productRows.length; i++) {
        const p = productRows[i];
        const productCode = `SEED-PROD-${String(i + 1).padStart(4, "0")}`;
        await prisma.product.upsert({
            where:  { productCode },
            update: {},
            create: {
                id:          p.id,
                productCode,
                name:        p.name,
                category:    p.category,
                price:       parseFloat(p.price)
            }
        });
    }
    console.log(`  ✔ ${productRows.length} products seeded`);

    // ── 5. Inventory ───────────────────────────────────────────────────────────
    // CSV columns: id, quantity, productId
    const inventoryRows = await readCsv("Inventory.csv");
    for (const inv of inventoryRows) {
        // Only insert if the referenced product was seeded
        const product = await prisma.product.findUnique({ where: { id: inv.productId } });
        if (!product) continue;

        await prisma.inventory.upsert({
            where:  { productId: inv.productId },
            update: { quantity: Number(inv.quantity) },
            create: {
                id:                inv.id,
                productId:         inv.productId,
                quantity:          Number(inv.quantity),
                lowStockThreshold: 10
            }
        });
    }
    console.log(`  ✔ ${inventoryRows.length} inventory records seeded`);

    // ── 6. Sales Transactions ──────────────────────────────────────────────────
    // CSV columns: id, customerId, productId, userId, quantity, totalAmount, saleDate
    // Schema uses:  transactionDate (not saleDate)
    // invoiceNo is required (unique) — derive as SEED-INV-{i+1}
    const salesRows = await readCsv("SalesTransaction.csv");
    let salesSeeded = 0;
    for (let i = 0; i < salesRows.length; i++) {
        const s = salesRows[i];

        // Skip row if FK targets don't exist in DB
        const customer = await prisma.customer.findUnique({ where: { id: s.customerId } });
        const product  = await prisma.product.findUnique({ where:  { id: s.productId  } });
        const user     = s.userId
            ? await prisma.user.findUnique({ where: { id: s.userId } })
            : null;

        if (!customer || !product) continue;

        const invoiceNo = `SEED-INV-${String(i + 1).padStart(6, "0")}`;
        const transactionDate = s.saleDate
            ? new Date(s.saleDate)
            : new Date();

        const existing = await prisma.salesTransaction.findUnique({ where: { invoiceNo } });
        if (existing) continue;

        await prisma.salesTransaction.create({
            data: {
                id:              s.id,
                invoiceNo,
                customerId:      s.customerId,
                productId:       s.productId,
                userId:          user ? s.userId : null,
                quantity:        Number(s.quantity),
                totalAmount:     parseFloat(s.totalAmount),
                transactionDate
            }
        });
        salesSeeded++;
    }
    console.log(`  ✔ ${salesSeeded} sales transactions seeded`);

    console.log("\n✅ Seed complete");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
