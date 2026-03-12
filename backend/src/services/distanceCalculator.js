/**
 * Distance Calculator Service
 * Calculates distances between geographic coordinates using the Haversine formula
 */

class DistanceCalculator {
  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    // Validate inputs
    if (
      !this.isValidCoordinate(lat1, lon1) ||
      !this.isValidCoordinate(lat2, lon2)
    ) {
      return null;
    }

    const R = 6371; // Earth's radius in kilometers
    
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate if coordinates are valid
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {boolean} True if valid, false otherwise
   */
  isValidCoordinate(lat, lon) {
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  }

  /**
   * Format distance to one decimal place in kilometers
   * @param {number} distance - Distance in kilometers
   * @returns {string} Formatted distance string
   */
  formatDistance(distance) {
    if (distance === null || distance === undefined || isNaN(distance)) {
      return 'Distance unavailable';
    }
    
    return `${distance.toFixed(1)} km`;
  }

  /**
   * Calculate and format distance
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {string} Formatted distance string
   */
  calculateAndFormatDistance(lat1, lon1, lat2, lon2) {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return this.formatDistance(distance);
  }

  /**
   * Calculate distance with error handling
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number|null} Distance in kilometers or null if invalid
   */
  safeCalculateDistance(lat1, lon1, lat2, lon2) {
    try {
      return this.calculateDistance(lat1, lon1, lat2, lon2);
    } catch (error) {
      console.error('Error calculating distance:', error);
      return null;
    }
  }
}

module.exports = new DistanceCalculator();
