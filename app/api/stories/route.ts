import { storySchema } from '../../../db/schema';

type StoryInput = { nickname?:string; title?:string; body?:string; goal?:string; amount?:number; period?:string; tag?:string };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control':'no-store' } });
async function ready(): Promise<D1Database | null> { try { const { env } = await import('cloudflare:workers'); const db=env.DB as D1Database; await db.batch(storySchema.map(sql => db.prepare(sql))); return db; } catch { return null; } }
function user(request: Request) { return { id: request.headers.get('oai-authenticated-user-id'), email: request.headers.get('oai-authenticated-user-email') }; }

export async function GET(request: Request) {
  const current = user(request); const db = await ready(); if(!db) return json({stories:[],pending:[],signedIn:Boolean(current.id),localPreview:true});
  const approved = await db.prepare(`SELECT id,nickname,title,body,goal,amount,period,tag,featured,created_at AS createdAt,'approved' AS status FROM stories WHERE status='approved' ORDER BY featured DESC, created_at DESC LIMIT 30`).all();
  const mine = current.id ? await db.prepare(`SELECT id,nickname,title,body,goal,amount,period,tag,featured,created_at AS createdAt,status FROM stories WHERE user_id=? AND status='pending' ORDER BY created_at DESC LIMIT 10`).bind(current.id).all() : { results:[] };
  return json({ stories: approved.results, pending: mine.results, signedIn: Boolean(current.id) });
}

export async function POST(request: Request) {
  const current = user(request); if (!current.id) return json({ error:'로그인이 필요합니다.' }, 401);
  const input = await request.json() as StoryInput;
  const nickname=String(input.nickname??'').trim().slice(0,16), title=String(input.title??'').trim().slice(0,40), body=String(input.body??'').trim().slice(0,280), goal=String(input.goal??'').trim().slice(0,24), period=String(input.period??'기간 비공개').trim().slice(0,12), tag=String(input.tag??'기타').trim().slice(0,12), amount=Math.floor(Number(input.amount));
  if(!nickname||!title||!body||!goal||!Number.isFinite(amount)||amount<=0) return json({error:'필수 입력값을 확인해주세요.'},400);
  const db=await ready(); if(!db) return json({error:'로컬 미리보기에서는 기기 저장을 사용합니다.'},503); const id=crypto.randomUUID();
  await db.prepare(`INSERT INTO stories(id,user_id,user_email,nickname,title,body,goal,amount,period,tag,status) VALUES(?,?,?,?,?,?,?,?,?,?,'pending')`).bind(id,current.id,current.email,nickname,title,body,goal,amount,period,tag).run();
  return json({ id, status:'pending', message:'후기가 등록되어 승인 대기 중입니다.' },201);
}

export async function PATCH(request: Request) {
  const current=user(request); if(!current.id) return json({error:'로그인이 필요합니다.'},401);
  const body=await request.json() as {id?:string;action?:string}; if(!body.id||body.action!=='report') return json({error:'잘못된 요청입니다.'},400);
  const db=await ready(); if(!db) return json({error:'로컬 미리보기에서는 사용할 수 없습니다.'},503); await db.prepare(`UPDATE stories SET report_count=report_count+1, status=CASE WHEN report_count>=2 THEN 'hidden' ELSE status END WHERE id=? AND status='approved'`).bind(body.id).run();
  return json({message:'신고가 접수되었습니다.'});
}
