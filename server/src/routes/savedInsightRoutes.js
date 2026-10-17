const express = require('express');
const {
  getSavedInsights,
  createSavedInsight,
  deleteSavedInsight
} = require('../controllers/savedInsightController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getSavedInsights);
router.post('/', protect, createSavedInsight);
router.delete('/:id', protect, deleteSavedInsight);

module.exports = router;
