import { fileURLToPath, pathToFileURL } from 'node:url';

function withTypeScriptExtension(url) {
  const filePath = fileURLToPath(url);
  if (!filePath.match(/\.[cm]?tsx?$/)) {
    return pathToFileURL(`${filePath}.ts`).href;
  }
  return url;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'circular-natal-horoscope-js/dist/index.js') {
    return nextResolve(new URL('./test-shims/circular-natal-horoscope.mjs', import.meta.url).href, context);
  }
  if (specifier === 'iztro/dist/iztro.min.js') {
    return nextResolve(new URL('./test-shims/iztro.mjs', import.meta.url).href, context);
  }
  if (specifier.startsWith('@/')) {
    const sourcePath = new URL(`../src/${specifier.slice(2)}`, import.meta.url);
    return nextResolve(withTypeScriptExtension(sourcePath.href), context);
  }
  return nextResolve(specifier, context);
}
