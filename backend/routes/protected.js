const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

router.get('/manager-only', auth, requireRole('manager'), (req, res) => {
  res.json({ message: `Hello manager ${req.user.email}` });
});

module.exports = router;
