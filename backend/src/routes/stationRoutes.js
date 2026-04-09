const express = require('express');
const { getAllStations, getStationById, getStationQueue } = require('../controllers/stationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes - no authentication required for mobile app to view stations
router.get('/', getAllStations);
router.get('/:id', getAllStations); // Will filter by ID in controller
router.get('/:id/queue', authenticate, getStationQueue); // Queue requires auth

module.exports = router;
