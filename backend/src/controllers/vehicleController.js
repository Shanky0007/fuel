const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Add a vehicle
const addVehicle = async (req, res) => {
    try {
        const { licensePlate, registrationNumber, type, fuelTypeId } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!registrationNumber) {
            return res.status(400).json({ error: 'Vehicle registration number is required' });
        }

        // Normalize registration number to uppercase
        const normalizedRegNumber = registrationNumber.toUpperCase().trim();

        // Check if license plate already exists
        const existingPlate = await prisma.vehicle.findUnique({
            where: { licensePlate },
        });

        if (existingPlate) {
            return res.status(400).json({ error: 'Vehicle with this license plate already exists' });
        }

        // Check if registration number already exists
        const existingReg = await prisma.vehicle.findUnique({
            where: { registrationNumber: normalizedRegNumber },
        });

        if (existingReg) {
            return res.status(400).json({ error: 'Vehicle with this registration number already exists' });
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                userId,
                licensePlate,
                registrationNumber: normalizedRegNumber,
                type,
                fuelTypeId,
            },
            include: {
                fuelType: true,
            },
        });

        res.status(201).json({
            message: 'Vehicle added successfully',
            vehicle,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get my vehicles
const getMyVehicles = async (req, res) => {
    try {
        const userId = req.user.userId;

        const vehicles = await prisma.vehicle.findMany({
            where: { userId },
            include: {
                fuelType: true,
            },
        });

        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a vehicle
const deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const vehicle = await prisma.vehicle.findFirst({
            where: { id, userId },
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        await prisma.vehicle.delete({
            where: { id },
        });

        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { addVehicle, getMyVehicles, deleteVehicle };
