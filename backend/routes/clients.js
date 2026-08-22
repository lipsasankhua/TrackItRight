const express = require('express');
const router = express.Router();
const { runQuery, queryAll } = require('../db/db');

// GET /clients — list all clients
router.get('/', (req, res) => {
  try {
    const clients = queryAll('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// POST /clients — add a new client
router.post('/', (req, res) => {
  try {
    const { name, company, field } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    runQuery(
      'INSERT INTO clients (name, company, field) VALUES (?, ?, ?)',
      [name, company || null, field || null]
    );

    res.status(201).json({ message: 'Client added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add client' });
  }
});

module.exports = router;