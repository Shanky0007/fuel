const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// ============ OPERATOR MANAGEMENT ============
// POST /api/admin/operators - Create a new operator
router.post('/operators', authenticate, isAdmin, adminController.createOperator);

// GET /api/admin/operators - Get all operators
router.get('/operators', authenticate, isAdmin, adminController.getOperators);

// POST /api/admin/operators/assign-region - Assign region to operator
router.post('/operators/assign-region', authenticate, isAdmin, adminController.assignOperatorRegion);

// DELETE /api/admin/operators/:id - Delete an operator
router.delete('/operators/:id', authenticate, isAdmin, adminController.deleteOperator);

// ============ STATION MANAGEMENT ============
// POST /api/admin/stations - Create a new station
router.post('/stations', authenticate, isAdmin, adminController.createStation);

// PUT /api/admin/stations/:id - Update a station
router.put('/stations/:id', authenticate, isAdmin, adminController.updateStation);

// DELETE /api/admin/stations/:id - Delete a station
router.delete('/stations/:id', authenticate, isAdmin, adminController.deleteStation);

// ============ ANALYTICS ============
// GET /api/admin/analytics - Get dashboard analytics
router.get('/analytics', authenticate, isAdmin, adminController.getAnalytics);

// ============ LOOKUPS ============
// GET /api/admin/fuel-types - Get all fuel types
router.get('/fuel-types', authenticate, isAdmin, adminController.getFuelTypes);

// GET /api/admin/locations - Get all countries and regions
router.get('/locations', authenticate, isAdmin, adminController.getLocations);

// ============ FUEL QUOTA MANAGEMENT ============
const fuelQuotaController = require('../controllers/fuelQuotaController');

// GET /api/admin/fuel-quotas - Get all fuel quotas
router.get('/fuel-quotas', authenticate, isAdmin, fuelQuotaController.getAllQuotas);

// PUT /api/admin/fuel-quotas - Update fuel quota for a vehicle type
router.put('/fuel-quotas', authenticate, isAdmin, fuelQuotaController.updateQuota);

// GET /api/admin/fuel-consumption/:registrationNumber - Get fuel consumption for a vehicle
router.get('/fuel-consumption/:registrationNumber', authenticate, isAdmin, fuelQuotaController.getVehicleConsumption);

module.exports = router;

