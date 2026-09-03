import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const expectedRoutes = ['index.html', 'home.html', 'profiles.html', 'records.html', 'settings.html', 'privacy.html', 'terms.html', '+not-found.html', '_sitemap.html', 'module/[slug].html'];
const missing = expectedRoutes.filter((route) => !existsSync(join(dist, route)));
if (missing.length > 0) {
  console.error(`Web export is missing static routes: ${missing.join(', ')}`);
  process.exit(1);
}

const expectedPublicFiles = ['manifest.webmanifest', 'robots.txt', 'offline.html', 'sw.js', '_headers', 'favicon.ico'];
const missingPublicFiles = expectedPublicFiles.filter((file) => !existsSync(join(dist, file)));
if (missingPublicFiles.length > 0) {
  console.error(`Web export is missing public release files: ${missingPublicFiles.join(', ')}`);
  process.exit(1);
}

const html = readFileSync(join(dist, 'index.html'), 'utf8');
if (!html.includes('观象') || !html.includes('观象·命盘｜本地排盘与复盘工具') || !html.includes('name="description"') || !html.includes('<html  lang="zh-CN">') || !html.includes('_expo/static/js/web/')) {
  console.error('Web export index is missing product metadata or the entry bundle.');
  process.exit(1);
}
const routeManifest = join(dist, '_expo', '.routes.json');
if (!existsSync(routeManifest)) {
  console.error('Web export route manifest is missing.');
  process.exit(1);
}
const bundleDirectory = join(dist, '_expo', 'static', 'js', 'web');
if (!existsSync(bundleDirectory) || readdirSync(bundleDirectory).filter((file) => file.endsWith('.js')).length === 0) {
  console.error('Web export JavaScript bundle is missing.');
  process.exit(1);
}
console.log(`Web export verification passed (${expectedRoutes.length} routes).`);
