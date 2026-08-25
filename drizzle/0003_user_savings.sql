CREATE TABLE IF NOT EXISTS savings_records (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0), memo TEXT NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('saved','spent')), record_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_savings_records_user_date ON savings_records(user_id, record_date DESC);
CREATE TABLE IF NOT EXISTS savings_goals (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK(amount > 0), emoji TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id, created_at);
