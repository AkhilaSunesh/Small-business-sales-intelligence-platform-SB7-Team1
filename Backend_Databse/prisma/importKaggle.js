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
    console.log("  ⌛ Checking existing customers...");
    const existingCustomers = await prisma.customer.findMany({ select: { customerCode: true } });
    const existingCustomerCodes = new Set(existingCustomers.map(c => c.customerCode));

    const customersToInsert = [];
    for (const [customerCode] of customerCodeSet) {
        if (existingCustomerCodes.has(customerCode)) continue;
        customersToInsert.push({
            customerCode,
            name:    `Customer ${customerCode}`,
            email:   `customer.${customerCode.toLowerCase()}@kaggle.dataset`,
            phone:   null,
            address: null
        });
    }

    let customersInserted = customersToInsert.length;
    if (customersToInsert.length > 0) {
        console.log(`  ⌛ Inserting ${customersToInsert.length} new customers...`);
        const chunkSize = 10000;
        for (let i = 0; i < customersToInsert.length; i += chunkSize) {
            const chunk = customersToInsert.slice(i, i + chunkSize);
            await prisma.customer.createMany({
                data: chunk,
                skipDuplicates: true
            });
        }
    }
    console.log(`  ✔ Customers import completed.`);

    // ── STEP 5: Insert products (skip if already exist) ───────────────────────
    console.log("  ⌛ Checking existing products...");
    const existingProducts = await prisma.product.findMany({ select: { productCode: true } });
    const existingProductCodes = new Set(existingProducts.map(p => p.productCode));

    const productsToInsert = [];
    for (const [productCode, row] of productCodeSet) {
        if (existingProductCodes.has(productCode)) continue;
        productsToInsert.push({
            productCode,
            name:     `Product ${productCode}`,
            category: row.ProductCategory || "Uncategorised",
            price:    Number(row.Price) || 0
        });
    }

    let productsInserted = productsToInsert.length;
    if (productsToInsert.length > 0) {
        await prisma.product.createMany({
            data: productsToInsert,
            skipDuplicates: true
        });
    }
    console.log(`  ✔ Products import completed.`);

    // ── STEP 6: Create inventory for any product missing a record ─────────────
    const allProducts = await prisma.product.findMany({ select: { id: true, productCode: true } });
    const existingInventory = await prisma.inventory.findMany({ select: { productId: true } });
    const existingInventoryIds = new Set(existingInventory.map(inv => inv.productId));

    const inventoriesToInsert = [];
    for (const product of allProducts) {
        if (existingInventoryIds.has(product.id)) continue;
        inventoriesToInsert.push({
            productId: product.id,
            quantity: 1000,
            lowStockThreshold: 10
        });
    }
    let inventoryInserted = inventoriesToInsert.length;
    if (inventoriesToInsert.length > 0) {
        await prisma.inventory.createMany({
            data: inventoriesToInsert,
            skipDuplicates: true
        });
    }
    console.log(`  ✔ Inventory records created: ${inventoryInserted}`);

    // Build lookup maps for FK resolution
    const customers   = await prisma.customer.findMany({ select: { id: true, customerCode: true } });
    const products    = await prisma.product.findMany({ select: { id: true, productCode: true } });
    const customerMap = new Map(customers.map(c => [c.customerCode, c.id]));
    const productMap  = new Map(products.map(p  => [p.productCode,  p.id]));

    // ── STEP 7: Insert sales transactions + invoices + payments ───────────────
    console.log("  ⌛ Preparing sales, invoices, and payments in memory...");
    const salesToInsert = [];
    const invoicesToInsert = [];
    const paymentsToInsert = [];

    const crypto = require("crypto");
    const uuidv4 = crypto.randomUUID;

    // Check which KGL transactions already exist
    const existingSales = await prisma.salesTransaction.findMany({
        where: { invoiceNo: { startsWith: "KGL-" } },
        select: { invoiceNo: true }
    });
    const existingInvoiceNos = new Set(existingSales.map(s => s.invoiceNo));

    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const customerId = customerMap.get(row.CustomerID);
        const productId  = productMap.get(row.ProductID);

        if (!customerId || !productId) { skipped++; continue; }

        // Deterministic, collision-safe invoiceNo based on row index
        const invoiceNo = `KGL-${String(i + 1).padStart(8, "0")}`;

        // Skip if this transaction was already imported
        if (existingInvoiceNos.has(invoiceNo)) { skipped++; continue; }

        const qty         = Number(row.Quantity)   || 0;
        const unitPrice   = Number(row.Price)       || 0;
        const kaggleTotalAmount = Number(row.TotalAmount) || 0;
        const rawDate = row.TransactionDate ? new Date(row.TransactionDate) : new Date();
        // Shift transactions forward so 2023 becomes 2025 and 2024 becomes 2026
        const txDate = new Date(rawDate);
        if (txDate.getFullYear() < 2025) {
            const origMonth = rawDate.getMonth();
            const origDay = rawDate.getDate();
            const targetYear = rawDate.getFullYear() + 2;
            
            // If original date was Feb 29 in leap year 2024, set to Feb 28 in non-leap year 2026
            if (origMonth === 1 && origDay === 29) {
                txDate.setFullYear(targetYear, 1, 28);
            } else {
                txDate.setFullYear(targetYear);
            }
        }

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

        const saleId = uuidv4();
        const invoiceId = uuidv4();

        salesToInsert.push({
            id:              saleId,
            invoiceNo,
            customerId,
            productId,
            userId:          systemUser.id,
            quantity:        qty,
            totalAmount,
            transactionDate: txDate
        });

        invoicesToInsert.push({
            id:                 invoiceId,
            invoiceNumber,
            customerId,
            salesTransactionId: saleId,
            subtotal,
            taxRate:            GST_RATE,
            taxAmount,
            discountRate:       discountPct,
            discountAmount:     discountAmt,
            totalAmount:        invoiceTotal,
            status:             paymentMethod !== "OTHER" ? "PAID" : "UNPAID",
            dueDate,
            createdById:        systemUser.id,
            lineItems:          [{
                productId,
                productName: `Product ${row.ProductID}`,
                quantity:    qty,
                unitPrice,
                lineTotal:   subtotal
            }]
        });

        if (paymentMethod !== "OTHER") {
            paymentsToInsert.push({
                id:           uuidv4(),
                invoiceId,
                amount:       invoiceTotal,
                method:       paymentMethod,
                reference:    invoiceNo,
                paidAt:       txDate,
                recordedById: systemUser.id
            });
        }
    }

    if (salesToInsert.length > 0) {
        console.log(`  ⌛ Bulk inserting ${salesToInsert.length} sales transactions, Invoices, and Payments...`);
        const bulkChunkSize = 5000;

        // Insert sales
        for (let i = 0; i < salesToInsert.length; i += bulkChunkSize) {
            const chunk = salesToInsert.slice(i, i + bulkChunkSize);
            await prisma.salesTransaction.createMany({
                data: chunk,
                skipDuplicates: true
            });
            console.log(`    … sales: ${Math.min(i + bulkChunkSize, salesToInsert.length)} / ${salesToInsert.length} inserted`);
        }

        // Insert invoices
        for (let i = 0; i < invoicesToInsert.length; i += bulkChunkSize) {
            const chunk = invoicesToInsert.slice(i, i + bulkChunkSize);
            await prisma.invoice.createMany({
                data: chunk,
                skipDuplicates: true
            });
            console.log(`    … invoices: ${Math.min(i + bulkChunkSize, invoicesToInsert.length)} / ${invoicesToInsert.length} inserted`);
        }

        // Insert payments
        for (let i = 0; i < paymentsToInsert.length; i += bulkChunkSize) {
            const chunk = paymentsToInsert.slice(i, i + bulkChunkSize);
            await prisma.payment.createMany({
                data: chunk,
                skipDuplicates: true
            });
            console.log(`    … payments: ${Math.min(i + bulkChunkSize, paymentsToInsert.length)} / ${paymentsToInsert.length} inserted`);
        }
    }

    console.log(`\n  ✔ Sales transactions inserted: ${salesToInsert.length}`);
    console.log(`  ✔ Invoices inserted:           ${invoicesToInsert.length}`);
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
