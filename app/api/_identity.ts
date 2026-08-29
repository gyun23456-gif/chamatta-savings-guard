// 로그인이 없는 앱의 신원 처리.
//
// 이 앱에는 계정이 없다. 예전에는 oai-authenticated-user-id 헤더로 사람을
// 구분했는데, 그 헤더는 ChatGPT Sites 안에서만 들어왔다. 스토어에서 받은 앱과
// 자체 도메인에는 오지 않아서 관련 기능이 전부 죽어 있었다.
//
// 그 자리를 기기 값으로 바꿨다. 기기 값은 브라우저가 스스로 만든 난수라
// 사람과 이어지지 않는다. 대신 기기를 바꾸면 서버 쪽 기록과 이어지지 않는데,
// 그건 설정 > 기록 백업(파일 내보내기)으로 옮기게 안내한다.

const DEVICE = /^[A-Za-z0-9_-]{8,64}$/;

/** 요청을 보낸 기기. 형식이 어긋나면 null 이라 호출부가 반드시 확인해야 한다. */
export const deviceOf = (request: Request): string | null => {
  const header = request.headers.get('x-chamatta-device');
  if (header && DEVICE.test(header)) return header;
  // GET·DELETE 는 본문이 없어 질의 문자열로도 받는다.
  const query = new URL(request.url).searchParams.get('device');
  return query && DEVICE.test(query) ? query : null;
};

// 운영자 확인.
//
// 기기 값은 누구나 지어낼 수 있으니 운영자 판별에는 쓸 수 없다. 공유 비밀키를
// 쓰고, 비교는 양쪽을 해시한 뒤 맞춘다. 문자열을 그대로 비교하면 몇 글자까지
// 맞았는지가 응답 시간으로 새어나갈 수 있다.
const digest = async (text: string) => {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
};

/** ADMIN_KEY 를 설정하지 않았으면 운영자 기능은 아무에게도 열리지 않는다. */
export const isAdmin = async (request: Request, secret: unknown): Promise<boolean> => {
  const key = typeof secret === 'string' ? secret : '';
  if (key.length < 16) return false;
  const given = request.headers.get('x-chamatta-admin') ?? '';
  if (!given) return false;
  return (await digest(given)) === (await digest(key));
};
