const express = require('express');
const { addVehicle, getMyVehicles, deleteVehicle } = require('../controllers/vehicleController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, addVehicle);
router.get('/', authenticate, getMyVehicles);
router.delete('/:id', authenticate, deleteVehicle);

module.exports = router;
