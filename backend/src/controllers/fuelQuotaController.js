const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all fuel quotas
const getAllQuotas = async (req, res) => {
    try {
        const quotas = await prisma.fuelQuota.findMany({
            orderBy: { vehicleType: 'asc' },
        });

        res.json(quotas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update fuel quota for a specific vehicle type
const updateQuota = async (req, res) => {
    try {
        const { vehicleType, weeklyLimit } = req.body;

        if (!vehicleType || weeklyLimit === undefined) {
            return res.status(400).json({ error: 'Vehicle type and weekly limit are required' });
        }

        if (weeklyLimit < 0) {
            return res.status(400).json({ error: 'Weekly limit must be a positive number' });
        }

        const quota = await prisma.fuelQuota.upsert({
            where: { vehicleType },
            update: { weeklyLimit: parseFloat(weeklyLimit) },
            create: {
                vehicleType,
                weeklyLimit: parseFloat(weeklyLimit),
            },
        });

        res.json({
            message: 'Fuel quota updated successfully',
            quota,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get fuel consumption for a specific vehicle (by registration number)
const getVehicleConsumption = async (req, res) => {
    try {
        const { registrationNumber } = req.params;

        // Get current week's start (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);

        const purchases = await prisma.fuelPurchase.findMany({
            where: {
                registrationNumber: registrationNumber.toUpperCase(),
                purchaseDate: {
                    gte: weekStart,
                },
            },
            include: {
                vehicle: {
                    select: {
                        type: true,
                        licensePlate: true,
                    },
                },
            },
            orderBy: {
                purchaseDate: 'desc',
            },
        });

        const totalConsumed = purchases.reduce((sum, p) => sum + p.fuelAmount, 0);

        res.json({
            registrationNumber,
            weekStart,
            totalConsumed,
            purchases,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllQuotas,
    updateQuota,
    getVehicleConsumption,
};
