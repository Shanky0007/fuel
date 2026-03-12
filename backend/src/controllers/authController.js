const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

const register = async (req, res) => {
    try {
        const { name, email, password, phone, role, country, region, vehicleType, fuelType, registrationNumber } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Validate location data
        if (!country || !region) {
            return res.status(400).json({ error: 'Country and region are required' });
        }

        // Validate vehicle data
        if (!vehicleType || !fuelType) {
            return res.status(400).json({ error: 'Vehicle type and fuel type are required' });
        }

        // Validate registration number
        if (!registrationNumber) {
            return res.status(400).json({ error: 'Vehicle registration number is required' });
        }

        // Validate vehicleType
        const validVehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Bus'];
        if (!validVehicleTypes.includes(vehicleType)) {
            return res.status(400).json({
                error: 'Invalid vehicle type. Must be one of: Car, Motorcycle, Truck, Bus'
            });
        }

        // Validate fuelType
        const validFuelTypes = ['Petrol', 'Diesel', 'EV', 'CNG'];
        if (!validFuelTypes.includes(fuelType)) {
            return res.status(400).json({
                error: 'Invalid fuel type. Must be one of: Petrol, Diesel, EV, CNG'
            });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check if vehicle with this registration number already exists
        const existingVehicle = await prisma.vehicle.findUnique({
            where: { registrationNumber }
        });

        if (existingVehicle) {
            return res.status(400).json({ error: 'Vehicle with this registration number is already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Find the fuel type ID
        const fuelTypeRecord = await prisma.fuelType.findUnique({
            where: { name: fuelType }
        });

        if (!fuelTypeRecord) {
            return res.status(400).json({ error: 'Invalid fuel type selected' });
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: role || 'CUSTOMER',
                country,
                region,
                vehicleType,
                fuelType,
                vehicles: {
                    create: {
                        licensePlate: registrationNumber, // Use registration number as license plate
                        registrationNumber: registrationNumber, // OFFICIAL ID for quota tracking
                        type: vehicleType,
                        fuelTypeId: fuelTypeRecord.id
                    }
                }
            },

        });

        const token = generateToken(user.id, user.role);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                country: user.country,
                region: user.region,
                vehicleType: user.vehicleType,
                fuelType: user.fuelType
            },
            token,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id, user.role);

        res.json({
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                country: true,
                region: true,
                vehicleType: true,
                fuelType: true,
                assignedRegion: true,
                createdAt: true
            },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateLocation = async (req, res) => {
    try {
        const { country, region } = req.body;

        if (!country || !region) {
            return res.status(400).json({ error: 'Country and region are required' });
        }

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: { country, region },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                country: true,
                region: true,
                vehicleType: true,
                fuelType: true,
                createdAt: true
            },
        });

        res.json({
            message: 'Location updated successfully',
            user,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateVehicle = async (req, res) => {
    try {
        const { vehicleType, fuelType } = req.body;

        if (!vehicleType || !fuelType) {
            return res.status(400).json({ error: 'Vehicle type and fuel type are required' });
        }

        // Validate vehicleType
        const validVehicleTypes = ['Car', 'Motorcycle', 'Truck', 'Bus'];
        if (!validVehicleTypes.includes(vehicleType)) {
            return res.status(400).json({
                error: 'Invalid vehicle type. Must be one of: Car, Motorcycle, Truck, Bus'
            });
        }

        // Validate fuelType
        const validFuelTypes = ['Petrol', 'Diesel', 'EV', 'CNG'];
        if (!validFuelTypes.includes(fuelType)) {
            return res.status(400).json({
                error: 'Invalid fuel type. Must be one of: Petrol, Diesel, EV, CNG'
            });
        }

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: { vehicleType, fuelType },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                country: true,
                region: true,
                vehicleType: true,
                fuelType: true,
                createdAt: true
            },
        });

        res.json({
            message: 'Vehicle information updated successfully',
            user,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login, getMe, updateLocation, updateVehicle };
