const locationService = require('../services/locationService');

/**
 * Get all countries
 */
exports.getCountries = async (req, res) => {
  try {
    const countries = await locationService.getCountries();
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
};

/**
 * Get regions for a specific country
 */
exports.getRegionsByCountry = async (req, res) => {
  try {
    const { countryId } = req.params;
    
    if (!countryId) {
      return res.status(400).json({ error: 'Country ID is required' });
    }

    const regions = await locationService.getRegionsByCountry(countryId);
    res.json(regions);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Failed to fetch regions' });
  }
};

/**
 * Get a specific country by ID
 */
exports.getCountryById = async (req, res) => {
  try {
    const { countryId } = req.params;
    
    const country = await locationService.getCountryById(countryId);
    
    if (!country) {
      return res.status(404).json({ error: 'Country not found' });
    }
    
    res.json(country);
  } catch (error) {
    console.error('Error fetching country:', error);
    res.status(500).json({ error: 'Failed to fetch country' });
  }
};

/**
 * Validate country and region combination
 */
exports.validateLocation = async (req, res) => {
  try {
    const { country, region } = req.body;
    
    if (!country || !region) {
      return res.status(400).json({ 
        error: 'Country and region are required',
        valid: false 
      });
    }

    const result = await locationService.validateLocation(country, region);
    
    if (!result.valid) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error validating location:', error);
    res.status(500).json({ error: 'Failed to validate location', valid: false });
  }
};
