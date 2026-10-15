CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  business_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  company TEXT,
  field TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  raw_text TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  embedding TEXT,
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  entry_type TEXT NOT NULL,
  summary TEXT,
  due_date DATE,
  billed BOOLEAN DEFAULT 0,
  completed BOOLEAN DEFAULT 0,
  estimated_value DECIMAL,
  classifier_label TEXT,
  classifier_confidence DECIMAL,
  needs_review BOOLEAN DEFAULT 0,
  review_reason TEXT,
  resolved_label TEXT,
  resolved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);