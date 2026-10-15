const express = require('express');
const router = express.Router();
const { runQuery, queryAll } = require('../db/db');

// GET /clients — list this business's clients
router.get('/', (req, res) => {
  try {
    const clients = queryAll('SELECT * FROM clients WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// POST /clients — add a new client, owned by this business
router.post('/', (req, res) => {
  try {
    const { name, company, field } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    runQuery(
      'INSERT INTO clients (user_id, name, company, field) VALUES (?, ?, ?, ?)',
      [req.user.id, name, company || null, field || null]
    );

    res.status(201).json({ message: 'Client added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add client' });
  }
});

module.exports = router;