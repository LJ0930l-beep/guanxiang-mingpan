import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ASTROLOGY_DATE_LEVEL_APPROXIMATION_POLICY,
  ASTROLOGY_DATE_LEVEL_APPROXIMATION_RULE_VERSION,
} from '../src/domains/astrology/policy.ts';
import {
  BOUNDARY_INPUT_RESOLUTION_V5_AUDIT_CASE_IDS,
  BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION,
  P5_A4B_INPUT_RESOLUTION_V5_CASES,
  P5_A4B_INPUT_RESOLUTION_V6_CASES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  OWNER_DECISION_RESOLUTION_CONTRACT_VERSION,
  OWNER_DECISION_RESOLUTION_V2_CONTRACT_VERSION,
  P5_A5A_OWNER_DECISION_RESOLUTION_CASES,
  P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES,
  getBoundaryInputResolutionVersionedRegistryValidationErrors,
  getOwnerDecisionResolutionVersionedRegistryValidationErrors,
  validateBoundaryInputResolutionV6Registry,
  validateOwnerDecisionResolutionV2Registry,
} from '../src/domains/golden/index.ts';
import {
  calculateAstrologyView,
  getChartInputErrorContract,
  isChartInputError,
} from '../src/services/chart-engine.ts';
import { createLocalBackupText, parseLocalBackupText } from '../src/storage/backup.ts';
import { migrateReadings, snapshotMetaFromPayload } from '../src/storage/schema.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const generatedAt = '2026-08-31T00:00:00.000Z';

const exactProfile = {
  id: 'p5-a5b-astrology-safety',
  name: 'P5-A5b 占星安全样例',
  relationship: '本人',
  birthDate: '2001-09-08',
  birthTime: '20:30',
  birthCity: '广东省深圳市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 22.5431,
  longitude: 114.0579,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

const options = { generatedAt, timezone: 'Asia/Shanghai' };

function profile(overrides = {}) {
  return { ...exactProfile, ...overrides };
}

function expectInputError(run, code, field) {
  let caught;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught);
  assert.equal(isChartInputError(caught), true);
  assert.deepEqual(getChartInputErrorContract(caught), {
    name: 'ChartInputError',
    category: 'input-validation',
    code,
    field,
    message: caught.message,
  });
}

test('P5-A5b 未知时辰使用固定日级策略并隐藏不稳定字段', () => {
  const result = calculateAstrologyView(profile({
    id: 'p5-a5b-missing-time',
    birthDate: '2024-01-03',
    birthTime: undefined,
    timeKnown: false,
  }), options);
  assert.equal(result.calculationMode, 'approximate');
  assert.equal(result.precision, 'date-level-approximate');
  assert.notEqual(result.completeness, 'complete');
  assert.equal(result.ascendant, undefined);
  assert.equal(result.midheaven, undefined);
  assert.equal(result.aspects.length, 0);
  assert.equal(result.factors.some((factor) => factor.key === 'ascendant' || factor.key === 'midheaven'), false);
  assert.equal(result.factors.some((factor) => Object.prototype.hasOwnProperty.call(factor, 'house')), false);
  assert.equal(result.factors.some((factor) => Object.prototype.hasOwnProperty.call(factor, 'retrograde')), false);
  assert.equal(result.moonSign, undefined, 'Moon crossed signs during this date and must stay hidden');
  assert.equal(result.normalizedChart.points.some((point) => point.kind === 'angle'), false);
  assert.equal(result.normalizedChart.points.some((point) => Object.prototype.hasOwnProperty.call(point, 'house')), false);
  assert.equal(result.normalizedChart.points.some((point) => Object.prototype.hasOwnProperty.call(point, 'retrograde')), false);
  assert.equal(result.evidenceGraph.nodes.some((node) => node.type === 'angle.position' || node.type === 'house.placement'), false);
  assert.equal(result.calculationSettings.astrologyPolicy.precision, 'date-level-approximate');
  assert.equal(result.calculationSettings.astrologyPolicy.approximationAnchor.localTime, '12:00:00');
  assert.equal(result.calculationSettings.astrologyPolicy.approximationAnchor.ruleVersion, ASTROLOGY_DATE_LEVEL_APPROXIMATION_RULE_VERSION);
  assert.deepEqual(result.inputSnapshot.astrologyPolicy, result.calculationSettings.astrologyPolicy);
  assert.equal(result.caveats.some((caveat) => caveat.includes('出生时辰未知') && caveat.includes('日期级近似')), true);
  assert.equal(result.caveats.some((caveat) => caveat.includes('日首') && caveat.includes('日末')), true);
});

