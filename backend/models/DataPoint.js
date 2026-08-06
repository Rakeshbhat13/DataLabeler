const mongoose = require('mongoose');

const dataPointSchema = new mongoose.Schema({
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', index: true },
  rawText: { type: String, required: true },
  label: { type: String, enum: ['Positive', 'Negative', 'Neutral'], default: null },
  labeledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  labeledAt: { type: Date, default: null },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  claimedAt: { type: Date, default: null }
});

// Compound index to make "find next unlabeled item in this dataset" efficient.
dataPointSchema.index({ datasetId: 1, label: 1, claimedBy: 1 });

module.exports = mongoose.model('DataPoint', dataPointSchema);
