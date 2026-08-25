export const storySchema = [
  `CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT,
    nickname TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    goal TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK(amount > 0),
    period TEXT NOT NULL,
    tag TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','hidden')),
    featured INTEGER NOT NULL DEFAULT 0,
    report_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_stories_status_created ON stories(status, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id, created_at DESC)`,
];

export const adSchema = [
  `CREATE TABLE IF NOT EXISTS ad_inquiries (
    id TEXT PRIMARY KEY, brand TEXT NOT NULL, contact_name TEXT NOT NULL,
    email TEXT NOT NULL, budget TEXT NOT NULL, placement TEXT NOT NULL,
    message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ad_inquiries_status_created ON ad_inquiries(status, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS ad_events (
    id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL, event_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ad_events_campaign_type ON ad_events(campaign_id, event_type)`
  ,`CREATE TABLE IF NOT EXISTS ad_campaigns (
    id TEXT PRIMARY KEY, brand TEXT NOT NULL, label TEXT NOT NULL, title TEXT NOT NULL,
    description TEXT NOT NULL, link_url TEXT NOT NULL, placement TEXT NOT NULL DEFAULT 'market',
    starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`
  ,`CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status_dates ON ad_campaigns(status, starts_at, ends_at)`
];

export const profileSchema = [
  `CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY, email TEXT, nickname TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`
];
