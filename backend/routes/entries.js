const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { runQuery, queryAll } = require('../db/db');
const { extractFromMessage } = require('../services/aiExtraction');
const { transcribeAudio } = require('../services/transcription');
const { getEmbedding, cosineSimilarity } = require('../services/embeddings');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

router.get('/:client_id', (req, res) => {
  try {
    const { client_id } = req.params;
    const entries = queryAll(`
      SELECT entries.*, messages.raw_text, messages.source, messages.received_at
      FROM entries
      JOIN messages ON entries.message_id = messages.id
      WHERE entries.client_id = ?
      ORDER BY entries.created_at DESC
    `, [client_id]);
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

async function findSimilarMessages(client_id, newEmbedding, excludeText) {
  const pastMessages = queryAll(
    'SELECT raw_text, embedding FROM messages WHERE client_id = ? AND embedding IS NOT NULL AND raw_text != ?',
    [client_id, excludeText]
  );

  const scored = pastMessages
    .map(m => ({
      text: m.raw_text,
      score: cosineSimilarity(newEmbedding, JSON.parse(m.embedding))
    }))
    .filter(m => m.score > 0.55) // only reasonably similar ones
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return scored;
}

async function saveMessageAndExtract(client_id, raw_text, source) {
  const embedding = await getEmbedding(raw_text);
  const similar = await findSimilarMessages(client_id, embedding, raw_text);

  runQuery(
    'INSERT INTO messages (client_id, raw_text, source, embedding) VALUES (?, ?, ?, ?)',
    [client_id, raw_text, source, JSON.stringify(embedding)]
  );

  const lastMessage = queryAll('SELECT id FROM messages ORDER BY id DESC LIMIT 1');
  const message_id = lastMessage[0].id;

  const extracted = await extractFromMessage(raw_text);

  runQuery(
    `INSERT INTO entries (message_id, client_id, entry_type, summary, due_date, billed, estimated_value)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      message_id,
      client_id,
      extracted.entry_type,
      extracted.summary,
      extracted.due_date,
      extracted.billable ? 0 : 1,
      extracted.estimated_value
    ]
  );

  return { extracted, similarMessages: similar };
}

router.post('/', async (req, res) => {
  try {
    const { client_id, raw_text } = req.body;
    if (!client_id || !raw_text) {
      return res.status(400).json({ error: 'client_id and raw_text are required' });
    }

    const result = await saveMessageAndExtract(client_id, raw_text, 'manual');
    res.status(201).json({ message: 'Entry created successfully', ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

router.post('/voice', upload.single('audio'), async (req, res) => {
  try {
    const { client_id } = req.body;
    if (!client_id || !req.file) {
      return res.status(400).json({ error: 'client_id and an audio file are required' });
    }

    const raw_text = await transcribeAudio(req.file.path);
    fs.unlink(req.file.path, () => {});

    const result = await saveMessageAndExtract(client_id, raw_text, 'voice_note');
    res.status(201).json({ message: 'Voice note processed successfully', raw_text, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process voice note' });
  }
});

module.exports = router;