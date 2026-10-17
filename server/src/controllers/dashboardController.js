const DatasetMetadata = require('../models/DatasetMetadata');
const QueryHistory = require('../models/QueryHistory');
const SavedInsight = require('../models/SavedInsight');

// @desc    Get aggregated dashboard summary metrics
// @route   GET /api/dashboard/summary
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Concurrently gather counts and recent activities
    const [
      totalDatasets,
      totalQueriesExecuted,
      totalSavedInsights,
      recentQueries,
      recentSavedInsights,
      datasets
    ] = await Promise.all([
      DatasetMetadata.countDocuments({ visibility: 'public' }),
      QueryHistory.countDocuments({ userId }),
      SavedInsight.countDocuments({ userId }),
      QueryHistory.find({ userId }).sort({ createdAt: -1 }).limit(5),
      SavedInsight.find({ userId }).sort({ createdAt: -1 }).limit(4),
      DatasetMetadata.find({ visibility: 'public' }).select('datasetId tableName title sampleQuestions rowCount')
    ]);

    // Aggregate quick start questions from datasets
    const quickStartQuestions = [];
    datasets.forEach((ds) => {
      if (ds.sampleQuestions && ds.sampleQuestions.length > 0) {
        ds.sampleQuestions.slice(0, 2).forEach((q) => {
          quickStartQuestions.push({
            question: q,
            datasetId: ds.datasetId,
            tableName: ds.tableName,
            datasetTitle: ds.title
          });
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalDatasets,
          totalQueriesExecuted,
          totalSavedInsights
        },
        recentQueries,
        recentSavedInsights,
        availableDatasets: datasets,
        quickStartQuestions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary
};
