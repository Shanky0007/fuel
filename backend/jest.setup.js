// Jest setup file for database cleanup and configuration
const { PrismaClient } = require('@prisma/client');

// Increase timeout for property-based tests
jest.setTimeout(30000);

// Global teardown
afterAll(async () => {
  // Close any open database connections
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});
