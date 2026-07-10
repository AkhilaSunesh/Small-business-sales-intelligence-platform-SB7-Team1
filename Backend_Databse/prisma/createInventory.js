const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {

    const products = await prisma.product.findMany();

    for (const product of products) {

        await prisma.inventory.create({
            data: {
                quantity: 500,
                productId: product.id
            }
        });

    }

    console.log("Inventory created successfully!");
}

main()
.then(async () => {
    await prisma.$disconnect();
})
.catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
});