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

        // Normalize registration number to uppercase and remove spaces
        const normalizedRegNumber = registrationNumber.toUpperCase().trim().replace(/\s+/g, '');
        const normalizedLicensePlate = licensePlate ? licensePlate.toUpperCase().trim().replace(/\s+/g, '') : normalizedRegNumber;

        // Check if license plate already exists (only if different from registration number)
        if (licensePlate && licensePlate !== registrationNumber) {
            const existingPlate = await prisma.vehicle.findUnique({
                where: { licensePlate: normalizedLicensePlate },
            });

            if (existingPlate) {
                return res.status(400).json({ error: 'Vehicle with this license plate already exists' });
            }
        }

        // Check if registration number already exists for THIS user
        const existingReg = await prisma.vehicle.findFirst({
            where: { 
                registrationNumber: normalizedRegNumber,
                userId: userId
            },
        });

        if (existingReg) {
            return res.status(400).json({ error: 'You have already added this vehicle' });
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                userId,
                licensePlate: normalizedLicensePlate,
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
