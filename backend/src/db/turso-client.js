require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

// Parse DATABASE_URL to extract components
const dbUrl = process.env.DATABASE_URL;
const url = dbUrl.split('?')[0];
const authToken = dbUrl.split('authToken=')[1];

// Create libSQL client
const libsql = createClient({
    url: url,
    authToken: authToken
});

// Create Prisma adapter
const adapter = new PrismaLibSQL(libsql);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
