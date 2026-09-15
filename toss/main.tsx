// 토스 미니앱 진입점.
//
// 워커에 올리는 웹은 vinext 가 layout.tsx 로 감싸주지만, 토스에 올리는 건
// index.html 하나로 시작하는 정적 번들이다. 그래서 layout.tsx 가 하던 일
// (전역 CSS, 언어 컨텍스트, html lang) 을 여기서 대신한다.
//
// 화면 코드는 app/ 을 그대로 가져다 쓴다. 두 빌드가 같은 UI 를 보게 하려는
// 것이고, 그래야 한쪽만 고치는 실수가 안 생긴다.

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { closeView, graniteEvent } from '@apps-in-toss/web-framework';
import '../app/globals.css';
import { goBack, useBackLayer } from '../app/back';
import { provideRewardedAd } from '../app/rewarded-ad';
import { tossRewardedAd } from './rewarded-ad';
import { provideSharer } from '../app/share';
import { tossShare } from './share';
import { LangProvider } from '../app/i18n';
import Home from '../app/page';
import PolicyBody from '../app/privacy/PolicyBody';

// 에너지 화면의 "보상형 광고 보기"가 쓸 광고. 워커 웹에는 이 줄이 없어 광고가 없다.
provideRewardedAd(tossRewardedAd);
// 초대 공유는 토스 공유 시트와 토스에서 열리는 링크로 보낸다.
provideSharer(tossShare);

// 라우터라고 할 것도 없는 두 화면짜리 전환.
//
// 미니앱은 index.html 하나만 올라가므로 /privacy 로 진짜 이동하면 404 다.
// 그래서 내부 링크 클릭을 가로채 주소만 바꾸고 화면을 갈아끼운다.
// 뒤로가기는 popstate 로 받는다.
function App() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);

    const onClick = (event: MouseEvent) => {
      // 새 탭·다운로드·수정키 조합은 브라우저에 맡긴다.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      // 같은 출처의 절대경로만 가로챈다. mailto: 와 외부 링크는 그대로 둔다.
      if (!href || !href.startsWith('/')) return;
      if (anchor.target && anchor.target !== '_self') return;

      event.preventDefault();
      window.history.pushState(null, '', href);
      setPath(href);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', onPop);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('click', onClick);
    };
  }, []);

  // 시스템 뒤로가기.
  //
  // 앱인토스는 backEvent 를 구독하는 순간 기본 동작(미니앱 종료)을 막는다. 그래서
  // 열린 화면이 있으면 하나 닫고, 더 닫을 게 없을 때만 closeView 로 직접 나간다.
  // 구독하지 않았을 때는 어느 화면에서 누르든 앱이 종료돼 검토에서 반려됐다.
  useEffect(() => {
    try {
      return graniteEvent.addEventListener('backEvent', {
        onEvent: () => { if (!goBack()) void closeView(); },
      });
    } catch {
      // 토스 밖(브라우저로 번들을 열어본 경우)에는 브리지가 없다. 뒤로가기는 브라우저에 맡긴다.
      return undefined;
    }
  }, []);

  // 방침 화면은 주소를 바꿔 들어오지만 뒤로가기는 위 스택으로 받는다. 홈으로 되돌린다.
  const onPrivacy = path.startsWith('/privacy');
  useBackLayer(onPrivacy, () => {
    window.history.replaceState(null, '', '/');
    setPath('/');
  });

  return onPrivacy ? <PolicyBody /> : <Home />;
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <LangProvider>
        <App />
      </LangProvider>
    </StrictMode>,
  );
}
