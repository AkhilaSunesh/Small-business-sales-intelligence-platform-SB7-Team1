const { PrismaClient } = require("@prisma/client");

// Singleton pattern — prevents exhausting DB connections in dev with hot-reload
const prisma = global._prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    global._prisma = prisma;
}

module.exports = prisma;
