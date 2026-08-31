-- 가게별 후기.
--
-- 목표 달성 후기(stories)와 다르다. 그쪽은 "제주도 다녀왔어요" 같은 목표 달성기이고,
-- 이건 특정 가게를 두고 "여기 참길 잘했다" 를 남기는 자리다.
--
-- 글쓴이는 계정이 아니라 기기로 구분한다. 한 기기가 한 가게에 하나만 남길 수 있게
-- (shop_id, device_id) 를 기본키로 잡았다. 다시 쓰면 덮어쓰기가 된다.
-- 별점 없이 글만 남기거나 그 반대도 되게 두면 목록이 지저분해져서 둘 다 받는다.
CREATE TABLE IF NOT EXISTS shop_reviews (
  shop_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (shop_id, device_id)
);

-- 가게 화면을 열 때마다 그 가게 것만 최신순으로 뽑는다.
CREATE INDEX IF NOT EXISTS idx_shop_reviews_shop ON shop_reviews(shop_id, created_at DESC);
