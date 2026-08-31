import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  OWNER_DECISION_RESOLUTION_CONTRACT_VERSION,
  OWNER_DECISION_RESOLUTION_AUDIT_CASE_IDS,
  P5_A5A_OWNER_DECISION_RESOLUTION_CASES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  getOwnerDecisionResolutionVersionedRegistryValidationErrors,
  validateOwnerDecisionResolutionVersionedRegistry,
} from '../src/domains/golden/index.ts';
import {
  calculateAstrologyView,
  calculateBaziView,
  calculateLiuyaoView,
  calculateZiweiView,
  getChartInputErrorContract,
  isChartInputError,
  PUBLIC_BIRTH_DATE_RANGE_END_DATE,
  PUBLIC_BIRTH_DATE_RANGE_POLICY,
  PUBLIC_BIRTH_DATE_RANGE_POLICY_VERSION,
  PUBLIC_BIRTH_DATE_RANGE_START_DATE,
} from '../src/services/chart-engine.ts';
import { snapshotMetaFromPayload } from '../src/storage/schema.ts';
import { createLocalBackupText, parseLocalBackupText } from '../src/storage/backup.ts';

const generatedAt = '2026-08-31T00:00:00.000Z';
const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const calculationOptions = { generatedAt, timezone: 'Asia/Shanghai' };

const baseProfile = {
  id: 'p5-a5a-date-policy-profile',
  name: 'P5-A5a 日期政策样例',
  relationship: '本人',
  birthDate: '2024-02-10',
  birthTime: '12:00',
  birthCity: '广东省深圳市',
  timeKnown: true,
  calendar: 'solar',
  isLeapMonth: false,
  gender: 'male',
  latitude: 22.5431,
  longitude: 114.0579,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function inputError(run, code, field = 'birthDate') {
  let caught;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught, `expected ${code}`);
  assert.equal(isChartInputError(caught), true);
  assert.equal(caught.code, code);
  assert.equal(caught.field, field);
  const contract = getChartInputErrorContract(caught);
  assert.deepEqual(contract, {
    name: 'ChartInputError',
    category: 'input-validation',
    code,
    field,
    message: caught.message,
  });
  return caught;
}

function birthProfile(overrides = {}) {
  return { ...baseProfile, ...overrides };
}

test('P5-A5a 建立独立 owner-decision overlay，精确接受三项日期范围决策', () => {
  assert.equal(OWNER_DECISION_RESOLUTION_CONTRACT_VERSION, 'p5-a5a-owner-decision.v1');
  assert.deepEqual(OWNER_DECISION_RESOLUTION_AUDIT_CASE_IDS, [
    'p5-a4a-bazi-supported-date-range',
    'p5-a4a-ziwei-date-range',
    'p5-a4a-astrology-date-range',
  ]);
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_CASES.length, 3);
  assert.deepEqual(
    P5_A5A_OWNER_DECISION_RESOLUTION_CASES.map((item) => item.auditCaseId),
    OWNER_DECISION_RESOLUTION_AUDIT_CASE_IDS,
  );
  assert.equal(getOwnerDecisionResolutionVersionedRegistryValidationErrors(P5_A5A_OWNER_DECISION_RESOLUTION_CASES).length, 0);
  assert.deepEqual(
    validateOwnerDecisionResolutionVersionedRegistry(P5_A5A_OWNER_DECISION_RESOLUTION_CASES),
    P5_A5A_OWNER_DECISION_RESOLUTION_CASES,
  );
  assert.deepEqual(JSON.parse(JSON.stringify(P5_A5A_OWNER_DECISION_RESOLUTION_CASES)), P5_A5A_OWNER_DECISION_RESOLUTION_CASES);
  for (const resolution of P5_A5A_OWNER_DECISION_RESOLUTION_CASES) {
    const original = P5_BOUNDARY_INPUT_AUDIT_CASES.find((item) => item.id === resolution.auditCaseId);
    assert.equal(original?.status, 'decision-required');
    assert.equal(original?.targetBatch, 'OWNER-DECISION');
    assert.equal(original?.ownerDecisionRequired, true);
    assert.equal(resolution.status, 'accepted');
    assert.equal(resolution.targetBatch, 'P5-A5a');
    assert.equal(resolution.decisionId, 'cn-mainland-public-birth-date-range');
    assert.equal(JSON.stringify(resolution).includes('commit'), false);
  }

  const wrongVersion = clone(P5_A5A_OWNER_DECISION_RESOLUTION_CASES);
  wrongVersion[0].contractVersion = 'p5-a4b-input-resolution.v6';
  assert.throws(
    () => validateOwnerDecisionResolutionVersionedRegistry(wrongVersion),
    /exactly one supported contract version/,
  );
  const wrongCase = clone(P5_A5A_OWNER_DECISION_RESOLUTION_CASES);
  wrongCase[0].auditCaseId = 'p5-a4a-bazi-historical-dst';
  assert.throws(
    () => validateOwnerDecisionResolutionVersionedRegistry(wrongCase),
    /auditCaseId is not supported|must map from a decision-required case/,
  );
  const changedPolicy = clone(P5_A5A_OWNER_DECISION_RESOLUTION_CASES);
  changedPolicy[0].policy.endDate = '2100-12-31';
  assert.throws(
    () => validateOwnerDecisionResolutionVersionedRegistry(changedPolicy),
    /owner-approved public birth-date range policy/,
  );
});

