'use client';
import { useMemo, useState } from 'react';

/** page.tsx 의 RecordItem 중 그래프가 실제로 읽는 필드만. */
type Entry = { result: string; amount: number; calories?: number; date: string };

const DAYS = 7;

const key = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const money = (n: number) => n.toLocaleString('ko-KR');

type Bar = { date: string; label: string; amount: number; calories: number };

function Chart({ bars, unit, tone, total }: { bars: Bar[]; unit: string; tone: 'money' | 'kcal'; total: number }) {
  const values = bars.map(b => (tone === 'money' ? b.amount : b.calories));
  const peak = Math.max(...values, 0);
  return (
    <section className={`chart chart-${tone}`}>
      <header>
        <b><i aria-hidden />{tone === 'money' ? '절약 금액' : '아낀 칼로리'}</b>
        <span>전체 <strong>{money(total)}{unit}</strong></span>
      </header>
      <div className="chart-bars">
        {bars.map((bar, i) => {
          const value = values[i];
          // 값이 0이면 눈금만 남기고, 아니면 최대값 대비 높이를 준다.
          const height = peak > 0 ? Math.max(4, Math.round((value / peak) * 100)) : 3;
          return (
            <div key={bar.date} className="chart-bar">
              {value > 0 && <em>{money(value)}</em>}
              <i style={{ height: `${height}%` }} className={value > 0 ? '' : 'is-empty'} />
            </div>
          );
        })}
      </div>
      <div className="chart-axis">
        {bars.map(bar => <small key={bar.date}>{bar.label}</small>)}
      </div>
    </section>
  );
}

export default function SavingsChart({ records }: { records: Entry[] }) {
  const [open, setOpen] = useState(true);
  // new Date() 를 렌더 중에 부르면 리렌더마다 값이 달라진다. 처음 한 번만 잡는다.
  const [today] = useState(() => key(new Date()));
  const [days] = useState<{ date: string; label: string }[]>(() => {
    const now = new Date();
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (DAYS - 1 - i));
      return { date: key(d), label: `${d.getMonth() + 1}. ${d.getDate()}.` };
    });
  });

  const { bars, todayAmount, todayCalories, totalAmount, totalCalories, weekAmount, weekCalories } = useMemo(() => {
    const saved = records.filter(r => r.result === 'saved');
    const bars: Bar[] = days.map(d => {
      const ofDay = saved.filter(r => r.date === d.date);
      return {
        ...d,
        amount: ofDay.reduce((sum, r) => sum + r.amount, 0),
        calories: ofDay.reduce((sum, r) => sum + (r.calories ?? 0), 0),
      };
    });
    const ofToday = saved.filter(r => r.date === today);
    return {
      bars,
      todayAmount: ofToday.reduce((sum, r) => sum + r.amount, 0),
      todayCalories: ofToday.reduce((sum, r) => sum + (r.calories ?? 0), 0),
      totalAmount: saved.reduce((sum, r) => sum + r.amount, 0),
      totalCalories: saved.reduce((sum, r) => sum + (r.calories ?? 0), 0),
      weekAmount: bars.reduce((sum, b) => sum + b.amount, 0),
      weekCalories: bars.reduce((sum, b) => sum + b.calories, 0),
    };
  }, [records, days, today]);

  return (
    <div className="savings-report">
      <h2 className="report-heading">오늘의 절약</h2>
      <div className="report-pair">
        <article><small>오늘 아낀 돈</small><b>{money(todayAmount)}원</b></article>
        <article className="kcal"><small>오늘 아낀 칼로리</small><b>{money(todayCalories)} kcal</b></article>
      </div>

      <h2 className="report-heading">누적 절약</h2>
      <div className="report-pair">
        <article><small>누적 절약 금액</small><b>{money(totalAmount)}원</b></article>
        <article className="kcal"><small>누적 아낀 칼로리</small><b>{money(totalCalories)} kcal</b></article>
      </div>

      <button className="chart-toggle" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <div>
          <b>날짜별 절약 그래프</b>
          <small>각 날짜에 아낀 금액과 칼로리예요.</small>
        </div>
        <i className={open ? 'open' : ''} aria-hidden>⌃</i>
      </button>

      {open && <>
        <Chart bars={bars} unit="원" tone="money" total={weekAmount} />
        <Chart bars={bars} unit=" kcal" tone="kcal" total={weekCalories} />
      </>}
    </div>
  );
}
