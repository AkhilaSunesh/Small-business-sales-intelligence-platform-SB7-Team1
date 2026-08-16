require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Invoices count:', invoices.length);
  invoices.forEach(i => console.log(i.invoiceNumber, i.createdAt));
}

main().catch(console.error).finally(() => prisma.$disconnect());
