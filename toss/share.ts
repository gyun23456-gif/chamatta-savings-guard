import { Share } from '@apps-in-toss/web-framework';
import type { Sharer } from '../app/share';

// 토스 미니앱의 초대 공유.
//
// 미니앱은 chamatta.apps.tossmini.com 에서 돌아서 location.origin 을 보내면 받은 사람이
// 열 수 없다. 토스 앱에서 바로 열리는 공유 링크를 만들어 붙이고, 토스의 공유 시트로 보낸다.
// 링크를 못 만들면 문구만이라도 보낸다 — 추천 코드는 문구 안에 있다.
const DEEP_LINK = 'intoss://chamatta';

export const tossShare: Sharer = async text => {
  let link = '';
  try {
    link = await Share.createLink({ path: DEEP_LINK });
  } catch {
    // 오래된 토스 앱이거나 일시적 실패. 링크 없이 진행한다.
  }
  try {
    await Share.sendMessage({ message: link ? `${text}\n${link}` : text });
    // 토스 공유 시트는 보냈는지 닫았는지를 알려주지 않는다. 열린 것을 공유로 본다.
    return 'shared';
  } catch {
    return 'failed';
  }
};
