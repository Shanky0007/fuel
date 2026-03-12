const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper: Calculate fuel quota info for a vehicle
const calculateFuelQuotaInfo = async (vehicle) => {
    const fuelQuota = await prisma.fuelQuota.findUnique({
        where: { vehicleType: vehicle.type },
    });

    if (!fuelQuota) {
        return {
            weeklyLimit: null,
            consumedThisWeek: 0,
            remaining: null,
            registrationNumber: vehicle.registrationNumber,
            vehicleType: vehicle.type,
        };
    }

    // Calculate current week's start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // Get total fuel consumed this week for this vehicle (by registration number)
    const weeklyPurchases = await prisma.fuelPurchase.findMany({
        where: {
            registrationNumber: vehicle.registrationNumber,
            purchaseDate: {
                gte: weekStart,
            },
        },
    });

    const consumedThisWeek = weeklyPurchases.reduce((sum, p) => sum + p.fuelAmount, 0);
    const remaining = Math.max(0, fuelQuota.weeklyLimit - consumedThisWeek);

    return {
        weeklyLimit: fuelQuota.weeklyLimit,
        consumedThisWeek: Math.round(consumedThisWeek * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        registrationNumber: vehicle.registrationNumber,
        vehicleType: vehicle.type,
    };
};

// Verify Ticket (Operator scans QR or enters verification code)
const verifyTicket = async (req, res) => {
    try {
        const { qrCodeData, verificationCode } = req.body;

        let ticket;

        // Check if verification code is provided (manual verification)
        if (verificationCode) {
            // Find ticket by verification code
            ticket = await prisma.ticket.findUnique({
                where: { verificationCode: verificationCode.toUpperCase() },
                include: {
                    queue: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                            vehicle: true,
                            station: true,
                        },
                    },
                },
            });

            if (!ticket) {
                return res.status(404).json({ error: 'Invalid verification code' });
            }
        } else if (qrCodeData) {
            // Parse QR data
            let parsedData;
            try {
                parsedData = JSON.parse(qrCodeData);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid QR code format' });
            }

            const { queueId } = parsedData;

            // Find ticket by queueId
            ticket = await prisma.ticket.findFirst({
                where: { queueId },
                include: {
                    queue: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                            vehicle: true,
                            station: true,
                        },
                    },
                },
            });

            if (!ticket) {
                return res.status(404).json({ error: 'Ticket not found' });
            }
        } else {
            return res.status(400).json({ error: 'Please provide QR code data or verification code' });
        }

        if (ticket.status === 'USED') {
            return res.status(400).json({ error: 'Ticket already used' });
        }

        if (ticket.status === 'EXPIRED') {
            return res.status(400).json({ error: 'Ticket has expired' });
        }

        if (ticket.queue.status === 'COMPLETED' || ticket.queue.status === 'CANCELLED') {
            return res.status(400).json({ error: 'Queue entry is no longer active' });
        }

        // ✅ Check if this person is first in line (FIFO enforcement)
        const currentPosition = await prisma.queue.count({
            where: {
                stationId: ticket.queue.stationId,
                status: 'WAITING',
                joinedAt: { lte: ticket.queue.joinedAt },
            },
        });

        if (currentPosition > 1) {
            return res.status(403).json({
                error: `You are currently at position ${currentPosition}. Please wait for your turn.`,
                code: 'NOT_FIRST_IN_LINE',
                position: currentPosition,
                message: 'Only the person at position 1 can be served. Please wait until it\'s your turn.'
            });
        }

        // Update ticket status to SCANNED
        await prisma.ticket.update({
            where: { id: ticket.id },
            data: { status: 'SCANNED' },
        });

        // Update queue status to SERVING
        await prisma.queue.update({
            where: { id: ticket.queue.id },
            data: { status: 'SERVING' },
        });

        // ✅ Calculate and return fuel quota info automatically
        const fuelQuotaInfo = await calculateFuelQuotaInfo(ticket.queue.vehicle);

        res.json({
            message: 'Ticket verified successfully',
            ticket,
            queue: ticket.queue,
            fuelQuotaInfo,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Complete Service (Operator marks as done)
const completeService = async (req, res) => {
    try {
        const { queueId, fuelAmount } = req.body;

        const queue = await prisma.queue.findUnique({
            where: { id: queueId },
            include: {
                vehicle: true,
                station: true,
            },
        });

        if (!queue) {
            return res.status(404).json({ error: 'Queue entry not found' });
        }

        // Default fuel amount if not provided (assume full tank based on vehicle type)
        const defaultFuelAmounts = {
            'Car': 40,
            'Motorcycle': 15,
            'Truck': 150,
            'Bus': 200,
        };

        const actualFuelAmount = fuelAmount || queue.fuelAmount || defaultFuelAmounts[queue.vehicle.type] || 40;

        // ✅ Validate fuel amount against remaining weekly quota
        const fuelQuotaInfo = await calculateFuelQuotaInfo(queue.vehicle);

        if (fuelQuotaInfo.weeklyLimit !== null) {
            if (fuelQuotaInfo.remaining <= 0) {
                return res.status(403).json({
                    error: `This vehicle (${queue.vehicle.registrationNumber}) has already exhausted its weekly fuel quota of ${fuelQuotaInfo.weeklyLimit}L. Consumed: ${fuelQuotaInfo.consumedThisWeek}L.`,
                    code: 'QUOTA_EXHAUSTED',
                    fuelQuotaInfo,
                });
            }

            if (actualFuelAmount > fuelQuotaInfo.remaining) {
                return res.status(403).json({
                    error: `Cannot dispense ${actualFuelAmount}L. This vehicle only has ${fuelQuotaInfo.remaining}L remaining in its weekly quota (${fuelQuotaInfo.consumedThisWeek}L / ${fuelQuotaInfo.weeklyLimit}L used).`,
                    code: 'QUOTA_EXCEEDED',
                    fuelQuotaInfo,
                    maxAllowed: fuelQuotaInfo.remaining,
                });
            }
        }

        // Update queue to COMPLETED with fuel amount
        await prisma.queue.update({
            where: { id: queueId },
            data: {
                status: 'COMPLETED',
                fuelAmount: actualFuelAmount,
            },
        });

        // Update ticket to USED
        await prisma.ticket.updateMany({
            where: { queueId },
            data: { status: 'USED' },
        });

        // ✅ Record fuel purchase for quota tracking
        await prisma.fuelPurchase.create({
            data: {
                vehicleId: queue.vehicleId,
                registrationNumber: queue.vehicle.registrationNumber,
                vehicleType: queue.vehicle.type,
                fuelAmount: actualFuelAmount,
                stationId: queue.stationId,
                queueId: queue.id,
            },
        });

        // Return updated quota info after purchase
        const updatedQuotaInfo = await calculateFuelQuotaInfo(queue.vehicle);

        res.json({
            message: 'Service completed successfully',
            fuelAmount: actualFuelAmount,
            fuelQuotaInfo: updatedQuotaInfo,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { verifyTicket, completeService };
