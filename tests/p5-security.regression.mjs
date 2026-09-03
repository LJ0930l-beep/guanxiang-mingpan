import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('P5-E secret scan and production audit scripts are present and pass the current baseline', () => {
  const scan = execFileSync(process.execPath, ['scripts/scan-secrets.mjs'], { encoding: 'utf8' });
  assert.match(scan, /Secret scan passed/);
  const audit = execFileSync(process.execPath, ['scripts/production-audit.mjs'], { encoding: 'utf8' });
  assert.match(audit, /Production audit \(--omit=dev\)/);
  assert.match(readFileSync('.github/workflows/ci.yml', 'utf8'), /npm run security:scan/);
  assert.match(readFileSync('.github/workflows/ci.yml', 'utf8'), /npm run security:audit/);
});

test('P5-H EAS profiles stop at the signing boundary and contain no credentials', () => {
  const easSource = readFileSync('eas.json', 'utf8');
  const eas = JSON.parse(easSource);
  assert.deepEqual(eas, {
    build: {
      preview: { distribution: 'internal' },
      production: {},
    },
  });
  assert.doesNotMatch(easSource, /token|secret|password|projectId|ascAppId/i);
});

test('P5-G production web export verification and security headers are wired', () => {
  const verify = readFileSync('scripts/verify-web-export.mjs', 'utf8');
  assert.match(verify, /\+not-found\.html/);
  assert.match(verify, /\.routes\.json/);
  const headers = readFileSync('public/_headers', 'utf8');
  assert.match(headers, /Content-Security-Policy/);
  assert.match(headers, /X-Content-Type-Options/);
  assert.match(readFileSync('public/manifest.webmanifest', 'utf8'), /"display": "standalone"/);
  assert.match(readFileSync('public/manifest.webmanifest', 'utf8'), /favicon\.ico/);
  const serviceWorker = readFileSync('public/sw.js', 'utf8');
  assert.match(serviceWorker, /offline\.html/);
  assert.match(serviceWorker, /cache\.put\(event\.request, response\.clone\(\)\)/);
  assert.match(serviceWorker, /cached \?\? caches\.match\(OFFLINE\)/);
  assert.match(readFileSync('public/robots.txt', 'utf8'), /Disallow: \/$/m);
  assert.match(readFileSync('scripts/verify-web-export.mjs', 'utf8'), /expectedPublicFiles/);
  assert.match(readFileSync('src/app/+html.tsx', 'utf8'), /lang="zh-CN"/);
  assert.match(readFileSync('src/app/+html.tsx', 'utf8'), /name="description"/);
});

test('P5-F local-only policy boundary is visible at entry points', () => {
  const notice = readFileSync('src/components/local-data-notice.tsx', 'utf8');
  assert.match(notice, /router\.push\('\/privacy'\)/);
  assert.match(notice, /router\.push\('\/terms'\)/);
  assert.match(readFileSync('src/screens/login-screen.tsx', 'utf8'), /LocalDataNotice/);
  assert.match(readFileSync('src/app/settings.tsx', 'utf8'), /LocalDataNotice/);
  assert.match(readFileSync('src/app/privacy.tsx', 'utf8'), /当前版本处理边界/);
  assert.match(readFileSync('src/app/terms.tsx', 'utf8'), /服务范围/);
  assert.match(readFileSync('docs/DATA_PROCESSING_INVENTORY.md', 'utf8'), /本地/);
});
