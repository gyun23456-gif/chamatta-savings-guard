// 절약 랭킹의 기기 쪽 절반.
//
// 이 앱의 기록은 기본적으로 기기 밖으로 나가지 않는다. 랭킹은 그 원칙에서
// 유일하게 벗어나는 기능이라 기본값이 "참여 안 함"이고, 사용자가 직접 켜야
// 닉네임과 절약 합계가 올라간다. 끄면 서버에 있던 줄도 지운다.

const DEVICE_KEY = 'chamatta-device-v1';
const OPTIN_KEY = 'chamatta-rank-optin-v1';

export type RankRow = {
  rank: number; nickname: string;
  amount: number; calories: number; count: number; me: boolean;
};
export type Period = 'week' | 'month';

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

export const isJoined = (): boolean => {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem(OPTIN_KEY) === 'yes'; } catch { return false; }
};

export const setJoined = (joined: boolean) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(OPTIN_KEY, joined ? 'yes' : 'no'); } catch { /* 저장이 막혀도 이번 세션은 그대로 쓴다 */ }
};

const pad = (n: number) => String(n).padStart(2, '0');

export const monthKeyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

/** ISO 주차. 목요일이 속한 해를 그 주의 해로 친다. */
export const weekKeyOf = (d: Date) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // 월=1 … 일=7 로 바꾼 뒤 그 주의 목요일로 옮긴다.
  const weekday = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad(week)}`;
};

export type Totals = {
  weekAmount: number; weekCalories: number; weekCount: number;
  monthAmount: number; monthCalories: number; monthCount: number;
};

type Entry = { result: string; amount: number; calories?: number; date: string };

/** 참은 기록만 골라 이번 주·이번 달 합계를 낸다. */
export const totalsOf = (records: Entry[], now: Date): Totals => {
  const week = weekKeyOf(now);
  const month = monthKeyOf(now);
  const saved = records.filter(r => r.result === 'saved');
  const sum = (rows: Entry[]) => ({
    amount: rows.reduce((s, r) => s + r.amount, 0),
    calories: rows.reduce((s, r) => s + (r.calories ?? 0), 0),
    count: rows.length,
  });
  const inWeek = saved.filter(r => weekKeyOf(new Date(`${r.date}T00:00:00`)) === week);
  const inMonth = saved.filter(r => r.date.slice(0, 7) === month);
  const w = sum(inWeek); const m = sum(inMonth);
  return {
    weekAmount: w.amount, weekCalories: w.calories, weekCount: w.count,
    monthAmount: m.amount, monthCalories: m.calories, monthCount: m.count,
  };
};

export const fetchRanks = async (period: Period, key: string, device: string | null): Promise<RankRow[]> => {
  const params = new URLSearchParams({ period, key });
  if (device) params.set('device', device);
  const response = await fetch(`/api/ranking?${params}`);
  if (!response.ok) return [];
  const payload = await response.json() as { ranks?: RankRow[] };
  return payload.ranks ?? [];
};

export const publishRank = async (
  device: string, nickname: string, now: Date, totals: Totals,
): Promise<boolean> => {
  const response = await fetch('/api/ranking', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device, nickname,
      weekKey: weekKeyOf(now), monthKey: monthKeyOf(now),
      ...totals,
    }),
  });
  return response.ok;
};

export const withdrawRank = async (device: string): Promise<boolean> => {
  const response = await fetch(`/api/ranking?device=${encodeURIComponent(device)}`, { method: 'DELETE' });
  return response.ok;
};
