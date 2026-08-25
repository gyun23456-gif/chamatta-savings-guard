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
