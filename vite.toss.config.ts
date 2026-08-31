import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// 앱인토스 미니앱용 빌드.
//
// 워커에 올리는 웹(vite.config.ts)과 별개다. 그쪽은 vinext 가 서버 렌더링을
// 하는 워커 번들을 만들고, 이쪽은 index.html 하나로 시작하는 정적 SPA 를
// 만든다. 앱인토스가 webBundleDir 에 index.html 이 있기를 요구해서다.
//
// 화면 코드(app/)는 두 빌드가 공유한다. 갈라지는 건 진입점과 이 설정뿐이다.
export default defineConfig({
  root: 'toss',
  // 음식 이미지·아이콘이 여기 있다. 프로젝트 루트 기준이 아니라 root 기준이라 ../ 다.
  publicDir: '../public',
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: {
    alias: {
      // PolicyBody 가 쓰는 next/link 를 평범한 <a> 로 바꿔치기한다.
      'next/link': fileURLToPath(new URL('./toss/next-link.tsx', import.meta.url)),
    },
  },
  define: {
    // net.ts 가 이 값을 읽어 API 를 절대주소로 부른다. 미니앱은 *.tossmini.com
    // 에서 돌기 때문에 상대경로로는 우리 워커에 닿지 못한다.
    __API_BASE__: JSON.stringify('https://chamatta.gyun23456.workers.dev'),
  },
  build: {
    outDir: '../dist-toss',
    emptyOutDir: true,
    // 미니앱은 번들 루트에서 열리므로 절대경로 자산 참조가 그대로 맞는다.
    assetsDir: 'assets',
  },
});
