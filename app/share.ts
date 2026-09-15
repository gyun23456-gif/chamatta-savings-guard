// 초대 문구 공유.
//
// 웹에서는 브라우저 공유 시트(navigator.share)를 쓰고, 안 되면 클립보드에 복사한다.
// 토스 미니앱 웹뷰에서는 브라우저 공유가 없거나 링크가 tossmini.com 을 가리켜 받은
// 사람이 열 수 없으므로, toss/main.tsx 가 SDK 공유(toss/share.ts)를 여기 꽂는다.
// 구조는 app/rewarded-ad.ts 와 같다 — 토스 SDK 를 화면 코드로 끌어오지 않기 위해서다.

/** shared: 공유 시트를 거침 · copied: 클립보드에 복사 · cancelled: 사용자가 닫음 · failed: 둘 다 안 됨 */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export type Sharer = (text: string) => Promise<ShareOutcome>;

const webShare: Sharer = async text => {
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: '참았다!', text, url });
      return 'shared';
    } catch (error) {
      // 사용자가 시트를 닫으면 AbortError 다. 그건 공유가 아니므로 보상하지 않는다.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
};

let provided: Sharer | null = null;

export const provideSharer = (sharer: Sharer) => { provided = sharer; };

export const shareInvite: Sharer = text => (provided ?? webShare)(text);
