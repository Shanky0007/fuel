const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Assign region to an operator
 */
exports.assignOperatorRegion = async (req, res) => {
  try {
    const { operatorId, region } = req.body;

    if (!operatorId || !region) {
      return res.status(400).json({ error: 'Operator ID and region are required' });
    }

    // Verify the user is an operator
    const operator = await prisma.user.findUnique({
      where: { id: operatorId },
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    if (operator.role !== 'OPERATOR') {
      return res.status(400).json({ error: 'User is not an operator' });
    }

    // Update operator's assigned region
    const updatedOperator = await prisma.user.update({
      where: { id: operatorId },
      data: { assignedRegion: region },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedRegion: true,
        country: true,
        region: true,
      },
    });

    res.json({
      message: 'Operator region assigned successfully',
      operator: updatedOperator,
    });
  } catch (error) {
    console.error('Error assigning operator region:', error);
    res.status(500).json({ error: 'Failed to assign operator region' });
  }
};

/**
 * Get all operators
 */
exports.getOperators = async (req, res) => {
  try {
    const operators = await prisma.user.findMany({
      where: { role: 'OPERATOR' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        region: true,
        city: true,
        assignedRegion: true,
        assignedStationId: true,
        assignedStation: {
          select: {
            id: true,
            name: true,
            location: true,
            city: true,
            region: true,
          }
        },
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(operators);
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ error: 'Failed to fetch operators' });
  }
};

/**
 * Get dashboard analytics filtered by region
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { country, region } = req.query;

    let whereClause = {};
    if (country) {
      whereClause.country = country;
    }
    if (region) {
      whereClause.region = region;
    }

    // Get station count
    const stationCount = await prisma.station.count({
      where: whereClause,
    });

    // Get queue statistics
    const totalQueues = await prisma.queue.count({
      where: {
        station: whereClause,
      },
    });

    const completedQueues = await prisma.queue.count({
      where: {
        station: whereClause,
        status: 'COMPLETED',
      },
    });

    const activeQueues = await prisma.queue.count({
      where: {
        station: whereClause,
        status: {
          in: ['WAITING', 'SERVING'],
        },
      },
    });

    // Get stations with queue counts
    const stations = await prisma.station.findMany({
      where: whereClause,
      include: {
        queues: {
          where: {
            status: {
              in: ['WAITING', 'SERVING'],
            },
          },
        },
      },
    });

    const stationsWithCounts = stations.map((station) => ({
      id: station.id,
      name: station.name,
      location: station.location,
      country: station.country,
      region: station.region,
      latitude: station.latitude,
      longitude: station.longitude,
      status: station.status,
      activeQueues: station.queues.length,
    }));

    res.json({
      summary: {
        totalStations: stationCount,
        totalQueues,
        completedQueues,
        activeQueues,
      },
      stations: stationsWithCounts,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

/**
 * Create a new station
 */
exports.createStation = async (req, res) => {
  try {
    const { name, location, latitude, longitude, country, region, city, totalPumps, fuelTypes } = req.body;

    if (!name || !location || !country || !region) {
      return res.status(400).json({ error: 'Name, location, country, and region are required' });
    }

    // Create station with fuel inventory
    const station = await prisma.station.create({
      data: {
        name,
        location,
        latitude: latitude || 0,
        longitude: longitude || 0,
        country,
        region,
        city: city || null,
        totalPumps: totalPumps || 4,
        status: 'OPEN',
        inventory: fuelTypes && fuelTypes.length > 0 ? {
          create: fuelTypes.map(fuelTypeId => ({
            fuelTypeId,
            isAvailable: true,
          })),
        } : undefined,
      },
      include: {
        inventory: {
          include: {
            fuelType: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Station created successfully',
      station,
    });
  } catch (error) {
    console.error('Error creating station:', error);
    res.status(500).json({ error: 'Failed to create station' });
  }
};

/**
 * Update a station
 */
exports.updateStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, latitude, longitude, country, region, city, totalPumps, status } = req.body;

    const station = await prisma.station.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(country && { country }),
        ...(region && { region }),
        ...(city && { city }),
        ...(totalPumps && { totalPumps }),
        ...(status && { status }),
      },
      include: {
        inventory: {
          include: {
            fuelType: true,
          },
        },
      },
    });

    res.json({
      message: 'Station updated successfully',
      station,
    });
  } catch (error) {
    console.error('Error updating station:', error);
    res.status(500).json({ error: 'Failed to update station' });
  }
};

/**
 * Delete a station
 */
exports.deleteStation = async (req, res) => {
  try {
    const { id } = req.params;

    // First delete related records
    await prisma.stationFuelInventory.deleteMany({
      where: { stationId: id },
    });

    // Delete queues and their tickets
    const queues = await prisma.queue.findMany({
      where: { stationId: id },
      select: { id: true },
    });

    for (const queue of queues) {
      await prisma.ticket.deleteMany({
        where: { queueId: queue.id },
      });
    }

    await prisma.queue.deleteMany({
      where: { stationId: id },
    });

    // Finally delete the station
    await prisma.station.delete({
      where: { id },
    });

    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    console.error('Error deleting station:', error);
    res.status(500).json({ error: 'Failed to delete station' });
  }
};

/**
 * Create an operator account
 */
const bcrypt = require('bcryptjs');

exports.createOperator = async (req, res) => {
  try {
    const { name, email, password, phone, country, region, city, assignedRegion, assignedStationId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!assignedStationId) {
      return res.status(400).json({ error: 'Operator must be assigned to a specific station' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const operator = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'OPERATOR',
        country: country || null,
        region: region || null,
        city: city || null,
        assignedRegion: assignedRegion || null,
        assignedStationId: assignedStationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        country: true,
        region: true,
        city: true,
        assignedRegion: true,
        assignedStationId: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'Operator created successfully',
      operator,
    });
  } catch (error) {
    console.error('Error creating operator:', error);
    res.status(500).json({ error: 'Failed to create operator' });
  }
};

/**
 * Delete an operator
 */
exports.deleteOperator = async (req, res) => {
  try {
    const { id } = req.params;

    const operator = await prisma.user.findUnique({
      where: { id },
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    if (operator.role !== 'OPERATOR') {
      return res.status(400).json({ error: 'User is not an operator' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Error deleting operator:', error);
    res.status(500).json({ error: 'Failed to delete operator' });
  }
};

/**
 * Get all fuel types
 */
exports.getFuelTypes = async (req, res) => {
  try {
    const fuelTypes = await prisma.fuelType.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(fuelTypes);
  } catch (error) {
    console.error('Error fetching fuel types:', error);
    res.status(500).json({ error: 'Failed to fetch fuel types' });
  }
};

/**
 * Get all countries and regions
 */
exports.getLocations = async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      include: {
        regions: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(countries);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

exports.getLiveQueues = async (req, res) => {
  try {
    const queues = await prisma.queue.findMany({
      where: { status: { in: ['WAITING', 'SERVING'] } },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        vehicle: { include: { fuelType: true } },
        station: { select: { id: true, name: true, city: true, region: true, country: true } },
        ticket: { select: { verificationCode: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    res.json(queues);
  } catch (error) {
    console.error('Error fetching live queues:', error);
    res.status(500).json({ error: 'Failed to fetch live queues' });
  }
};