test('P5-A5b exact/location policy preserves explicit coordinate and city resolver precedence', () => {
  const explicit = calculateAstrologyView(profile({ birthCity: '未知城市' }), options);
  assert.equal(explicit.calculationMode, 'exact');
  assert.equal(explicit.calculationSettings.astrologyPolicy.locationSource, 'explicit-coordinates');
  const city = calculateAstrologyView(profile({ latitude: undefined, longitude: undefined }), options);
  assert.equal(city.calculationMode, 'exact');
  assert.equal(city.calculationSettings.astrologyPolicy.locationSource, 'city-dataset');
  assert.equal(city.calculationSettings.astrologyPolicy.locationId, 'CN-GD-SHENZHEN');
  assert.equal(city.calculationSettings.astrologyPolicy.locationDatasetVersion, 'china-cities-p1f-mainland-v1');
});

test('P5-A5b missing/unknown/partial/out-of-range location fails before Horoscope', () => {
  for (const birthCity of ['', '   ', '福建省泉州市', '未知城市']) {
    expectInputError(
      () => calculateAstrologyView(profile({ birthCity, latitude: undefined, longitude: undefined }), options),
      'MISSING_BIRTH_COORDINATES',
      'birthCity',
    );
  }
  expectInputError(
    () => calculateAstrologyView(profile({ birthCity: '未知城市', latitude: 22.5, longitude: undefined }), options),
    'INVALID_BIRTH_COORDINATES',
    'birthCoordinates',
  );
  expectInputError(
    () => calculateAstrologyView(profile({ birthCity: '未知城市', latitude: 91, longitude: 114 }), options),
    'INVALID_BIRTH_COORDINATES',
    'latitude',
  );
  // Date/range validation remains first and is not masked by a missing place.
  expectInputError(
    () => calculateAstrologyView(profile({ birthDate: '2024-02-30', birthCity: '未知城市', latitude: undefined, longitude: undefined }), options),
    'INVALID_GREGORIAN_DATE',
    'birthDate',
  );
  const source = readFileSync(resolve(projectRoot, 'src/services/engines/astrology-engine.ts'), 'utf8');
  assert.equal(source.includes('?? 0'), false, 'Astrology must not contain a 0,0 coordinate fallback');
});

test('P5-A5b policy survives ChartSnapshotMeta, SavedReading and backup/replay roundtrip', () => {
  const payload = calculateAstrologyView(profile({ birthTime: undefined, timeKnown: false }), options);
  const snapshotMeta = snapshotMetaFromPayload(payload);
  const policy = payload.calculationSettings.astrologyPolicy;
  assert.deepEqual(snapshotMeta.calculationSettings.astrologyPolicy, policy);
  assert.deepEqual(snapshotMeta.inputSnapshot.astrologyPolicy, policy);
  const reading = {
    id: 'p5-a5b-reading',
    profileId: exactProfile.id,
    profileName: exactProfile.name,
    module: 'astrology',
    title: '占星安全快照',
    summary: 'date-level approximation',
    createdAt: payload.generatedAt,
    engineVersion: payload.engineVersion,
    interpretationVersion: 'rules-v1',
    snapshotMeta,
    inputSnapshot: payload.inputSnapshot,
    profileSnapshot: profile({ birthTime: undefined, timeKnown: false }),
    favorite: false,
    feedback: [],
    payload,
  };
  const backup = parseLocalBackupText(createLocalBackupText({
    user: null,
    profiles: [reading.profileSnapshot],
    selectedProfileId: exactProfile.id,
    readings: [reading],
  }, generatedAt));
  const restored = backup.data.readings[0];
  assert.deepEqual(restored.payload.calculationSettings.astrologyPolicy, policy);
  assert.deepEqual(restored.payload.inputSnapshot.astrologyPolicy, policy);
  assert.deepEqual(restored.snapshotMeta.calculationSettings.astrologyPolicy, policy);
  assert.deepEqual(restored.snapshotMeta.inputSnapshot.astrologyPolicy, policy);
  const replay = migrateReadings([JSON.parse(JSON.stringify(reading))])[0];
  assert.deepEqual(replay.payload.calculationSettings.astrologyPolicy, policy);
});

