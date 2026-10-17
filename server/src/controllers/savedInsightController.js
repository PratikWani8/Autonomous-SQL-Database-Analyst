const SavedInsight = require('../models/SavedInsight');

// @desc    Get all saved insights for user
// @route   GET /api/saved-insights
const getSavedInsights = async (req, res, next) => {
  try {
    const insights = await SavedInsight.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: insights.length,
      data: insights
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new saved insight
// @route   POST /api/saved-insights
const createSavedInsight = async (req, res, next) => {
  try {
    const { datasetId, tableName, title, question, generatedSql, chartPreferences, notes, keyFinding } = req.body;

    if (!title || !question || !generatedSql || !tableName) {
      return res.status(400).json({
        success: false,
        error: 'Please provide title, question, tableName, and generatedSql'
      });
    }

    const insight = await SavedInsight.create({
      userId: req.user._id,
      datasetId,
      tableName,
      title: title.trim(),
      question: question.trim(),
      generatedSql,
      chartPreferences: chartPreferences || {},
      notes: notes || '',
      keyFinding: keyFinding || ''
    });

    res.status(201).json({
      success: true,
      data: insight
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved insight
// @route   DELETE /api/saved-insights/:id
const deleteSavedInsight = async (req, res, next) => {
  try {
    const insight = await SavedInsight.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!insight) {
      return res.status(404).json({
        success: false,
        error: 'Saved insight not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Saved insight removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSavedInsights,
  createSavedInsight,
  deleteSavedInsight
};
