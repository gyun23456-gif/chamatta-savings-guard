// 보상형 광고의 자리.
//
// 광고 SDK 는 토스 미니앱에만 있다. 화면 코드(app/)는 워커 웹과 같이 쓰므로 여기서
// SDK 를 직접 불러오면 서버 렌더링 번들에 토스 브리지가 섞인다. 그래서 화면은 이
// 자리만 알고, 실제 구현은 toss/main.tsx 가 시작할 때 꽂아 넣는다
// (toss/rewarded-ad.ts). 아무도 꽂지 않는 웹에서는 늘 "광고 없음"이다.

/** rewarded: 끝까지 봐서 보상 확정 · closed: 중간에 닫음 · failed: 불러오기·표시 실패 */
export type RewardedAdOutcome = 'rewarded' | 'closed' | 'failed';

export type RewardedAd = {
  /** 이 환경에서 광고를 띄울 수 있는지. 광고 그룹 ID 가 없거나 토스 앱이 오래됐으면 false. */
  available: () => boolean;
  /**
   * 광고를 불러와 보여준다. 보상이 확정되는 순간 onReward 를 한 번 부르고,
   * 광고가 닫히거나 실패하면 결과를 돌려준다. 보상은 onReward 에서만 준다.
   */
  show: (onReward: () => void) => Promise<RewardedAdOutcome>;
};

let provided: RewardedAd | null = null;

export const provideRewardedAd = (ad: RewardedAd) => { provided = ad; };

/** 지금 쓸 수 있는 광고. 없으면 null — 버튼을 막고 이유를 보여준다. */
export const rewardedAd = (): RewardedAd | null => (provided?.available() ? provided : null);

/** 광고 구현이 꽂혔는지. 토스 미니앱이면 true, 워커 웹이면 false. */
export const hasAdRuntime = () => provided !== null;
