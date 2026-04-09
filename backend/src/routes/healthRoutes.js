const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Basic health check
router.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date(),
        service: 'fuel-backend'
    });
});

// Database ping endpoint - keeps SQLite Cloud alive
router.get('/db-ping', async (req, res) => {
    try {
        // Simple query to keep connection alive
        const userCount = await prisma.user.count();
        const stationCount = await prisma.station.count();
        
        res.status(200).json({ 
            status: 'OK',
            database: 'connected',
            timestamp: new Date(),
            stats: {
                users: userCount,
                stations: stationCount
            }
        });
    } catch (error) {
        console.error('Database ping failed:', error);
        res.status(500).json({ 
            status: 'ERROR',
            database: 'disconnected',
            timestamp: new Date(),
            error: error.message
        });
    }
});

// Detailed health check with all services
router.get('/detailed', async (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date(),
        services: {}
    };

    // Check database
    try {
        await prisma.$queryRaw`SELECT 1`;
        health.services.database = { status: 'OK', message: 'Connected' };
    } catch (error) {
        health.status = 'DEGRADED';
        health.services.database = { status: 'ERROR', message: error.message };
    }

    // Check environment
    health.services.environment = {
        status: 'OK',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
    };

    res.status(health.status === 'OK' ? 200 : 503).json(health);
});

module.exports = router;
