const express = require('express');
const router = express.Router();
const { queryAll } = require('../db/db');

// GET /search?q=... — matches clients by name/company/field, and entries
// by summary or their original message text.
router.get('/', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ clients: [], entries: [] });

    const like = `%${q}%`;

    const clients = queryAll(
      `SELECT id, name, company, field
       FROM clients
       WHERE name LIKE ? OR company LIKE ? OR field LIKE ?
       ORDER BY name ASC
       LIMIT 5`,
      [like, like, like]
    );

    const entries = queryAll(
      `SELECT entries.id, entries.entry_type, entries.summary, entries.client_id,
              clients.name AS client_name, messages.raw_text
       FROM entries
       JOIN clients ON entries.client_id = clients.id
       JOIN messages ON entries.message_id = messages.id
       WHERE entries.summary LIKE ? OR messages.raw_text LIKE ?
       ORDER BY entries.created_at DESC
       LIMIT 5`,
      [like, like]
    );

    res.json({ clients, entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
