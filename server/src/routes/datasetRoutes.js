const express = require('express');
const {
  getDatasets,
  getDatasetById,
  getDatasetSchema,
  getDatasetPreview
} = require('../controllers/datasetController');

const router = express.Router();

router.get('/', getDatasets);
router.get('/:id', getDatasetById);
router.get('/:id/schema', getDatasetSchema);
router.get('/:id/preview', getDatasetPreview);

module.exports = router;
