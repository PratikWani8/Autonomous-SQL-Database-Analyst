const { v4: uuidv4 } = require('uuid');
const QueryHistory = require('../models/QueryHistory');
const DatasetMetadata = require('../models/DatasetMetadata');
const { analyzeQuestion } = require('../services/aiServiceClient');

// @desc    Execute natural language analytical query
// @route   POST /api/analytics/query
const executeQuery = async (req, res, next) => {
  try {
    const { question, datasetId, tableName } = req.body;

    if (!question || question.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid analytical question (minimum 3 characters)'
      });
    }

    const requestId = uuidv4();
    const preferredLanguage = req.user?.preferredLanguage || 'en';

    // Call Python FastAPI analytical pipeline
    const analysisResult = await analyzeQuestion({
      question: question.trim(),
      datasetId,
      tableName,
      preferredLanguage,
      requestId
    });

    // Save to user's QueryHistory asynchronously
    if (req.user && req.user._id) {
      try {
        const topFinding = analysisResult.explanation?.direct_answer || '';
        const chartType = analysisResult.chart_spec?.type || 'table';

        await QueryHistory.create({
          userId: req.user._id,
          datasetId: analysisResult.dataset_id || datasetId,
          tableName: analysisResult.table_name || tableName || 'unknown',
          originalQuestion: question,
          interpretedQuestion: analysisResult.interpreted_question,
          generatedSql: analysisResult.generated_sql,
          executionStatus: analysisResult.execution_status,
          resultSummary: {
            rowCount: analysisResult.row_count,
            columns: analysisResult.result_columns,
            topFinding,
            chartType
          },
          warnings: analysisResult.result_validation?.warnings || [],
          executionDuration: analysisResult.execution_duration_ms
        });
      } catch (histErr) {
        console.error('Failed to log query history:', histErr.message);
      }
    }

    res.status(200).json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's query history
// @route   GET /api/analytics/history
const getQueryHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const total = await QueryHistory.countDocuments({ userId: req.user._id });
    const history = await QueryHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: history.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get query history item by ID
// @route   GET /api/analytics/history/:id
const getQueryHistoryById = async (req, res, next) => {
  try {
    const historyItem = await QueryHistory.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!historyItem) {
      return res.status(404).json({
        success: false,
        error: 'Query history record not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      data: historyItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rerun query from history
// @route   POST /api/analytics/history/:id/rerun
const rerunQuery = async (req, res, next) => {
  try {
    const historyItem = await QueryHistory.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!historyItem) {
      return res.status(404).json({
        success: false,
        error: 'Query history record not found or unauthorized'
      });
    }

    const requestId = uuidv4();
    const analysisResult = await analyzeQuestion({
      question: historyItem.originalQuestion,
      datasetId: historyItem.datasetId,
      tableName: historyItem.tableName,
      preferredLanguage: req.user?.preferredLanguage || 'en',
      requestId
    });

    res.status(200).json({
      success: true,
      isRerun: true,
      data: analysisResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete query history item
// @route   DELETE /api/analytics/history/:id
const deleteQueryHistory = async (req, res, next) => {
  try {
    const historyItem = await QueryHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!historyItem) {
      return res.status(404).json({
        success: false,
        error: 'Query history record not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Query history record removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  executeQuery,
  getQueryHistory,
  getQueryHistoryById,
  rerunQuery,
  deleteQueryHistory
};
