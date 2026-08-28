import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Build output and tool scratch dirs. These mirror .gitignore: they hold
  // generated/minified bundles, so linting them only produces noise.
  globalIgnores([
    '.next/**',
    '.vinext/**',
    '.site-tools/**',
    '.wrangler/**',
    'out/**',
    'build/**',
    'dist/**',
    'outputs/**',
    'android-twa/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
