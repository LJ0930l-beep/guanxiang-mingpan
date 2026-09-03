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

test('P5-G production web export verification and security headers are wired', () => {
  const verify = readFileSync('scripts/verify-web-export.mjs', 'utf8');
  assert.match(verify, /\+not-found\.html/);
  assert.match(verify, /\.routes\.json/);
  const headers = readFileSync('public/_headers', 'utf8');
  assert.match(headers, /Content-Security-Policy/);
  assert.match(headers, /X-Content-Type-Options/);
  assert.match(readFileSync('public/manifest.webmanifest', 'utf8'), /"display": "standalone"/);
  assert.match(readFileSync('public/sw.js', 'utf8'), /offline\.html/);
});
