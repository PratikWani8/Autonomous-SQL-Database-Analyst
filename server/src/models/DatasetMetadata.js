const mongoose = require('mongoose');

const columnMetaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    description: { type: String, default: '' },
    unit: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    isNullable: { type: Boolean, default: true }
  },
  { _id: false }
);

const datasetMetadataSchema = new mongoose.Schema(
  {
    datasetId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tableName: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    sourceUrl: {
      type: String,
      required: true
    },
    license: {
      type: String,
      default: 'Open Government Data License - India (OGDL-India)'
    },
    sourceVersion: {
      type: String,
      default: '1.0'
    },
    sourceUpdatedAt: {
      type: Date
    },
    importedAt: {
      type: Date,
      default: Date.now
    },
    reportingPeriods: [
      {
        type: String
      }
    ],
    columns: [columnMetaSchema],
    sampleQuestions: [
      {
        type: String
      }
    ],
    rowCount: {
      type: Number,
      default: 0
    },
    missingAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    provenance: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    visibility: {
      type: String,
      enum: ['public', 'restricted', 'archived'],
      default: 'public'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DatasetMetadata', datasetMetadataSchema);
