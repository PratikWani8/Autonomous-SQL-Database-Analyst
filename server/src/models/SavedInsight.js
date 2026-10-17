const mongoose = require('mongoose');

const savedInsightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    datasetId: {
      type: String,
      default: null
    },
    tableName: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the insight'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    question: {
      type: String,
      required: true
    },
    generatedSql: {
      type: String,
      required: true
    },
    chartPreferences: {
      type: { type: String, default: 'bar' },
      xKey: { type: String },
      yKey: { type: String },
      xLabel: { type: String },
      yLabel: { type: String },
      unit: { type: String }
    },
    notes: {
      type: String,
      default: ''
    },
    keyFinding: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

savedInsightSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SavedInsight', savedInsightSchema);
