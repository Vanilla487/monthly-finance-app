CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, color) VALUES
  ('Groceries', 'yellow'),
  ('Fixed Costs', 'blue'),
  ('Savings', 'green'),
  ('Eating Out', 'pink'),
  ('Discretionary', 'purple');