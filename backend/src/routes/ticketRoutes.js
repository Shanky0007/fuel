const express = require('express');
const { verifyTicket, completeService } = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/verify', authenticate, authorize(['OPERATOR', 'ADMIN']), verifyTicket);
router.post('/complete', authenticate, authorize(['OPERATOR', 'ADMIN']), completeService);

module.exports = router;
