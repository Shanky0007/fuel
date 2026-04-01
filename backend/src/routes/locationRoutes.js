const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// GET /api/locations/countries - Get all countries
router.get('/countries', locationController.getCountries);

// GET /api/locations/countries/:countryId - Get a specific country
router.get('/countries/:countryId', locationController.getCountryById);

// GET /api/locations/countries/:countryId/regions - Get regions for a country
router.get('/countries/:countryId/regions', locationController.getRegionsByCountry);

// GET /api/locations/regions/:regionId/cities - Get cities for a region
router.get('/regions/:regionId/cities', locationController.getCitiesByRegion);

// POST /api/locations/validate - Validate country and region combination
router.post('/validate', locationController.validateLocation);

module.exports = router;
