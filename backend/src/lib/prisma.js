// ============================================
// Shared Prisma Client Instance
// ============================================
// Single PrismaClient instance to prevent connection pool exhaustion
// Import this in all controllers instead of creating new PrismaClient()

const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances during hot-reloading in development
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
