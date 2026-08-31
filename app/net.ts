// API 요청을 한 곳으로 모은다.
//
// 워커에 올린 웹에서는 API 가 같은 출처라 경로만 있으면 됐다. 그런데 토스
// 미니앱은 번들만 *.tossmini.com 에서 돌고 API 는 여전히 이 워커가 받는다.
// 그 빌드에서만 절대 주소를 앞에 붙여야 한다.
//
// __API_BASE__ 는 vite.toss.config.ts 의 define 이 심는다. 워커 빌드에는
// 그 값이 없으므로 typeof 검사에서 걸러져 빈 문자열이 되고, 지금까지와
// 똑같이 상대경로로 나간다.
declare const __API_BASE__: string | undefined;

const BASE = typeof __API_BASE__ === 'string' ? __API_BASE__ : '';

/** fetch 와 인자가 같다. 경로 앞에 필요한 만큼만 주소를 붙인다. */
export const req = (path: string, init?: RequestInit) => fetch(BASE + path, init);

/**
 * 토스 미니앱 번들인지. 두 빌드에서 다르게 굴어야 하는 것들을 가른다.
 * 지금은 서비스워커가 그렇다 — 미니앱은 토스가 번들을 통째로 갱신하므로
 * 우리가 따로 캐시를 쥐고 있으면 옛 화면이 남는다.
 */
export const IN_TOSS = BASE !== '';
