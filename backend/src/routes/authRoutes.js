const express = require('express');
const { register, login, getMe, updateLocation, updateVehicle, updateProfile, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.patch('/profile/location', authenticate, updateLocation);
router.patch('/profile/vehicle', authenticate, updateVehicle);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
