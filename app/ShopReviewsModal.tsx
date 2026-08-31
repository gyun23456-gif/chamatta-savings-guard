'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { deviceHeaders, deviceId } from './device';
import { Energy, REVIEW_BONUS, earn } from './energy';
import { req } from './net';

// 가게별 후기.
//
// 목표 달성 후기(StoryModal)와 다르다. 그쪽은 "제주도 다녀왔어요" 같은 달성기이고,
// 이건 가게 하나를 두고 "여기 참길 잘했다" 를 남기는 자리다.
//
// 한 기기가 한 가게에 하나만 쓴다. 다시 쓰면 덮어쓰기다. 그래서 에너지는
// 처음 쓸 때만 준다. 고쳐 쓰기를 반복해 에너지를 계속 받아가면 안 되기 때문이다.

type Review = { nickname: string; rating: number; body: string; createdAt: string; me: boolean };

const STARS = [1, 2, 3, 4, 5];

// 2026-08-31T09:12:00Z 같은 값을 "8월 31일" 로 줄인다.
const dayOf = (iso: string) => {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function ShopReviewsModal({
  shopId, shopName, nickname, energy, onEnergy, onChanged, onClose,
}: {
  shopId: string;
  shopName: string;
  nickname: string;
  energy: Energy | null;
  onEnergy: (next: Energy) => void;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);

  const mine = reviews.find(r => r.me) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const device = deviceId();
      const query = device ? `?shop=${encodeURIComponent(shopId)}&device=${encodeURIComponent(device)}` : `?shop=${encodeURIComponent(shopId)}`;
      const response = await req(`/api/shop-reviews${query}`);
      const payload = await response.json() as { reviews?: Review[] };
      setReviews(payload.reviews ?? []);
    } catch {
      setReviews([]);
    }
    setLoading(false);
  }, [shopId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load() 는 fetch 가 끝난 뒤에야 상태를 바꾼다. 규칙이 await 너머를 보지 못한다.
  useEffect(() => { load(); }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!rating) return setNotice('별점을 골라주세요.');
    if (!body.trim()) return setNotice('한 줄이라도 적어주세요.');

    // 저장하기 전에 새 글인지 봐둔다. 저장 뒤에는 구분이 안 된다.
    const isFirst = mine === null;

    setBusy(true); setNotice('');
    try {
      const response = await req('/api/shop-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...deviceHeaders() },
        body: JSON.stringify({ shop: shopId, nickname, rating, body: body.trim() }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) { setBusy(false); return setNotice(payload.error ?? '올리지 못했어요.'); }
    } catch {
      setBusy(false);
      return setNotice('네트워크 상태를 확인해주세요.');
    }
    setBusy(false);
    setEditing(false);

    // 처음 남길 때만 에너지를 준다. 고쳐 쓰기로는 받을 수 없다.
    if (isFirst && energy) {
      onEnergy(earn(energy, REVIEW_BONUS));
      setNotice(`후기 고마워요. 에너지 ${REVIEW_BONUS}개를 받았어요.`);
    } else {
      setNotice('후기를 수정했어요.');
    }

    await load();
    onChanged();
  };

  const remove = async () => {
    setBusy(true); setNotice('');
    try {
      await req(`/api/shop-reviews?shop=${encodeURIComponent(shopId)}`, {
        method: 'DELETE',
        headers: deviceHeaders(),
      });
    } catch { /* 목록을 다시 불러오면 실패가 드러난다 */ }
    setBusy(false);
    setRating(0); setBody(''); setEditing(false);
    setNotice('후기를 지웠어요. 에너지는 돌려받지 않아요.');
    await load();
    onChanged();
  };

  const startEdit = () => {
    if (mine) { setRating(mine.rating); setBody(mine.body); }
    setEditing(true); setNotice('');
  };

  const showForm = editing || mine === null;

  return (
    <div className="modal-backdrop">
      <section className="modal-sheet review-sheet">
        <header>
          <div>
            <span>SHOP REVIEWS</span>
            <h2>{shopName}</h2>
            <p>여기서 참아본 사람들의 한 줄이에요.</p>
          </div>
          <button onClick={onClose} aria-label="닫기">×</button>
        </header>

        {showForm ? (
          <form className="review-form" onSubmit={submit}>
            <div className="review-stars">
              {STARS.map(n => (
                <button
                  key={n}
                  type="button"
                  className={n <= rating ? 'on' : ''}
                  onClick={() => { setRating(n); setNotice(''); }}
                  aria-label={`별 ${n}개`}
                >★</button>
              ))}
            </div>
            <textarea
              maxLength={200}
              value={body}
              onChange={e => { setBody(e.target.value); setNotice(''); }}
              placeholder="참길 잘했나요? 다음에 또 참을 수 있게 한 줄 남겨주세요."
            />
            <small className="review-count">{body.length}/200</small>
            <button className="submit-button" disabled={busy || !rating || !body.trim()}>
              {mine ? '후기 수정하기' : `후기 남기고 에너지 ${REVIEW_BONUS}개 받기`}
            </button>
            {mine && <button type="button" className="review-cancel" onClick={() => { setEditing(false); setNotice(''); }}>취소</button>}
          </form>
        ) : (
          <div className="review-mine">
            <b>내가 남긴 후기</b>
            <p className="review-stars-read">{'★'.repeat(mine.rating)}<span>{'★'.repeat(5 - mine.rating)}</span></p>
            <p>{mine.body}</p>
            <div>
              <button type="button" onClick={startEdit}>수정</button>
              <button type="button" className="review-remove" onClick={remove} disabled={busy}>지우기</button>
            </div>
          </div>
        )}

        {notice && <p className="review-notice">{notice}</p>}

        <div className="review-list">
          {loading ? (
            <p className="review-empty">불러오는 중이에요.</p>
          ) : reviews.length === 0 ? (
            <p className="review-empty">아직 후기가 없어요. 첫 후기를 남겨보세요.</p>
          ) : (
            reviews.map((r, i) => (
              <article key={`${r.nickname}-${i}`} className={r.me ? 'mine' : ''}>
                <header>
                  <b>{r.nickname}{r.me && <em>나</em>}</b>
                  <span>{'★'.repeat(r.rating)}</span>
                  <small>{dayOf(r.createdAt)}</small>
                </header>
                <p>{r.body}</p>
              </article>
            ))
          )}
        </div>

        <p className="review-note">
          후기에는 <b>닉네임과 별점, 내용</b>만 올라가요. 무엇을 참았는지나 계좌 정보는
          올라가지 않습니다. 한 가게에 하나만 쓸 수 있고, 다시 쓰면 이전 것을 덮어써요.
        </p>
      </section>
    </div>
  );
}
