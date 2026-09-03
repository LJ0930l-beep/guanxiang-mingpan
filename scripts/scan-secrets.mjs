import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const scanRoots = ['src', 'scripts', '.github', 'app.json', 'package.json', 'public'];
const secretPatterns = [
  /-----BEGIN [^-]*(?:PRIVATE|RSA|EC|OPENSSH) KEY-----/i,
  /\b(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{20,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-[A-Za-z0-9]{20,}/,
  /(?:access[_-]?token|api[_-]?key|client[_-]?secret|private[_-]?key)\s*[:=]\s*["'][^"']{12,}/i,
];

function filesIn(path) {
  const fullPath = join(projectRoot, path);
  if (!statSync(fullPath, { throwIfNoEntry: false })) return [];
  if (statSync(fullPath).isFile()) return [fullPath];
  return readdirSync(fullPath, { withFileTypes: true }).flatMap((entry) => {
    const child = join(fullPath, entry.name);
    if (entry.isDirectory()) return filesIn(relative(projectRoot, child));
    return /\.(?:ts|tsx|mjs|cjs|js|json|yml|yaml|html|css|webmanifest|txt)$/.test(entry.name) ? [child] : [];
  });
}

const findings = [];
for (const root of scanRoots) {
  for (const file of filesIn(root)) {
    const text = readFileSync(file, 'utf8');
    text.split(/\r?\n/).forEach((line, index) => {
      if (secretPatterns.some((pattern) => pattern.test(line))) findings.push(`${relative(projectRoot, file)}:${index + 1}`);
    });
  }
}

if (findings.length > 0) {
  console.error(`Potential secret material found in ${findings.length} line(s):`);
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exitCode = 1;
} else {
  console.log(`Secret scan passed (${scanRoots.length} configured roots).`);
}
