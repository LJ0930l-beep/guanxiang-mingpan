import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveSolarTermBoundary } from '../src/domains/bazi/solar-terms.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const boundaryTimes = [
  '2024-02-04T16:26:07',
  '2024-02-04T16:27:07',
  '2024-02-04T16:28:07',
];

test('P1-B 立春边界的 T-1/T/T+1 分钟返回前后节气与月柱依据', () => {
  const [before, exact, after] = boundaryTimes.map(resolveSolarTermBoundary);

  assert.equal(before.timezone, 'Asia/Shanghai');
  assert.equal(before.dataSource, '6tail/lunar-javascript');
  assert.equal(before.dataVersion, '1.7.7');
  assert.equal(before.precisionSeconds, 1);
  assert.equal(before.recentTerm.name, '小寒');
  assert.equal(before.nextTerm.name, '立春');
  assert.equal(before.currentMonthBasis.termName, '小寒');
  assert.deepEqual(before.boundaryWindow, {
    start: '2024-02-04T16:26:07',
    end: '2024-02-04T16:28:07',
    precisionSeconds: 1,
  });

  assert.equal(exact.recentTerm.name, '立春');
  assert.equal(exact.currentMonthBasis.termName, '立春');
  assert.equal(exact.currentMonthBasis.monthBranch, '寅');
  assert.equal(exact.currentMonthBasis.explanation, '月柱以立春（2024-02-04T16:27:07）为当前节令依据。');

  assert.equal(after.recentTerm.name, '立春');
  assert.equal(after.nextTerm.name, '惊蛰');
  assert.equal(after.currentMonthBasis.termName, '立春');
});

test('P1-B 节气边界不依赖宿主 TZ', () => {
  const run = (timezone) => JSON.parse(execFileSync(
    process.execPath,
    [
      '--experimental-strip-types',
      '--experimental-loader',
      './scripts/ts-path-loader.mjs',
      './scripts/run-bazi-boundary-fixture.mjs',
    ],
    {
      cwd: projectRoot,
      env: { ...process.env, TZ: timezone },
      encoding: 'utf8',
    },
  ));
  const utc = run('UTC');
  const shanghai = run('Asia/Shanghai');
  assert.deepEqual(utc, shanghai);
  assert.equal(utc[1].currentMonthBasis.termName, '立春');
});

