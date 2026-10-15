require('dotenv').config();
const Groq = require('groq-sdk');
const { queryAll } = require('../db/db');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SCHEMA_DESCRIPTION = `
my_clients(id, name, company, field)
my_entries(id, client_id, client_name, entry_type, summary, due_date, billed, completed, estimated_value, needs_review, created_at)

entry_type is one of: 'deadline', 'task', 'extra_work'.
billed, completed, needs_review are 0 (false) or 1 (true).
estimated_value is the billable amount in rupees for extra_work entries, null otherwise.
`.trim();

// Table/identifier names that must never appear in LLM-generated SQL — if
// the model ever ignores its instructions and writes the real table names,
// this rejects the query before it runs rather than trusting the prompt.
const FORBIDDEN_IDENTIFIERS = ['clients', 'entries', 'messages', 'users', 'sqlite_master', 'sqlite_sequence'];
const FORBIDDEN_KEYWORDS = ['insert', 'update', 'delete', 'drop', 'alter', 'attach', 'detach', 'pragma', 'create', 'replace', 'exec', 'vacuum', 'reindex', 'trigger', 'grant', 'revoke'];

function wordBoundaryMatch(sql, word) {
  return new RegExp(`\\b${word}\\b`, 'i').test(sql);
}

// Rejects anything that isn't a single, read-only SELECT against the two
// pre-scoped views — this is the actual safety boundary, not the prompt.
function assertSafeSelect(sql) {
  const trimmed = sql.trim().replace(/;+\s*$/, '');

  if (!/^select\b/i.test(trimmed)) {
    throw new Error('Generated query was not a SELECT statement.');
  }
  if (trimmed.includes(';')) {
    throw new Error('Generated query contained multiple statements.');
  }
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (wordBoundaryMatch(trimmed, keyword)) {
      throw new Error(`Generated query used a disallowed keyword: ${keyword}`);
    }
  }
  for (const identifier of FORBIDDEN_IDENTIFIERS) {
    if (wordBoundaryMatch(trimmed, identifier)) {
      throw new Error(`Generated query referenced a disallowed table: ${identifier}`);
    }
  }

  return trimmed;
}

// Swaps the two virtual view names for subqueries scoped to this business.
// userId comes from the verified JWT payload (never user-supplied text), so
// it's safe to inline as a plain integer literal.
function scopeToUser(sql, userId) {
  const safeUserId = parseInt(userId, 10);
  if (!Number.isInteger(safeUserId)) {
    throw new Error('Invalid user id.');
  }

  let scoped = sql.replace(
    /\bmy_entries\b/gi,
    `(SELECT entries.id, entries.client_id, clients.name AS client_name, entries.entry_type,
             entries.summary, entries.due_date, entries.billed, entries.completed,
             entries.estimated_value, entries.needs_review, entries.created_at
      FROM entries JOIN clients ON entries.client_id = clients.id
      WHERE clients.user_id = ${safeUserId})`
  );
  scoped = scoped.replace(
    /\bmy_clients\b/gi,
    `(SELECT id, name, company, field FROM clients WHERE user_id = ${safeUserId})`
  );

  if (!/\blimit\b/i.test(scoped)) {
    scoped += ' LIMIT 50';
  }

  return scoped;
}

async function generateSql(question) {
  const prompt = `You are a SQL generation assistant for a small business analytics tool. You have access to exactly two read-only views:

${SCHEMA_DESCRIPTION}

Given a business owner's question, write ONE single SQLite SELECT query (no other statement types, no semicolons) against ONLY my_clients and/or my_entries that answers it. Return ONLY the raw SQL, nothing else — no markdown, no explanation.

Question: "${question}"`;

  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.choices[0].message.content;
  return raw.replace(/```sql|```/gi, '').trim();
}

async function explainResult(question, rows) {
  const prompt = `You are a helpful assistant answering a small business owner's question about their own data.

Question: "${question}"
Query result (JSON rows): ${JSON.stringify(rows).slice(0, 4000)}

Answer the question in 1-3 short, plain sentences, using ₹ for currency where relevant. If the result is empty, say so plainly and suggest why. Don't mention SQL, queries, or databases.`;

  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0].message.content.trim();
}

async function askDataQuestion(question, userId) {
  const generatedSql = await generateSql(question);
  const safeSql = assertSafeSelect(generatedSql);
  const scopedSql = scopeToUser(safeSql, userId);

  const rows = queryAll(scopedSql);
  const answer = await explainResult(question, rows);

  return { answer, sql: generatedSql, rows };
}

module.exports = { askDataQuestion };
