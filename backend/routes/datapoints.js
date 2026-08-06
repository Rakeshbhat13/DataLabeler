const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const DataPoint = require('../models/DataPoint');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const inMemoryDB = require('../lib/inMemoryDB');

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

router.use(express.json());
router.use(auth);
router.get('/', (req, res) => res.json({ message: 'datapoints route' }));

router.post('/:id/label', requireRole('annotator'), async (req, res) => {
  try {
    const { label } = req.body;
    if (!['Positive', 'Negative', 'Neutral'].includes(label)) {
      return res.status(400).json({ error: 'label must be Positive, Negative, or Neutral' });
    }

    if (isDbConnected()) {
      const updated = await DataPoint.findByIdAndUpdate(req.params.id, {
        label,
        labeledBy: req.user.id,
        labeledAt: new Date(),
        claimedBy: null,
        claimedAt: null
      }, { new: true });
      if (!updated) return res.status(404).json({ error: 'DataPoint not found' });
      return res.json({ success: true });
    }

    const updated = inMemoryDB.updateDataPointLabel(req.params.id, label, req.user.id);
    if (!updated) return res.status(404).json({ error: 'DataPoint not found' });
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Label submission failed' });
  }
});

module.exports = router;
