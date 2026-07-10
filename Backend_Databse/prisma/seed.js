const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const prisma = new PrismaClient();
const datasetPath = path.join(__dirname, "../dataset/Retail_Transaction_Dataset.csv");

function sanitize(value) {
    return value === undefined || value === null ? "" : value.toString().trim();
}

function parseDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function loadCsv(filePath) {
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => rows.push(row))
            .on("end", () => resolve(rows))
            .on("error", reject);
    });
}

async function main() {
    console.log("🌱 Starting Database Seeding...");

    await prisma.salesTransaction.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    console.log("Old data deleted.");

    const owner = await prisma.role.create({ data: { name: "Business Owner" } });
    const manager = await prisma.role.create({ data: { name: "Store Manager" } });
    const executive = await prisma.role.create({ data: { name: "Sales Executive" } });
    const admin = await prisma.role.create({ data: { name: "System Administrator" } });

    console.log("Roles inserted.");

    const password = await bcrypt.hash("password123", 10);
    const adminUser = await prisma.user.create({
        data: {
            name: "Admin User",
            email: "admin@example.com",
            password,
            roleId: admin.id
        }
    });

    console.log("Seed user created.");

    const rows = await loadCsv(datasetPath);
    console.log(`Dataset loaded: ${rows.length} rows`);

    const customers = new Map();
    const products = new Map();
    const validSalesRows = [];

    rows.forEach((row, index) => {
        const customerCode = sanitize(row.CustomerID);
        const productCode = sanitize(row.ProductID);
        const quantity = Number(sanitize(row.Quantity));
        const price = Number(sanitize(row.Price));
        const transactionDate = parseDate(row.TransactionDate);

        if (!customerCode || !productCode || isNaN(quantity) || quantity <= 0 || isNaN(price) || price < 0 || !transactionDate) {
            return;
        }

        if (!customers.has(customerCode)) {
            customers.set(customerCode, {
                customerCode,
                name: `Customer ${customerCode}`,
                email: `customer${customerCode}@example.com`,
                phone: `+1${customerCode.padStart(10, "0")}`,
                address: `Retail District ${customerCode}`
            });
        }

        if (!products.has(productCode)) {
            products.set(productCode, {
                productCode,
                name: `${sanitize(row.ProductCategory) || "Product"} ${productCode}`,
                category: sanitize(row.ProductCategory) || "General",
                price: Number.isFinite(price) ? price : 0.0
            });
        }

        validSalesRows.push({
            customerCode,
            productCode,
            quantity,
            price,
            transactionDate,
            totalAmount: Number(sanitize(row.TotalAmount)) || quantity * price,
            line: index + 2
        });
    });

    console.log(`Valid rows: ${validSalesRows.length}`);
    console.log(`Unique customers: ${customers.size}`);
    console.log(`Unique products: ${products.size}`);

    await prisma.customer.createMany({
        data: Array.from(customers.values()),
        skipDuplicates: true
    });

    await prisma.product.createMany({
        data: Array.from(products.values()),
        skipDuplicates: true
    });

    console.log("Customers and products inserted.");

    const allProducts = await prisma.product.findMany();
    const inventoryData = allProducts.map((product) => ({
        productId: product.id,
        quantity: 150
    }));

    await prisma.inventory.createMany({
        data: inventoryData,
        skipDuplicates: true
    });

    console.log("Inventory inserted.");

    const allCustomers = await prisma.customer.findMany();
    const customerMap = new Map(allCustomers.map((customer) => [customer.customerCode, customer.id]));
    const productMap = new Map(allProducts.map((product) => [product.productCode, product.id]));

    const salesData = validSalesRows.map((item, index) => ({
        invoiceNo: `INV-${item.customerCode}-${item.productCode}-${index + 1}`,
        customerId: customerMap.get(item.customerCode),
        productId: productMap.get(item.productCode),
        userId: adminUser.id,
        quantity: item.quantity,
        totalAmount: item.totalAmount,
        transactionDate: item.transactionDate
    })).filter((sale) => sale.customerId && sale.productId);

    await prisma.salesTransaction.createMany({
        data: salesData,
        skipDuplicates: true
    });

    console.log(`Sales transactions inserted: ${salesData.length}`);
}

main()
    .then(async () => {
        console.log("✅ Database Seed Completed");
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });