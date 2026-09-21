const express = require('express');
const router = express.Router();
const { queryAll } = require('../db/db');

// GET /insights — analytics across all clients: unbilled backlog trend,
// which clients generate the most extra (unscoped) work, deadline status
// (overdue / upcoming / completed), and a compliance rate — the share of
// past-due deadlines that were marked complete. Compliance is based on
// completed status, not a completion timestamp, so a deadline finished
// late still counts as compliant; there's no way to detect that yet.
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
        COALESCE(SUM(CASE WHEN completed = 0 AND date(due_date) < date('now') THEN 1 ELSE 0 END), 0) AS overdue,
        COALESCE(SUM(CASE WHEN completed = 0 AND date(due_date) >= date('now') THEN 1 ELSE 0 END), 0) AS upcoming,
        COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) AS completed,
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
        AND entries.completed = 0
        AND date(entries.due_date) < date('now')
      ORDER BY entries.due_date ASC
    `);

    // Compliance = share of past-due deadlines that were marked complete,
    // bucketed by the week they were due, plus the overall rate.
    const complianceByWeek = queryAll(`
      SELECT strftime('%Y-%W', due_date) AS week_key,
             MIN(date(due_date)) AS week_start,
             SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed_count,
             COUNT(*) AS total_count
      FROM entries
      WHERE entry_type = 'deadline'
        AND due_date IS NOT NULL
        AND date(due_date) < date('now')
      GROUP BY week_key
      ORDER BY week_key ASC
    `);

    const pastDue = queryAll(`
      SELECT
        COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) AS completed_count,
        COUNT(*) AS total_count
      FROM entries
      WHERE entry_type = 'deadline' AND due_date IS NOT NULL AND date(due_date) < date('now')
    `)[0];

    const overallComplianceRate = pastDue.total_count > 0
      ? Math.round((pastDue.completed_count / pastDue.total_count) * 100)
      : null;

    res.json({
      unbilledBacklogByWeek,
      scopeCreepByClient,
      deadlineStatus,
      overdueDeadlines,
      complianceByWeek,
      overallComplianceRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch insights data' });
  }
});

module.exports = router;