test('P5-A5a policy contract is a single inclusive 1900-01-01..2099-12-31 window', () => {
  assert.equal(PUBLIC_BIRTH_DATE_RANGE_POLICY_VERSION, 'cn-mainland-public-birth-date-range.v1');
  assert.deepEqual(PUBLIC_BIRTH_DATE_RANGE_POLICY, {
    version: 'cn-mainland-public-birth-date-range.v1',
    startDate: '1900-01-01',
    endDate: '2099-12-31',
    inclusive: true,
  });
  assert.equal(PUBLIC_BIRTH_DATE_RANGE_START_DATE, '1900-01-01');
  assert.equal(PUBLIC_BIRTH_DATE_RANGE_END_DATE, '2099-12-31');
});

test('P5-A5a Bazi solar accepts both inclusive endpoints and rejects dates outside the public range', () => {
  for (const birthDate of ['1900-01-01', '2099-12-31']) {
    const result = calculateBaziView(
      birthProfile({ id: `bazi-solar-${birthDate}`, birthDate, calendar: 'solar' }),
      undefined,
      calculationOptions,
    );
    assert.deepEqual(result.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
    assert.deepEqual(result.inputSnapshot.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  }
  for (const birthDate of ['1899-12-31', '2100-01-01']) {
    const caught = inputError(
      () => calculateBaziView(birthProfile({ birthDate, calendar: 'solar' }), undefined, calculationOptions),
      'UNSUPPORTED_BIRTH_DATE_RANGE',
    );
    assert.match(caught.message, /1900-01-01 至 2099-12-31/);
  }
});

test('P5-A5a Bazi lunar validates the real lunar date before applying the input-year range', () => {
  for (const [birthDate, isLeapMonth] of [
    ['1900-01-01', false],
    ['2099-12-30', false],
    ['1900-08-01', true],
  ]) {
    const result = calculateBaziView(
      birthProfile({ id: `bazi-lunar-${birthDate}-${isLeapMonth}`, birthDate, calendar: 'lunar', isLeapMonth }),
      undefined,
      calculationOptions,
    );
    assert.equal(result.inputSnapshot.calendar, 'lunar');
    assert.deepEqual(result.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  }
  for (const birthDate of ['1899-12-30', '2100-01-01']) {
    inputError(
      () => calculateBaziView(birthProfile({ birthDate, calendar: 'lunar', isLeapMonth: false }), undefined, calculationOptions),
      'UNSUPPORTED_BIRTH_DATE_RANGE',
    );
  }
  // 2100-02-31 is an invalid lunar date.  It must not become a range error
  // merely because its input year is outside the accepted public window.
  assert.throws(
    () => calculateBaziView(birthProfile({ birthDate: '2100-02-31', calendar: 'lunar', isLeapMonth: false }), undefined, calculationOptions),
    /农历日期无效/,
  );
  assert.throws(
    () => calculateBaziView(birthProfile({ birthDate: '2100-02-01', calendar: 'lunar', isLeapMonth: true }), undefined, calculationOptions),
    /不存在闰 2 月/,
  );
});

test('P5-A5a Ziwei solar/lunar/闰月 uses the same range contract while preserving old input errors', () => {
  for (const birthDate of ['1900-01-01', '2099-12-31']) {
    const result = calculateZiweiView(
      birthProfile({ id: `ziwei-solar-${birthDate}`, birthDate, calendar: 'solar' }),
      undefined,
      calculationOptions,
    );
    assert.deepEqual(result.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
    assert.deepEqual(result.inputSnapshot.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  }
  for (const birthDate of ['1899-12-31', '2100-01-01']) {
    inputError(
      () => calculateZiweiView(birthProfile({ birthDate, calendar: 'solar' }), undefined, calculationOptions),
      'UNSUPPORTED_BIRTH_DATE_RANGE',
    );
  }
  const ordinary = calculateZiweiView(
    birthProfile({ id: 'ziwei-lunar-ordinary', birthDate: '2099-12-30', calendar: 'lunar', isLeapMonth: false }),
    undefined,
    calculationOptions,
  );
  assert.equal(ordinary.inputSnapshot.calendar, 'lunar');
  assert.deepEqual(ordinary.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  const lowerOrdinary = calculateZiweiView(
    birthProfile({ id: 'ziwei-lunar-lower-endpoint', birthDate: '1900-01-01', calendar: 'lunar', isLeapMonth: false }),
    undefined,
    calculationOptions,
  );
  assert.equal(lowerOrdinary.inputSnapshot.birthDate, '1900-01-01');
  assert.deepEqual(lowerOrdinary.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  const leap = calculateZiweiView(
    birthProfile({ id: 'ziwei-lunar-leap', birthDate: '2099-02-01', calendar: 'lunar', isLeapMonth: true }),
    undefined,
    calculationOptions,
  );
  assert.equal(leap.inputSnapshot.isLeapMonth, true);
  assert.deepEqual(leap.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  inputError(
    () => calculateZiweiView(birthProfile({ birthDate: '2100-02-31', calendar: 'lunar', isLeapMonth: false }), undefined, calculationOptions),
    'INVALID_LUNAR_DATE',
  );
  inputError(
    () => calculateZiweiView(birthProfile({ birthDate: '2100-02-01', calendar: 'lunar', isLeapMonth: true }), undefined, calculationOptions),
    'INVALID_LUNAR_LEAP_MONTH',
    'isLeapMonth',
  );
  inputError(
    () => calculateZiweiView(birthProfile({ birthDate: '2024-02-30', calendar: 'solar' }), undefined, calculationOptions),
    'INVALID_GREGORIAN_DATE',
  );
});

test('P5-A5a Astrology solar accepts endpoints and rejects out-of-range/invalid Gregorian dates', () => {
  for (const birthDate of ['1900-01-01', '2099-12-31']) {
    const result = calculateAstrologyView(
      birthProfile({ id: `astrology-${birthDate}`, birthDate, calendar: 'solar' }),
      calculationOptions,
    );
    assert.deepEqual(result.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
    assert.deepEqual(result.inputSnapshot.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  }
  for (const birthDate of ['1899-12-31', '2100-01-01']) {
    inputError(
      () => calculateAstrologyView(birthProfile({ birthDate, calendar: 'solar' }), calculationOptions),
      'UNSUPPORTED_BIRTH_DATE_RANGE',
    );
  }
  inputError(
    () => calculateAstrologyView(birthProfile({ birthDate: '2024-02-30', calendar: 'solar' }), calculationOptions),
    'INVALID_GREGORIAN_DATE',
  );
});

test('P5-A5a Liuyao is outside the birth-date policy and still accepts a 2100 casting date', async () => {
  const result = await calculateLiuyaoView('2100 日期不应被出生日期政策拦截', '官鬼', {
    ...calculationOptions,
    seed: 'p5-a5a-liuyao-seed',
    date: '2100-01-01T12:00:00',
  });
  assert.equal(result.date, '2100-01-01T12:00:00');
  assert.equal(result.calculationSettings.birthDateRangePolicy, undefined);
});

test('P5-A5a policy version/bounds survive input snapshot, ChartSnapshotMeta, SavedReading and backup JSON roundtrip', () => {
  const profile = birthProfile({ birthDate: '2099-12-31' });
  const payload = calculateBaziView(profile, undefined, calculationOptions);
  const snapshotMeta = snapshotMetaFromPayload(payload);
  assert.deepEqual(payload.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  assert.deepEqual(payload.inputSnapshot.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  assert.deepEqual(snapshotMeta.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  assert.deepEqual(snapshotMeta.inputSnapshot.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  const roundTrippedSnapshot = JSON.parse(JSON.stringify(snapshotMeta));
  assert.deepEqual(roundTrippedSnapshot, snapshotMeta);

  const reading = {
    id: 'p5-a5a-reading',
    profileId: profile.id,
    profileName: profile.name,
    module: 'bazi',
    title: '日期政策快照',
    summary: 'policy roundtrip',
    createdAt: payload.generatedAt,
    engineVersion: payload.engineVersion,
    interpretationVersion: payload.interpretation.interpretationVersion,
    snapshotMeta,
    inputSnapshot: payload.inputSnapshot,
    profileSnapshot: profile,
    normalizedChartSnapshot: payload.normalizedChart,
    evidenceGraphSnapshot: payload.evidenceGraph,
    interpretationSnapshot: payload.interpretation,
    explanationSnapshot: payload.explanation,
    favorite: false,
    feedback: [],
    payload,
  };
  const backup = parseLocalBackupText(createLocalBackupText({
    user: null,
    profiles: [profile],
    selectedProfileId: profile.id,
    readings: [reading],
  }, generatedAt));
  const restored = backup.data.readings[0];
  assert.deepEqual(restored.payload.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  assert.deepEqual(restored.payload.inputSnapshot.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  assert.deepEqual(restored.snapshotMeta.calculationSettings.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
  assert.deepEqual(restored.snapshotMeta.inputSnapshot.birthDateRangePolicy, PUBLIC_BIRTH_DATE_RANGE_POLICY);
});

function runAcrossHostTimezone(hostTimezone) {
  const source = `
    import { calculateAstrologyView, calculateBaziView, calculateZiweiView } from './src/services/chart-engine.ts';
    const profile = ${JSON.stringify(baseProfile)};
    const options = ${JSON.stringify(calculationOptions)};
    const result = {
      bazi: calculateBaziView(profile, undefined, options),
      ziwei: calculateZiweiView(profile, undefined, options),
      astrology: calculateAstrologyView(profile, options),
    };
    process.stdout.write(JSON.stringify(result));
  `;
  return JSON.parse(execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-loader', './scripts/ts-path-loader.mjs', '-e', source],
    {
      cwd: projectRoot,
      env: { ...process.env, TZ: hostTimezone },
      encoding: 'utf8',
    },
  ));
}

test('P5-A5a three birth engines are deepEqual under TZ=UTC and TZ=Asia/Shanghai', () => {
  assert.deepEqual(runAcrossHostTimezone('UTC'), runAcrossHostTimezone('Asia/Shanghai'));
});
