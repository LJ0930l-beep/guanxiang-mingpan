const fs = require('node:fs');
const path = require('node:path');

const target = path.join(__dirname, '..', 'node_modules', 'iztro', 'lib', 'i18n', 'index.js');
const umdTarget = path.join(__dirname, '..', 'node_modules', 'iztro', 'dist', 'iztro.min.js');
const taibuRngTarget = path.join(__dirname, '..', 'node_modules', 'taibu-core', 'dist', 'shared', 'seeded-rng.js');

if (!fs.existsSync(target)) {
  process.exit(0);
}

const before = fs.readFileSync(target, 'utf8');
const after = before.replace(
  /require\("\.\/locales\/(zh-CN|zh-TW|ko-KR|ja-JP|en-US|vi-VN)"\)/g,
  'require("./locales/$1/index.js")',
);

if (after !== before) {
  fs.writeFileSync(target, after, 'utf8');
  console.log('Applied Expo Metro compatibility patch to iztro locale imports.');
}

if (fs.existsSync(umdTarget)) {
  const umdBefore = fs.readFileSync(umdTarget, 'utf8');
  const umdAfter = umdBefore.replace('}(self,', '}(globalThis,');
  if (umdAfter !== umdBefore) {
    fs.writeFileSync(umdTarget, umdAfter, 'utf8');
    console.log('Applied globalThis compatibility patch to iztro UMD bundle.');
  }
}

if (fs.existsSync(taibuRngTarget)) {
  const browserSafeRng = `const UINT32_MAX_PLUS_ONE = 0x1_0000_0000;
function hash32(input, salt = 0) {
    let hash = (0x811c9dc5 ^ salt) >>> 0;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 0x7feb352d) >>> 0;
    hash ^= hash >>> 15;
    hash = Math.imul(hash, 0x846ca68b) >>> 0;
    hash ^= hash >>> 16;
    return hash >>> 0;
}
function seedToUint32(seed) {
    const value = hash32(seed);
    return value === 0 ? 0x9e3779b9 : value;
}
export function createSeededRng(seed) {
    let state = seedToUint32(seed);
    return () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / UINT32_MAX_PLUS_ONE;
    };
}
function hashSeed(input) {
    return [0, 1, 2].map((salt) => hash32(input, salt).toString(16).padStart(8, '0')).join('');
}
export function resolveSeed(inputSeed, fallback, scope) {
    const normalized = inputSeed?.trim();
    const base = normalized || hashSeed(fallback);
    const scoped = scope?.trim();
    if (!scoped) return base;
    return hashSeed(\`\${scoped}|\${base}\`);
}
`;
  const currentRng = fs.readFileSync(taibuRngTarget, 'utf8');
  if (currentRng !== browserSafeRng) {
    fs.writeFileSync(taibuRngTarget, browserSafeRng, 'utf8');
    console.log('Applied browser-safe deterministic RNG patch to taibu-core.');
  }
}
