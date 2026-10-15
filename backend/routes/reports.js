const express = require('express');
const router = express.Router();
const { queryAll } = require('../db/db');

// GET /reports/:client_id — summary for one client
router.get('/:client_id', (req, res) => {
  try {
    const { client_id } = req.params;

    const owned = queryAll('SELECT id FROM clients WHERE id = ? AND user_id = ?', [client_id, req.user.id]);
    if (owned.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const entries = queryAll(`
      SELECT entries.*, messages.raw_text
      FROM entries
      JOIN messages ON entries.message_id = messages.id
      WHERE entries.client_id = ?
      ORDER BY entries.created_at DESC
    `, [client_id]);

    const totalUnbilled = entries
      .filter(e => e.entry_type === 'extra_work' && !e.billed)
      .reduce((sum, e) => sum + (e.estimated_value || 0), 0);

    const deadlinesTotal = entries.filter(e => e.entry_type === 'deadline').length;

    res.json({
      totalEntries: entries.length,
      totalUnbilled,
      deadlinesTotal,
      entries
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;