import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

function run(timezone) {
  return JSON.parse(execFileSync(
    process.execPath,
    [
      '--experimental-strip-types',
      '--experimental-loader',
      './scripts/ts-path-loader.mjs',
      './scripts/run-bazi-true-solar-fixture.mjs',
    ],
    { cwd: projectRoot, env: { ...process.env, TZ: timezone }, encoding: 'utf8' },
  ));
}

test('P1-D apparent solar time is independent of the host TZ', () => {
  const utc = run('UTC');
  const shanghai = run('Asia/Shanghai');
  assert.deepEqual(utc, shanghai);
  assert.equal(utc.settings.timezone, 'Asia/Shanghai');
  assert.equal(utc.settings.trueSolarTime, true);
  assert.equal(utc.settings.solarTimeModel, 'apparentSolarTime');
  assert.equal(utc.evidence.trueSolarCorrection.applied, true);
  assert.equal(utc.evidence.trueSolarCorrection.longitude, 116.4074);
  assert.equal(utc.evidence.trueSolarCorrection.standardMeridian, 120);
  assert.equal(utc.evidence.trueSolarCorrection.precisionMinutes, 1);
  assert.notEqual(utc.evidence.trueSolarCorrection.civilTime, utc.evidence.trueSolarCorrection.effectiveTime);
});
