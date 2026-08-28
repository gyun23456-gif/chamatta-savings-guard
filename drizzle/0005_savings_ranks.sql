-- 절약 랭킹.
--
-- 로그인이 아니라 기기 단위로 집계한다. 모든 API가 쓰는 oai-authenticated-user-id
-- 헤더는 ChatGPT Sites 안에서만 들어오기 때문에, 스토어로 앱을 받은 사람에게는
-- 로그인이 성립하지 않는다. 기기당 한 줄을 두고 그 줄을 덮어쓴다.
--
-- 기간 키를 같이 저장해서, 주가 바뀌면 지난주 숫자가 이번 주 순위에 섞이지 않게 한다.
CREATE TABLE IF NOT EXISTS savings_ranks (
  device_id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  week_key TEXT NOT NULL,
  week_amount INTEGER NOT NULL DEFAULT 0 CHECK(week_amount >= 0),
  week_calories INTEGER NOT NULL DEFAULT 0 CHECK(week_calories >= 0),
  week_count INTEGER NOT NULL DEFAULT 0 CHECK(week_count >= 0),
  month_key TEXT NOT NULL,
  month_amount INTEGER NOT NULL DEFAULT 0 CHECK(month_amount >= 0),
  month_calories INTEGER NOT NULL DEFAULT 0 CHECK(month_calories >= 0),
  month_count INTEGER NOT NULL DEFAULT 0 CHECK(month_count >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_savings_ranks_week ON savings_ranks(week_key, week_amount DESC);
CREATE INDEX IF NOT EXISTS idx_savings_ranks_month ON savings_ranks(month_key, month_amount DESC);
