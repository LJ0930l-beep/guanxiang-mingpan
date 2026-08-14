import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculateBaziView } from '../src/services/chart-engine.ts';

const generatedAt = '2026-08-14T00:00:00.000Z';
const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const profile = {
  id: 'lunar-calendar-fixture',
  name: 'Lunar calendar fixture',
  relationship: '本人',
  birthDate: '2024-01-01',
  birthTime: '12:00',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'lunar',
  isLeapMonth: false,
  gender: 'male',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

test('P1-E lunar new year input is converted and recorded before calculation', () => {
  const lunar = calculateBaziView(profile, undefined, { generatedAt });
  const solar = calculateBaziView({ ...profile, calendar: 'solar', birthDate: '2024-02-10', isLeapMonth: undefined }, undefined, { generatedAt });

  assert.deepEqual(lunar.pillars.map(({ key, stem, branch }) => ({ key, stem, branch })), solar.pillars.map(({ key, stem, branch }) => ({ key, stem, branch })));
  assert.equal(lunar.calculationEvidence.sourceCalendar, 'lunar');
  assert.equal(lunar.calculationEvidence.calendarConversion.normalizedSolarDateTime, '2024-02-10T12:00:00');
  assert.equal(lunar.calculationEvidence.calendarConversion.dataVersion, '1.7.7');
  assert.equal(lunar.calculationEvidence.solarTermBoundary.status, 'resolved');
  assert.ok(lunar.calculationEvidence.warnings.some((warning) => warning.includes('农历')));
});

test('P1-E invalid leap-month combinations are rejected explicitly', () => {
  assert.throws(
    () => calculateBaziView({ ...profile, birthDate: '2024-01-15', isLeapMonth: true }),
    /不存在闰 1 月/,
  );
  assert.throws(
    () => calculateBaziView({ ...profile, birthDate: '2023-04-31', isLeapMonth: false }),
    /农历日期无效/,
  );
});

test('P1-E lunar conversion is independent of the host TZ', () => {
  const run = (timezone) => JSON.parse(execFileSync(
    process.execPath,
    [
      '--experimental-strip-types',
      '--experimental-loader',
      './scripts/ts-path-loader.mjs',
      './scripts/run-bazi-lunar-fixture.mjs',
    ],
    { cwd: projectRoot, env: { ...process.env, TZ: timezone }, encoding: 'utf8' },
  ));
  assert.deepEqual(run('UTC'), run('Asia/Shanghai'));
});
