CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY, email TEXT, nickname TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id TEXT PRIMARY KEY, brand TEXT NOT NULL, label TEXT NOT NULL, title TEXT NOT NULL,
  description TEXT NOT NULL, link_url TEXT NOT NULL, placement TEXT NOT NULL DEFAULT 'market',
  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status_dates ON ad_campaigns(status, starts_at, ends_at);
