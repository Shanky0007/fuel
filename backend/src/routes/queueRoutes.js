const express = require('express');
const { joinQueue, getMyQueueStatus, cancelQueue } = require('../controllers/queueController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/join', authenticate, joinQueue);
router.get('/status', authenticate, getMyQueueStatus);
router.post('/cancel', authenticate, cancelQueue);

module.exports = router;
