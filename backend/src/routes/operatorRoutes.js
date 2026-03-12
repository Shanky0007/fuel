const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const { authenticate } = require('../middleware/authMiddleware');

// Middleware to check if user is operator
const isOperator = (req, res, next) => {
  if (req.user.role !== 'OPERATOR') {
    return res.status(403).json({ error: 'Access denied. Operator only.' });
  }
  next();
};

// GET /api/operator/queues - Get queues in operator's region
router.get('/queues', authenticate, isOperator, operatorController.getRegionalQueues);

// GET /api/operator/stations - Get stations in operator's region
router.get('/stations', authenticate, isOperator, operatorController.getRegionalStations);

// POST /api/operator/scan-ticket - Scan and validate ticket
router.post('/scan-ticket', authenticate, isOperator, operatorController.scanTicket);

// POST /api/operator/complete-service - Complete service
router.post('/complete-service', authenticate, isOperator, operatorController.completeService);

module.exports = router;
