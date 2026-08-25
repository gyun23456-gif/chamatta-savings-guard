'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Tab = 'home' | 'history' | 'stats' | 'goals';
type Result = 'saved' | 'spent';
type RecordItem = { id: string; category: string; amount: number; memo: string; result: Result; date: string };
type Goal = { id: string; name: string; amount: number; emoji: string };
type AppData = { records: RecordItem[]; goals: Goal[] };

const categories = [
  { id: '배달', icon: '🍜', color: '#ffefdc' }, { id: '카페', icon: '☕', color: '#e9e1d7' },
  { id: '쇼핑', icon: '🛍️', color: '#f2e5ff' }, { id: '택시', icon: '🚕', color: '#fff3c7' },
  { id: '게임/앱결제', icon: '🎮', color: '#dfeeff' }, { id: '술자리', icon: '🍺', color: '#ffe8b5' },
  { id: '기타', icon: '✨', color: '#e9efe5' },
];
const emptyData: AppData = { records: [], goals: [] };
const money = (n: number) => n.toLocaleString('ko-KR');
const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monthKey = () => dateKey().slice(0, 7);
const getCategory = (id: string) => categories.find(c => c.id === id) ?? categories[6];

export default function Home() {
  const [tab, setTab] = useState<Tab>('home');
  const [data, setData] = useState<AppData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [success, setSuccess] = useState<RecordItem | null>(null);
  const [historyDate, setHistoryDate] = useState(dateKey());

  useEffect(() => {
    try { const stored = localStorage.getItem('chamatta-data-v1'); if (stored) setData(JSON.parse(stored)); } catch { /* start clean */ }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem('chamatta-data-v1', JSON.stringify(data)); }, [data, loaded]);

  const saved = data.records.filter(r => r.result === 'saved');
  const monthRecords = data.records.filter(r => r.date.startsWith(monthKey()));
  const monthSavedRecords = monthRecords.filter(r => r.result === 'saved');
  const monthSaved = monthSavedRecords.reduce((sum, r) => sum + r.amount, 0);
  const todaySaved = saved.filter(r => r.date === dateKey()).reduce((sum, r) => sum + r.amount, 0);
  const totalSaved = saved.reduce((sum, r) => sum + r.amount, 0);
  const defenseRate = monthRecords.length ? Math.round(monthSavedRecords.length / monthRecords.length * 100) : 0;
  const streak = useMemo(() => {
    const days = new Set(saved.map(r => r.date)); let count = 0; const cursor = new Date();
    if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(dateKey(cursor))) { count++; cursor.setDate(cursor.getDate() - 1); }
    return count;
  }, [saved]);

  const addRecord = (record: Omit<RecordItem, 'id'>) => {
    const item = { ...record, id: crypto.randomUUID() };
    setData(prev => ({ ...prev, records: [item, ...prev.records] })); setRecordOpen(false);
    if (item.result === 'saved') setSuccess(item); else setTab('history');
  };
  const addGoal = (goal: Omit<Goal, 'id'>) => { setData(prev => ({ ...prev, goals: [...prev.goals, { ...goal, id: crypto.randomUUID() }] })); setGoalOpen(false); };
  const removeRecord = (id: string) => setData(prev => ({ ...prev, records: prev.records.filter(r => r.id !== id) }));

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={() => setTab('home')} aria-label="홈으로"><span>ㅊ</span><div><strong>참았다!</strong><small>안 쓴 돈이 보이기 시작한다.</small></div></button>
        <div className="streak-pill">🔥 {streak}일</div>
      </header>

      {tab === 'home' && <HomeView monthSaved={monthSaved} todaySaved={todaySaved} totalSaved={totalSaved} streak={streak} records={data.records} goals={data.goals} openRecord={() => setRecordOpen(true)} goHistory={() => setTab('history')} goGoals={() => setTab('goals')} />}
      {tab === 'history' && <HistoryView records={data.records} selectedDate={historyDate} setSelectedDate={setHistoryDate} removeRecord={removeRecord} />}
      {tab === 'stats' && <StatsView records={monthRecords} savedAmount={monthSaved} rate={defenseRate} />}
      {tab === 'goals' && <GoalsView goals={data.goals} totalSaved={totalSaved} openGoal={() => setGoalOpen(true)} removeGoal={(id) => setData(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))} />}

      <nav className="bottom-nav" aria-label="주요 메뉴">
        <NavButton label="홈" icon="⌂" active={tab === 'home'} onClick={() => setTab('home')} />
        <NavButton label="내역" icon="◷" active={tab === 'history'} onClick={() => setTab('history')} />
        <button className="nav-action" onClick={() => setRecordOpen(true)} aria-label="새 기록"><span>＋</span></button>
        <NavButton label="통계" icon="▥" active={tab === 'stats'} onClick={() => setTab('stats')} />
        <NavButton label="목표" icon="◇" active={tab === 'goals'} onClick={() => setTab('goals')} />
      </nav>

      {recordOpen && <RecordModal onClose={() => setRecordOpen(false)} onSubmit={addRecord} />}
      {goalOpen && <GoalModal onClose={() => setGoalOpen(false)} onSubmit={addGoal} />}
      {success && <SuccessModal record={success} total={totalSaved} streak={streak} onClose={() => setSuccess(null)} />}
    </main>
  );
}

function NavButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) { return <button className={active ? 'active' : ''} onClick={onClick}><span>{icon}</span>{label}</button>; }

function HomeView({ monthSaved, todaySaved, totalSaved, streak, records, goals, openRecord, goHistory, goGoals }: { monthSaved: number; todaySaved: number; totalSaved: number; streak: number; records: RecordItem[]; goals: Goal[]; openRecord: () => void; goHistory: () => void; goGoals: () => void }) {
  const goal = goals[0]; const percent = goal ? Math.min(100, Math.round(totalSaved / goal.amount * 100)) : 0;
  return <div className="page home-page">
    <section className="hero-card">
      <div className="hero-copy"><span className="eyebrow">이번 달 방어 금액</span><h1>{money(monthSaved)}<small>원</small></h1><p>{monthSaved ? '좋아요. 작은 선택들이 모이고 있어요.' : '첫 소비 유혹을 막고 기록해보세요.'}</p></div>
      <div className="shield" aria-hidden="true"><span>✓</span></div>
      <div className="hero-bottom"><span>오늘 지킨 돈</span><b>{money(todaySaved)}원</b><span className="hero-divider" /><span>연속 방어</span><b>{streak}일</b></div>
    </section>
    <button className="primary-cta" onClick={openRecord}><span>＋</span><b>참았다!</b><small>방금 넘긴 소비 유혹 기록하기</small></button>
    {goal ? <button className="goal-card home-goal" onClick={goGoals}>
      <div className="goal-top"><div><span className="eyebrow">나의 첫 번째 목표</span><h2>{goal.emoji} {goal.name}</h2></div><b>{percent}%</b></div>
      <div className="progress"><i style={{ width: `${percent}%` }} /></div><div className="goal-numbers"><span><b>{money(totalSaved)}원</b> 지켰어요</span><span>목표 {money(goal.amount)}원</span></div>
    </button> : <button className="empty-goal" onClick={goGoals}><span>◎</span><div><b>지킨 돈에 목적지를 만들어볼까요?</b><small>여행, 비상금, 갖고 싶던 물건까지</small></div><i>›</i></button>}
    <section className="section-block"><div className="section-title"><h2>최근 기록</h2>{records.length > 0 && <button onClick={goHistory}>전체 보기</button>}</div>{records.length ? <RecordList records={records.slice(0, 4)} /> : <Empty icon="🌱" title="아직 기록이 없어요" text="오늘 참은 작은 소비부터 남겨보세요." action="첫 기록 남기기" onAction={openRecord} />}</section>
  </div>;
}

function HistoryView({ records, selectedDate, setSelectedDate, removeRecord }: { records: RecordItem[]; selectedDate: string; setSelectedDate: (v: string) => void; removeRecord: (id: string) => void }) {
  const filtered = records.filter(r => r.date === selectedDate); const saved = filtered.filter(r => r.result === 'saved').reduce((s, r) => s + r.amount, 0);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { key: dateKey(d), day: ['일','월','화','수','목','금','토'][d.getDay()], num: d.getDate() }; });
  return <div className="page"><PageHeading eyebrow="기록 보관함" title="내역" subtitle="유혹 앞에서 했던 선택을 돌아봐요." />
    <div className="week-strip">{days.map(d => <button key={d.key} className={selectedDate === d.key ? 'selected' : ''} onClick={() => setSelectedDate(d.key)}><small>{d.day}</small><b>{d.num}</b>{records.some(r => r.date === d.key) && <i />}</button>)}</div>
    <label className="date-picker">날짜 직접 선택 <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} /></label>
    <section className="day-summary"><span>{selectedDate === dateKey() ? '오늘' : selectedDate} 지킨 돈</span><b>{money(saved)}원</b><small>{filtered.length}번의 선택</small></section>
    <section className="section-block history-list"><div className="section-title"><h2>선택 기록</h2></div>{filtered.length ? <RecordList records={filtered} removable onRemove={removeRecord} /> : <Empty icon="🫧" title="이날은 기록이 없어요" text="선택한 날짜에 남긴 기록이 없습니다." />}</section>
  </div>;
}

