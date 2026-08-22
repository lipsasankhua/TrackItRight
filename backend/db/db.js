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

  return db;
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