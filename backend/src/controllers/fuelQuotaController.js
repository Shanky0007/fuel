const prisma = require('../db/turso-client');

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

        // Find the vehicle first
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                registrationNumber: registrationNumber.toUpperCase(),
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        // Get the quota for this vehicle type
        const quota = await prisma.fuelQuota.findUnique({
            where: { vehicleType: vehicle.type },
        });

        if (!quota) {
            return res.status(404).json({ error: 'No quota found for this vehicle type' });
        }

        // Get current week's start (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(now.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);

        // Get this week's fuel purchases
        const purchases = await prisma.fuelPurchase.findMany({
            where: {
                registrationNumber: registrationNumber.toUpperCase(),
                purchaseDate: {
                    gte: weekStart,
                },
            },
            orderBy: {
                purchaseDate: 'desc',
            },
        });

        const weeklyConsumption = purchases.reduce((sum, p) => sum + p.fuelAmount, 0);
        const remaining = Math.max(0, quota.weeklyLimit - weeklyConsumption);
        const canRefuel = remaining > 0;

        res.json({
            registrationNumber: vehicle.registrationNumber,
            vehicleType: vehicle.type,
            licensePlate: vehicle.licensePlate,
            owner: vehicle.user.name,
            weeklyLimit: quota.weeklyLimit,
            weeklyConsumption: parseFloat(weeklyConsumption.toFixed(2)),
            remaining: parseFloat(remaining.toFixed(2)),
            canRefuel,
            weekStart,
            purchases: purchases.map(p => ({
                date: p.purchaseDate,
                amount: p.fuelAmount,
                stationId: p.stationId,
            })),
        });
    } catch (error) {
        console.error('Error fetching vehicle consumption:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllQuotas,
    updateQuota,
    getVehicleConsumption,
};
