const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class LocationService {
  /**
   * Get all countries
   * @returns {Promise<Array>} List of all countries
   */
  async getCountries() {
    try {
      const countries = await prisma.country.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });
      return countries;
    } catch (error) {
      throw new Error(`Failed to fetch countries: ${error.message}`);
    }
  }

  /**
   * Get regions for a specific country
   * @param {string} countryId - The country ID
   * @returns {Promise<Array>} List of regions for the country
   */
  async getRegionsByCountry(countryId) {
    try {
      const regions = await prisma.region.findMany({
        where: { countryId },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          countryId: true,
          latitude: true,
          longitude: true,
        },
      });
      return regions;
    } catch (error) {
      throw new Error(`Failed to fetch regions: ${error.message}`);
    }
  }

  /**
   * Get a specific country by ID
   * @param {string} countryId - The country ID
   * @returns {Promise<Object>} Country object
   */
  async getCountryById(countryId) {
    try {
      const country = await prisma.country.findUnique({
        where: { id: countryId },
        include: { regions: true },
      });
      return country;
    } catch (error) {
      throw new Error(`Failed to fetch country: ${error.message}`);
    }
  }

  /**
   * Get a specific region by ID
   * @param {string} regionId - The region ID
   * @returns {Promise<Object>} Region object
   */
  async getRegionById(regionId) {
    try {
      const region = await prisma.region.findUnique({
        where: { id: regionId },
        include: { country: true },
      });
      return region;
    } catch (error) {
      throw new Error(`Failed to fetch region: ${error.message}`);
    }
  }

  /**
   * Validate country and region combination
   * @param {string} country - Country name
   * @param {string} region - Region name
   * @returns {Promise<Object>} Validation result with valid flag and message
   */
  async validateLocation(country, region) {
    try {
      // Find the country
      const countryRecord = await prisma.country.findFirst({
        where: { name: country },
      });

      if (!countryRecord) {
        return {
          valid: false,
          message: 'The specified country does not exist',
        };
      }

      // Find the region within that country
      const regionRecord = await prisma.region.findFirst({
        where: {
          name: region,
          countryId: countryRecord.id,
        },
      });

      if (!regionRecord) {
        return {
          valid: false,
          message: 'The selected region does not exist in the specified country',
        };
      }

      return {
        valid: true,
        message: 'Location is valid',
        countryId: countryRecord.id,
        regionId: regionRecord.id,
      };
    } catch (error) {
      throw new Error(`Failed to validate location: ${error.message}`);
    }
  }

  /**
   * Get region center coordinates
   * @param {string} regionId - The region ID
   * @returns {Promise<Object>} Coordinates object with latitude and longitude
   */
  async getRegionCoordinates(regionId) {
    try {
      const region = await prisma.region.findUnique({
        where: { id: regionId },
        select: {
          latitude: true,
          longitude: true,
        },
      });

      if (!region) {
        throw new Error('Region not found');
      }

      return {
        latitude: region.latitude,
        longitude: region.longitude,
      };
    } catch (error) {
      throw new Error(`Failed to fetch region coordinates: ${error.message}`);
    }
  }

  /**
   * Get region coordinates by name and country
   * @param {string} country - Country name
   * @param {string} region - Region name
   * @returns {Promise<Object>} Coordinates object with latitude and longitude
   */
  async getRegionCoordinatesByName(country, region) {
    try {
      const countryRecord = await prisma.country.findFirst({
        where: { name: country },
      });

      if (!countryRecord) {
        throw new Error('Country not found');
      }

      const regionRecord = await prisma.region.findFirst({
        where: {
          name: region,
          countryId: countryRecord.id,
        },
      });

      if (!regionRecord) {
        throw new Error('Region not found');
      }

      return {
        latitude: regionRecord.latitude,
        longitude: regionRecord.longitude,
      };
    } catch (error) {
      throw new Error(`Failed to fetch region coordinates: ${error.message}`);
    }
  }
}

module.exports = new LocationService();
