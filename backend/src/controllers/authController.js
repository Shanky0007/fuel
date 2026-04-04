const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetEmail } = require('../services/emailService');

const prisma = new PrismaClient();

const register = async (req, res) => {
    try {
        const { name, email, password, phone, role, country, region, city, vehicleType, fuelType, registrationNumber } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        // Validate location data
        if (!country || !region) {
            return res.status(400).json({ error: 'Country and region are required' });
        }

        if (!city) {
            return res.status(400).json({ error: 'City is required' });
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

        // Normalize registration number
        const normalizedRegNumber = registrationNumber.toUpperCase().trim().replace(/\s+/g, '');

        // Check if vehicle with this registration number already exists
        const existingVehicle = await prisma.vehicle.findFirst({
            where: { registrationNumber: normalizedRegNumber }
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
                city,
                vehicleType,
                fuelType,
                vehicles: {
                    create: {
                        licensePlate: normalizedRegNumber, // Use registration number as license plate
                        registrationNumber: normalizedRegNumber, // OFFICIAL ID for quota tracking
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
                city: user.city,
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
                city: true,
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
                city: true,
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

const updateProfile = async (req, res) => {
    try {
        const { name, phone, country, region, city } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (!country || !region || !city) {
            return res.status(400).json({ error: 'Country, region, and city are required' });
        }

        const user = await prisma.user.update({
            where: { id: req.user.userId },
            data: {
                name,
                phone: phone || null,
                country,
                region,
                city,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                country: true,
                region: true,
                city: true,
                vehicleType: true,
                fuelType: true,
                createdAt: true
            },
        });

        res.json({
            message: 'Profile updated successfully',
            user,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken,
                resetPasswordExpires,
            },
        });

        // Send email
        try {
            await sendPasswordResetEmail(user.email, resetToken);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            return res.status(500).json({ error: 'Failed to send password reset email. Please try again later.' });
        }

        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Hash the token to compare with database
        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken,
                resetPasswordExpires: {
                    gt: new Date(), // Token not expired
                },
            },
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getMyStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [completedQueues, totalFuel, stationIds] = await Promise.all([
            prisma.queue.count({ where: { userId, status: 'COMPLETED' } }),
            prisma.queue.aggregate({ where: { userId, status: 'COMPLETED' }, _sum: { fuelAmount: true } }),
            prisma.queue.findMany({ where: { userId, status: 'COMPLETED' }, select: { stationId: true }, distinct: ['stationId'] }),
        ]);

        res.json({
            totalVisits: completedQueues,
            stationsVisited: stationIds.length,
            totalFuel: Math.round((totalFuel._sum.fuelAmount || 0) * 10) / 10,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login, getMe, getMyStats, updateLocation, updateVehicle, updateProfile, forgotPassword, resetPassword };
