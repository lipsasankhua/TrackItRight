const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { runQuery, queryAll } = require('../db/db');
const { extractFromMessage } = require('../services/aiExtraction');
const { transcribeAudio } = require('../services/transcription');
const { getEmbedding, cosineSimilarity } = require('../services/embeddings');
const { getClassifierPrediction, submitFeedback } = require('../services/classifierComparison');

const VALID_LABELS = ['deadline', 'task', 'extra_work'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// True if the given client belongs to this signed-in business — checked
// before any read/write touching that client's entries or messages, so one
// business can never read or modify another's data.
function clientBelongsToUser(client_id, user_id) {
  return queryAll('SELECT id FROM clients WHERE id = ? AND user_id = ?', [client_id, user_id]).length > 0;
}

// PATCH /entries/:id/complete — toggle a deadline entry's completed status
router.patch('/:id/complete', (req, res) => {
  try {
    const owned = queryAll(
      `SELECT entries.id FROM entries
       JOIN clients ON entries.client_id = clients.id
       WHERE entries.id = ? AND clients.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (owned.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    runQuery(
      'UPDATE entries SET completed = CASE WHEN completed = 1 THEN 0 ELSE 1 END WHERE id = ?',
      [req.params.id]
    );
    const updated = queryAll('SELECT completed FROM entries WHERE id = ?', [req.params.id]);
    res.json({ message: 'Toggled completion', completed: !!updated[0]?.completed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// PATCH /entries/:id/resolve-review — a human confirms the correct label
// for an entry the classifier flagged, closing the loop: the correction is
// fed back to the classifier service as a new training example instead of
// being discarded (see classifierComparison.js's submitFeedback).
router.patch('/:id/resolve-review', (req, res) => {
  try {
    const { correct_label } = req.body;
    if (!correct_label || !VALID_LABELS.includes(correct_label)) {
      return res.status(400).json({ error: `correct_label must be one of: ${VALID_LABELS.join(', ')}` });
    }

    const rows = queryAll(
      `SELECT entries.id, messages.raw_text
       FROM entries
       JOIN clients ON entries.client_id = clients.id
       JOIN messages ON entries.message_id = messages.id
       WHERE entries.id = ? AND clients.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    runQuery(
      `UPDATE entries
       SET entry_type = ?, needs_review = 0, resolved_label = ?, resolved_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [correct_label, correct_label, req.params.id]
    );

    submitFeedback(rows[0].raw_text, correct_label).catch(() => {});

    res.json({ message: 'Review resolved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resolve review' });
  }
});

router.get('/:client_id', (req, res) => {
  try {
    const { client_id } = req.params;
    if (!clientBelongsToUser(client_id, req.user.id)) {
      return res.status(404).json({ error: 'Client not found' });
    }

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
    .filter(m => m.score > 0.4) // only reasonably similar ones
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
}

// Strips spaces/underscores/hyphens and lowercases, so 'extra_work' and
// 'extra work' compare as the same label.
function normalizeLabel(s) {
  return (s || '').toLowerCase().replace(/[\s_-]/g, '');
}

// Cross-checks the LLM's classification against the independently trained
// classifier. When they disagree, the entry is flagged for human review
// instead of silently trusting whichever model answered first — this is
// the safety net: a wrong classification can mean missed billable work or
// a missed deadline, and nobody would otherwise know it happened.
function evaluateClassifierAgreement(extracted, classifierResult) {
  if (!classifierResult) {
    return { classifier_label: null, classifier_confidence: null, needs_review: false, review_reason: null };
  }

  const agrees = normalizeLabel(extracted.entry_type) === normalizeLabel(classifierResult.label);
  if (agrees) {
    return { classifier_label: classifierResult.label, classifier_confidence: classifierResult.confidence, needs_review: false, review_reason: null };
  }

  const confidencePct = Math.round((classifierResult.confidence || 0) * 100);
  return {
    classifier_label: classifierResult.label,
    classifier_confidence: classifierResult.confidence,
    needs_review: true,
    review_reason: `LLM classified this as "${extracted.entry_type}", but the trained classifier predicted "${classifierResult.label}" (${confidencePct}% confidence) — worth a second look.`,
  };
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
  const classifierResult = await getClassifierPrediction(raw_text);
  const review = evaluateClassifierAgreement(extracted, classifierResult);

  runQuery(
    `INSERT INTO entries (message_id, client_id, entry_type, summary, due_date, billed, estimated_value, classifier_label, classifier_confidence, needs_review, review_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message_id,
      client_id,
      extracted.entry_type,
      extracted.summary,
      extracted.due_date,
      extracted.billable ? 0 : 1,
      extracted.estimated_value,
      review.classifier_label,
      review.classifier_confidence,
      review.needs_review ? 1 : 0,
      review.review_reason,
    ]
  );

  return {
    extracted,
    similarMessages: similar,
    classifierComparison: classifierResult,
    needsReview: review.needs_review,
    reviewReason: review.review_reason,
  };
}

router.post('/', async (req, res) => {
  try {
    const { client_id, raw_text } = req.body;
    if (!client_id || !raw_text) {
      return res.status(400).json({ error: 'client_id and raw_text are required' });
    }
    if (!clientBelongsToUser(client_id, req.user.id)) {
      return res.status(404).json({ error: 'Client not found' });
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
    if (!clientBelongsToUser(client_id, req.user.id)) {
      return res.status(404).json({ error: 'Client not found' });
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