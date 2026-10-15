const express = require('express');
const router = express.Router();
const { askDataQuestion } = require('../services/textToSql');

// POST /ask — natural-language question answered by generating a scoped
// SQL query against this business's own data, then explaining the result
// in plain English. The query is always rewritten to only touch this
// business's rows (see textToSql.js) regardless of what the LLM generates.
router.post('/', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'A question is required' });
    }

    const result = await askDataQuestion(question.trim(), req.user.id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to answer the question' });
  }
});

module.exports = router;
