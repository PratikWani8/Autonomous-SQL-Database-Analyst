const express = require('express');
const {
  executeQuery,
  getQueryHistory,
  getQueryHistoryById,
  rerunQuery,
  deleteQueryHistory
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { queryLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/query', protect, queryLimiter, executeQuery);
router.get('/history', protect, getQueryHistory);
router.get('/history/:id', protect, getQueryHistoryById);
router.post('/history/:id/rerun', protect, rerunQuery);
router.delete('/history/:id', protect, deleteQueryHistory);

module.exports = router;