function StatsView({ records, savedAmount, rate }: { records: RecordItem[]; savedAmount: number; rate: number }) {
  const success = records.filter(r => r.result === 'saved').length; const failed = records.length - success;
  const rows = categories.map(c => { const items = records.filter(r => r.category === c.id); return { ...c, count: items.length, saved: items.filter(r => r.result === 'saved').reduce((s, r) => s + r.amount, 0) }; }).filter(r => r.count).sort((a, b) => b.saved - a.saved);
  const max = Math.max(...rows.map(r => r.saved), 1);
  return <div className="page"><PageHeading eyebrow={`${new Date().getMonth() + 1}월 리포트`} title="나의 방어력" subtitle="참은 선택이 어떤 변화를 만들었는지 확인해요." />
    <section className="stat-hero"><div className="rate-ring" style={{ '--rate': `${rate * 3.6}deg` } as React.CSSProperties}><span><b>{rate}%</b><small>방어율</small></span></div><div><span>이번 달 지킨 돈</span><h2>{money(savedAmount)}원</h2><p>{records.length ? `${records.length}번의 유혹 중 ${success}번을 지켰어요.` : '기록을 시작하면 분석이 쌓여요.'}</p></div></section>
    <div className="score-grid"><article><span>✓</span><div><small>참았다</small><b>{success}회</b></div></article><article className="lost"><span>↘</span><div><small>결국 샀다</small><b>{failed}회</b></div></article></div>
    <section className="section-block category-stats"><div className="section-title"><h2>카테고리별 방어</h2></div>{rows.length ? rows.map(r => <div className="category-row" key={r.id}><span style={{ background: r.color }}>{r.icon}</span><div><div><b>{r.id}</b><small>{r.count}회</small></div><i><em style={{ width: `${r.saved / max * 100}%` }} /></i></div><strong>{money(r.saved)}원</strong></div>) : <Empty icon="📊" title="통계가 기다리고 있어요" text="한 번만 기록해도 분석이 시작됩니다." />}</section>
  </div>;
}

function GoalsView({ goals, totalSaved, openGoal, removeGoal }: { goals: Goal[]; totalSaved: number; openGoal: () => void; removeGoal: (id: string) => void }) {
  return <div className="page"><PageHeading eyebrow="돈의 목적지" title="목표" subtitle="안 쓴 돈을 내가 원하는 미래에 연결해요." />
    <button className="add-goal" onClick={openGoal}><span>＋</span><div><b>새 목표 만들기</b><small>목표는 여러 개 만들 수 있어요</small></div></button>
    <section className="goal-stack">{goals.length ? goals.map((g, i) => { const p = Math.min(100, Math.round(totalSaved / g.amount * 100)); return <article className="full-goal" key={g.id}><button className="delete-goal" onClick={() => removeGoal(g.id)} aria-label={`${g.name} 삭제`}>×</button><div className="goal-emoji">{g.emoji}</div><span className="eyebrow">목표 {String(i + 1).padStart(2, '0')}</span><h2>{g.name}</h2><div className="goal-big"><b>{p}%</b><span>{money(totalSaved)}원 / {money(g.amount)}원</span></div><div className="progress"><i style={{ width: `${p}%` }} /></div><p>{p >= 100 ? '목표 달성! 이제 다음 목적지를 정해볼까요?' : `앞으로 ${money(Math.max(0, g.amount - totalSaved))}원만 더 지키면 도착해요.`}</p></article>; }) : <Empty icon="🏁" title="아직 정한 목표가 없어요" text="지키고 싶은 돈의 목적지를 만들어보세요." action="첫 목표 만들기" onAction={openGoal} />}</section>
  </div>;
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) { return <header className="page-heading"><span>{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></header>; }

function RecordList({ records, removable = false, onRemove }: { records: RecordItem[]; removable?: boolean; onRemove?: (id: string) => void }) { return <div className="record-list">{records.map(item => { const cat = getCategory(item.category); return <div className="record" key={item.id}><span className="record-icon" style={{ background: cat.color }}>{cat.icon}</span><div><b>{item.memo || item.category}</b><small>{item.category} · {item.date}</small></div><strong className={item.result === 'spent' ? 'spent' : ''}>{item.result === 'saved' ? '+' : '−'}{money(item.amount)}원</strong>{removable && <button className="remove-record" onClick={() => onRemove?.(item.id)} aria-label="기록 삭제">×</button>}</div>; })}</div>; }
function Empty({ icon, title, text, action, onAction }: { icon: string; title: string; text: string; action?: string; onAction?: () => void }) { return <div className="empty-state"><span>{icon}</span><b>{title}</b><p>{text}</p>{action && <button onClick={onAction}>{action}</button>}</div>; }

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="modal-sheet" role="dialog" aria-modal="true" aria-label={title}><div className="modal-handle" /><header><div><span>새로운 선택</span><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose} aria-label="닫기">×</button></header>{children}</section></div>; }

function RecordModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: Omit<RecordItem, 'id'>) => void }) {
  const [category, setCategory] = useState('배달'); const [amount, setAmount] = useState(''); const [memo, setMemo] = useState(''); const [result, setResult] = useState<Result>('saved'); const [date, setDate] = useState(dateKey());
  const submit = (e: FormEvent) => { e.preventDefault(); const value = Number(amount.replaceAll(',', '')); if (value > 0) onSubmit({ category, amount: value, memo: memo.trim(), result, date }); };
  return <ModalShell title="어떤 소비를 넘겼나요?" subtitle="참았든 샀든, 솔직하게 남기면 충분해요." onClose={onClose}><form onSubmit={submit} className="record-form">
    <fieldset><legend>카테고리</legend><div className="category-grid">{categories.map(c => <button type="button" className={category === c.id ? 'selected' : ''} key={c.id} onClick={() => setCategory(c.id)}><span style={{ background: c.color }}>{c.icon}</span><small>{c.id}</small></button>)}</div></fieldset>
    <label className="amount-field"><span>금액</span><div><input inputMode="numeric" autoFocus value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" required /><b>원</b></div></label>
    <div className="form-row"><label><span>메모 또는 상품명 <small>선택</small></span><input value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 퇴근길 아이스 라테" maxLength={40} /></label><label><span>날짜</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label></div>
    <fieldset><legend>결과</legend><div className="result-toggle"><button type="button" className={result === 'saved' ? 'selected success-choice' : ''} onClick={() => setResult('saved')}><span>✓</span><div><b>참았다</b><small>돈을 지켰어요</small></div></button><button type="button" className={result === 'spent' ? 'selected spent-choice' : ''} onClick={() => setResult('spent')}><span>↘</span><div><b>결국 샀다</b><small>다음 선택을 위해 기록</small></div></button></div></fieldset>
    <button className="submit-button" disabled={!Number(amount)}>{result === 'saved' ? '이 선택, 방어 성공!' : '솔직하게 기록하기'}</button>
  </form></ModalShell>;
}

function GoalModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (v: Omit<Goal, 'id'>) => void }) {
  const [name, setName] = useState(''); const [amount, setAmount] = useState(''); const [emoji, setEmoji] = useState('✈️');
  const submit = (e: FormEvent) => { e.preventDefault(); const value = Number(amount); if (name.trim() && value > 0) onSubmit({ name: name.trim(), amount: value, emoji }); };
  return <ModalShell title="돈의 목적지를 정해요" subtitle="참을 때마다 목표에 한 걸음 가까워져요." onClose={onClose}><form onSubmit={submit} className="goal-form"><fieldset><legend>목표 아이콘</legend><div className="emoji-grid">{['✈️','🏡','🛟','💻','🎁','🌿'].map(e => <button type="button" key={e} className={emoji === e ? 'selected' : ''} onClick={() => setEmoji(e)}>{e}</button>)}</div></fieldset><label><span>목표 이름</span><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="예: 제주도 한 달 살기" required maxLength={30} /></label><label className="amount-field"><span>목표 금액</span><div><input inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" required /><b>원</b></div></label><button className="submit-button" disabled={!name.trim() || !Number(amount)}>목표 만들기</button></form></ModalShell>;
}

function SuccessModal({ record, total, streak, onClose }: { record: RecordItem; total: number; streak: number; onClose: () => void }) { return <div className="success-screen" role="dialog" aria-modal="true"><div className="confetti">✦ <i>●</i> ✦ <em>◆</em> ✦</div><div className="success-shield"><span>✓</span></div><span className="success-label">방어 성공</span><h2>{money(record.amount)}원</h2><p>{record.memo || record.category}의 유혹을 넘겼어요.<br/>오늘의 선택이 미래의 나를 만들어요.</p><div className="success-stats"><div><small>누적 지킨 돈</small><b>{money(total)}원</b></div><i/><div><small>연속 방어</small><b>🔥 {streak}일</b></div></div><button onClick={onClose}>좋아, 계속 지켜볼게!</button></div>; }
