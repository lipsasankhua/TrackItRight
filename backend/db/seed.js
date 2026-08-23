const { runQuery, queryAll } = require('./db');

function seedIfEmpty() {
  const existing = queryAll('SELECT COUNT(*) as count FROM clients');
  if (existing[0].count > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }

  console.log('Seeding demo data...');

  const clients = [
    { name: 'Meera Kapoor', company: 'Kapoor & Associates', field: 'Law' },
    { name: 'Sunrise Builders', company: 'Sunrise Builders Pvt Ltd', field: 'Architecture' },
    { name: 'Studio Nine', company: 'Studio Nine Design', field: 'Interior Design' },
  ];

  const clientIds = [];
  for (const c of clients) {
    runQuery('INSERT INTO clients (name, company, field) VALUES (?, ?, ?)', [c.name, c.company, c.field]);
    const last = queryAll('SELECT id FROM clients ORDER BY id DESC LIMIT 1');
    clientIds.push(last[0].id);
  }

  const entriesData = [
    // Meera Kapoor (Law)
    { client: 0, text: 'Please prepare the draft agreement and send it to us by August 28th for review.', type: 'deadline', summary: 'Prepare and send draft agreement for review', due: '2026-08-28', billed: 1, value: null },
    { client: 0, text: "We'd also like you to add a non-compete clause to the contract — this wasn't part of the original scope, so let us know the additional cost.", type: 'extra_work', summary: 'Add non-compete clause to contract', due: null, billed: 0, value: 8000 },
    { client: 0, text: 'Reminder — court filing deadline is September 2nd, please don\'t miss it.', type: 'deadline', summary: 'Court filing deadline', due: '2026-09-02', billed: 1, value: null },

    // Sunrise Builders (Architecture)
    { client: 1, text: 'Material delivery for the Andheri site is delayed by a week, please adjust the project timeline accordingly.', type: 'task', summary: 'Adjust timeline for delayed material delivery', due: null, billed: 1, value: null },
    { client: 1, text: 'We want to add a rooftop garden to the design — please share estimated cost and timeline impact since this is beyond the original brief.', type: 'extra_work', summary: 'Add rooftop garden to design', due: null, billed: 0, value: 45000 },
    { client: 1, text: 'Site visit scheduled for August 30th, please have the updated drawings ready by then.', type: 'deadline', summary: 'Updated drawings ready for site visit', due: '2026-08-30', billed: 1, value: null },
    { client: 1, text: 'Client also wants an additional balcony extension on the second floor — separate from the original scope, please quote it.', type: 'extra_work', summary: 'Balcony extension, second floor', due: null, billed: 0, value: 32000 },

    // Studio Nine (Interior Design)
    { client: 2, text: "We'd like the mood board finalized by August 26th.", type: 'deadline', summary: 'Finalize mood board', due: '2026-08-26', billed: 1, value: null },
    { client: 2, text: 'Client has requested a complete change of the flooring material from wood to marble — this is extra work outside the original agreement.', type: 'extra_work', summary: 'Change flooring from wood to marble', due: null, billed: 0, value: 60000 },
    { client: 2, text: 'Please also source curtain fabric samples, needed before the next client meeting on September 1st.', type: 'deadline', summary: 'Source curtain fabric samples', due: '2026-09-01', billed: 1, value: null },
    { client: 2, text: "Add a home office nook to the layout — this wasn't discussed earlier, please estimate additional cost.", type: 'extra_work', summary: 'Add home office nook to layout', due: null, billed: 0, value: 25000 },
  ];

  for (const e of entriesData) {
    const client_id = clientIds[e.client];
    runQuery('INSERT INTO messages (client_id, raw_text, source) VALUES (?, ?, ?)', [client_id, e.text, 'manual']);
    const lastMsg = queryAll('SELECT id FROM messages ORDER BY id DESC LIMIT 1');

    runQuery(
      `INSERT INTO entries (message_id, client_id, entry_type, summary, due_date, billed, estimated_value)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [lastMsg[0].id, client_id, e.type, e.summary, e.due, e.billed, e.value]
    );
  }

  console.log('Demo data seeded successfully.');
}

module.exports = { seedIfEmpty };