const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const maxDate = await prisma.salesTransaction.aggregate({
        _max: { transactionDate: true }
    });
    console.log('Max Date:', maxDate._max.transactionDate);
}

main().finally(() => prisma.$disconnect());
