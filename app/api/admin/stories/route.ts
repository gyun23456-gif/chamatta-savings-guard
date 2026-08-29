import { storySchema } from '../../../../db/schema';
import { isAdmin } from '../../_identity';

// 운영자 센터의 후기 쪽.
//
// 예전에는 ADMIN_USER_IDS 에 적힌 ChatGPT 사용자 식별값으로 운영자를 가렸다.
// 그 헤더가 더는 오지 않아 지금은 공유 비밀키(ADMIN_KEY)를 쓴다.
// 키는 Cloudflare 시크릿으로 넣는다:  wrangler secret put ADMIN_KEY

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function context() {
  try {
    const { env } = await import('cloudflare:workers');
    const db = env.DB as D1Database;
    await db.batch(storySchema.map(sql => db.prepare(sql)));
    return { db, secret: env.ADMIN_KEY };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const ctx = await context();
  if (!ctx) return json({ admin: false, stories: [], localPreview: true });
  if (!await isAdmin(request, ctx.secret)) return json({ error: '운영자 권한이 필요합니다.' }, 403);

  const result = await ctx.db.prepare(
    `SELECT id,nickname,title,body,goal,amount,period,tag,status,featured,report_count AS reportCount,created_at AS createdAt
     FROM stories
     ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'hidden' THEN 1 ELSE 2 END, created_at DESC
     LIMIT 100`
  ).all();

  return json({ admin: true, stories: result.results });
}

export async function PATCH(request: Request) {
  const ctx = await context();
  if (!ctx) return json({ error: '로컬 미리보기에서는 사용할 수 없습니다.' }, 503);
  if (!await isAdmin(request, ctx.secret)) return json({ error: '운영자 권한이 필요합니다.' }, 403);

  const input = await request.json() as { id?: string; action?: 'approve' | 'hide' | 'feature' | 'unfeature' };
  if (!input.id || !input.action) return json({ error: '잘못된 요청입니다.' }, 400);

  if (input.action === 'approve') await ctx.db.prepare(`UPDATE stories SET status='approved' WHERE id=?`).bind(input.id).run();
  if (input.action === 'hide') await ctx.db.prepare(`UPDATE stories SET status='hidden' WHERE id=?`).bind(input.id).run();
  if (input.action === 'feature') await ctx.db.prepare(`UPDATE stories SET status='approved',featured=1 WHERE id=?`).bind(input.id).run();
  if (input.action === 'unfeature') await ctx.db.prepare(`UPDATE stories SET featured=0 WHERE id=?`).bind(input.id).run();

  return json({ message: '처리되었습니다.' });
}
