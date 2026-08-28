'use client';
import { useEffect, useRef, useState } from 'react';
import { useT } from './i18n';

// 배달 화면의 지도 버전. 기존 화면(DeliveryJourney)과 단계·문구는 같고 장면만 다르다.
//
// 실제 지도 타일을 쓰지 않는다. 개인정보처리방침에 위치정보를 요구하지 않는다고
// 적어둔 데다, 배달 자체가 가상이라 진짜 좌표를 띄울 이유가 없다. 대신 도로와
// 블록을 그린 가상의 동네 위로 경로를 따라간다. 외부 요청도 API 키도 없다.

const stages = [
  { icon: '🧾', title: '가상 주문을 접수했어요', text: '지금부터 실제 결제 없이 마음을 식혀봐요.', label: '접수' },
  { icon: '🍳', title: '상점이 메뉴를 준비하고 있어요', text: '먹고 싶은 마음은 파도처럼 지나갈 수 있어요.', label: '준비' },
  { icon: '🛵', title: '가상 배달이 오고 있어요', text: '라이더도 음식도 실제로 출발하지 않았어요.', label: '이동' },
  { icon: '🏡', title: '배달 대신 절약이 도착했어요', text: '오늘도 돈과 칼로리를 함께 지켰습니다.', label: '절약' },
];

// 상점(왼쪽 위)에서 집(오른쪽 아래)까지. 마커가 이 선을 따라 움직인다.
const ROUTE = 'M 46 44 L 46 96 L 132 96 L 132 150 L 262 150 L 262 186';
const PROGRESS = [0, 34, 72, 100];

const money = (n: number) => n.toLocaleString('ko-KR');

export default function DeliveryMap({
  amount, calories, pace, onComplete, onCancel,
}: { amount: number; calories: number; pace: string; onComplete: () => void; onCancel: () => void }) {
  const t = useT();
  const [stage, setStage] = useState(0);
  const routeRef = useRef<SVGPathElement>(null);
  const [rider, setRider] = useState({ x: 46, y: 44 });

  // offset-path 는 SVG <text> 에서 먹지 않는다(인라인 값이 계산값에 반영되지 않음).
  // 경로 길이를 직접 재서 좌표를 구하고 transform 으로 옮긴다.
  useEffect(() => {
    const path = routeRef.current;
    if (!path) return;
    const point = path.getPointAtLength(path.getTotalLength() * (PROGRESS[stage] / 100));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the position can only be measured from the rendered path.
    setRider({ x: point.x, y: point.y });
  }, [stage]);

  useEffect(() => {
    if (stage >= 3) return;
    const timer = setTimeout(() => setStage(s => s + 1), pace === '빠르게 정리' ? 1600 : 3000);
    return () => clearTimeout(timer);
  }, [stage, pace]);

  return (
    <div className="delivery-journey delivery-map-view">
      <header>
        <button onClick={onCancel} aria-label="뒤로">‹</button>
        <div><small>{t('100% 가상 체험')}</small><h1>{t('마음 식히는 중')}</h1></div>
        <span>{stage + 1}/4</span>
      </header>

      <section className="map-scene">
        <svg className="map-canvas" viewBox="0 0 320 220" role="img" aria-label="가상 배달 경로">
          <rect className="map-ground" x="0" y="0" width="320" height="220" rx="20" />
          {/* 블록 몇 개로 동네처럼 보이게만 한다. 실제 지형이 아니다. */}
          <g className="map-blocks">
            <rect x="14" y="14" width="58" height="46" rx="7" />
            <rect x="88" y="14" width="74" height="46" rx="7" />
            <rect x="178" y="14" width="60" height="46" rx="7" />
            <rect x="254" y="14" width="52" height="46" rx="7" />
            <rect x="14" y="112" width="88" height="52" rx="7" />
            <rect x="152" y="66" width="86" height="60" rx="7" />
            <rect x="254" y="66" width="52" height="60" rx="7" />
            <rect x="14" y="180" width="88" height="26" rx="7" />
            <rect x="152" y="180" width="76" height="26" rx="7" />
          </g>
          <g className="map-roads">
            <line x1="0" y1="96" x2="320" y2="96" />
            <line x1="0" y1="150" x2="320" y2="150" />
            <line x1="46" y1="0" x2="46" y2="220" />
            <line x1="132" y1="0" x2="132" y2="220" />
            <line x1="262" y1="0" x2="262" y2="220" />
          </g>
          <path className="map-route" d={ROUTE} ref={routeRef} />
          <path className="map-route-done" d={ROUTE} pathLength={100} style={{ strokeDashoffset: 100 - PROGRESS[stage] }} />
          <g className="map-pin map-pin-shop"><circle cx="46" cy="44" r="13" /></g>
          <g className="map-pin map-pin-home"><circle cx="262" cy="186" r="13" /></g>
          <text className="map-emoji" x="46" y="49" textAnchor="middle">🏪</text>
          <text className="map-emoji" x="262" y="191" textAnchor="middle">🏡</text>
          <text className="map-rider" textAnchor="middle" style={{ transform: `translate(${rider.x}px, ${rider.y}px)` }}>🛵</text>
        </svg>
      </section>

      <div className="journey-status">
        <span>{stages[stage].icon}</span>
        <h2>{t(stages[stage].title)}</h2>
        <p>{t(stages[stage].text)}</p>
        <div className="journey-progress"><i style={{ width: `${(stage + 1) * 25}%` }} /></div>
        <small>{stage < 3 ? `${pace} · 다음 단계로 이동 중` : t('가상 배달 완료')}</small>
      </div>

      <div className="journey-steps">
        {stages.map((x, i) => (
          <div className={i <= stage ? 'active' : ''} key={x.title}>
            <span>{x.icon}</span><small>{t(x.label)}</small>
          </div>
        ))}
      </div>

      {stage === 3 ? (
        <section className="journey-result">
          <div><small>{t('이번에 지킨 돈')}</small><b>{money(amount)}원</b></div>
          <div><small>{t('피한 예상 열량')}</small><b>{money(calories)} kcal</b></div>
          <button onClick={onComplete}>{t('절약 결과 확인하기')}</button>
        </section>
      ) : (
        <button className="journey-skip" onClick={() => setStage(3)}>{t('기다림 건너뛰기')}</button>
      )}
    </div>
  );
}
