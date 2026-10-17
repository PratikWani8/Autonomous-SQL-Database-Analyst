const mongoose = require('mongoose');

const queryHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    datasetId: {
      type: String,
      default: null,
      index: true
    },
    tableName: {
      type: String,
      required: true
    },
    originalQuestion: {
      type: String,
      required: true
    },
    interpretedQuestion: {
      type: String,
      default: ''
    },
    generatedSql: {
      type: String,
      required: true
    },
    executionStatus: {
      type: String,
      enum: ['success', 'empty_result', 'failed', 'rejected'],
      default: 'success',
      index: true
    },
    resultSummary: {
      rowCount: { type: Number, default: 0 },
      columns: [{ type: String }],
      topFinding: { type: String, default: '' },
      chartType: { type: String, default: 'bar' }
    },
    warnings: [
      {
        code: String,
        severity: String,
        message: String,
        column: String
      }
    ],
    executionDuration: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

queryHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('QueryHistory', queryHistorySchema);
