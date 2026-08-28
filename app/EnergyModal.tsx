'use client';
import { FormEvent, useState } from 'react';
import {
  AD_BONUS, DAILY_GRANT, Energy, ORDER_COST, REFERRAL_BONUS, REVIEW_BONUS,
  applyCode, normalizeCode,
} from './energy';

type Props = {
  energy: Energy;
  onChange: (next: Energy) => void;
  onClose: () => void;
  /** 후기 작성 화면을 연다. 후기를 올리면 호출한 쪽에서 에너지를 준다. */
  onWriteReview: () => void;
};

export default function EnergyModal({ energy, onChange, onClose, onWriteReview }: Props) {
  const [codeOpen, setCodeOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [shared, setShared] = useState('');

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    const result = applyCode(energy, input);
    if (!result.ok) return setError(result.reason);
    onChange(result.energy);
    setCodeOpen(false);
    setInput('');
    setError('');
  };

  const share = async () => {
    const text = `참았다! 에서 배달 충동을 참아보세요.\n제 추천 코드: ${energy.code}`;
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: '참았다!', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setShared('초대 문구를 복사했어요. 친구에게 붙여넣어 보내주세요.');
    } catch {
      // 공유 시트를 닫은 경우도 여기로 온다. 실패로 취급하지 않는다.
      setShared(`추천 코드 ${energy.code} 를 friend 에게 알려주세요.`);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal-sheet energy-sheet" role="dialog" aria-modal="true" aria-label="에너지 충전">
        <div className="modal-handle" />
        <header>
          <div>
            <span>가상 주문 에너지</span>
            <h2>에너지 충전</h2>
          </div>
          <button onClick={onClose} aria-label="닫기">×</button>
        </header>

        <p className="energy-mycode">
          내 추천 코드 <b>{energy.code}</b> · {energy.invited}명 등록
        </p>

        <div className="energy-balance">
          <span aria-hidden>⚡</span>
          <div>
            <small>현재 에너지</small>
            <b>{energy.unlimited ? '무제한' : `${energy.count}개`}</b>
          </div>
          <i>1 주문하기 = ⚡ {ORDER_COST}</i>
        </div>

        <p className="energy-rule">
          가상 주문 1번마다 에너지 {ORDER_COST}개가 필요해요.<br />
          앱을 켠 날마다 {DAILY_GRANT}개씩 지급됩니다.
        </p>

        {codeOpen ? (
          <form className="energy-code-form" onSubmit={submitCode}>
            <label>
              <span>추천 코드 입력</span>
              <input
                autoFocus
                value={input}
                onChange={e => { setInput(normalizeCode(e.target.value)); setError(''); }}
                placeholder="예: FWNNH7"
                inputMode="text"
                maxLength={6}
              />
            </label>
            {error && <p className="energy-error">{error}</p>}
            <div className="energy-code-actions">
              <button type="button" onClick={() => { setCodeOpen(false); setError(''); }}>취소</button>
              <button type="submit" className="submit-button">등록하고 +{REFERRAL_BONUS} 받기</button>
            </div>
          </form>
        ) : (
          <button
            className="energy-row energy-row-code"
            onClick={() => setCodeOpen(true)}
            disabled={!!energy.usedCode}
          >
            <span aria-hidden>👤</span>
            <div>
              <b>추천 코드</b>
              <small>{energy.usedCode ? `${energy.usedCode} 등록 완료` : '나중에 하기를 눌렀다면 여기서 다시 입력할 수 있어요.'}</small>
            </div>
            <i>{energy.usedCode ? '✓' : '›'}</i>
          </button>
        )}

        <button className="energy-row" onClick={share}>
          <span aria-hidden>💬</span>
          <div>
            <b>친구에게 공유하고 충전</b>
            <small>초대 링크와 추천 코드를 보내세요.<br />친구가 코드 입력 시 에너지 {REFERRAL_BONUS}개를 받아요.</small>
          </div>
          <i className="energy-plus">+{REFERRAL_BONUS}</i>
        </button>
        {shared && <p className="energy-note">{shared}</p>}

        <button className="energy-row" onClick={onWriteReview}>
          <span aria-hidden>✍️</span>
          <div>
            <b>후기 쓰고 충전</b>
            <small>목표를 이룬 후기를 남기면 에너지 {REVIEW_BONUS}개를 받아요.</small>
          </div>
          <i className="energy-plus">+{REVIEW_BONUS}</i>
        </button>

        <button className="energy-row energy-row-off" disabled>
          <span aria-hidden>▶</span>
          <div>
            <b>보상형 광고 보기</b>
            <small>광고를 끝까지 보면 에너지 {AD_BONUS}개를 받아요.<br />앱 스토어 버전에서 준비 중이에요.</small>
          </div>
          <i className="energy-plus">+{AD_BONUS}</i>
        </button>

        <button className="energy-row energy-row-off energy-row-paid" disabled>
          <span aria-hidden>∞</span>
          <div>
            <b>무제한 에너지 &amp; 광고 제거</b>
            <small>결제 한 번으로 무제한 에너지와 광고 제거를 모두 이용할 수 있어요.<br />앱 스토어 버전에서 준비 중이에요.</small>
          </div>
          <i>₩3,300</i>
        </button>

        <p className="energy-footnote">
          에너지는 이 기기에만 저장돼요. 앱 데이터를 지우면 함께 사라집니다.
        </p>
      </section>
    </div>
  );
}
