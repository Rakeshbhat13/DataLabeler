const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const DataPoint = require('../models/DataPoint');
const Dataset = require('../models/Dataset');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const inMemoryDB = require('../lib/inMemoryDB');

router.use(auth);

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const query = req.user.role === 'manager' ? { owner: req.user.id } : {};
      const datasets = await Dataset.find(query).sort({ createdAt: -1 });
      return res.json(datasets);
    }

    const datasets = req.user.role === 'manager'
      ? inMemoryDB.listDatasetsByOwner(req.user.id)
      : [...inMemoryDB.datasets.values()];
    return res.json(datasets);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to load datasets' });
  }
});

router.post('/', requireRole('manager'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    if (isDbConnected()) {
      const dataset = await Dataset.create({ name, description, owner: req.user.id });
      return res.status(201).json(dataset);
    }

    const dataset = inMemoryDB.createDataset({ name, description, owner: req.user.id });
    return res.status(201).json(dataset);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to create dataset' });
  }
});

router.get('/:id/progress', async (req, res) => {
  try {
    if (isDbConnected()) {
      const total = await DataPoint.countDocuments({ datasetId: req.params.id });
      const labeled = await DataPoint.countDocuments({ datasetId: req.params.id, label: { $ne: null } });
      return res.json({ total, labeled, percent: total ? Number((labeled / total) * 100).toFixed(1) : 0 });
    }

    const total = inMemoryDB.countDataPoints({ datasetId: req.params.id });
    const labeled = inMemoryDB.countDataPoints({ datasetId: req.params.id, labelNotNull: true });
    return res.json({ total, labeled, percent: total ? Number((labeled / total) * 100).toFixed(1) : 0 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to load progress' });
  }
});

router.get('/:id/export', requireRole('manager'), async (req, res) => {
  try {
    const dataset = isDbConnected()
      ? await Dataset.findById(req.params.id)
      : inMemoryDB.findDatasetById(req.params.id);
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    if (isDbConnected()) {
      const items = await DataPoint.find({ datasetId: req.params.id })
        .select('rawText label labeledBy labeledAt')
        .sort({ createdAt: 1 });
      return res.json({ dataset, items });
    }

    const items = inMemoryDB.getDataPointsByDataset(req.params.id)
      .map(item => ({
        rawText: item.rawText,
        label: item.label,
        labeledBy: item.labeledBy,
        labeledAt: item.labeledAt
      }));
    return res.json({ dataset, items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to export dataset' });
  }
});

router.get('/:id/next', requireRole('annotator'), async (req, res) => {
  try {
    if (isDbConnected()) {
      const item = await DataPoint.findOneAndUpdate(
        { datasetId: req.params.id, label: null, claimedBy: null },
        { $set: { claimedBy: req.user.id, claimedAt: new Date() } },
        { new: true, sort: { createdAt: 1 } }
      );
      if (!item) return res.json({ done: true });
      return res.json(item);
    }

    const item = inMemoryDB.claimNext(req.params.id, req.user.id);
    if (!item) return res.json({ done: true });
    return res.json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to claim next item' });
  }
});

router.post('/:id/upload', requireRole('manager'), async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array of strings' });
    }

    if (isDbConnected()) {
      const docs = items.map(text => ({ datasetId: req.params.id, rawText: text }));
      await DataPoint.insertMany(docs);
      await Dataset.findByIdAndUpdate(req.params.id, { $inc: { totalCount: docs.length } });
      return res.json({ inserted: docs.length });
    }

    const docs = items.map(text => ({ datasetId: req.params.id, rawText: text }));
    inMemoryDB.insertDataPoints(docs);
    inMemoryDB.incDatasetCount(req.params.id, docs.length);
    return res.json({ inserted: docs.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
