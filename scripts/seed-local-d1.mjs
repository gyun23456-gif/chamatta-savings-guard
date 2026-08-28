// Seeds the local Miniflare D1 database with demo rows so the app can be
// developed against realistic data.
//
// The tables themselves are created on demand by the route handlers in
// app/api/*, so this script only inserts rows. It is idempotent: every row uses
// a fixed `seed-` id and is written with INSERT OR REPLACE.
//
// Usage: pnpm seed:local   (stop `pnpm dev` first — Miniflare holds the file open)
import { DatabaseSync } from 'node:sqlite';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const D1_DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';

function findDatabase() {
  let entries;
  try {
    entries = readdirSync(D1_DIR);
  } catch {
    throw new Error(`No local D1 state at ${D1_DIR}. Run \`pnpm dev\` once first.`);
  }
  // Miniflare names the database file after a hash of the database id, and keeps
  // its own metadata.sqlite alongside it.
  const files = entries.filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite');
  if (files.length !== 1) {
    throw new Error(`Expected exactly one D1 database in ${D1_DIR}, found: ${files.join(', ') || '(none)'}`);
  }
  return join(D1_DIR, files[0]);
}

const pad = (n) => String(n).padStart(2, '0');
// CURRENT_TIMESTAMP format, so seeded rows sort alongside app-written ones.
const stamp = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
  `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

const now = new Date();
const daysAgo = (n) => stamp(new Date(now.getTime() - n * 86400000));
const isoDay = (n) => new Date(now.getTime() + n * 86400000).toISOString();

const stories = [
  ['seed-story-1', 'seed-user-1', 'seed1@example.test', '주말엔 산책', '야식비를 모아 제주도에 다녀왔어요',
   '매번 배달앱을 켤 때 가상 장바구니에 먼저 담았어요. 10분만 기다려보니 생각보다 자주 마음이 지나갔고, 5개월 뒤 정말 여행을 떠났습니다.',
   '제주도 여행', 620000, '5개월', '여행', 'approved', 1, daysAgo(12)],
  ['seed-story-2', 'seed-user-2', 'seed2@example.test', '라테는 집에서', '작은 커피값이 비상금이 됐어요',
   '매일 한 번의 선택을 기록했을 뿐인데 숫자로 보이니까 계속하고 싶어졌어요. 목표를 채운 날의 뿌듯함은 아직도 기억나요.',
   '비상금 만들기', 300000, '3개월', '비상금', 'approved', 0, daysAgo(5)],
  ['seed-story-3', 'seed-user-3', 'seed3@example.test', '치킨은 한 달에 한 번', '주 3회 치킨을 주 1회로 줄였어요',
   '참기만 하면 스트레스라서 횟수를 정했어요. 남은 돈으로 러닝화를 샀고 지금은 달리기가 더 재밌어요.',
   '러닝화 구입', 180000, '2개월', '운동', 'approved', 0, daysAgo(2)],
  ['seed-story-4', 'seed-user-4', 'seed4@example.test', '야식 끊는 중', '새벽 배달을 끊고 아침이 가벼워졌어요',
   '자정 넘어 주문하던 습관을 기록으로 남겼더니 패턴이 보였어요. 지금은 자기 전에 물 한 잔 마시고 잡니다.',
   '건강 회복', 95000, '1개월', '건강', 'pending', 0, daysAgo(1)],
];

const campaigns = [
  ['seed-campaign-1', '초록마켓', 'AD · 제휴', '장보기로 배달비를 아껴보세요',
   '신선식품 첫 구매 시 무료배송. 참았다! 사용자 전용 혜택입니다.',
   'https://example.test/greenmarket', 'market', isoDay(-7), isoDay(30), 'active'],
  ['seed-campaign-2', '한걸음 저축', 'AD · 제휴', '모은 돈을 자동으로 저축까지',
   '참았다!에서 아낀 금액을 그대로 적금으로 옮겨보세요.',
   'https://example.test/hangeoreum', 'market', isoDay(-3), isoDay(60), 'active'],
  ['seed-campaign-3', '내일의 러닝', 'AD · 제휴', '러닝 크루 무료 체험',
   '절약 목표를 운동으로 이어가는 사용자에게 추천합니다.',
   'https://example.test/running', 'market', isoDay(10), isoDay(45), 'draft'],
];

const inquiries = [
  ['seed-inquiry-1', '초록마켓', '김담당', 'partner1@example.test', '100~500만원', '상점 목록',
   '신선식품 카테고리에 3개월 캠페인을 검토 중입니다.', 'new', daysAgo(4)],
  ['seed-inquiry-2', '한걸음 저축', '이제휴', 'partner2@example.test', '500만원 이상', '목표 화면',
   '저축 연동 배너를 목표 달성 화면에 노출하고 싶습니다.', 'reviewing', daysAgo(9)],
];

const events = [];
for (let i = 0; i < 34; i++) events.push([`seed-event-i-${i}`, 'seed-campaign-1', 'impression', daysAgo(i % 7)]);
for (let i = 0; i < 6; i++) events.push([`seed-event-c-${i}`, 'seed-campaign-1', 'click', daysAgo(i % 5)]);
for (let i = 0; i < 21; i++) events.push([`seed-event-i2-${i}`, 'seed-campaign-2', 'impression', daysAgo(i % 6)]);
for (let i = 0; i < 3; i++) events.push([`seed-event-c2-${i}`, 'seed-campaign-2', 'click', daysAgo(i % 3)]);

const file = findDatabase();
const db = new DatabaseSync(file);

const run = (sql, rows) => {
  const stmt = db.prepare(sql);
  for (const row of rows) stmt.run(...row);
  return rows.length;
};

db.exec('BEGIN');
try {
  const counts = {
    stories: run(
      `INSERT OR REPLACE INTO stories(id,user_id,user_email,nickname,title,body,goal,amount,period,tag,status,featured,created_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`, stories),
    ad_campaigns: run(
      `INSERT OR REPLACE INTO ad_campaigns(id,brand,label,title,description,link_url,placement,starts_at,ends_at,status)
       VALUES(?,?,?,?,?,?,?,?,?,?)`, campaigns),
    ad_inquiries: run(
      `INSERT OR REPLACE INTO ad_inquiries(id,brand,contact_name,email,budget,placement,message,status,created_at)
       VALUES(?,?,?,?,?,?,?,?,?)`, inquiries),
    ad_events: run(
      `INSERT OR REPLACE INTO ad_events(id,campaign_id,event_type,created_at) VALUES(?,?,?,?)`, events),
  };
  db.exec('COMMIT');
  console.log(`Seeded ${file}`);
  for (const [table, n] of Object.entries(counts)) {
    const total = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
    console.log(`  ${table}: +${n} written (${total} rows total)`);
  }
} catch (err) {
  db.exec('ROLLBACK');
  throw err;
} finally {
  db.close();
}
