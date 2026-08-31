import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BAZI_HISTORICAL_DST_POLICY,
  BAZI_HISTORICAL_DST_POLICY_VERSION,
  BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT,
  BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT_URL,
  BAZI_HISTORICAL_DST_TRANSITIONS,
  calculateBaziView,
  getChartInputErrorContract,
  isChartInputError,
  resolveBaziHistoricalDst,
} from '../src/services/chart-engine.ts';
import {
  BAZI_HISTORICAL_DST_DECISION_ID,
  OWNER_DECISION_RESOLUTION_V3_AUDIT_CASE_IDS,
  OWNER_DECISION_RESOLUTION_V3_CONTRACT_VERSION,
  OWNER_DECISION_RESOLUTION_V3_TARGET_BATCH,
  P5_A5A_OWNER_DECISION_RESOLUTION_CASES,
  P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES,
  P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES,
  getOwnerDecisionResolutionVersionedRegistryValidationErrors,
  validateOwnerDecisionResolutionV3Registry,
} from '../src/domains/golden/index.ts';
import { createEncryptedLocalBackupText, parseEncryptedLocalBackupText } from '../src/storage/encrypted-backup.ts';
import { createLocalBackupText, parseLocalBackupText } from '../src/storage/backup.ts';
import { migrateReadings, snapshotMetaFromPayload } from '../src/storage/schema.ts';

const generatedAt = '2026-08-31T00:00:00.000Z';
const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const calculationOptions = { generatedAt, timezone: 'Asia/Shanghai' };

