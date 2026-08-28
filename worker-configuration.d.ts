// Cloudflare Workers bindings for this project.
//
// There is no wrangler.toml here: bindings are declared inline in vite.config.ts
// (see `localBindingConfig`) and driven by .openai/hosting.json, so `wrangler types`
// has nothing to read. Keep this file in sync with those two.
declare namespace Cloudflare {
  interface Env {
    // .openai/hosting.json -> "d1": "DB"
    DB: D1Database;
    // Comma-separated user ids allowed to reach /api/admin/*.
    ADMIN_USER_IDS?: string;
  }
}
