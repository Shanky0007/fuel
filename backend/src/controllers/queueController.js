const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const stationService = require('../services/stationService');

const prisma = new PrismaClient();

// Join Queue
const joinQueue = async (req, res) => {
    try {
        const { stationId, vehicleId } = req.body;
        const userId = req.user.userId;

        // Validate station exists
        const station = await prisma.station.findUnique({ where: { id: stationId } });
        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        // Validate station is in user's region
        const isValidAccess = await stationService.validateStationAccess(userId, stationId);
        if (!isValidAccess) {
            return res.status(403).json({
                error: 'Cannot join queue at stations outside your region',
                code: 'REGION_MISMATCH'
            });
        }

        // Validate vehicle belongs to user
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: vehicleId, userId },
        });
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found or does not belong to you' });
        }

        // ✅ NEW: Check fuel quota - Weekly limit validation
        const fuelQuota = await prisma.fuelQuota.findUnique({
            where: { vehicleType: vehicle.type },
        });

        if (fuelQuota) {
            // Calculate current week's start (Monday)
            const now = new Date();
            const dayOfWeek = now.getDay();
            const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const weekStart = new Date(now.setDate(diff));
            weekStart.setHours(0, 0, 0, 0);

            // Get total fuel consumed this week for this vehicle
            const weeklyPurchases = await prisma.fuelPurchase.findMany({
                where: {
                    registrationNumber: vehicle.registrationNumber,
                    purchaseDate: {
                        gte: weekStart,
                    },
                },
            });

            const totalConsumed = weeklyPurchases.reduce((sum, p) => sum + p.fuelAmount, 0);

            // Check if weekly limit exceeded
            if (totalConsumed >= fuelQuota.weeklyLimit) {
                return res.status(403).json({
                    error: `Weekly fuel limit exceeded for ${vehicle.type}`,
                    code: 'QUOTA_EXCEEDED',
                    details: {
                        vehicleType: vehicle.type,
                        registrationNumber: vehicle.registrationNumber,
                        weeklyLimit: fuelQuota.weeklyLimit,
                        consumed: totalConsumed,
                        remaining: 0,
                        weekStart: weekStart.toISOString(),
                    },
                    message: `Your ${vehicle.type} (${vehicle.registrationNumber}) has reached its weekly fuel limit of ${fuelQuota.weeklyLimit}L. You have consumed ${totalConsumed}L this week. Please try again next week.`,
                });
            }

            // Calculate remaining quota
            const remaining = fuelQuota.weeklyLimit - totalConsumed;
            console.log(`Vehicle ${vehicle.registrationNumber}: ${totalConsumed}L consumed, ${remaining}L remaining this week`);
        }

        // Check if user already has an active queue entry
        const existingQueue = await prisma.queue.findFirst({
            where: {
                userId,
                status: { in: ['WAITING', 'SERVING'] },
            },
            include: {
                station: true,
            },
        });

        if (existingQueue) {
            return res.status(400).json({ 
                error: `You already have an active queue at ${existingQueue.station.name}. Please complete or cancel that queue before joining another.`,
                code: 'ALREADY_IN_QUEUE',
                existingQueueId: existingQueue.id,
                existingStationName: existingQueue.station.name,
            });
        }

        // Get user information for QR code
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                country: true,
                region: true,
                vehicleType: true,
                fuelType: true,
            },
        });

        // Create queue entry
        const queue = await prisma.queue.create({
            data: {
                stationId,
                userId,
                vehicleId,
                status: 'WAITING',
            },
        });

        // Generate QR Code data with location information
        const qrData = JSON.stringify({
            queueId: queue.id,
            stationId,
            stationName: station.name,
            stationCountry: station.country,
            stationRegion: station.region,
            userId,
            userName: user.name,
            userCountry: user.country,
            userRegion: user.region,
            vehicleId,
            vehicleType: user.vehicleType,
            fuelType: user.fuelType,
            timestamp: new Date().toISOString(),
        });

        // Generate a unique 6-character verification code
        const generateVerificationCode = async () => {
            const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar looking chars
            let code;
            let isUnique = false;

            while (!isUnique) {
                code = '';
                for (let i = 0; i < 6; i++) {
                    code += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                // Check if code already exists
                const existingTicket = await prisma.ticket.findUnique({
                    where: { verificationCode: code }
                });
                if (!existingTicket) {
                    isUnique = true;
                }
            }
            return code;
        };

        const verificationCode = await generateVerificationCode();

        // Generate QR Code as Data URL
        const qrCodeDataURL = await QRCode.toDataURL(qrData);

        // Create ticket
        const ticket = await prisma.ticket.create({
            data: {
                queueId: queue.id,
                qrCodeData: qrData,
                verificationCode: verificationCode,
                status: 'ACTIVE',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        // Get queue position
        const position = await prisma.queue.count({
            where: {
                stationId,
                status: 'WAITING',
                joinedAt: { lte: queue.joinedAt },
            },
        });

        res.status(201).json({
            message: 'Successfully joined queue',
            queue,
            ticket: {
                ...ticket,
                qrCodeImage: qrCodeDataURL,
            },
            position,
        });
    } catch (error) {
        console.error('Error joining queue:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get current queue status for logged-in user
const getMyQueueStatus = async (req, res) => {
    try {
        const userId = req.user.userId;

        const queue = await prisma.queue.findFirst({
            where: {
                userId,
                status: { in: ['WAITING', 'SERVING'] },
            },
            include: {
                station: true,
                vehicle: { include: { fuelType: true } },
                ticket: true,
            },
        });

        if (!queue) {
            return res.status(404).json({ error: 'No active queue entry found' });
        }

        // Calculate position
        const position = await prisma.queue.count({
            where: {
                stationId: queue.stationId,
                status: 'WAITING',
                joinedAt: { lte: queue.joinedAt },
            },
        });

        // Generate QR Code image if needed
        let qrCodeImage = null;
        if (queue.ticket) {
            qrCodeImage = await QRCode.toDataURL(queue.ticket.qrCodeData);
        }

        res.json({
            queue,
            position,
            ticket: queue.ticket ? { ...queue.ticket, qrCodeImage } : null,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cancel queue entry
const cancelQueue = async (req, res) => {
    try {
        const userId = req.user.userId;

        const queue = await prisma.queue.findFirst({
            where: {
                userId,
                status: { in: ['WAITING', 'SERVING'] },
            },
        });

        if (!queue) {
            return res.status(404).json({ error: 'No active queue entry found' });
        }

        await prisma.queue.update({
            where: { id: queue.id },
            data: { status: 'CANCELLED' },
        });

        await prisma.ticket.updateMany({
            where: { queueId: queue.id },
            data: { status: 'EXPIRED' },
        });

        res.json({ message: 'Queue entry cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { joinQueue, getMyQueueStatus, cancelQueue };
