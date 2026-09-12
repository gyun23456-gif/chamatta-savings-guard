# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 이 저장소

`참았다!` — 충동소비 방어 웹앱. 배달앱을 흉내 낸 가상 상점에서 결제 직전까지 가본 뒤 참으면 그 금액이 절약 기록으로 쌓인다.

하나의 화면 코드(`app/`)에서 세 가지가 나온다: **Cloudflare Worker 웹**(라이브: `chamatta.gyun23456.workers.dev`), **앱인토스 미니앱**, **안드로이드 TWA**(`android-twa/`, 깃 제외).

주석은 한국어로 "무엇"이 아니라 **"왜"** 를 적는 스타일이다. 새 코드도 그렇게 맞춘다.

## 명령어

```bash
pnpm dev            # 개발 서버 (3000번, .claude/launch.json)
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint
pnpm seed:local     # 로컬 D1 에 데모 행 넣기 (dev 를 한 번 돌린 뒤, 중지한 상태에서)
pnpm deploy         # typecheck → vinext build → wrangler deploy
pnpm deploy:check   # 배포 없이 dry-run
pnpm toss:deploy    # typecheck → vite build(토스) → ait build → ait deploy
pnpm db:sql <파일>  # 원격 D1 에 SQL 실행
```

테스트 프레임워크가 없다. **`pnpm typecheck` 가 유일한 자동 검증이다.**

`pnpm` 이 PATH 에 없을 수 있다(2026-09-12 기준 이 개발 PC 가 그렇다). `node_modules` 만 있으면 설치 없이 바이너리를 직접 부르면 된다 — `.\node_modules\.bin\tsc.cmd --noEmit`, `.\node_modules\.bin\vite.cmd build --config vite.toss.config.ts`, `.\node_modules\.bin\ait.cmd build`.

`eslint` 는 타입을 보지 않고 `vinext build` 도 타입 검사를 하지 않는다. 컴파일되지 않는 모듈이 lint 0 에러로 배포돼 `/api/ranking` 과 `/api/ads` 가 며칠간 500 을 뱉은 적이 있다(`cbb1bf3`). 그래서 두 배포 스크립트 모두 앞에 `typecheck` 를 붙여놨다. **배포 스크립트를 우회해 `wrangler deploy` 를 직접 부르지 말 것.**

## 두 개의 빌드, 하나의 화면 코드

가장 먼저 이해해야 할 구조다. `app/` 의 컴포넌트는 두 빌드가 그대로 공유하고, 갈라지는 것은 진입점과 설정뿐이다.

| | 웹 (Worker) | 앱인토스 미니앱 |
|---|---|---|
| 설정 | `vite.config.ts` (vinext + Cloudflare 플러그인) | `vite.toss.config.ts` (`root: 'toss'`) |
| 진입점 | `app/layout.tsx` (SSR) | `toss/main.tsx` (정적 SPA) |
| 산출물 | `dist/` | `dist-toss/` → `chamatta.ait` |

미니앱은 `index.html` 하나로 시작하므로 `layout.tsx` 가 없다. `toss/main.tsx` 가 그 자리에서 전역 CSS·`LangProvider`·`<html lang>` 을 대신하고, `/privacy` 는 진짜 이동이 아니라 클릭을 가로채 화면만 갈아끼운다. `next/link` 는 `toss/next-link.tsx` 로 alias 되어 평범한 `<a>` 가 된다.

**API 는 어느 빌드에서든 이 워커가 받는다.** 미니앱 번들은 `*.tossmini.com` 에서 돌기 때문에 상대경로로는 닿지 못한다. `vite.toss.config.ts` 의 `define` 이 심는 `__API_BASE__` 를 `app/net.ts` 가 읽어 주소를 붙인다.

- 네트워크 호출은 항상 `app/net.ts` 의 **`req()`** 를 쓴다. 날 `fetch` 를 쓰면 미니앱에서만 조용히 깨진다.
- 빌드별로 갈라야 하면 `IN_TOSS` 를 본다. 지금은 서비스워커 등록이 그렇다(미니앱은 토스가 번들을 통째로 갱신하므로 캐시를 쥐면 옛 화면이 남는다).
- `app/` 에 화면을 추가하면 **두 빌드 모두** 확인한다.

## 데이터 (Cloudflare D1)

