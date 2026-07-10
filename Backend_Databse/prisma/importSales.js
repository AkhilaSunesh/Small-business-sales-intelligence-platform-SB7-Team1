const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const csv = require("csv-parser");

const prisma = new PrismaClient();

const rows = [];

fs.createReadStream("./dataset/Retail_Transaction_Dataset.csv")
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {

        console.log(`CSV Loaded: ${rows.length} rows`);

        // Get admin user
        const admin = await prisma.user.findFirst();

        if (!admin) {
            console.log("No user found.");
            process.exit();
        }

        // Create lookup maps

        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                customerCode: true
            }
        });

        const products = await prisma.product.findMany({
            select: {
                id: true,
                productCode: true
            }
        });

        const customerMap = {};

        customers.forEach(c => {
            customerMap[c.customerCode] = c.id;
        });

        const productMap = {};

        products.forEach(p => {
            productMap[p.productCode] = p.id;
        });

        const sales = [];

        for (const row of rows) {

            const customerId = customerMap[row.CustomerID];
            const productId = productMap[row.ProductID];

            if (!customerId || !productId)
                continue;

            sales.push({

                customerId,

                productId,

                userId: admin.id,

                quantity: Number(row.Quantity),

                totalAmount: Number(row.TotalAmount),

                paymentMethod: row.PaymentMethod,

                storeLocation: row.StoreLocation,

                discountApplied: Number(row["DiscountApplied(%)"]),

                saleDate: new Date(row.TransactionDate)

            });

        }

        console.log("Preparing to insert...");
        console.log(sales.length);

        const batchSize = 1000;

        for (let i = 0; i < sales.length; i += batchSize) {

            const batch = sales.slice(i, i + batchSize);

            await prisma.salesTransaction.createMany({
                data: batch
            });

            console.log(
                `Inserted ${Math.min(i + batchSize, sales.length)} / ${sales.length}`
            );

        }

        console.log("================================");
        console.log("Sales Imported Successfully!");
        console.log("================================");

        await prisma.$disconnect();

    });