import { storySchema } from '../../../db/schema';
import { deviceOf } from '../_identity';

// 목표 달성 후기. 여러 사람이 함께 보는 게시판이라 이것만은 서버에 둔다.
//
// 글쓴이는 계정이 아니라 기기로 구분한다. 그래서 기기를 바꾸면 예전에 쓴
// 승인 대기 글은 더 이상 "내 글"로 보이지 않는다. 이미 승인된 글은 모두에게
// 보이므로 영향이 없다.

type StoryInput = { nickname?: string; title?: string; body?: string; goal?: string; amount?: number; period?: string; tag?: string };

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function ready(): Promise<D1Database | null> {
  try {
    const { env } = await import('cloudflare:workers');
    const db = env.DB as D1Database;
    await db.batch(storySchema.map(sql => db.prepare(sql)));
    return db;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const device = deviceOf(request);
  const db = await ready();
  if (!db) return json({ stories: [], pending: [], localPreview: true });

  const approved = await db.prepare(
    `SELECT id,nickname,title,body,goal,amount,period,tag,featured,created_at AS createdAt,'approved' AS status
     FROM stories WHERE status='approved' ORDER BY featured DESC, created_at DESC LIMIT 30`
  ).all();

  // 승인 대기 글은 쓴 기기에서만 보인다.
  const mine = device
    ? await db.prepare(
        `SELECT id,nickname,title,body,goal,amount,period,tag,featured,created_at AS createdAt,status
         FROM stories WHERE user_id=? AND status='pending' ORDER BY created_at DESC LIMIT 10`
      ).bind(device).all()
    : { results: [] };

  return json({ stories: approved.results, pending: mine.results });
}

export async function POST(request: Request) {
  const device = deviceOf(request);
  if (!device) return json({ error: '이 브라우저에서는 후기를 올릴 수 없어요.' }, 400);

  const input = await request.json() as StoryInput;
  const nickname = String(input.nickname ?? '').trim().slice(0, 16);
  const title = String(input.title ?? '').trim().slice(0, 40);
  const body = String(input.body ?? '').trim().slice(0, 280);
  const goal = String(input.goal ?? '').trim().slice(0, 24);
  const period = String(input.period ?? '기간 비공개').trim().slice(0, 12);
  const tag = String(input.tag ?? '기타').trim().slice(0, 12);
  const amount = Math.floor(Number(input.amount));
  if (!nickname || !title || !body || !goal || !Number.isFinite(amount) || amount <= 0) {
    return json({ error: '필수 입력값을 확인해주세요.' }, 400);
  }

  const db = await ready();
  if (!db) return json({ error: '로컬 미리보기에서는 기기 저장을 사용합니다.' }, 503);

  const id = crypto.randomUUID();
  // 이메일은 더 이상 받지 않는다. 문의는 개인정보처리방침의 주소로 온다.
  await db.prepare(
    `INSERT INTO stories(id,user_id,user_email,nickname,title,body,goal,amount,period,tag,status)
     VALUES(?,?,NULL,?,?,?,?,?,?,?,'pending')`
  ).bind(id, device, nickname, title, body, goal, amount, period, tag).run();

  return json({ id, status: 'pending', message: '후기가 등록되어 승인 대기 중입니다.' }, 201);
}

// 신고. 두 번 쌓이면 자동으로 숨긴다.
export async function PATCH(request: Request) {
  const device = deviceOf(request);
  if (!device) return json({ error: '이 브라우저에서는 신고할 수 없어요.' }, 400);

  const body = await request.json() as { id?: string; action?: string };
  if (!body.id || body.action !== 'report') return json({ error: '잘못된 요청입니다.' }, 400);

  const db = await ready();
  if (!db) return json({ error: '로컬 미리보기에서는 사용할 수 없습니다.' }, 503);

  await db.prepare(
    `UPDATE stories SET report_count=report_count+1,
       status=CASE WHEN report_count>=2 THEN 'hidden' ELSE status END
     WHERE id=? AND status='approved'`
  ).bind(body.id).run();

  return json({ message: '신고가 접수되었습니다.' });
}
