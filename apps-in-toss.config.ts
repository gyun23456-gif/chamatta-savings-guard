import { defineConfig } from '@apps-in-toss/web-framework/config';

// 앱인토스 미니앱 설정. `ait build` 가 이 파일을 읽는다.
//
// appName 은 콘솔에서 정한 값이고 바꿀 수 없다. 딥링크(intoss://chamatta)와
// 미니앱이 실행되는 도메인(chamatta.apps.tossmini.com)이 여기서 나오며,
// 그 도메인은 app/api/_cors.ts 의 허용 목록과 맞춰져 있다.
//
// 앱 이름·아이콘·카테고리 같은 표시 정보는 이 파일이 아니라 콘솔의 앱 정보에서
// 관리한다. 그래서 여기엔 브랜드 색만 둔다.
export default defineConfig({
  appName: 'chamatta',

  brand: {
    // 앱의 빨강 테마와 같은 값. app/globals.css 의 --danger 와 맞춰둔다.
    primaryColor: '#B82024',
  },

  // 요구하는 기기 권한이 없다. 위치·연락처·사진·카메라·마이크를 쓰지 않고,
  // 기록은 전부 브라우저 저장소에만 둔다. 개인정보처리방침의 약속과 같다.
  permissions: [],

  navigationBar: {
    // 앱 안에서 자체 탭으로 이동하므로 토스 내비게이션 바는 최소로 둔다.
    withBackButton: true,
    withTitle: true,
    theme: 'light',
  },

  webView: {
    // 아래로 당겨 새로고침하면 기록이 날아간 것처럼 보여 혼란을 준다.
    // 데이터는 로컬 저장소에 있어서 실제로 지워지진 않지만 꺼둔다.
    pullToRefreshEnabled: false,
    bounces: false,
  },

  // vite.toss.config.ts 가 만드는 정적 번들 위치. index.html 이 여기 있어야 한다.
  webBundleDir: 'dist-toss',
});
