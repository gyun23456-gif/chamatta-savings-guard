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
import '../app/globals.css';
import { LangProvider } from '../app/i18n';
import Home from '../app/page';
import PolicyBody from '../app/privacy/PolicyBody';

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

  return path.startsWith('/privacy') ? <PolicyBody /> : <Home />;
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
