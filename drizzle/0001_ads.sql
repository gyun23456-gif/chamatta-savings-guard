CREATE TABLE IF NOT EXISTS ad_inquiries (
  id TEXT PRIMARY KEY, brand TEXT NOT NULL, contact_name TEXT NOT NULL,
  email TEXT NOT NULL, budget TEXT NOT NULL, placement TEXT NOT NULL,
  message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ad_inquiries_status_created ON ad_inquiries(status, created_at DESC);
CREATE TABLE IF NOT EXISTS ad_events (
  id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL, event_type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ad_events_campaign_type ON ad_events(campaign_id, event_type);
