import { rankSchema } from '../../../db/schema';

// 절약 랭킹은 로그인이 아니라 기기 단위다. oai-authenticated-user-id 헤더는
// ChatGPT Sites 안에서만 들어오고, 스토어로 받은 앱에는 없다.
//
// 그래서 누구나 아무 숫자나 올릴 수 있다. 막을 방법이 없으므로 대신
//   - 값에 상한을 두고
//   - 화면에 "기기 기준 집계"임을 밝힌다.
// 제대로 된 본인 확인은 자체 로그인(카카오 등)이 붙은 뒤에 가능하다.

const LIMIT = 20;
const MAX_AMOUNT = 100_000_000;   // 한 기간에 1억원 넘게 아꼈다는 건 입력이 아니라 장난이다
const MAX_CALORIES = 10_000_000;
const MAX_COUNT = 10_000;

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function db() {
  try {
    const { env } = await import('cloudflare:workers');
    const d = env.DB as D1Database;
    await d.batch(rankSchema.map(sql => d.prepare(sql)));
    return d;
  } catch {
    return null;
  }
}

const clamp = (value: unknown, max: number) => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
};

const cleanDevice = (value: unknown) =>
  typeof value === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(value) ? value : null;

const cleanNickname = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim().slice(0, 16) : '';
  return text.length >= 1 ? text : '익명의 방어자';
};

const cleanKey = (value: unknown, pattern: RegExp) =>
  typeof value === 'string' && pattern.test(value) ? value : null;

type Row = {
  device_id: string; nickname: string;
  amount: number; calories: number; count: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const period = url.searchParams.get('period') === 'month' ? 'month' : 'week';
  const key = url.searchParams.get('key') ?? '';
  const me = cleanDevice(url.searchParams.get('device'));

  const valid = period === 'week'
    ? cleanKey(key, /^\d{4}-W\d{2}$/)
    : cleanKey(key, /^\d{4}-\d{2}$/);
  if (!valid) return json({ error: '기간 값이 올바르지 않습니다.' }, 400);

  const d = await db();
  // 로컬 미리보기에는 D1이 없다. 화면이 깨지지 않게 빈 목록을 준다.
  if (!d) return json({ ranks: [], period, key: valid, localPreview: true });

  const column = period === 'week' ? 'week' : 'month';
  const result = await d.prepare(
    `SELECT device_id, nickname, ${column}_amount AS amount, ${column}_calories AS calories, ${column}_count AS count
     FROM savings_ranks
     WHERE ${column}_key = ? AND ${column}_amount > 0
     ORDER BY ${column}_amount DESC, ${column}_count DESC
     LIMIT ?`
  ).bind(valid, LIMIT).all<Row>();

  const rows = result.results ?? [];
  const ranks = rows.map((row, i) => ({
    rank: i + 1,
    nickname: row.nickname,
    amount: row.amount,
    calories: row.calories,
    count: row.count,
    me: me !== null && row.device_id === me,
  }));

  return json({ ranks, period, key: valid });
}

export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: '요청을 읽지 못했습니다.' }, 400);
  }

  const device = cleanDevice(body.device);
  const weekKey = cleanKey(body.weekKey, /^\d{4}-W\d{2}$/);
  const monthKey = cleanKey(body.monthKey, /^\d{4}-\d{2}$/);
  if (!device || !weekKey || !monthKey) return json({ error: '요청 값이 올바르지 않습니다.' }, 400);

  const d = await db();
  if (!d) return json({ ok: true, localPreview: true });

  await d.prepare(
    `INSERT INTO savings_ranks
       (device_id, nickname, week_key, week_amount, week_calories, week_count,
        month_key, month_amount, month_calories, month_count, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
     ON CONFLICT(device_id) DO UPDATE SET
       nickname=excluded.nickname,
       week_key=excluded.week_key, week_amount=excluded.week_amount,
       week_calories=excluded.week_calories, week_count=excluded.week_count,
       month_key=excluded.month_key, month_amount=excluded.month_amount,
       month_calories=excluded.month_calories, month_count=excluded.month_count,
       updated_at=CURRENT_TIMESTAMP`
  ).bind(
    device, cleanNickname(body.nickname),
    weekKey, clamp(body.weekAmount, MAX_AMOUNT), clamp(body.weekCalories, MAX_CALORIES), clamp(body.weekCount, MAX_COUNT),
    monthKey, clamp(body.monthAmount, MAX_AMOUNT), clamp(body.monthCalories, MAX_CALORIES), clamp(body.monthCount, MAX_COUNT),
  ).run();

  return json({ ok: true });
}

// 랭킹에서 빠지고 싶을 때. 개인정보처리방침의 삭제 요청 권리와 짝이다.
export async function DELETE(request: Request) {
  const device = cleanDevice(new URL(request.url).searchParams.get('device'));
  if (!device) return json({ error: '기기 값이 올바르지 않습니다.' }, 400);
  const d = await db();
  if (!d) return json({ ok: true, localPreview: true });
  await d.prepare('DELETE FROM savings_ranks WHERE device_id = ?').bind(device).run();
  return json({ ok: true });
}
