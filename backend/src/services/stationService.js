const { PrismaClient } = require('@prisma/client');
const distanceCalculator = require('./distanceCalculator');
const locationService = require('./locationService');

const prisma = new PrismaClient();

class StationService {
  /**
   * Get stations filtered by user's location with distances
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} List of stations with distances
   */
  async getStationsByUserLocation(userId) {
    try {
      // Get user with location
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          country: true,
          region: true,
        },
      });

      if (!user || !user.country || !user.region) {
        throw new Error('User location not found');
      }

      // Get user's region coordinates
      const userCoords = await locationService.getRegionCoordinatesByName(
        user.country,
        user.region
      );

      // Get stations in the same country and region
      const stations = await prisma.station.findMany({
        where: {
          country: user.country,
          region: user.region,
        },
        include: {
          inventory: {
            include: {
              fuelType: true,
            },
          },
        },
      });

      // Calculate distances and add to station objects
      const stationsWithDistance = stations.map((station) => {
        let distance = null;
        
        if (
          station.latitude &&
          station.longitude &&
          userCoords.latitude &&
          userCoords.longitude
        ) {
          distance = distanceCalculator.calculateDistance(
            userCoords.latitude,
            userCoords.longitude,
            station.latitude,
            station.longitude
          );
        }

        return {
          ...station,
          distance,
        };
      });

      // Sort by distance (stations without coordinates go to the end)
      stationsWithDistance.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      return stationsWithDistance;
    } catch (error) {
      throw new Error(`Failed to fetch stations: ${error.message}`);
    }
  }

  /**
   * Get all stations (for admin)
   * @returns {Promise<Array>} List of all stations
   */
  async getAllStations() {
    try {
      const stations = await prisma.station.findMany({
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
      throw new Error(`Failed to fetch stations: ${error.message}`);
    }
  }

  /**
   * Get a single station by ID
   * @param {string} stationId - The station ID
   * @param {string} userId - Optional user ID for distance calculation
   * @returns {Promise<Object>} Station object
   */
  async getStationById(stationId, userId = null) {
    try {
      const station = await prisma.station.findUnique({
        where: { id: stationId },
        include: {
          inventory: {
            include: {
              fuelType: true,
            },
          },
        },
      });

      if (!station) {
        return null;
      }

      // If userId provided, calculate distance
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            country: true,
            region: true,
          },
        });

        if (user && user.country && user.region) {
          const userCoords = await locationService.getRegionCoordinatesByName(
            user.country,
            user.region
          );

          if (station.latitude && station.longitude) {
            const distance = distanceCalculator.calculateDistance(
              userCoords.latitude,
              userCoords.longitude,
              station.latitude,
              station.longitude
            );
            station.distance = distance;
          }
        }
      }

      return station;
    } catch (error) {
      throw new Error(`Failed to fetch station: ${error.message}`);
    }
  }

  /**
   * Validate if a station belongs to user's region
   * @param {string} userId - The user ID
   * @param {string} stationId - The station ID
   * @returns {Promise<boolean>} True if station is in user's region
   */
  async validateStationAccess(userId, stationId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          country: true,
          region: true,
        },
      });

      const station = await prisma.station.findUnique({
        where: { id: stationId },
        select: {
          country: true,
          region: true,
        },
      });

      if (!user || !station) {
        return false;
      }

      return (
        user.country === station.country && user.region === station.region
      );
    } catch (error) {
      throw new Error(`Failed to validate station access: ${error.message}`);
    }
  }

  /**
   * Get stations by region (for operators)
   * @param {string} country - Country name
   * @param {string} region - Region name
   * @returns {Promise<Array>} List of stations in the region
   */
  async getStationsByRegion(country, region) {
    try {
      const stations = await prisma.station.findMany({
        where: {
          country,
          region,
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
      throw new Error(`Failed to fetch stations by region: ${error.message}`);
    }
  }
}

module.exports = new StationService();
