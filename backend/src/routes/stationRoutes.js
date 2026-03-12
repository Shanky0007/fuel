const express = require('express');
const { getAllStations, getStationById, getStationQueue } = require('../controllers/stationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticate, getAllStations);
router.get('/:id', authenticate, getStationById);
router.get('/:id/queue', authenticate, getStationQueue);

module.exports = router;