const baseProfile = {
  id: 'p5-a5c-bazi-historical-dst',
  name: 'P5-A5c 历史夏令时样例',
  relationship: '本人',
  birthDate: '1987-06-01',
  birthTime: '12:00',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'solar',
  isLeapMonth: false,
  gender: 'male',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function expectInputError(run, code, field = 'birthTime') {
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
  assert.deepEqual(getChartInputErrorContract(caught), {
    name: 'ChartInputError',
    category: 'input-validation',
    code,
    field,
    message: caught.message,
  });
  return caught;
}

function profile(overrides = {}) {
  return { ...baseProfile, ...overrides };
}

test('P5-A5c freezes the IANA source, policy version, and six transition dates', () => {
  assert.equal(BAZI_HISTORICAL_DST_POLICY_VERSION, 'cn-mainland-historical-dst-1986-1991.v1');
  assert.deepEqual(BAZI_HISTORICAL_DST_POLICY, {
    version: 'cn-mainland-historical-dst-1986-1991.v1',
    timezone: 'Asia/Shanghai',
    dataSource: 'IANA Time Zone Database',
    dataVersion: 'tzdata2025b',
    dataSourceUrl: 'https://data.iana.org/time-zones/releases/tzdata2025b.tar.gz',
    dataSourceCommit: '7e1145bfdb9630c127841dc8ce808a937a300938',
    dataSourceCommitUrl: 'https://github.com/eggert/tz/commit/7e1145bfdb9630c127841dc8ce808a937a300938',
    sourceFile: 'asia',
    standardOffsetMinutes: 480,
    daylightOffsetMinutes: 540,
    adjustmentMinutes: -60,
    sourceRule: {
      firstStart: 'Rule PRC 1986 only - May 4 2:00 1:00 D',
      recurringStart: 'Rule PRC 1987 1991 - Apr Sun>=11 2:00 1:00 D',
      end: 'Rule PRC 1986 1991 - Sep Sun>=11 2:00 0 S',
      zone: 'Zone Asia/Shanghai 8:00 PRC C%sT',
      wallClock: 'spring 02:00 -> 03:00; autumn 02:00 -> 01:00',
    },
    transitions: [
      { year: 1986, startDate: '1986-05-04', endDate: '1986-09-14', transitionTime: '02:00:00', springGapStart: '02:00:00', springGapEnd: '03:00:00', autumnOverlapStart: '01:00:00', autumnOverlapEnd: '02:00:00' },
      { year: 1987, startDate: '1987-04-12', endDate: '1987-09-13', transitionTime: '02:00:00', springGapStart: '02:00:00', springGapEnd: '03:00:00', autumnOverlapStart: '01:00:00', autumnOverlapEnd: '02:00:00' },
      { year: 1988, startDate: '1988-04-17', endDate: '1988-09-11', transitionTime: '02:00:00', springGapStart: '02:00:00', springGapEnd: '03:00:00', autumnOverlapStart: '01:00:00', autumnOverlapEnd: '02:00:00' },
      { year: 1989, startDate: '1989-04-16', endDate: '1989-09-17', transitionTime: '02:00:00', springGapStart: '02:00:00', springGapEnd: '03:00:00', autumnOverlapStart: '01:00:00', autumnOverlapEnd: '02:00:00' },
      { year: 1990, startDate: '1990-04-15', endDate: '1990-09-16', transitionTime: '02:00:00', springGapStart: '02:00:00', springGapEnd: '03:00:00', autumnOverlapStart: '01:00:00', autumnOverlapEnd: '02:00:00' },
      { year: 1991, startDate: '1991-04-14', endDate: '1991-09-15', transitionTime: '02:00:00', springGapStart: '02:00:00', springGapEnd: '03:00:00', autumnOverlapStart: '01:00:00', autumnOverlapEnd: '02:00:00' },
    ],
  });
  assert.equal(BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT, '7e1145bfdb9630c127841dc8ce808a937a300938');
  assert.equal(BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT_URL, 'https://github.com/eggert/tz/commit/7e1145bfdb9630c127841dc8ce808a937a300938');
});

test('P5-A5c resolves every transition boundary without guessing gap or overlap', () => {
  for (const transition of BAZI_HISTORICAL_DST_TRANSITIONS) {
    const at = (date, time) => `${date}T${time}`;
    const source = (date, time) => profile({ birthDate: date, birthTime: time });

    const beforeStart = resolveBaziHistoricalDst(source(transition.startDate, '01:59:59'), at(transition.startDate, '01:59:59'), {
      timezone: 'Asia/Shanghai',
      historicalDstPolicy: BAZI_HISTORICAL_DST_POLICY,
    });
    assert.equal(beforeStart.status, 'standard-time');
    assert.equal(beforeStart.applied, false);
    assert.equal(beforeStart.effectiveDateTime, at(transition.startDate, '01:59:59'));

    expectInputError(
      () => resolveBaziHistoricalDst(source(transition.startDate, '02:00:00'), at(transition.startDate, '02:00:00'), {
        timezone: 'Asia/Shanghai',
        historicalDstPolicy: BAZI_HISTORICAL_DST_POLICY,
      }),
      'NONEXISTENT_LOCAL_TIME',
    );
    expectInputError(
      () => resolveBaziHistoricalDst(source(transition.startDate, '02:59:59'), at(transition.startDate, '02:59:59'), {
        timezone: 'Asia/Shanghai',
        historicalDstPolicy: BAZI_HISTORICAL_DST_POLICY,
      }),
      'NONEXISTENT_LOCAL_TIME',
    );

    const atStart = resolveBaziHistoricalDst(source(transition.startDate, '03:00:00'), at(transition.startDate, '03:00:00'), {
      timezone: 'Asia/Shanghai',
      historicalDstPolicy: BAZI_HISTORICAL_DST_POLICY,
    });
    assert.equal(atStart.status, 'daylight-time');
    assert.equal(atStart.applied, true);
    assert.equal(atStart.adjustmentMinutes, -60);
    assert.equal(atStart.inputOffsetMinutes, 540);
    assert.equal(atStart.effectiveDateTime, at(transition.startDate, '02:00:00'));

    const beforeEnd = resolveBaziHistoricalDst(source(transition.endDate, '00:59:59'), at(transition.endDate, '00:59:59'), {
      timezone: 'Asia/Shanghai',
      historicalDstPolicy: BAZI_HISTORICAL_DST_POLICY,
    });
    assert.equal(beforeEnd.status, 'daylight-time');
    const previousDate = new Date(`${transition.endDate}T00:00:00Z`);
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    const previousDateLabel = previousDate.toISOString().slice(0, 10);
    assert.equal(beforeEnd.effectiveDateTime, at(previousDateLabel, '23:59:59'));

    expectInputError(
      () => resolveBaziHistoricalDst(source(transition.endDate, '01:00:00'), at(transition.endDate, '01:00:00'), {
        timezone: 'Asia/Shanghai',
        historicalDstPolicy: BAZI_HISTORICAL_DST_POLICY,
      }),
      'AMBIGUOUS_LOCAL_TIME',
    );
    expectInputError(
      () => resolveBaziHistoricalDst(source(transition.endDate, '01:59:59'), at(transition.endDate, '01:59:59'), {
        timezone: 'Asia/Shanghai',
        historicalDstPolicy: BAZI_HISTORICAL_DST_POLICY,
      }),
      'AMBIGUOUS_LOCAL_TIME',
    );

    const atEnd = resolveBaziHistoricalDst(source(transition.endDate, '02:00:00'), at(transition.endDate, '02:00:00'), {
      timezone: 'Asia/Shanghai',
      historicalDstPolicy: BAZI_HISTORICAL_DST_POLICY,
    });
    assert.equal(atEnd.status, 'standard-time');
    assert.equal(atEnd.applied, false);
    assert.equal(atEnd.effectiveDateTime, at(transition.endDate, '02:00:00'));
  }
});

test('P5-A5c applies -60 minutes before true-solar and day-boundary stages', () => {
  const original = clone(baseProfile);
  const result = calculateBaziView(baseProfile, undefined, calculationOptions);
  const resolution = result.calculationEvidence.historicalDstResolution;

  assert.deepEqual(baseProfile, original, 'original civil input must never be overwritten');
  assert.equal(result.calculationSettings.timezone, 'Asia/Shanghai');
  assert.deepEqual(result.calculationSettings.historicalDstPolicy, BAZI_HISTORICAL_DST_POLICY);
  assert.deepEqual(result.inputSnapshot.historicalDstPolicy, BAZI_HISTORICAL_DST_POLICY);
  assert.equal(result.inputSnapshot.birthDate, '1987-06-01');
  assert.equal(result.inputSnapshot.birthTime, '12:00');
  assert.equal(resolution.sourceCivilTime, '1987-06-01T12:00:00');
  assert.equal(resolution.normalizedSolarDateTime, '1987-06-01T12:00:00');
  assert.equal(resolution.dataSourceCommit, '7e1145bfdb9630c127841dc8ce808a937a300938');
  assert.equal(resolution.dataSourceCommitUrl, 'https://github.com/eggert/tz/commit/7e1145bfdb9630c127841dc8ce808a937a300938');
  assert.equal(resolution.effectiveDateTime, '1987-06-01T11:00:00');
  assert.equal(resolution.status, 'daylight-time');
  assert.equal(resolution.adjustmentMinutes, -60);
  assert.equal(resolution.dayOffset, 0);
  assert.equal(result.calculationEvidence.effectiveCalculationTime, '1987-06-01T11:00:00');
  assert.match(result.calculationEvidence.warnings.join(' '), /历史夏令时政策/);

  const crossDay = calculateBaziView(profile({ birthTime: '00:30' }), undefined, {
    ...calculationOptions,
    bazi: { trueSolarTime: false, solarTimeModel: 'none' },
  });
  assert.equal(crossDay.calculationEvidence.historicalDstResolution.effectiveDateTime, '1987-05-31T23:30:00');
  assert.equal(crossDay.calculationEvidence.historicalDstResolution.dayOffset, -1);
  assert.equal(crossDay.calculationEvidence.effectiveCalculationTime, '1987-05-31T23:30:00');
  assert.equal(crossDay.calculationEvidence.trueSolarCorrection.civilTime, '1987-05-31T23:30:00');

  const ziEarly = calculateBaziView(profile({ birthTime: '00:30' }), undefined, {
    ...calculationOptions,
    bazi: { dayBoundary: 'ziEarly', trueSolarTime: false, solarTimeModel: 'none' },
  });
  assert.equal(ziEarly.calculationEvidence.historicalDstResolution.effectiveDateTime, '1987-05-31T23:30:00');
  assert.equal(ziEarly.calculationEvidence.dayBoundaryRule, 'ziEarly');
  assert.equal(ziEarly.calculationEvidence.effectiveCalculationTime, '1987-06-01T23:30:00');

  const trueSolar = calculateBaziView(profile({ birthTime: '00:30' }), undefined, {
    ...calculationOptions,
    bazi: { trueSolarTime: true, solarTimeModel: 'localMeanSolarTime' },
  });
  assert.equal(trueSolar.calculationEvidence.historicalDstResolution.effectiveDateTime, '1987-05-31T23:30:00');
  assert.equal(trueSolar.calculationEvidence.trueSolarCorrection.civilTime, '1987-05-31T23:30:00');
  assert.equal(trueSolar.calculationEvidence.trueSolarCorrection.effectiveTime.startsWith('1987-05-31T'), true);
  assert.equal(trueSolar.calculationEvidence.effectiveCalculationTime.startsWith('1987-05-31T'), true);

  const winter = calculateBaziView(profile({ birthDate: '1987-01-01', birthTime: '12:00' }), undefined, calculationOptions);
  assert.equal(winter.calculationEvidence.historicalDstResolution.status, 'standard-time');
  assert.equal(winter.calculationEvidence.historicalDstResolution.applied, false);
  assert.equal(winter.calculationEvidence.historicalDstResolution.adjustmentMinutes, 0);
  assert.equal(winter.calculationEvidence.historicalDstResolution.effectiveDateTime, '1987-01-01T12:00:00');

  expectInputError(
    () => calculateBaziView(profile({ birthDate: '1987-04-12', birthTime: '02:30' }), undefined, calculationOptions),
    'NONEXISTENT_LOCAL_TIME',
  );
  expectInputError(
    () => calculateBaziView(profile({ birthDate: '1987-09-13', birthTime: '01:30' }), undefined, calculationOptions),
    'AMBIGUOUS_LOCAL_TIME',
  );
});

test('P5-A5c resolves lunar input only after conversion and retains the lunar source label', () => {
  const result = calculateBaziView(profile({
    id: 'p5-a5c-lunar',
    birthDate: '1987-05-06',
    birthTime: '12:00',
    calendar: 'lunar',
    isLeapMonth: false,
  }), undefined, calculationOptions);
  const resolution = result.calculationEvidence.historicalDstResolution;
  assert.equal(result.inputSnapshot.calendar, 'lunar');
  assert.equal(result.inputSnapshot.birthDate, '1987-05-06');
  assert.equal(result.inputSnapshot.birthTime, '12:00');
  assert.equal(resolution.sourceCalendar, 'lunar');
  assert.equal(resolution.sourceCivilTime, '1987-05-06T12:00:00');
  assert.equal(resolution.normalizedSolarDateTime, '1987-06-01T12:00:00');
  assert.equal(resolution.effectiveDateTime, '1987-06-01T11:00:00');
  assert.equal(resolution.applied, true);
  assert.equal(result.calculationEvidence.calendarConversion.sourceCalendar, 'lunar');
});

test('P5-A5c stores policy and resolution in ChartSnapshotMeta, SavedReading, replay and both backup formats', async () => {
  const payload = calculateBaziView(baseProfile, undefined, calculationOptions);
  const snapshotMeta = snapshotMetaFromPayload(payload);
  const resolution = payload.calculationEvidence.historicalDstResolution;
  const reading = {
    id: 'p5-a5c-reading',
    profileId: baseProfile.id,
    profileName: baseProfile.name,
    module: 'bazi',
    title: '历史夏令时快照',
    summary: '保留原始民用时刻与有效标准时',
    createdAt: payload.generatedAt,
    engineVersion: payload.engineVersion,
    interpretationVersion: payload.interpretation.interpretationVersion,
    snapshotMeta,
    inputSnapshot: payload.inputSnapshot,
    profileSnapshot: baseProfile,
    normalizedChartSnapshot: payload.normalizedChart,
    evidenceGraphSnapshot: payload.evidenceGraph,
    interpretationSnapshot: payload.interpretation,
    explanationSnapshot: payload.explanation,
    favorite: false,
    feedback: [],
    payload,
  };

  assert.deepEqual(snapshotMeta.calculationSettings.historicalDstPolicy, BAZI_HISTORICAL_DST_POLICY);
  assert.deepEqual(snapshotMeta.inputSnapshot.historicalDstResolution, resolution);
  assert.deepEqual(reading.snapshotMeta.inputSnapshot.historicalDstResolution, resolution);
  assert.deepEqual(reading.payload.inputSnapshot.historicalDstResolution, resolution);
  assert.deepEqual(migrateReadings([clone(reading)])[0].payload.calculationEvidence.historicalDstResolution, resolution);

  const normalRestored = parseLocalBackupText(createLocalBackupText({
    user: null,
    profiles: [baseProfile],
    selectedProfileId: baseProfile.id,
    readings: [reading],
  }, generatedAt)).data.readings[0];
  assert.deepEqual(normalRestored.payload.calculationSettings.historicalDstPolicy, BAZI_HISTORICAL_DST_POLICY);
  assert.deepEqual(normalRestored.payload.inputSnapshot.historicalDstResolution, resolution);
  assert.deepEqual(normalRestored.snapshotMeta.calculationSettings.historicalDstPolicy, BAZI_HISTORICAL_DST_POLICY);
  assert.deepEqual(normalRestored.snapshotMeta.inputSnapshot.historicalDstResolution, resolution);

  const encryptedRestored = (await parseEncryptedLocalBackupText(
    await createEncryptedLocalBackupText({
      user: null,
      profiles: [baseProfile],
      selectedProfileId: baseProfile.id,
      readings: [reading],
    },
    '观象历史夏令时2026',
    generatedAt),
    '观象历史夏令时2026',
  )).data.readings[0];
  assert.deepEqual(encryptedRestored.payload.calculationSettings.historicalDstPolicy, BAZI_HISTORICAL_DST_POLICY);
  assert.deepEqual(encryptedRestored.payload.inputSnapshot.historicalDstResolution, resolution);
  assert.deepEqual(encryptedRestored.snapshotMeta.inputSnapshot.historicalDstResolution, resolution);
});

test('P5-A5c old Bazi snapshots remain readable without invented DST metadata', () => {
  const inputSnapshot = {
    type: 'birth',
    timezone: 'Asia/Shanghai',
    profileId: 'legacy-profile',
    birthDate: '1987-06-01',
    birthTime: '12:00',
    timeKnown: true,
    birthCity: '北京市',
    calendar: 'solar',
  };
  const settings = { timezone: 'Asia/Shanghai' };
  const legacy = {
    id: 'legacy-bazi-dst',
    profileId: 'legacy-profile',
    profileName: 'legacy',
    module: 'bazi',
    title: 'legacy',
    summary: 'legacy',
    createdAt: generatedAt,
    engineVersion: 'taibu-core@3.4.0/bazi',
    interpretationVersion: 'rules-v1',
    snapshotMeta: {
      snapshotVersion: 1,
      generatedAt,
      engineVersion: 'taibu-core@3.4.0/bazi',
      calculationSettings: settings,
      inputSnapshot,
    },
    inputSnapshot,
    payload: {
      module: 'bazi',
      snapshotVersion: 1,
      generatedAt,
      engineVersion: 'taibu-core@3.4.0/bazi',
      calculationSettings: settings,
      inputSnapshot,
    },
  };
  const migrated = migrateReadings([legacy])[0];
  assert.ok(migrated);
  assert.equal(Object.prototype.hasOwnProperty.call(migrated.payload.calculationSettings, 'historicalDstPolicy'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(migrated.inputSnapshot, 'historicalDstResolution'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(migrated.payload.inputSnapshot, 'historicalDstResolution'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(migrated.payload.calculationEvidence, 'historicalDstResolution'), false);
});

test('P5-A5c Bazi output is deepEqual under UTC, Asia/Shanghai, and another host timezone', () => {
  const source = `
    import { calculateBaziView } from './src/services/chart-engine.ts';
    const profile = ${JSON.stringify(profile({ birthTime: '00:30' }))};
    const options = ${JSON.stringify({ ...calculationOptions, bazi: { dayBoundary: 'ziEarly', trueSolarTime: true, solarTimeModel: 'apparentSolarTime' } })};
    process.stdout.write(JSON.stringify(calculateBaziView(profile, undefined, options)));
  `;
  const run = (hostTimezone) => JSON.parse(execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-loader', './scripts/ts-path-loader.mjs', '-e', source],
    {
      cwd: projectRoot,
      env: { ...process.env, TZ: hostTimezone },
      encoding: 'utf8',
    },
  ));
  const utc = run('UTC');
  assert.deepEqual(utc, run('Asia/Shanghai'));
  assert.deepEqual(utc, run('America/Los_Angeles'));
  assert.equal(utc.calculationSettings.timezone, 'Asia/Shanghai');
  assert.equal(utc.calculationEvidence.historicalDstResolution.timezone, 'Asia/Shanghai');
});

test('P5-A5c cumulative owner-decision overlay preserves v1/v2 and adds the fifth DST case', () => {
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_CASES.length, 3);
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES.length, 4);
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES.length, 5);
  assert.equal(OWNER_DECISION_RESOLUTION_V3_CONTRACT_VERSION, 'p5-a5a-owner-decision.v3');
  assert.equal(OWNER_DECISION_RESOLUTION_V3_TARGET_BATCH, 'P5-A5c');
  assert.deepEqual(OWNER_DECISION_RESOLUTION_V3_AUDIT_CASE_IDS, [
    ...P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES.map((item) => item.auditCaseId),
    'p5-a4a-bazi-historical-dst',
  ]);
  assert.deepEqual(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES.slice(0, 4).map((item) => item.resolutionId), P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES.map((item) => item.resolutionId));
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES[4].decisionId, BAZI_HISTORICAL_DST_DECISION_ID);
  assert.equal(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES[4].targetBatch, OWNER_DECISION_RESOLUTION_V3_TARGET_BATCH);
  assert.deepEqual(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES[4].policy, BAZI_HISTORICAL_DST_POLICY);
  assert.deepEqual(getOwnerDecisionResolutionVersionedRegistryValidationErrors(P5_A5A_OWNER_DECISION_RESOLUTION_CASES), []);
  assert.deepEqual(getOwnerDecisionResolutionVersionedRegistryValidationErrors(P5_A5A_OWNER_DECISION_RESOLUTION_V2_CASES), []);
  assert.deepEqual(getOwnerDecisionResolutionVersionedRegistryValidationErrors(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES), []);
  assert.deepEqual(validateOwnerDecisionResolutionV3Registry(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES), P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES);

  const changed = clone(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES);
  changed[4].policy.transitions[0].startDate = '1986-04-27';
  assert.throws(() => validateOwnerDecisionResolutionV3Registry(changed), /owner-approved China mainland historical DST policy/);

  const mixed = clone(P5_A5A_OWNER_DECISION_RESOLUTION_V3_CASES);
  mixed[0].contractVersion = 'p5-a5a-owner-decision.v2';
  assert.match(getOwnerDecisionResolutionVersionedRegistryValidationErrors(mixed).join('\n'), /exactly one supported contract version/);
});
