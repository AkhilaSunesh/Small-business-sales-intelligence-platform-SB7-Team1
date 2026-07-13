const { PrismaClient } = require("@prisma/client");

// Singleton — prevents exhausting DB connections on hot-reload
const prisma = global._gatewayPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    global._gatewayPrisma = prisma;
}

module.exports = prisma;