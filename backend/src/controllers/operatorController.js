const operatorService = require('../services/operatorService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get queues for operator's region
 */
exports.getRegionalQueues = async (req, res) => {
  try {
    const operatorId = req.user.userId;

    const queues = await operatorService.getRegionalQueues(operatorId);

    res.json(queues);
  } catch (error) {
    console.error('Error fetching regional queues:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get stations in operator's region
 */
exports.getRegionalStations = async (req, res) => {
  try {
    const operatorId = req.user.userId;

    const stations = await operatorService.getRegionalStations(operatorId);

    res.json(stations);
  } catch (error) {
    console.error('Error fetching regional stations:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Scan and validate ticket
 */
exports.scanTicket = async (req, res) => {
  try {
    const operatorId = req.user.userId;
    const { ticketId, qrCodeData } = req.body;

    if (!ticketId && !qrCodeData) {
      return res.status(400).json({ error: 'Ticket ID or QR code data is required' });
    }

    let ticket;
    if (ticketId) {
      ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          queue: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  country: true,
                  region: true,
                  vehicleType: true,
                  fuelType: true,
                },
              },
              vehicle: true,
              station: true,
            },
          },
        },
      });
    } else {
      // Parse QR code data to get ticket info
      try {
        const qrData = JSON.parse(qrCodeData);
        const queue = await prisma.queue.findUnique({
          where: { id: qrData.queueId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                country: true,
                region: true,
                vehicleType: true,
                fuelType: true,
              },
            },
            vehicle: true,
            station: true,
            ticket: true,
          },
        });

        if (queue && queue.ticket) {
          ticket = queue.ticket;
          ticket.queue = queue;
        }
      } catch (parseError) {
        return res.status(400).json({ error: 'Invalid QR code data' });
      }
    }

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Validate ticket is in operator's region
    const isValid = await operatorService.validateTicketRegion(operatorId, ticket.id);

    if (!isValid) {
      return res.status(403).json({
        error: 'Cannot process ticket from different region',
        code: 'REGION_MISMATCH',
      });
    }

    // Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'SCANNED' },
    });

    // Update queue status
    await prisma.queue.update({
      where: { id: ticket.queueId },
      data: { status: 'SERVING' },
    });

    res.json({
      message: 'Ticket scanned successfully',
      ticket: updatedTicket,
      queue: ticket.queue,
    });
  } catch (error) {
    console.error('Error scanning ticket:', error);
    res.status(500).json({ error: 'Failed to scan ticket' });
  }
};

/**
 * Complete service for a queue entry
 */
exports.completeService = async (req, res) => {
  try {
    const { queueId, fuelAmount } = req.body;

    if (!queueId) {
      return res.status(400).json({ error: 'Queue ID is required' });
    }

    if (!fuelAmount) {
      return res.status(400).json({ error: 'Fuel amount is required' });
    }

    // Fetch queue details to get vehicle info
    const existingQueue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { vehicle: true }
    });

    if (!existingQueue) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    // Record Fuel Purchase (Critical for Quota System)
    await prisma.fuelPurchase.create({
      data: {
        vehicleId: existingQueue.vehicleId,
        registrationNumber: existingQueue.vehicle.registrationNumber,
        vehicleType: existingQueue.vehicle.type,
        fuelAmount: parseFloat(fuelAmount),
        stationId: existingQueue.stationId,
        queueId: existingQueue.id
      }
    });

    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: {
        status: 'COMPLETED',
        fuelAmount: parseFloat(fuelAmount)
      },
      include: {
        user: true,
        vehicle: true,
        station: true,
      },
    });

    // Update ticket status
    await prisma.ticket.updateMany({
      where: { queueId },
      data: { status: 'USED' },
    });

    res.json({
      message: 'Service completed successfully',
      queue,
    });
  } catch (error) {
    console.error('Error completing service:', error);
    res.status(500).json({ error: 'Failed to complete service' });
  }
};
