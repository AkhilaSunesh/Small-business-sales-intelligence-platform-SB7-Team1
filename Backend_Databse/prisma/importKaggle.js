/**
 * importKaggle.js — Kaggle Retail Transaction Dataset Importer
 *
 * Reads dataset/Retail_Transaction_Dataset.csv and populates the database
 * with all business data in dependency order:
 *
 *   Customers → Products → Inventory → SalesTransactions → Invoices → Payments
 *
 * Kaggle CSV columns used:
 *   CustomerID, ProductID, Quantity, Price, TransactionDate,
 *   PaymentMethod, ProductCategory, DiscountApplied(%), TotalAmount
 *
 * Design decisions:
 *   • Customer name derived as "Customer <ID>" — the dataset has no names.
 *   • Product name derived as "Product <ID>" — the dataset has no names.
 *   • Inventory starts at 100,000 units per product (sufficient for all sales).
 *   • Each sale row becomes one SalesTransaction and one Invoice.
 *   • Invoice applies 18% GST on the discounted subtotal (Kaggle DiscountApplied%).
 *   • Payment method mapped from Kaggle PaymentMethod field.
 *   • All invoices seeded as PAID with a matching Payment record.
 *   • Script is fully idempotent — safe to re-run.
 *
 * Run with:
 *   npm run import:kaggle
 */

require("dotenv").config();

const fs   = require("fs");
const path = require("path");
const csv  = require("csv-parser");

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CSV_PATH = path.join(__dirname, "../dataset/Retail_Transaction_Dataset.csv");
const GST_RATE = 18; // 18% GST applied on taxable amount

// ─── Map Kaggle PaymentMethod string → PaymentMethod enum ──────────────────────
function mapPaymentMethod(raw) {
    if (!raw) return "CASH";
    const val = raw.trim().toUpperCase().replace(/\s+/g, "_");
    const valid = ["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE", "OTHER"];
    if (valid.includes(val)) return val;
    if (val === "CREDIT_CARD" || val === "DEBIT_CARD") return "CARD";
    if (val === "BANK_TRANSFER" || val === "WIRE_TRANSFER" || val === "NEFT") return "BANK_TRANSFER";
    return "OTHER";
}

