const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, queryAll } = require('../db/db');
const { JWT_SECRET } = require('../middleware/auth');

const TOKEN_EXPIRY = '7d';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, business_name: user.business_name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// POST /auth/register — creates a new business account
router.post('/register', (req, res) => {
  try {
    const { email, password, business_name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = queryAll('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    runQuery(
      'INSERT INTO users (email, password_hash, business_name) VALUES (?, ?, ?)',
      [normalizedEmail, password_hash, business_name || null]
    );
    const user = queryAll('SELECT * FROM users WHERE email = ?', [normalizedEmail])[0];

    res.status(201).json({ token: makeToken(user), email: user.email, business_name: user.business_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// POST /auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = queryAll('SELECT * FROM users WHERE email = ?', [normalizedEmail])[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ token: makeToken(user), email: user.email, business_name: user.business_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

module.exports = router;
