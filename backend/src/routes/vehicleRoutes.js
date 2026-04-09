const express = require('express');
const { addVehicle, getMyVehicles, deleteVehicle } = require('../controllers/vehicleController');
const { authenticate } = require('../middleware/authMiddleware');
const prisma = require('../db/turso-client');

const router = express.Router();

// Public endpoint to get fuel types (no authentication required)
router.get('/fuel-types', async (req, res) => {
  try {
    const fuelTypes = await prisma.fuelType.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(fuelTypes);
  } catch (error) {
    console.error('Error fetching fuel types:', error);
    res.status(500).json({ error: 'Failed to fetch fuel types' });
  }
});

router.post('/', authenticate, addVehicle);
router.get('/', authenticate, getMyVehicles);
router.delete('/:id', authenticate, deleteVehicle);

module.exports = router;
