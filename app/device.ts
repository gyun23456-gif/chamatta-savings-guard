// 이 기기를 가리키는 값과, 운영자 키.
//
// 서버로 나가는 신원은 이 두 가지뿐이다. 계정도 비밀번호도 없다.
//
// 기기 값은 앱을 처음 열 때 만들어 localStorage 에 둔다. 만들기만 해서는
// 아무 데도 가지 않는다. 후기를 쓰거나 랭킹에 참여할 때만 서버로 보낸다.

const DEVICE_KEY = 'chamatta-device-v1';
const ADMIN_KEY = 'chamatta-admin-key-v1';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const randomId = (n = 24) => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint8Array(n);
    crypto.getRandomValues(buf);
    return [...buf].map(b => ALPHABET[b % ALPHABET.length]).join('');
  }
  return Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
};

/** 이 기기를 가리키는 임의의 값. 계정이 아니라서 사람과 이어지지 않는다. */
export const deviceId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(DEVICE_KEY);
    if (saved && /^[A-Za-z0-9_-]{8,64}$/.test(saved)) return saved;
    const made = randomId();
    localStorage.setItem(DEVICE_KEY, made);
    return made;
  } catch {
    return null;
  }
};

/** 서버 요청에 붙일 신원 헤더. 기기 값을 못 읽으면 빈 객체라 서버가 거절한다. */
export const deviceHeaders = (): Record<string, string> => {
  const id = deviceId();
  return id ? { 'x-chamatta-device': id } : {};
};

/** 운영자 키. 이 기기에만 저장되고 서버로는 헤더로만 나간다. */
export const adminKey = (): string => {
  if (typeof window === 'undefined') return '';
  try { return localStorage.getItem(ADMIN_KEY) ?? ''; } catch { return ''; }
};

export const setAdminKey = (key: string) => {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) localStorage.setItem(ADMIN_KEY, trimmed);
    else localStorage.removeItem(ADMIN_KEY);
  } catch { /* 저장이 막혀도 이번 세션은 그대로 쓴다 */ }
};

/** 운영자 요청 헤더. 키가 없으면 붙이지 않아 서버가 403 을 준다. */
export const adminHeaders = (): Record<string, string> => {
  const key = adminKey();
  return key ? { 'x-chamatta-admin': key } : {};
};
