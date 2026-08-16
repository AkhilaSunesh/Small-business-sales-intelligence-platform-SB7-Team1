require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({ take: 5 });
  console.log('Customers:', customers.map(c => c.customerCode));
  const products = await prisma.product.findMany({ take: 5 });
  console.log('Products:', products.map(p => p.productCode));
}

main().catch(console.error).finally(() => prisma.$disconnect());
