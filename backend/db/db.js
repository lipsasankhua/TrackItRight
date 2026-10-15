const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'trackitright.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.run(schema);
    saveDB();
  }

  runMigrations();

  return db;
}

// Adds tables/columns introduced after the initial schema to databases that
// already exist on disk, since schema.sql only runs for a brand new file.
function runMigrations() {
  let migrated = false;

  const entryColumns = db.exec("PRAGMA table_info(entries)")[0].values.map((row) => row[1]);
  const newEntryColumns = {
    completed: 'BOOLEAN DEFAULT 0',
    classifier_label: 'TEXT',
    classifier_confidence: 'DECIMAL',
    needs_review: 'BOOLEAN DEFAULT 0',
    review_reason: 'TEXT',
    resolved_label: 'TEXT',
    resolved_at: 'DATETIME',
  };
  for (const [name, definition] of Object.entries(newEntryColumns)) {
    if (!entryColumns.includes(name)) {
      db.run(`ALTER TABLE entries ADD COLUMN ${name} ${definition}`);
      migrated = true;
    }
  }

  // users/clients.user_id: added for per-business login. A database created
  // before this always has a `users` table (CREATE TABLE IF NOT EXISTS is
  // safe to re-run), but `clients.user_id` needs an explicit ALTER, and any
  // pre-existing clients will have it NULL until ensureDemoAccount.js backfills
  // them to a demo account on the next server startup.
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    business_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const clientColumns = db.exec("PRAGMA table_info(clients)")[0].values.map((row) => row[1]);
  if (!clientColumns.includes('user_id')) {
    db.run('ALTER TABLE clients ADD COLUMN user_id INTEGER');
    migrated = true;
  }

  if (migrated) saveDB();
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function getDB() {
  return db;
}

// Runs INSERT/UPDATE/DELETE, then saves to disk
function runQuery(sql, params = []) {
  db.run(sql, params);
  saveDB();
}

// Runs SELECT, returns rows as an array of plain objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

module.exports = { initDB, getDB, saveDB, runQuery, queryAll };