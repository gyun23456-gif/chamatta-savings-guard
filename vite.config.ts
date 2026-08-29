import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

// 개발 서버가 쓰는 로컬 바인딩.
//
// 예전에는 .openai/hosting.json 을 읽고 @openai/sites-vite-plugin 을 끼웠다.
// 둘 다 ChatGPT Sites 배포용이라 걷어냈다. 실제 배포 설정은
// wrangler.deploy.jsonc 에 있고, 여기 값은 로컬 미리보기 전용이다.
//
// D1 은 로컬에서 임시 데이터베이스를 만들어 쓴다. 아래 id 는 자리표시자이고
// 실제 데이터베이스 id 는 wrangler.deploy.jsonc 에만 적힌다.
const LOCAL_D1_PLACEHOLDER = '00000000-0000-4000-8000-000000000000';

const localBindingConfig = {
  main: 'vinext/server/app-router-entry',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: [
    {
      binding: 'DB',
      database_name: 'chamatta-db-local',
      database_id: LOCAL_D1_PLACEHOLDER,
    },
  ],
};

export default defineConfig(async () => {
  // Wrangler·Miniflare 가 남기는 파일을 프로젝트 안에 묶어둔다. 비밀값이 아니라
  // 도구 설정이다. 애플리케이션 환경변수는 무시 목록에 있는 .env* 에 둘 것.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler 는 Cloudflare 플러그인을 불러오는 순간 로그 경로를 붙잡는다.
  // 그래서 위 설정을 끝낸 뒤에 불러온다.
  const { cloudflare } = await import('@cloudflare/vite-plugin');

  return {
    css: { postcss: { plugins: [tailwindcss()] } },
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: localBindingConfig,
      }),
    ],
  };
});
