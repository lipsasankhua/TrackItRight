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
        AND date(entries.due_date) BETWEEN date('now') AND date('now', '+7 days')
      ORDER BY entries.due_date ASC
    `);

    // Total unbilled extra work this month
    const unbilledResult = queryAll(`
      SELECT COALESCE(SUM(estimated_value), 0) AS total_unbilled
      FROM entries
      WHERE entry_type = 'extra_work'
        AND billed = 0
        AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `);

    const entryBreakdown = queryAll(`
      SELECT entry_type, COUNT(*) as count
      FROM entries
      GROUP BY entry_type
   `);

    res.json({
  upcomingDeadlines,
  totalUnbilled: unbilledResult[0].total_unbilled,
  entryBreakdown
}); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;