- 라우트가 `await import('cloudflare:workers')` 로 `env.DB` 를 가져온다. try/catch 로 감싸 실패 시 `null` 을 돌려주므로, D1 없이도 앱은 뜨고 해당 기능만 막힌다.
- **표는 마이그레이션이 아니라 라우트가 요청마다 스스로 만든다.** `db/schema.ts` 의 SQL 문자열 배열을 `db.batch()` 로 실행한다. 새 표를 추가할 때는 `db/schema.ts` 에 넣고 라우트 진입부에서 batch 하면 로컬은 그대로 동작한다.
- `drizzle/*.sql` 은 원격 D1 을 처음 세울 때 쓰는 기록이다. **drizzle ORM 은 쓰지 않는다.**
- 모든 API 응답은 `app/api/_cors.ts` 의 **`json(request, body, status)`** 로 낸다. `no-store` 와 CORS 헤더가 여기 한자리에 있다. `OPTIONS` 는 `preflight()`.

## 신원 — 이 앱에는 계정이 없다

- 로그인도 이메일 수집도 없다. `app/device.ts` 가 만든 난수를 `x-chamatta-device` 헤더로 보내고, 서버는 `app/api/_identity.ts` 의 `deviceOf()` 로 **형식만** 검사한다.
- 그래서 랭킹 숫자는 누구나 지어낼 수 있다. 서버는 상한(`MAX_AMOUNT` 등)으로 장난만 걸러내고 화면에 "기기 기준 집계"라고 밝힌다. **이걸 신뢰 경계로 착각하지 말 것.**
- 운영자는 공유 비밀 `ADMIN_KEY` 로 가른다(`wrangler secret put ADMIN_KEY`). 키가 없거나 16자 미만이면 운영자 기능은 아무에게도 열리지 않는다. 앱에서는 설정 화면의 버전 번호를 **일곱 번** 눌러 입력한다. 비교는 양쪽을 SHA-256 해시한 뒤 한다.
- 절약 기록·에너지·언어 설정은 전부 `localStorage` 다. 서버로 가지 않는다.

## 번역 — 한국어 원문이 곧 키다

`t('안 쓴 돈이 보이기 시작한다.')` 처럼 **한국어 문자열 자체가 사전 키**이고, `app/locales.ts` 의 `translate()` 는 사전에 없으면 원문을 그대로 돌려준다. 즉 **JSX 안의 한국어를 고치면 en·ja·zh 번역이 조용히 끊긴다.** 문구를 바꾸면 `locales*.ts` 의 키도 같이 바꾼다.

사전은 영역별로 쪼개져 있다: `locales.ts`(앱 셸) · `-menu` · `-desc` · `-options` · `-content` · `-privacy`.

## 개인정보처리방침

`app/privacy/PolicyBody.tsx` + `app/locales-privacy.ts`. 법적 고지라 문장 하나하나가 약속이 된다. **수집 항목이 달라지는 변경을 하면 방침도 같은 커밋에서 고친다.**

루트의 `개인정보처리방침-수정안.md` 는 아직 앱에 반영하지 않은 검토용 초안이다(승인 대기).

## 에너지 (하루 사용 제한)

`app/energy.ts` — 앱을 켠 날마다 3 지급, 가상 주문 1회당 3 소모. 즉 **무료 사용자는 하루 한 번**이다. 무제한이면 "참는" 경험이 흐려져서 의도적으로 둔 제약이다. 보상형 광고(+3)와 3,300원 무제한 해제는 UI 에 있지만 "앱 스토어 버전 준비 중"이라 **아직 동작하지 않는다** — 웹 버전에는 현재 광고도 결제도 없다.

## 함정

- `wrangler.deploy.jsonc` 첫머리 주석의 "현재 라이브 사이트는 이 파일을 쓰지 않는다"는 **오래된 설명이다.** 지금은 `pnpm deploy` 가 이 파일을 쓰고, 그게 라이브다.
- 파일명이 `wrangler.jsonc` 가 아닌 이유: 그 이름이면 개발 서버의 Cloudflare 플러그인이 자동으로 읽어 `nodejs_compat` 플래그가 중복되고 `pnpm dev` 가 죽는다. 항상 `--config` 로 명시한다.
- `app/page.tsx` 는 JSX 를 한 줄에 길게 이어 쓰는 밀집 스타일이다(494줄). 이 파일을 고칠 때는 주변 밀도에 맞춘다.
