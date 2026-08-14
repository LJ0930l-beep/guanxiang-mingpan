import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

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
  if (specifier === '@react-native-async-storage/async-storage') {
    return nextResolve(new URL('./test-shims/async-storage.mjs', import.meta.url).href, context);
  }
  if (specifier.startsWith('@/')) {
    const sourcePath = new URL(`../src/${specifier.slice(2)}`, import.meta.url);
    return nextResolve(withTypeScriptExtension(sourcePath.href), context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.tsx')) {
    const source = await readFile(fileURLToPath(url), 'utf8');
    const transformed = ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: fileURLToPath(url),
    });
    return { format: 'module', source: transformed.outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
