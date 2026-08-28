// 가상 주문에 쓰는 에너지.
//
// 주문을 무제한으로 돌리면 "참는" 경험이 흐려지기 때문에 하루에 쓸 수 있는
// 횟수를 제한한다. 에너지는 앱을 켠 날마다 자동 지급되고, 추천 코드·리뷰로
// 더 모을 수 있다.
//
// 전부 기기 저장이다. 로그인해도 서버로 올라가지 않는다.

const KEY = 'chamatta-energy-v1';

export const ORDER_COST = 3;      // 가상 주문 1회
export const DAILY_GRANT = 3;     // 앱을 켠 날마다
export const REFERRAL_BONUS = 6;  // 추천 코드를 입력했을 때
export const REVIEW_BONUS = 1;    // 후기를 남겼을 때
export const AD_BONUS = 3;        // 보상형 광고를 끝까지 봤을 때

export type Energy = {
  count: number;
  /** 마지막으로 일일 지급을 한 날(YYYY-MM-DD). 하루 한 번만 준다. */
  lastGrant: string;
  /** 남에게 알려주는 내 코드 */
  code: string;
  /** 내가 입력한 남의 코드. 한 번만 쓸 수 있다. */
  usedCode: string | null;
  /** 내 코드를 등록한 사람 수 */
  invited: number;
  /** 결제로 무제한 해제 */
  unlimited: boolean;
};

const day = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 헷갈리기 쉬운 0/O, 1/I 는 뺀다. 사람이 불러주고 받아적는 코드다.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const makeCode = () => {
  const pick = (n: number) => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint8Array(n);
      crypto.getRandomValues(buf);
      return [...buf].map(b => ALPHABET[b % ALPHABET.length]).join('');
    }
    // crypto 가 없는 환경(구형 웹뷰)에서도 코드는 나와야 한다.
    return Array.from({ length: n }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  };
  return pick(6);
};

export const blankEnergy = (): Energy => ({
  count: DAILY_GRANT,
  lastGrant: day(),
  code: makeCode(),
  usedCode: null,
  invited: 0,
  unlimited: false,
});

/**
 * 저장된 값을 읽고, 날짜가 바뀌었으면 일일 에너지를 얹어서 돌려준다.
 * 서버 렌더링 중에는 localStorage 가 없으므로 null 을 준다.
 */
export const loadEnergy = (): Energy | null => {
  if (typeof window === 'undefined') return null;
  let stored: Partial<Energy> | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) stored = JSON.parse(raw) as Partial<Energy>;
  } catch {
    // 값이 깨졌으면 새로 시작한다. 에너지 때문에 앱이 멈추면 안 된다.
  }
  if (!stored) return blankEnergy();

  const base: Energy = {
    count: Number.isFinite(stored.count) ? Math.max(0, Number(stored.count)) : DAILY_GRANT,
    lastGrant: typeof stored.lastGrant === 'string' ? stored.lastGrant : '',
    code: typeof stored.code === 'string' && stored.code ? stored.code : makeCode(),
    usedCode: typeof stored.usedCode === 'string' ? stored.usedCode : null,
    invited: Number.isFinite(stored.invited) ? Math.max(0, Number(stored.invited)) : 0,
    unlimited: stored.unlimited === true,
  };

  const today = day();
  if (base.lastGrant !== today) return { ...base, count: base.count + DAILY_GRANT, lastGrant: today };
  return base;
};

export const saveEnergy = (energy: Energy) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(energy));
  } catch {
    // 저장공간이 막힌 브라우저에서도 이번 세션은 그대로 쓸 수 있게 둔다.
  }
};

export const canOrder = (energy: Energy | null) =>
  !!energy && (energy.unlimited || energy.count >= ORDER_COST);

export const spend = (energy: Energy, amount = ORDER_COST): Energy =>
  energy.unlimited ? energy : { ...energy, count: Math.max(0, energy.count - amount) };

export const earn = (energy: Energy, amount: number): Energy => ({
  ...energy,
  count: energy.count + Math.max(0, amount),
});

export const normalizeCode = (raw: string) => raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

export type CodeResult = { ok: true; energy: Energy } | { ok: false; reason: string };

/** 남의 추천 코드를 등록한다. 자기 코드나 두 번째 입력은 막는다. */
export const applyCode = (energy: Energy, raw: string): CodeResult => {
  const code = normalizeCode(raw);
  if (code.length !== 6) return { ok: false, reason: '추천 코드는 6자리예요.' };
  if (code === energy.code) return { ok: false, reason: '내 코드는 등록할 수 없어요.' };
  if (energy.usedCode) return { ok: false, reason: '추천 코드는 한 번만 등록할 수 있어요.' };
  return { ok: true, energy: { ...earn(energy, REFERRAL_BONUS), usedCode: code } };
};
