// Cloudflare Workers bindings for this project.
//
// 개발용 바인딩은 vite.config.ts 의 `localBindingConfig` 에, 배포용은
// wrangler.deploy.jsonc 에 적혀 있다. `wrangler types` 가 읽을 단일 설정 파일이
// 없어서 이 파일을 손으로 맞춘다. 두 곳을 바꿀 때 여기도 함께 고칠 것.
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    // 운영자 센터(/api/admin/*)를 여는 공유 비밀키.
    //   npx wrangler secret put ADMIN_KEY --config wrangler.deploy.jsonc
    // 비워두면 운영자 기능은 아무에게도 열리지 않는다.
    ADMIN_KEY?: string;
  }
}
