// 교차 출처 허용.
//
// 앱인토스 미니앱은 우리 도메인이 아니라 *.tossmini.com 에서 돌아간다.
// 번들만 토스가 가져가고 API 는 여전히 이 워커가 받으므로, 브라우저가
// 교차 출처 요청으로 취급한다. 허용 헤더가 없으면 후기·랭킹이 전부 막힌다.
//
// 문서마다 허용해야 할 호스트를 다르게 적어놨다(apps.tossmini.com 과
// web.tossmini.com). 어느 쪽이 맞는지 확정될 때까지 tossmini.com 하위를
// 통째로 받는다. 토스 소유 도메인이라 위험하지 않다.

const ALLOWED = [
  /^https:\/\/([a-z0-9-]+\.)*tossmini\.com$/,
  /^https:\/\/chamatta\.gyun23456\.workers\.dev$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

/** 허용 목록에 있는 출처일 때만 헤더를 돌려준다. 아니면 빈 객체다. */
export const cors = (request: Request): Record<string, string> => {
  const origin = request.headers.get('Origin');
  if (!origin || !ALLOWED.some(re => re.test(origin))) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    // 출처에 따라 응답이 달라지므로 캐시가 섞이지 않게 알린다.
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-chamatta-device, x-chamatta-admin',
    'Access-Control-Max-Age': '86400',
  };
};

/** 모든 API 응답은 이걸 쓴다. 캐시 금지와 CORS 를 한자리에서 붙인다. */
export const json = (request: Request, body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...cors(request) },
  });

/** 프리플라이트. Content-Type: application/json 을 보내면 브라우저가 먼저 묻는다. */
export const preflight = (request: Request) =>
  new Response(null, { status: 204, headers: cors(request) });
