const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting Database Seeding...");

    // Delete old data
    await prisma.salesTransaction.deleteMany();
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();

    console.log("Old data deleted.");

    // Roles
    const owner = await prisma.role.create({
        data: { name: "Business Owner" }
    });

    const manager = await prisma.role.create({
        data: { name: "Store Manager" }
    });

    const executive = await prisma.role.create({
        data: { name: "Sales Executive" }
    });

    const admin = await prisma.role.create({
        data: { name: "System Administrator" }
    });

    console.log("Roles inserted.");

    const password = await bcrypt.hash("password123", 10);

    await prisma.user.createMany({
        data: [
            {
                name: "Business Owner",
                email: "owner@test.com",
                password,
                roleId: owner.id
            },
            {
                name: "Store Manager",
                email: "manager@test.com",
                password,
                roleId: manager.id
            },
            {
                name: "Sales Executive",
                email: "sales@test.com",
                password,
                roleId: executive.id
            },
            {
                name: "System Admin",
                email: "admin@test.com",
                password,
                roleId: admin.id
            }
        ]
    });

    console.log("Users inserted.");
    // ----------------------
// Customers
// ----------------------

const customers = [];

for (let i = 0; i < 50; i++) {
    customers.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress()
    });
}

await prisma.customer.createMany({
    data: customers
});

console.log("50 Customers inserted.");
// ----------------------
// Products
// ----------------------

const products = [];

for (let i = 0; i < 30; i++) {
    products.push({
        name: faker.commerce.productName(),
        category: faker.commerce.department(),
        price: Number(faker.commerce.price({ min: 100, max: 5000 }))
    });
}

await prisma.product.createMany({
    data: products
});

console.log("30 Products inserted.");


// ----------------------
// Inventory
// ----------------------

const allProducts = await prisma.product.findMany();

for (const product of allProducts) {
    await prisma.inventory.create({
        data: {
            productId: product.id,
            quantity: faker.number.int({ min: 10, max: 500 })
        }
    });
}

console.log("Inventory inserted.");
// ----------------------
// Sales Transactions
// ----------------------

const customerList = await prisma.customer.findMany();
const productList = await prisma.product.findMany();
const userList = await prisma.user.findMany();

const sales = [];

for (let i = 0; i < 200; i++) {

    const customer = customerList[Math.floor(Math.random() * customerList.length)];

const product = productList[Math.floor(Math.random() * productList.length)];

const user = userList[Math.floor(Math.random() * userList.length)];

    const quantity = faker.number.int({ min: 1, max: 10 });

    sales.push({
        customerId: customer.id,
        productId: product.id,
        userId: user.id,
        quantity,
        totalAmount: quantity * product.price,
        saleDate: faker.date.recent({ days: 90 })
    });
}

await prisma.salesTransaction.createMany({
    data: sales
});

console.log("200 Sales Transactions inserted.");
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