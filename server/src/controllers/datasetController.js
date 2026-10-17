const DatasetMetadata = require('../models/DatasetMetadata');
const { previewDatasetTable } = require('../services/aiServiceClient');

// @desc    Get all public datasets
// @route   GET /api/datasets
const getDatasets = async (req, res, next) => {
  try {
    const datasets = await DatasetMetadata.find({ visibility: 'public' })
      .select('datasetId tableName title description license reportingPeriods rowCount sampleQuestions provenance')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: datasets.length,
      data: datasets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dataset by ID or Table Name
// @route   GET /api/datasets/:id
const getDatasetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dataset = await DatasetMetadata.findOne({
      $or: [{ datasetId: id }, { tableName: id }]
    });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: `Dataset not found with identifier '${id}'`
      });
    }

    res.status(200).json({
      success: true,
      data: dataset
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dataset schema details (columns, types, descriptions, units)
// @route   GET /api/datasets/:id/schema
const getDatasetSchema = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dataset = await DatasetMetadata.findOne({
      $or: [{ datasetId: id }, { tableName: id }]
    }).select('datasetId tableName title columns reportingPeriods missingAnalysis');

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: `Dataset not found with identifier '${id}'`
      });
    }

    res.status(200).json({
      success: true,
      tableName: dataset.tableName,
      title: dataset.title,
      reportingPeriods: dataset.reportingPeriods,
      columns: dataset.columns,
      missingAnalysis: dataset.missingAnalysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Preview first 20 rows of dataset
// @route   GET /api/datasets/:id/preview
const getDatasetPreview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dataset = await DatasetMetadata.findOne({
      $or: [{ datasetId: id }, { tableName: id }]
    }).select('tableName title rowCount');

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: `Dataset not found with identifier '${id}'`
      });
    }

    const preview = await previewDatasetTable(dataset.tableName, 20);

    res.status(200).json({
      success: true,
      tableName: dataset.tableName,
      title: dataset.title,
      totalRows: dataset.rowCount,
      columns: preview.columns,
      rows: preview.rows
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDatasets,
  getDatasetById,
  getDatasetSchema,
  getDatasetPreview
};
