import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION,
  BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION,
  BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION,
  P5_A4B_INPUT_RESOLUTION_CASES,
  P5_A4B_INPUT_RESOLUTION_V2_CASES,
  P5_A4B_INPUT_RESOLUTION_V3_CASES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  getBoundaryInputResolutionVersionedRegistryValidationErrors,
  validateBoundaryInputResolutionV3,
  validateBoundaryInputResolutionV3Registry,
  validateBoundaryInputResolutionVersioned,
  validateBoundaryInputResolutionVersionedRegistry,
} from '../src/domains/golden/index.ts';
import { calculateAstrologyView, getChartInputErrorContract } from '../src/services/chart-engine.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const generatedAt = '2026-08-15T00:00:00.000Z';

const baseProfile = {
  id: 'p5-a4b3-true-solar-boundary',
  name: 'P5-A4b3 真太阳时边界样例',
  relationship: '本人',
  birthDate: '2024-01-15',
  birthTime: '12:00',
  birthCity: 'P5-A4b3 边界测试点',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 30,
  longitude: 120,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

const boundaryMatrix = [
  {
    id: 'east-cross-forward',
    birthTime: '23:30',
    longitude: 135,
    dayBoundary: 'midnight',
    expected: {
      civilTime: '2024-01-15T23:30:00',
      effectiveTime: '2024-01-16T00:30:00',
      appliedCorrectionMinutes: 60,
      effectiveCalculationTime: '2024-01-16T00:30:00',
    },
  },
  {
    id: 'east-cross-forward-zi-early',
    birthTime: '23:30',
    longitude: 135,
    dayBoundary: 'ziEarly',
    expected: {
      civilTime: '2024-01-15T23:30:00',
      effectiveTime: '2024-01-16T00:30:00',
      appliedCorrectionMinutes: 60,
      effectiveCalculationTime: '2024-01-16T00:30:00',
    },
  },
  {
    id: 'west-cross-backward',
    birthTime: '00:30',
    longitude: 75,
    dayBoundary: 'midnight',
    expected: {
      civilTime: '2024-01-15T00:30:00',
      effectiveTime: '2024-01-14T21:30:00',
      appliedCorrectionMinutes: -180,
      effectiveCalculationTime: '2024-01-14T21:30:00',
    },
  },
  {
    id: 'west-cross-backward-zi-early',
    birthTime: '00:30',
    longitude: 75,
    dayBoundary: 'ziEarly',
    expected: {
      civilTime: '2024-01-15T00:30:00',
      effectiveTime: '2024-01-14T21:30:00',
      appliedCorrectionMinutes: -180,
      effectiveCalculationTime: '2024-01-14T21:30:00',
    },
  },
  {
    id: 'east-zi-early-intermediate',
    birthTime: '22:00',
    longitude: 135,
    dayBoundary: 'midnight',
    expected: {
      civilTime: '2024-01-15T22:00:00',
      effectiveTime: '2024-01-15T23:00:00',
      appliedCorrectionMinutes: 60,
      effectiveCalculationTime: '2024-01-15T23:00:00',
    },
  },
  {
    id: 'east-zi-early-final',
    birthTime: '22:00',
    longitude: 135,
    dayBoundary: 'ziEarly',
    expected: {
      civilTime: '2024-01-15T22:00:00',
      effectiveTime: '2024-01-15T23:00:00',
      appliedCorrectionMinutes: 60,
      effectiveCalculationTime: '2024-01-16T23:00:00',
    },
  },
  {
    id: 'west-zi-early-intermediate',
    birthTime: '02:00',
    longitude: 75,
    dayBoundary: 'midnight',
    expected: {
      civilTime: '2024-01-15T02:00:00',
      effectiveTime: '2024-01-14T23:00:00',
      appliedCorrectionMinutes: -180,
      effectiveCalculationTime: '2024-01-14T23:00:00',
    },
  },
  {
    id: 'west-zi-early-final',
    birthTime: '02:00',
    longitude: 75,
    dayBoundary: 'ziEarly',
    expected: {
      civilTime: '2024-01-15T02:00:00',
      effectiveTime: '2024-01-14T23:00:00',
      appliedCorrectionMinutes: -180,
      effectiveCalculationTime: '2024-01-15T23:00:00',
    },
  },
];

function runBoundaryMatrix(hostTimezone) {
  const source = `
    import { calculateBaziView } from './src/services/chart-engine.ts';
    const generatedAt = ${JSON.stringify(generatedAt)};
    const baseProfile = ${JSON.stringify(baseProfile)};
    const boundaryMatrix = ${JSON.stringify(boundaryMatrix.map(({ id, birthTime, longitude, dayBoundary }) => ({ id, birthTime, longitude, dayBoundary })))};
    const results = boundaryMatrix.map((item) => calculateBaziView(
      { ...baseProfile, id: item.id, birthTime: item.birthTime, longitude: item.longitude },
      undefined,
      { generatedAt, bazi: {
        dayBoundary: item.dayBoundary,
        trueSolarTime: true,
        solarTimeModel: 'localMeanSolarTime',
        trueSolarTimeVersion: 'true-solar-time-v2-noaa',
      } },
    ));
    process.stdout.write(JSON.stringify(results));
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

test('P5-A4b3 Bazi 真太阳时标准经线两侧跨日矩阵在 midnight/ziEarly 与宿主 TZ 下稳定', () => {
  const utc = runBoundaryMatrix('UTC');
  const shanghai = runBoundaryMatrix('Asia/Shanghai');
  assert.deepEqual(utc, shanghai);
  assert.equal(utc.length, boundaryMatrix.length);

  for (const [index, expectedCase] of boundaryMatrix.entries()) {
    const result = utc[index];
    const correction = result.calculationEvidence.trueSolarCorrection;
    assert.equal(result.calculationSettings.dayBoundary, expectedCase.dayBoundary);
    assert.equal(result.calculationSettings.trueSolarTimeVersion, 'true-solar-time-v2-noaa');
    assert.equal(result.calculationSettings.solarTimeModel, 'localMeanSolarTime');
    assert.equal(correction.algorithmVersion, 'true-solar-time-v2-noaa');
    assert.equal(correction.standardMeridian, 120);
    assert.equal(correction.longitude, expectedCase.longitude);
    assert.deepEqual(
      {
        civilTime: correction.civilTime,
        effectiveTime: correction.effectiveTime,
        appliedCorrectionMinutes: correction.appliedCorrectionMinutes,
        effectiveCalculationTime: result.calculationEvidence.effectiveCalculationTime,
      },
      expectedCase.expected,
    );
  }
});

test('P5-A4b3 cumulative resolution overlay 保持 v1/v2 前缀并新增第六项 v3', () => {
  assert.equal(P5_A4B_INPUT_RESOLUTION_CASES.length, 3);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V2_CASES.length, 5);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V3_CASES.length, 6);
  assert.deepEqual(
    P5_A4B_INPUT_RESOLUTION_V3_CASES.slice(0, 5).map(({ contractVersion, ...item }) => item),
    P5_A4B_INPUT_RESOLUTION_V2_CASES.map(({ contractVersion, ...item }) => item),
  );
  assert.deepEqual(
    P5_A4B_INPUT_RESOLUTION_V2_CASES.slice(0, 3).map(({ contractVersion, ...item }) => item),
    P5_A4B_INPUT_RESOLUTION_CASES.map(({ contractVersion, ...item }) => item),
  );
  assert.deepEqual(
    P5_A4B_INPUT_RESOLUTION_V3_CASES.map((item) => item.auditCaseId),
    [
      ...P5_A4B_INPUT_RESOLUTION_V2_CASES.map((item) => item.auditCaseId),
      'p5-a4a-bazi-true-solar-cross-day',
    ],
  );
  assert.equal(P5_A4B_INPUT_RESOLUTION_V3_CASES.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION), true);
  assert.deepEqual(JSON.parse(JSON.stringify(P5_A4B_INPUT_RESOLUTION_V3_CASES)), P5_A4B_INPUT_RESOLUTION_V3_CASES);
  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(P5_A4B_INPUT_RESOLUTION_CASES), []);
  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(P5_A4B_INPUT_RESOLUTION_V2_CASES), []);
  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(P5_A4B_INPUT_RESOLUTION_V3_CASES), []);
  assert.deepEqual(validateBoundaryInputResolutionVersionedRegistry(P5_A4B_INPUT_RESOLUTION_CASES), P5_A4B_INPUT_RESOLUTION_CASES);
  assert.deepEqual(validateBoundaryInputResolutionVersionedRegistry(P5_A4B_INPUT_RESOLUTION_V2_CASES), P5_A4B_INPUT_RESOLUTION_V2_CASES);
  assert.deepEqual(validateBoundaryInputResolutionVersionedRegistry(P5_A4B_INPUT_RESOLUTION_V3_CASES), P5_A4B_INPUT_RESOLUTION_V3_CASES);
  assert.deepEqual(validateBoundaryInputResolutionVersioned(P5_A4B_INPUT_RESOLUTION_V3_CASES[5]), P5_A4B_INPUT_RESOLUTION_V3_CASES[5]);
  assert.equal(P5_A4B_INPUT_RESOLUTION_CASES.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION), true);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V2_CASES.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION), true);

  for (const resolution of P5_A4B_INPUT_RESOLUTION_V3_CASES) {
    const original = P5_BOUNDARY_INPUT_AUDIT_CASES.find((item) => item.id === resolution.auditCaseId);
    assert.equal(original?.status, 'gap');
    assert.equal(original?.targetBatch, 'P5-A4b');
    assert.equal(resolution.status, 'resolved');
    assert.equal(resolution.targetBatch, 'P5-A4b');
    assert.equal(resolution.testRefs.every((ref) => ref.startsWith('tests/')), true);
    assert.equal(JSON.stringify(resolution).includes('commit'), false);
  }
});

test('P5-A4b3 v3 validator 拒绝版本混用、重复、缺项、非 JSON 和错误 audit 引用', () => {
  const clone = (value) => JSON.parse(JSON.stringify(value));

  const mixedVersions = clone(P5_A4B_INPUT_RESOLUTION_V3_CASES);
  mixedVersions[0] = clone(P5_A4B_INPUT_RESOLUTION_V2_CASES[0]);
  assert.throws(
    () => validateBoundaryInputResolutionVersionedRegistry(mixedVersions),
    /exactly one contract version/,
  );

  const duplicateResolutionId = clone(P5_A4B_INPUT_RESOLUTION_V3_CASES);
  duplicateResolutionId[5].resolutionId = duplicateResolutionId[0].resolutionId;
  assert.throws(() => validateBoundaryInputResolutionV3Registry(duplicateResolutionId), /resolutionId duplicates/);

  const duplicateAuditCaseId = clone(P5_A4B_INPUT_RESOLUTION_V3_CASES);
  duplicateAuditCaseId[5].auditCaseId = duplicateAuditCaseId[0].auditCaseId;
  assert.throws(() => validateBoundaryInputResolutionV3Registry(duplicateAuditCaseId), /auditCaseId duplicates|resolution registry is missing/);

  assert.throws(
    () => validateBoundaryInputResolutionV3Registry(P5_A4B_INPUT_RESOLUTION_V3_CASES.slice(0, 5)),
    /exactly 6 resolutions|resolution registry is missing/,
  );

  const nonJson = clone(P5_A4B_INPUT_RESOLUTION_V3_CASES);
  nonJson[0].notes = new Date('2026-08-15T00:00:00.000Z');
  assert.throws(() => validateBoundaryInputResolutionV3Registry(nonJson), /must be a plain JSON object/);

  const wrongAudit = clone(P5_A4B_INPUT_RESOLUTION_V3_CASES[5]);
  wrongAudit.auditCaseId = 'p5-a4a-bazi-solar-date-validity';
  assert.throws(() => validateBoundaryInputResolutionV3(wrongAudit), /auditCaseId is not supported/);
});

test('P5-A4b3 锁定 A4a 统计与 astrology unknown-city 0,0 probe 不变', () => {
  const count = (key, value) => P5_BOUNDARY_INPUT_AUDIT_CASES.filter((item) => item[key] === value).length;
  assert.deepEqual(
    {
      total: P5_BOUNDARY_INPUT_AUDIT_CASES.length,
      covered: count('status', 'covered'),
      gap: count('status', 'gap'),
      decisionRequired: count('status', 'decision-required'),
      notApplicable: count('status', 'not-applicable'),
      routedP5B: count('status', 'routed-p5-b'),
    },
    { total: 41, covered: 18, gap: 15, decisionRequired: 5, notApplicable: 2, routedP5B: 1 },
  );

  const exact = calculateAstrologyView({
    ...baseProfile,
    id: 'p5-a4b3-exact-city',
    birthCity: '广东省深圳市',
    birthDate: '2001-09-08',
    birthTime: '20:30',
    latitude: 22.5431,
    longitude: 114.0579,
  }, { generatedAt });
  assert.throws(() => calculateAstrologyView({
    ...baseProfile,
    id: 'p5-a4b3-unknown-city',
    birthCity: '福建省泉州市',
    birthDate: '2001-09-08',
    birthTime: '20:30',
    latitude: undefined,
    longitude: undefined,
  }, { generatedAt }), (error) => {
    assert.deepEqual(getChartInputErrorContract(error), {
      name: 'ChartInputError',
      category: 'input-validation',
      code: 'MISSING_BIRTH_COORDINATES',
      field: 'birthCity',
      message: '无法识别出生城市，请补充城市或成对的纬度和经度。',
    });
    return true;
  });
  assert.equal(exact.calculationMode, 'exact');
});
