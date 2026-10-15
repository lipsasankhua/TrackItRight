const express = require('express');
const router = express.Router();
const { queryAll } = require('../db/db');

// GET /dashboard — upcoming deadlines + unbilled work total
router.get('/', (req, res) => {
  try {
    // Deadlines coming up in the next 7 days
    const upcomingDeadlines = queryAll(`
      SELECT entries.*, clients.name AS client_name
      FROM entries
      JOIN clients ON entries.client_id = clients.id
      WHERE entries.entry_type = 'deadline'
        AND entries.due_date IS NOT NULL
        AND entries.completed = 0
        AND clients.user_id = ?
        AND date(entries.due_date) BETWEEN date('now') AND date('now', '+7 days')
      ORDER BY entries.due_date ASC
    `, [req.user.id]);

    // Total unbilled extra work this month
    const unbilledResult = queryAll(`
      SELECT COALESCE(SUM(entries.estimated_value), 0) AS total_unbilled
      FROM entries
      JOIN clients ON entries.client_id = clients.id
      WHERE entries.entry_type = 'extra_work'
        AND entries.billed = 0
        AND clients.user_id = ?
        AND strftime('%Y-%m', entries.created_at) = strftime('%Y-%m', 'now')
    `, [req.user.id]);

    const entryBreakdown = queryAll(`
      SELECT entries.entry_type, COUNT(*) as count
      FROM entries
      JOIN clients ON entries.client_id = clients.id
      WHERE clients.user_id = ?
      GROUP BY entries.entry_type
   `, [req.user.id]);

    // Entries where the trained classifier disagreed with the LLM's
    // classification — flagged for a human to double-check.
    const needsReview = queryAll(`
      SELECT entries.id, entries.entry_type, entries.classifier_label, entries.summary, entries.review_reason, clients.name AS client_name
      FROM entries
      JOIN clients ON entries.client_id = clients.id
      WHERE entries.needs_review = 1 AND clients.user_id = ?
      ORDER BY entries.created_at DESC
    `, [req.user.id]);

    res.json({
  upcomingDeadlines,
  totalUnbilled: unbilledResult[0].total_unbilled,
  entryBreakdown,
  needsReview,
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;