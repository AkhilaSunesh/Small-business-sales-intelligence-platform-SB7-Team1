const { PrismaClient } = require("@prisma/client");
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