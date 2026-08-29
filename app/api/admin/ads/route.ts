import { adSchema } from '../../../../db/schema';
import { isAdmin } from '../../_identity';

// 운영자 센터의 광고 쪽. 인증 방식은 admin/stories 와 같다(ADMIN_KEY 시크릿).

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

async function context() {
  try {
    const { env } = await import('cloudflare:workers');
    const db = env.DB as D1Database;
    await db.batch(adSchema.map(sql => db.prepare(sql)));
    return { db, secret: env.ADMIN_KEY };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const c = await context();
  if (!c) return json({ inquiries: [], stats: [], campaigns: [], localPreview: true });
  if (!await isAdmin(request, c.secret)) return json({ error: '운영자 권한이 필요합니다.' }, 403);

  const [i, s, a] = await c.db.batch([
    c.db.prepare(`SELECT id,brand,contact_name AS contactName,email,budget,placement,message,status,created_at AS createdAt FROM ad_inquiries ORDER BY created_at DESC LIMIT 100`),
    c.db.prepare(`SELECT campaign_id AS campaignId,event_type AS eventType,COUNT(*) AS count FROM ad_events GROUP BY campaign_id,event_type`),
    c.db.prepare(`SELECT id,brand,label,title,description,link_url AS linkUrl,placement,starts_at AS startsAt,ends_at AS endsAt,status FROM ad_campaigns ORDER BY created_at DESC`),
  ]);

  return json({ inquiries: i.results, stats: s.results, campaigns: a.results });
}

export async function POST(request: Request) {
  const c = await context();
  if (!c) return json({ error: '사용할 수 없습니다.' }, 503);
  if (!await isAdmin(request, c.secret)) return json({ error: '운영자 권한이 필요합니다.' }, 403);

  const x = await request.json() as Record<string, string>;
  if (!x.brand || !x.title || !/^https:\/\//.test(x.linkUrl ?? '')) {
    return json({ error: '브랜드, 제목, https 링크를 확인해주세요.' }, 400);
  }

  await c.db.prepare(
    `INSERT INTO ad_campaigns(id,brand,label,title,description,link_url,placement,starts_at,ends_at,status)
     VALUES(?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    crypto.randomUUID(), x.brand, x.label || 'AD · 제휴', x.title, x.description || '',
    x.linkUrl, x.placement || 'market', x.startsAt, x.endsAt, x.status || 'draft',
  ).run();

  return json({ ok: true }, 201);
}

export async function PATCH(request: Request) {
  const c = await context();
  if (!c) return json({ error: '로컬 미리보기에서는 사용할 수 없습니다.' }, 503);
  if (!await isAdmin(request, c.secret)) return json({ error: '운영자 권한이 필요합니다.' }, 403);

  const input = await request.json() as { id?: string; status?: string; kind?: string };
  if (!input.id) return json({ error: '잘못된 요청입니다.' }, 400);

  if (input.kind === 'campaign' && ['draft', 'active', 'paused'].includes(input.status ?? '')) {
    await c.db.prepare(`UPDATE ad_campaigns SET status=? WHERE id=?`).bind(input.status, input.id).run();
  } else if (['new', 'contacted', 'closed'].includes(input.status ?? '')) {
    await c.db.prepare(`UPDATE ad_inquiries SET status=? WHERE id=?`).bind(input.status, input.id).run();
  } else {
    return json({ error: '잘못된 상태입니다.' }, 400);
  }

  return json({ ok: true });
}
