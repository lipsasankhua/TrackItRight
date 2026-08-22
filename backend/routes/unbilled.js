const express = require('express');
const router = express.Router();
const { runQuery, queryAll } = require('../db/db');

// GET /unbilled — list all unbilled extra work
router.get('/', (req, res) => {
  try {
    const items = queryAll(`
      SELECT entries.*, clients.name AS client_name
      FROM entries
      JOIN clients ON entries.client_id = clients.id
      WHERE entries.entry_type = 'extra_work' AND entries.billed = 0
      ORDER BY entries.created_at DESC
    `);
    const total = items.reduce((sum, e) => sum + (e.estimated_value || 0), 0);
    res.json({ items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch unbilled work' });
  }
});

// PATCH /unbilled/:id/bill — mark an entry as billed
router.patch('/:id/bill', (req, res) => {
  try {
    runQuery('UPDATE entries SET billed = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Marked as billed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

module.exports = router;