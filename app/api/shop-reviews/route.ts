import { json, preflight } from '../_cors';
import { shopReviewSchema } from '../../../db/schema';
import { deviceOf } from '../_identity';

// 가게별 후기.
//
// 상점 목록에서는 가게마다 개수만 필요하고, 가게를 열었을 때만 목록이 필요하다.
// 그래서 shop 인자 없이 부르면 개수만, 있으면 그 가게 목록을 준다.
//
// 한 기기가 한 가게에 하나만 쓴다. 다시 쓰면 덮어쓰기라서 목록이 같은 사람으로
// 도배되지 않는다.

const SHOP = /^[A-Za-z0-9가-힣_-]{1,40}$/;
const LIMIT = 50;

const cleanShop = (value: unknown) =>
  typeof value === 'string' && SHOP.test(value) ? value : null;

const cleanRating = (value: unknown) => {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};

const cleanNickname = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim().slice(0, 16) : '';
  return text.length >= 1 ? text : '익명의 방어자';
};

async function db(): Promise<D1Database | null> {
  try {
    const { env } = await import('cloudflare:workers');
    const d = env.DB as D1Database;
    await d.batch(shopReviewSchema.map(sql => d.prepare(sql)));
    return d;
  } catch {
    return null;
  }
}

type Row = { shop_id: string; device_id: string; nickname: string; rating: number; body: string; created_at: string };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shop = cleanShop(url.searchParams.get('shop'));
  const me = deviceOf(request);

  const d = await db();
  // 로컬 미리보기에는 D1 이 없다. 화면이 깨지지 않게 빈 값을 준다.
  if (!d) return json(request, shop ? { reviews: [], mine: null, localPreview: true } : { counts: {}, localPreview: true });

  // 상점 목록용. 가게마다 몇 개인지만 있으면 된다.
  if (!shop) {
    const result = await d.prepare(
      `SELECT shop_id, COUNT(*) AS n FROM shop_reviews GROUP BY shop_id`
    ).all<{ shop_id: string; n: number }>();
    const counts: Record<string, number> = {};
    for (const row of result.results ?? []) counts[row.shop_id] = row.n;
    return json(request, { counts });
  }

  const result = await d.prepare(
    `SELECT shop_id, device_id, nickname, rating, body, created_at
     FROM shop_reviews WHERE shop_id = ? ORDER BY created_at DESC LIMIT ?`
  ).bind(shop, LIMIT).all<Row>();

  const rows = result.results ?? [];
  const reviews = rows.map(row => ({
    nickname: row.nickname,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
    // 내 글이면 화면에서 수정·삭제를 열어준다.
    me: me !== null && row.device_id === me,
  }));

  return json(request, { reviews, mine: reviews.find(r => r.me) ?? null });
}

export async function POST(request: Request) {
  const device = deviceOf(request);
  if (!device) return json(request, { error: '이 브라우저에서는 후기를 남길 수 없어요.' }, 400);

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json(request, { error: '요청을 읽지 못했습니다.' }, 400);
  }

  const shop = cleanShop(body.shop);
  const rating = cleanRating(body.rating);
  const text = typeof body.body === 'string' ? body.body.trim().slice(0, 200) : '';

  if (!shop) return json(request, { error: '가게 값이 올바르지 않습니다.' }, 400);
  if (!rating) return json(request, { error: '별점을 골라주세요.' }, 400);
  if (!text) return json(request, { error: '후기를 한 줄이라도 적어주세요.' }, 400);

  const d = await db();
  if (!d) return json(request, { ok: true, localPreview: true });

  await d.prepare(
    `INSERT INTO shop_reviews (shop_id, device_id, nickname, rating, body, created_at)
     VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)
     ON CONFLICT(shop_id, device_id) DO UPDATE SET
       nickname=excluded.nickname, rating=excluded.rating,
       body=excluded.body, created_at=CURRENT_TIMESTAMP`
  ).bind(shop, device, cleanNickname(body.nickname), rating, text).run();

  return json(request, { ok: true });
}

// 내 후기 지우기. 개인정보처리방침의 삭제 권리와 짝이다.
export async function DELETE(request: Request) {
  const device = deviceOf(request);
  const shop = cleanShop(new URL(request.url).searchParams.get('shop'));
  if (!device || !shop) return json(request, { error: '요청 값이 올바르지 않습니다.' }, 400);

  const d = await db();
  if (!d) return json(request, { ok: true, localPreview: true });

  await d.prepare('DELETE FROM shop_reviews WHERE shop_id = ? AND device_id = ?').bind(shop, device).run();
  return json(request, { ok: true });
}

export const OPTIONS = preflight;