// ─── Load CSV ──────────────────────────────────────────────────────────────────
function loadCsv(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end",  () => resolve(rows))
            .on("error", reject);
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log("📦 MarketMind AI — Kaggle Dataset Importer\n");

    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ Dataset not found at: ${CSV_PATH}`);
        process.exit(1);
    }

    const rows = await loadCsv(CSV_PATH);
    console.log(`  ✔ CSV loaded: ${rows.length} rows`);

    // ── STEP 1: Ensure system roles exist (seed.js may not have run yet) ──────
    const roleNames = ["Business Owner", "Store Manager", "Sales Executive", "System Administrator"];
    for (let i = 0; i < roleNames.length; i++) {
        await prisma.role.upsert({
            where:  { id: i + 1 },
            update: {},
            create: { id: i + 1, name: roleNames[i] }
        });
    }

    // ── STEP 2: Ensure a system user exists to associate with transactions ────
    let systemUser = await prisma.user.findUnique({ where: { email: "admin@marketmind.dev" } });
    if (!systemUser) {
        // Create minimal admin user if seed.js hasn't run
        const bcrypt = require("bcrypt");
        const hashed = await bcrypt.hash("Password1!", 10);
        const role   = await prisma.role.findFirst({ where: { id: 4 } });
        systemUser   = await prisma.user.create({
            data: {
                name:     "System Admin",
                email:    "admin@marketmind.dev",
                password: hashed,
                roleId:   role.id
            }
        });
    }
    console.log(`  ✔ System user ready: ${systemUser.email}`);

    // ── STEP 3: Build unique customer and product sets from CSV ───────────────
    const customerCodeSet = new Map(); // customerCode → first row
    const productCodeSet  = new Map(); // productCode  → first row

    for (const row of rows) {
        if (row.CustomerID && !customerCodeSet.has(row.CustomerID)) {
            customerCodeSet.set(row.CustomerID, row);
        }
        if (row.ProductID && !productCodeSet.has(row.ProductID)) {
            productCodeSet.set(row.ProductID, row);
        }
    }
    console.log(`  ✔ Unique customers in CSV: ${customerCodeSet.size}`);
    console.log(`  ✔ Unique products in CSV:  ${productCodeSet.size}`);

    // ── STEP 4: Insert customers (skip if already exist) ─────────────────────
    let customersInserted = 0;
    for (const [customerCode] of customerCodeSet) {
        const existing = await prisma.customer.findUnique({ where: { customerCode } });
        if (existing) continue;
        await prisma.customer.create({
            data: {
                customerCode,
                name:    `Customer ${customerCode}`,
                email:   `customer.${customerCode.toLowerCase()}@kaggle.dataset`,
                phone:   null,
                address: null
            }
        });
        customersInserted++;
    }
    console.log(`  ✔ Customers inserted: ${customersInserted} (skipped ${customerCodeSet.size - customersInserted} existing)`);

    // ── STEP 5: Insert products (skip if already exist) ───────────────────────
    let productsInserted = 0;
    for (const [productCode, row] of productCodeSet) {
        const existing = await prisma.product.findUnique({ where: { productCode } });
        if (existing) continue;
        await prisma.product.create({
            data: {
                productCode,
                name:     `Product ${productCode}`,
                category: row.ProductCategory || "Uncategorised",
                price:    Number(row.Price) || 0
            }
        });
        productsInserted++;
    }
    console.log(`  ✔ Products inserted: ${productsInserted} (skipped ${productCodeSet.size - productsInserted} existing)`);

    // ── STEP 6: Create inventory for any product missing a record ─────────────
    const allProducts = await prisma.product.findMany({ select: { id: true, productCode: true } });
    let inventoryInserted = 0;
    for (const product of allProducts) {
        const exists = await prisma.inventory.findUnique({ where: { productId: product.id } });
        if (exists) continue;
        await prisma.inventory.create({
            data: { productId: product.id, quantity: 100000, lowStockThreshold: 10 }
        });
        inventoryInserted++;
    }
    console.log(`  ✔ Inventory records created: ${inventoryInserted}`);

    // Build lookup maps for FK resolution
    const customers   = await prisma.customer.findMany({ select: { id: true, customerCode: true } });
    const products    = await prisma.product.findMany({ select: { id: true, productCode: true } });
    const customerMap = new Map(customers.map(c => [c.customerCode, c.id]));
    const productMap  = new Map(products.map(p  => [p.productCode,  p.id]));

    // ── STEP 7: Insert sales transactions + invoices + payments ───────────────
    let salesInserted    = 0;
    let invoicesInserted = 0;
    let skipped          = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const customerId = customerMap.get(row.CustomerID);
        const productId  = productMap.get(row.ProductID);

        if (!customerId || !productId) { skipped++; continue; }

        // Deterministic, collision-safe invoiceNo based on row index
        const invoiceNo = `KGL-${String(i + 1).padStart(8, "0")}`;

        // Skip if this transaction was already imported
        const existingSale = await prisma.salesTransaction.findUnique({ where: { invoiceNo } });
        if (existingSale) { skipped++; continue; }

        const qty         = Number(row.Quantity)   || 0;
        const unitPrice   = Number(row.Price)       || 0;
        // Use the Kaggle TotalAmount column (already post-discount) for the
        // SalesTransaction record so dashboard revenue is accurate.
        // Fall back to qty × price only if the column is missing/zero.
        const kaggleTotalAmount = Number(row.TotalAmount) || 0;
        const totalAmount = kaggleTotalAmount > 0 ? kaggleTotalAmount : qty * unitPrice;
        const txDate      = row.TransactionDate ? new Date(row.TransactionDate) : new Date();

        // ── Invoice calculations ─────────────────────────────────────────────
        const discountPct  = Number(row["DiscountApplied(%)"]) || 0;
        const subtotal     = totalAmount;                                   // qty × price
        const discountAmt  = subtotal * (discountPct / 100);
        const taxableAmt   = subtotal - discountAmt;
        const taxAmount    = taxableAmt * (GST_RATE / 100);
        const invoiceTotal = taxableAmt + taxAmount;
        const dueDate      = new Date(txDate);
        dueDate.setDate(dueDate.getDate() + 30);

        const year  = txDate.getFullYear();
        const month = String(txDate.getMonth() + 1).padStart(2, "0");
        const seq   = String(i + 1).padStart(8, "0");
        const invoiceNumber = `INV-${year}${month}-${seq}`;

        const paymentMethod = mapPaymentMethod(row.PaymentMethod);

        // Wrap sale + invoice + payment in one atomic transaction
        await prisma.$transaction(async (tx) => {
            // Create sale
            const sale = await tx.salesTransaction.create({
                data: {
                    invoiceNo,
                    customerId,
                    productId,
                    userId:          systemUser.id,
                    quantity:        qty,
                    totalAmount,
                    transactionDate: txDate
                }
            });

            // Create invoice linked to the sale
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    customerId,
                    salesTransactionId: sale.id,
                    subtotal,
                    taxRate:       GST_RATE,
                    taxAmount,
                    discountRate:   discountPct,
                    discountAmount: discountAmt,
                    totalAmount:    invoiceTotal,
                    // Paid if payment method is known; otherwise unpaid
                    status:         paymentMethod !== "OTHER" ? "PAID" : "UNPAID",
                    dueDate,
                    createdById: systemUser.id,
                    lineItems: [{
                        productId,
                        productName: `Product ${row.ProductID}`,
                        quantity:    qty,
                        unitPrice,
                        lineTotal:   subtotal
                    }]
                }
            });

            // Create payment record for paid invoices
            if (invoice.status === "PAID") {
                await tx.payment.create({
                    data: {
                        invoiceId:   invoice.id,
                        amount:      invoiceTotal,
                        method:      paymentMethod,
                        reference:   invoiceNo,
                        paidAt:      txDate,
                        recordedById: systemUser.id
                    }
                });
            }
        });

        salesInserted++;
        invoicesInserted++;
        if ((salesInserted % 500) === 0) {
            console.log(`    … ${salesInserted} rows processed`);
        }
    }

    console.log(`\n  ✔ Sales transactions inserted: ${salesInserted}`);
    console.log(`  ✔ Invoices inserted:           ${invoicesInserted}`);
    console.log(`  ✔ Rows skipped (duplicates or missing FKs): ${skipped}`);
    console.log("\n✅ Kaggle dataset import complete.");
    console.log("   All APIs (dashboard, analytics, inventory, invoices) now serve Kaggle data.");
}

main()
    .catch((e) => {
        console.error("❌ Import failed:", e.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
