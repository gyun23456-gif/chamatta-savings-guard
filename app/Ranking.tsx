'use client';
import { useCallback, useEffect, useState } from 'react';
import { useT, useWon } from './i18n';
import {
  Period, RankRow, Totals,
  deviceId, fetchRanks, isJoined, monthKeyOf, publishRank, setJoined, totalsOf, weekKeyOf, withdrawRank,
} from './rank-store';

type Entry = { result: string; amount: number; calories?: number; date: string };

const money = (n: number) => n.toLocaleString('ko-KR');

// 닉네임 첫 글자로 아바타를 만든다. 캐릭터 이미지가 없어도 줄이 구분된다.
const TINTS = ['#c0272d', '#e2620f', '#2f8a5b', '#3b6fb5', '#8a4fbf', '#b8862a'];
const tintOf = (name: string) =>
  TINTS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TINTS.length];

export default function Ranking({ records, nickname }: { records: Entry[]; nickname: string }) {
  const won = useWon();
  const t = useT();
  const [period, setPeriod] = useState<Period>('week');
  const [rows, setRows] = useState<RankRow[]>([]);
  const [joined, setJoinedState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  // 렌더 중에 new Date() 를 부르면 주차가 리렌더마다 흔들린다.
  const [now] = useState(() => new Date());

  const key = period === 'week' ? weekKeyOf(now) : monthKeyOf(now);

  const load = useCallback(async () => {
    try { setRows(await fetchRanks(period, key, deviceId())); }
    catch { setRows([]); }
  }, [period, key]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is unavailable during SSR, so the opt-in flag must be read in an effect.
    setJoinedState(isJoined());
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() only sets state after the fetch resolves; the rule cannot see past the await.
  useEffect(() => { load(); }, [load]);

  // 참여 중이면 화면을 볼 때마다 내 합계를 갱신해 둔다.
  useEffect(() => {
    if (!joined) return;
    const device = deviceId();
    if (!device) return;
    const totals: Totals = totalsOf(records, now);
    publishRank(device, nickname, now, totals).then(ok => { if (ok) load(); });
  }, [joined, records, nickname, now, load]);

  const join = async () => {
    const device = deviceId();
    if (!device) return setNotice('이 브라우저에서는 랭킹에 참여할 수 없어요.');
    setBusy(true); setNotice('');
    const ok = await publishRank(device, nickname, now, totalsOf(records, now));
    setBusy(false);
    if (!ok) return setNotice('지금은 순위를 올리지 못했어요. 잠시 후 다시 시도해주세요.');
    setJoined(true); setJoinedState(true); load();
  };

  const leave = async () => {
    const device = deviceId();
    setBusy(true); setNotice('');
    if (device) await withdrawRank(device);
    setBusy(false);
    setJoined(false); setJoinedState(false); setNotice('랭킹에서 내 기록을 지웠어요.'); load();
  };

  return (
    <section className="rank-block">
      <header>
        <div>
          <h2>{t('절약 랭킹')}</h2>
          <p>{t('참여한 기기끼리 모은 순위예요.')}</p>
        </div>
        <div className="rank-period">
          <button className={period === 'week' ? 'on' : ''} onClick={() => setPeriod('week')}>{t('주간')}</button>
          <button className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>{t('월간')}</button>
        </div>
      </header>

      {rows.length > 0 ? (
        <ol className="rank-list">
          {rows.map(row => (
            <li key={`${row.rank}-${row.nickname}`} className={row.me ? 'me' : ''}>
              <b className="rank-no">{row.rank}</b>
              <span className="rank-face" style={{ background: tintOf(row.nickname) }}>{[...row.nickname][0] ?? '?'}</span>
              <div>
                <b>{row.nickname}{row.me && <em>{t('나')}</em>}</b>
                <small>{money(row.count)}번 참음 · {money(row.calories)} kcal</small>
              </div>
              <strong>{won(row.amount)}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rank-empty">
          {t(joined ? '아직 이번 기간에 올라온 기록이 없어요.' : '참여하면 다른 사람들의 순위도 함께 볼 수 있어요.')}
        </p>
      )}

      {joined ? (
        <button className="rank-leave" onClick={leave} disabled={busy}>{t('랭킹에서 빠지기')}</button>
      ) : (
        <button className="rank-join" onClick={join} disabled={busy}>{t('랭킹 참여하기')}</button>
      )}

      <p className="rank-note">
        참여하면 <b>닉네임과 절약 합계·참은 횟수</b>만 서버로 올라가요. 무엇을 참았는지, 계좌나
        메모는 올라가지 않습니다. 계정이 아니라 기기 단위라 같은 사람이 여러 기기를 쓰면 따로
        집계돼요. 빠지기를 누르면 올렸던 기록도 지워집니다.
      </p>
      {notice && <p className="rank-notice">{notice}</p>}
    </section>
  );
}
