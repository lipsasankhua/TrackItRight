const bcrypt = require('bcryptjs');
const { runQuery, queryAll } = require('./db');

const DEMO_EMAIL = 'demo@trackitright.app';
const DEMO_PASSWORD = 'demo1234';

// Any client without a user_id predates per-business login (either an
// existing database migrated to this version, or a freshly seeded demo
// database). Either way, assign it to a shared demo account so existing
// data stays reachable instead of becoming orphaned and invisible.
function ensureDemoAccountForOrphanedClients() {
  const orphaned = queryAll('SELECT id FROM clients WHERE user_id IS NULL');
  if (orphaned.length === 0) return;

  let demoUser = queryAll('SELECT * FROM users WHERE email = ?', [DEMO_EMAIL])[0];
  if (!demoUser) {
    const password_hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    runQuery(
      'INSERT INTO users (email, password_hash, business_name) VALUES (?, ?, ?)',
      [DEMO_EMAIL, password_hash, 'Demo Business']
    );
    demoUser = queryAll('SELECT * FROM users WHERE email = ?', [DEMO_EMAIL])[0];
  }

  runQuery('UPDATE clients SET user_id = ? WHERE user_id IS NULL', [demoUser.id]);
  console.log(`Assigned ${orphaned.length} client(s) with no owner to the demo account (${DEMO_EMAIL} / ${DEMO_PASSWORD}).`);
}

module.exports = { ensureDemoAccountForOrphanedClients, DEMO_EMAIL, DEMO_PASSWORD };
