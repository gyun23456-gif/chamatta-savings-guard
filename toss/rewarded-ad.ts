import { Environment, loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import type { RewardedAd, RewardedAdOutcome } from '../app/rewarded-ad';

// 앱인토스 콘솔 > 인앱 광고 > "에너지 충전 보상형"(리워드 / 에너지 3개)의 광고 그룹 ID.
//
// 2026-09-12 에 그룹을 만들었고, ID 는 구글 광고 시스템에 반영된 뒤에 콘솔에 나온다.
// 비어 있는 동안 실제 토스 앱에서는 버튼이 "준비 중"으로 남는다. 콘솔 주소창에 보이는
// ait.v2.live.… 값은 콘솔 내부 식별자일 수 있으니, 그룹 상세의 "광고 그룹 ID" 값을 넣을 것.
const LIVE_AD_GROUP_ID = '';

// 앱인토스 문서가 안내하는 테스트용 리워드 광고. QR 테스트(sandbox)에서만 쓴다.
// 실제 토스 앱(toss)에 이 값이 나가면 테스트 광고가 사용자에게 보이므로 섞지 않는다.
const TEST_AD_GROUP_ID = 'ait-ad-test-rewarded-id';

// 불러오기가 이만큼 걸리면 포기한다. 광고를 보는 시간에는 적용하지 않는다.
const LOAD_TIMEOUT_MS = 15_000;

const adGroupId = (): string | null => {
  try {
    return Environment.environment === 'toss' ? (LIVE_AD_GROUP_ID || null) : TEST_AD_GROUP_ID;
  } catch {
    return null;
  }
};

const supported = () => {
  try {
    return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported();
  } catch {
    // 토스 밖에서는 브리지가 없어 예외가 난다.
    return false;
  }
};

export const tossRewardedAd: RewardedAd = {
  available: () => supported() && adGroupId() !== null,

  // 순서는 문서대로 load → loaded 를 받은 뒤 같은 ID 로 show.
  // 광고는 한 번 보여주면 끝이라 누를 때마다 새로 불러온다.
  show: onReward => new Promise<RewardedAdOutcome>(resolve => {
    const id = adGroupId();
    if (!id) return resolve('failed');

    let settled = false;
    let rewarded = false;
    const subscriptions: (() => void)[] = [];

    const finish = (outcome: RewardedAdOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      for (const stop of subscriptions) { try { stop(); } catch { /* 이미 끝난 구독 */ } }
      resolve(outcome);
    };
    // 보상을 이미 줬다면 그 뒤의 오류는 사용자에게 실패로 보여줄 이유가 없다.
    const fail = () => finish(rewarded ? 'rewarded' : 'failed');

    const timer = setTimeout(fail, LOAD_TIMEOUT_MS);

    try {
      subscriptions.push(loadFullScreenAd({
        options: { adGroupId: id },
        onEvent: event => {
          if (event.type !== 'loaded' || settled) return;
          clearTimeout(timer);
          try {
            subscriptions.push(showFullScreenAd({
              options: { adGroupId: id },
              onEvent: shown => {
                // 문서: 보상은 userEarnedReward 에서만 준다. dismissed 는 끝까지 안 봐도 온다.
                if (shown.type === 'userEarnedReward' && !rewarded) {
                  rewarded = true;
                  onReward();
                } else if (shown.type === 'dismissed') {
                  finish(rewarded ? 'rewarded' : 'closed');
                } else if (shown.type === 'failedToShow') {
                  fail();
                }
              },
              onError: fail,
            }));
          } catch {
            fail();
          }
        },
        onError: fail,
      }));
    } catch {
      fail();
    }
  }),
};
