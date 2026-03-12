const express = require('express');
const { register, login, getMe, updateLocation, updateVehicle } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/profile/location', authenticate, updateLocation);
router.patch('/profile/vehicle', authenticate, updateVehicle);

module.exports = router;
