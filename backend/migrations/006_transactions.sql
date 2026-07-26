CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  statement_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  raw_description TEXT NOT NULL,
  display_name TEXT NOT NULL,
  amount REAL NOT NULL,
  category_id INTEGER,
  rule_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (statement_id) REFERENCES statements(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (rule_id) REFERENCES rules(id)
);