test('P5-A5b old Astrology snapshots remain readable without invented policy', () => {
  const legacy = {
    id: 'legacy-astrology',
    profileId: 'legacy-profile',
    profileName: 'legacy',
    module: 'astrology',
    title: 'legacy',
    summary: 'legacy',
    createdAt: generatedAt,
    engineVersion: 'circular-natal-horoscope-js@1.1.0',
    interpretationVersion: 'rules-v1',
    snapshotMeta: {
      snapshotVersion: 1,
      generatedAt,
      engineVersion: 'circular-natal-horoscope-js@1.1.0',
      calculationSettings: { timezone: 'Asia/Shanghai' },
      inputSnapshot: {
        type: 'birth',
        timezone: 'Asia/Shanghai',
        profileId: 'legacy-profile',
        birthDate: '2001-09-08',
        timeKnown: true,
        birthCity: '广东省深圳市',
        calendar: 'solar',
      },
    },
    inputSnapshot: {
      type: 'birth',
      timezone: 'Asia/Shanghai',
      profileId: 'legacy-profile',
      birthDate: '2001-09-08',
      timeKnown: true,
      birthCity: '广东省深圳市',
      calendar: 'solar',
    },
    payload: {
      module: 'astrology',
      snapshotVersion: 1,
      generatedAt,
      engineVersion: 'circular-natal-horoscope-js@1.1.0',
      calculationSettings: { timezone: 'Asia/Shanghai' },
      inputSnapshot: {
        type: 'birth',
        timezone: 'Asia/Shanghai',
        profileId: 'legacy-profile',
        birthDate: '2001-09-08',
        timeKnown: true,
        birthCity: '广东省深圳市',
        calendar: 'solar',
      },
    },
  };
  const migrated = migrateReadings([legacy])[0];
  assert.ok(migrated);
  assert.equal(Object.prototype.hasOwnProperty.call(migrated.payload.calculationSettings, 'astrologyPolicy'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(migrated.inputSnapshot, 'astrologyPolicy'), false);
});

test('P5-A5b overlay preserves v1 prefixes and resolves missing-time plus two original gaps additively', () => {
  assert.equal(OWNER_DECISION_RESOLUTION_CONTRACT_VERSION, 'p5-a5a-owner-decision.v1');
  assert.equal(OWNER_DECISION_RESOLUTION_V2_CONTRACT_VERSION, 'p5-a5a-owner-decision.v2');
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_CASES.length, 3);
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES.length, 4);
  assert.equal(getOwnerDecisionResolutionVersionedRegistryValidationErrors(P5_A5A_OWNER_DECISION_RESOLUTION_CASES).length, 0);
  assert.equal(getOwnerDecisionResolutionVersionedRegistryValidationErrors(P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES).length, 0);
  validateOwnerDecisionResolutionV2Registry(P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES);
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES[3].policy.precision, 'date-level-approximate');
  assert.deepEqual(P5_A4B_INPUT_RESOLUTION_V6_CASES.slice(0, 12).map((item) => item.auditCaseId), P5_A4B_INPUT_RESOLUTION_V5_CASES.map((item) => item.auditCaseId));
  assert.deepEqual(BOUNDARY_INPUT_RESOLUTION_V5_AUDIT_CASE_IDS, P5_A4B_INPUT_RESOLUTION_V5_CASES.map((item) => item.auditCaseId));
  assert.equal(P5_A4B_INPUT_RESOLUTION_V6_CASES.length, 14);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V6_CASES[12].auditCaseId, 'p5-a4a-astrology-missing-coordinate');
  assert.equal(P5_A4B_INPUT_RESOLUTION_V6_CASES[13].auditCaseId, 'p5-a4a-cross-no-guessing');
  assert.equal(P5_A4B_INPUT_RESOLUTION_V6_CASES.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION), true);
  assert.equal(getBoundaryInputResolutionVersionedRegistryValidationErrors(P5_A4B_INPUT_RESOLUTION_V6_CASES).length, 0);
  validateBoundaryInputResolutionV6Registry(P5_A4B_INPUT_RESOLUTION_V6_CASES);
  assert.equal(P5_BOUNDARY_INPUT_AUDIT_CASES.length, 41);
});

test('P5-A5b date-level Astrology is host-TZ independent', () => {
  const source = `
    import { calculateAstrologyView } from './src/services/chart-engine.ts';
    const profile = ${JSON.stringify(profile({ birthTime: undefined, timeKnown: false }))};
    const result = calculateAstrologyView(profile, ${JSON.stringify(options)});
    process.stdout.write(JSON.stringify(result));
  `;
  const run = (TZ) => JSON.parse(execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-loader', './scripts/ts-path-loader.mjs', '-e', source],
    { cwd: projectRoot, env: { ...process.env, TZ }, encoding: 'utf8' },
  ));
  assert.deepEqual(run('UTC'), run('Asia/Shanghai'));
});
