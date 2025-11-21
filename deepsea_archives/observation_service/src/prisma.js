const { PrismaClient } = require('./generated/prisma'); // client généré par `prisma generate`
const prisma = new PrismaClient();
module.exports = prisma;