const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class OperatorService {
  /**
   * Get queues for operator's assigned station ONLY
   * @param {string} operatorId - The operator's user ID
   * @returns {Promise<Array>} List of queues for operator's assigned station
   */
  async getRegionalQueues(operatorId) {
    try {
      // Get operator with assigned station
      const operator = await prisma.user.findUnique({
        where: { id: operatorId },
        select: {
          assignedStationId: true,
          assignedStation: true,
        },
      });

      if (!operator || !operator.assignedStationId) {
        // Return empty array instead of throwing error - allows login to succeed
        return [];
      }

      // Build where clause - ONLY for assigned station
      let whereClause = {
        stationId: operator.assignedStationId,
        status: {
          in: ['WAITING', 'SERVING'],
        },
      };

      // Get queues from operator's assigned station ONLY
      const queues = await prisma.queue.findMany({
        where: whereClause,
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
              city: true,
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
   * Get operator's assigned station ONLY
   * @param {string} operatorId - The operator's user ID
   * @returns {Promise<Object>} The operator's assigned station
   */
  async getRegionalStations(operatorId) {
    try {
      const operator = await prisma.user.findUnique({
        where: { id: operatorId },
        select: {
          assignedStationId: true,
          assignedStation: {
            include: {
              inventory: {
                include: {
                  fuelType: true,
                },
              },
            },
          },
        },
      });

      if (!operator || !operator.assignedStationId) {
        // Return empty array instead of throwing error - allows login to succeed
        return [];
      }

      // Return only the assigned station as an array for compatibility
      return [operator.assignedStation];
    } catch (error) {
      throw new Error(`Failed to fetch assigned station: ${error.message}`);
    }
  }

  /**
   * Validate if a ticket belongs to operator's assigned station
   * @param {string} operatorId - The operator's user ID
   * @param {string} ticketId - The ticket ID
   * @returns {Promise<boolean>} True if ticket is for operator's assigned station
   */
  async validateTicketRegion(operatorId, ticketId) {
    try {
      const operator = await prisma.user.findUnique({
        where: { id: operatorId },
        select: {
          assignedStationId: true,
        },
      });

      if (!operator || !operator.assignedStationId) {
        return false;
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          queue: {
            select: {
              stationId: true,
            },
          },
        },
      });

      if (!ticket) {
        return false;
      }

      // Operator can only validate tickets for their assigned station
      return ticket.queue.stationId === operator.assignedStationId;
    } catch (error) {
      throw new Error(`Failed to validate ticket: ${error.message}`);
    }
  }
}

module.exports = new OperatorService();
