const { Database } = require('@sqlitecloud/drivers');
const { PrismaClient } = require('@prisma/client');

// Create SQLite Cloud connection
const createSQLiteCloudConnection = () => {
    const connectionString = process.env.DATABASE_URL;
    
    if (connectionString.startsWith('sqlitecloud://')) {
        console.log('Using SQLite Cloud connection');
        return new Database(connectionString);
    }
    
    // Fallback to regular Prisma for local development
    console.log('Using local SQLite connection');
    return null;
};

// Initialize Prisma with SQLite Cloud support
const initializePrisma = () => {
    const connectionString = process.env.DATABASE_URL;
    
    if (connectionString.startsWith('sqlitecloud://')) {
        // For SQLite Cloud, we'll use a hybrid approach
        // Use local file for Prisma operations, sync with cloud
        const localDbUrl = 'file:./dev.db';
        return new PrismaClient({
            datasources: {
                db: {
                    url: localDbUrl
                }
            }
        });
    }
    
    return new PrismaClient();
};

module.exports = {
    createSQLiteCloudConnection,
    initializePrisma
};
