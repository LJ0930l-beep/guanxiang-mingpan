import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculateBaziView } from '../src/services/chart-engine.ts';
import {
  legacyEquationOfTimeMinutes,
  noaaEquationOfTimeMinutes,
  TRUE_SOLAR_TIME_V1,
  TRUE_SOLAR_TIME_V2,
} from '../src/domains/bazi/true-solar-time.ts';

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
  assert.deepEqual(utc.snapshotMeta.calculationSettings, utc.settings);
  assert.equal(utc.settings.trueSolarTime, true);
  assert.equal(utc.settings.solarTimeModel, 'apparentSolarTime');
  assert.equal(utc.settings.trueSolarTimeVersion, TRUE_SOLAR_TIME_V2);
  assert.equal(utc.evidence.trueSolarCorrection.applied, true);
  assert.equal(utc.evidence.trueSolarCorrection.algorithmVersion, TRUE_SOLAR_TIME_V2);
  assert.equal(utc.evidence.trueSolarCorrection.dataSource, 'NOAA Solar Calculator equation-of-time PDF');
  assert.equal(utc.evidence.trueSolarCorrection.dataVersion, 'noaa-solareqns-pdf-229.18-v1');
  assert.equal(utc.evidence.trueSolarCorrection.dataSourceUrl, 'https://gml.noaa.gov/grad/solcalc/solareqns.PDF');
  assert.equal(utc.evidence.trueSolarCorrection.roundingRule, 'nearest-minute-half-away-from-zero');
  assert.equal(utc.evidence.trueSolarCorrection.provenanceStatus, 'current');
  assert.equal(utc.evidence.trueSolarCorrection.longitude, 116.4074);
  assert.equal(utc.evidence.trueSolarCorrection.standardMeridian, 120);
  assert.equal(utc.evidence.trueSolarCorrection.precisionMinutes, 1);
  assert.notEqual(utc.evidence.trueSolarCorrection.civilTime, utc.evidence.trueSolarCorrection.effectiveTime);
});

test('P5-A3a NOAA PDF coefficients include civil time and leap-year day count', () => {
  assert.ok(Math.abs(noaaEquationOfTimeMinutes(2024, 6, 21, 5, 30, 0) - (-1.3852272915805668)) < 1e-12);
  assert.ok(Math.abs(noaaEquationOfTimeMinutes(2020, 2, 29, 12, 0, 0) - (-12.930581920147938)) < 1e-12);
  assert.notEqual(
    noaaEquationOfTimeMinutes(2024, 6, 21, 5, 30, 0),
    legacyEquationOfTimeMinutes(2024, 6, 21),
  );
});

test('P5-A3a v1 retains the old approximation and Math.round behavior', () => {
  const profile = {
    id: 'true-solar-v1-fixture',
    name: 'v1 fixture',
    relationship: '本人',
    birthDate: '2024-06-21',
    birthTime: '05:30',
    birthCity: '北京市',
    timeKnown: true,
    calendar: 'solar',
    gender: 'male',
    latitude: 39.9042,
    longitude: 116.4074,
    createdAt: '2026-08-14T00:00:00.000Z',
    updatedAt: '2026-08-14T00:00:00.000Z',
  };
  const result = calculateBaziView(profile, undefined, {
    generatedAt: '2026-08-14T00:00:00.000Z',
    bazi: { trueSolarTime: true, solarTimeModel: 'apparentSolarTime', trueSolarTimeVersion: TRUE_SOLAR_TIME_V1 },
  });
  assert.equal(result.calculationSettings.trueSolarTimeVersion, TRUE_SOLAR_TIME_V1);
  assert.equal(result.calculationEvidence.trueSolarCorrection.effectiveTime, '2024-06-21T05:14:00');
  assert.equal(result.calculationEvidence.trueSolarCorrection.correctionMinutes, -16);
  assert.equal(result.calculationEvidence.trueSolarCorrection.appliedCorrectionMinutes, -16);
  assert.equal(result.calculationEvidence.trueSolarCorrection.roundingRule, 'legacy-js-math-round-after-tenth');
  assert.equal(result.calculationEvidence.trueSolarCorrection.provenanceStatus, 'legacy');
});

test('P5-A3a v2 uses symmetric half-away-from-zero at both signs', () => {
  const base = {
    id: 'rounding-fixture',
    name: 'rounding fixture',
    relationship: '本人',
    birthDate: '2024-01-15',
    birthTime: '12:00',
    birthCity: 'rounding fixture',
    timeKnown: true,
    calendar: 'solar',
    gender: 'male',
    latitude: 30,
    createdAt: '2026-08-14T00:00:00.000Z',
    updatedAt: '2026-08-14T00:00:00.000Z',
  };
  const options = { generatedAt: '2026-08-14T00:00:00.000Z', bazi: { trueSolarTime: true, solarTimeModel: 'localMeanSolarTime', trueSolarTimeVersion: TRUE_SOLAR_TIME_V2 } };
  const positive = calculateBaziView({ ...base, longitude: 120.125 }, undefined, options);
  const negative = calculateBaziView({ ...base, longitude: 119.875 }, undefined, options);
  assert.equal(positive.calculationEvidence.trueSolarCorrection.rawCorrectionMinutes, 0.5);
  assert.equal(negative.calculationEvidence.trueSolarCorrection.rawCorrectionMinutes, -0.5);
  assert.equal(positive.calculationEvidence.trueSolarCorrection.appliedCorrectionMinutes, 1);
  assert.equal(negative.calculationEvidence.trueSolarCorrection.appliedCorrectionMinutes, -1);
  assert.equal(positive.calculationEvidence.trueSolarCorrection.effectiveTime, '2024-01-15T12:01:00');
  assert.equal(negative.calculationEvidence.trueSolarCorrection.effectiveTime, '2024-01-15T11:59:00');
});

test('P5-A3a unknown version is rejected when true solar calculation is requested', () => {
  assert.throws(
    () => calculateBaziView({
      id: 'unknown-version-fixture',
      name: 'unknown',
      relationship: '本人',
      birthDate: '2024-01-15',
      birthTime: '12:00',
      birthCity: '北京市',
      timeKnown: true,
      calendar: 'solar',
      gender: 'male',
      latitude: 39.9042,
      longitude: 116.4074,
      createdAt: '2026-08-14T00:00:00.000Z',
      updatedAt: '2026-08-14T00:00:00.000Z',
    }, undefined, {
      generatedAt: '2026-08-14T00:00:00.000Z',
      bazi: { trueSolarTime: true, solarTimeModel: 'localMeanSolarTime', trueSolarTimeVersion: 'legacy-unknown' },
    }),
    /未知真太阳时规则版本/,
  );
});
