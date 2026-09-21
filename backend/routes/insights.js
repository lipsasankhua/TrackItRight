const express = require('express');
const router = express.Router();
const { queryAll } = require('../db/db');

// GET /insights — analytics across all clients: unbilled backlog trend,
// which clients generate the most extra (unscoped) work, and deadline
// overdue status. There's no "completed" flag on entries, so this reports
// overdue-vs-upcoming rather than a true compliance/on-time rate.
router.get('/', (req, res) => {
  try {
    const unbilledBacklogByWeek = queryAll(`
      SELECT strftime('%Y-%W', created_at) AS week_key,
             MIN(date(created_at)) AS week_start,
             COALESCE(SUM(estimated_value), 0) AS total
      FROM entries
      WHERE entry_type = 'extra_work' AND billed = 0
      GROUP BY week_key
      ORDER BY week_key ASC
    `);

    const scopeCreepByClient = queryAll(`
      SELECT clients.id AS client_id,
             clients.name AS client_name,
             COUNT(*) AS extra_work_count,
             COALESCE(SUM(entries.estimated_value), 0) AS total_value
      FROM entries
      JOIN clients ON entries.client_id = clients.id
      WHERE entries.entry_type = 'extra_work'
      GROUP BY clients.id
      ORDER BY extra_work_count DESC, total_value DESC
    `);

    const deadlineStatus = queryAll(`
      SELECT
        COALESCE(SUM(CASE WHEN date(due_date) < date('now') THEN 1 ELSE 0 END), 0) AS overdue,
        COALESCE(SUM(CASE WHEN date(due_date) >= date('now') THEN 1 ELSE 0 END), 0) AS upcoming,
        COUNT(*) AS total
      FROM entries
      WHERE entry_type = 'deadline' AND due_date IS NOT NULL
    `)[0];

    const overdueDeadlines = queryAll(`
      SELECT entries.id, entries.summary, entries.due_date, clients.name AS client_name
      FROM entries
      JOIN clients ON entries.client_id = clients.id
      WHERE entries.entry_type = 'deadline'
        AND entries.due_date IS NOT NULL
        AND date(entries.due_date) < date('now')
      ORDER BY entries.due_date ASC
    `);

    res.json({ unbilledBacklogByWeek, scopeCreepByClient, deadlineStatus, overdueDeadlines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch insights data' });
  }
});

module.exports = router;
