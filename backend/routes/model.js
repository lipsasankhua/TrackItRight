const express = require('express');
const router = express.Router();
const { getFeedbackStatus, triggerRetrain } = require('../services/classifierComparison');

// GET /model/status — how much feedback the classifier service has
// collected from resolved reviews, and whether it's reachable at all.
router.get('/status', async (req, res) => {
  const status = await getFeedbackStatus();
  res.json(status || { reachable: false, feedback_count: 0 });
});

// POST /model/retrain — retrains the classifier on the original dataset
// plus every piece of feedback collected so far, and hot-swaps the running
// model in place.
router.post('/retrain', async (req, res) => {
  try {
    const result = await triggerRetrain();
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message || 'Retrain failed' });
  }
});

module.exports = router;
