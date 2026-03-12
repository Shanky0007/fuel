const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class OperatorService {
  /**
   * Get queues for operator's assigned region
   * @param {string} operatorId - The operator's user ID
   * @returns {Promise<Array>} List of queues in operator's region
   */
  async getRegionalQueues(operatorId) {
    try {
      // Get operator with assigned region
      const operator = await prisma.user.findUnique({
        where: { id: operatorId },
        select: {
          assignedRegion: true,
          country: true,
        },
      });

      if (!operator || !operator.assignedRegion) {
        throw new Error('Operator region not assigned');
      }

      // Get queues from stations in operator's region
      const queues = await prisma.queue.findMany({
        where: {
          station: {
            country: operator.country,
            region: operator.assignedRegion,
          },
          status: {
            in: ['WAITING', 'SERVING'],
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              country: true,
              region: true,
              vehicleType: true,
              fuelType: true,
            },
          },
          vehicle: true,
          station: {
            select: {
              id: true,
              name: true,
              location: true,
              country: true,
              region: true,
            },
          },
          ticket: true,
        },
        orderBy: {
          joinedAt: 'asc',
        },
      });

      // ✅ Attach fuel quota info for each queue entry
      const queuesWithQuota = await Promise.all(
        queues.map(async (queue) => {
          if (!queue.vehicle) return queue;

          const fuelQuota = await prisma.fuelQuota.findUnique({
            where: { vehicleType: queue.vehicle.type },
          });

          if (!fuelQuota) {
            return { ...queue, fuelQuotaInfo: null };
          }

          // Calculate current week's start (Monday)
          const now = new Date();
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          const weekStart = new Date(new Date().setDate(diff));
          weekStart.setHours(0, 0, 0, 0);

          const weeklyPurchases = await prisma.fuelPurchase.findMany({
            where: {
              registrationNumber: queue.vehicle.registrationNumber,
              purchaseDate: { gte: weekStart },
            },
          });

          const consumedThisWeek = weeklyPurchases.reduce((sum, p) => sum + p.fuelAmount, 0);
          const remaining = Math.max(0, fuelQuota.weeklyLimit - consumedThisWeek);

          return {
            ...queue,
            fuelQuotaInfo: {
              weeklyLimit: fuelQuota.weeklyLimit,
              consumedThisWeek: Math.round(consumedThisWeek * 100) / 100,
              remaining: Math.round(remaining * 100) / 100,
            },
          };
        })
      );

      return queuesWithQuota;
    } catch (error) {
      throw new Error(`Failed to fetch regional queues: ${error.message}`);
    }
  }

  /**
   * Get stations in operator's assigned region
   * @param {string} operatorId - The operator's user ID
   * @returns {Promise<Array>} List of stations in operator's region
   */
  async getRegionalStations(operatorId) {
    try {
      const operator = await prisma.user.findUnique({
        where: { id: operatorId },
        select: {
          assignedRegion: true,
          country: true,
        },
      });

      if (!operator || !operator.assignedRegion) {
        throw new Error('Operator region not assigned');
      }

      const stations = await prisma.station.findMany({
        where: {
          country: operator.country,
          region: operator.assignedRegion,
        },
        include: {
          inventory: {
            include: {
              fuelType: true,
            },
          },
        },
      });

      return stations;
    } catch (error) {
      throw new Error(`Failed to fetch regional stations: ${error.message}`);
    }
  }

  /**
   * Validate if a ticket belongs to operator's region
   * @param {string} operatorId - The operator's user ID
   * @param {string} ticketId - The ticket ID
   * @returns {Promise<boolean>} True if ticket is in operator's region
   */
  async validateTicketRegion(operatorId, ticketId) {
    try {
      const operator = await prisma.user.findUnique({
        where: { id: operatorId },
        select: {
          assignedRegion: true,
          country: true,
        },
      });

      if (!operator || !operator.assignedRegion) {
        return false;
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          queue: {
            include: {
              station: {
                select: {
                  country: true,
                  region: true,
                },
              },
            },
          },
        },
      });

      if (!ticket) {
        return false;
      }

      return (
        ticket.queue.station.country === operator.country &&
        ticket.queue.station.region === operator.assignedRegion
      );
    } catch (error) {
      throw new Error(`Failed to validate ticket region: ${error.message}`);
    }
  }
}

module.exports = new OperatorService();
