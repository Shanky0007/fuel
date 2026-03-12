const { PrismaClient } = require('@prisma/client');
const stationService = require('../services/stationService');

const prisma = new PrismaClient();

// Get all stations (with optional user filtering)
const getAllStations = async (req, res) => {
    try {
        const { userId } = req.query;

        // If userId provided, get stations filtered by user's location
        if (userId) {
            const stations = await stationService.getStationsByUserLocation(userId);
            return res.json(stations);
        }

        // Otherwise, get all stations (for admin)
        const stations = await stationService.getAllStations();
        res.json(stations);
    } catch (error) {
        console.error('Error fetching stations:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get station by ID
const getStationById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        const station = await stationService.getStationById(id, userId);

        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        // Also get queue information
        const queues = await prisma.queue.findMany({
            where: {
                stationId: id,
                status: {
                    in: ['WAITING', 'SERVING'],
                },
            },
        });

        res.json({
            ...station,
            currentQueueLength: queues.length,
        });
    } catch (error) {
        console.error('Error fetching station:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get queue status for a station
const getStationQueue = async (req, res) => {
    try {
        const { id } = req.params;

        const queues = await prisma.queue.findMany({
            where: {
                stationId: id,
                status: {
                    in: ['WAITING', 'SERVING'],
                },
            },
            include: {
                user: {
                    select: { 
                        id: true, 
                        name: true,
                        country: true,
                        region: true,
                        vehicleType: true,
                        fuelType: true
                    },
                },
                vehicle: true,
                ticket: true,
            },
            orderBy: {
                joinedAt: 'asc',
            },
        });

        res.json({
            stationId: id,
            queueLength: queues.length,
            queues,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getAllStations, getStationById, getStationQueue };
