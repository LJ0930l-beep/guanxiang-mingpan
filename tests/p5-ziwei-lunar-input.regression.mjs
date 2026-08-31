import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION,
  BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION,
  BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION,
  BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION,
  P5_A4B_INPUT_RESOLUTION_CASES,
  P5_A4B_INPUT_RESOLUTION_V2_CASES,
  P5_A4B_INPUT_RESOLUTION_V3_CASES,
  P5_A4B_INPUT_RESOLUTION_V4_CASES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  getBoundaryInputResolutionV4ValidationErrors,
  getBoundaryInputResolutionVersionedRegistryValidationErrors,
  validateBoundaryInputResolutionRegistry,
  validateBoundaryInputResolutionV2Registry,
  validateBoundaryInputResolutionV3,
  validateBoundaryInputResolutionV3Registry,
  validateBoundaryInputResolutionV4,
  validateBoundaryInputResolutionV4Registry,
  validateBoundaryInputResolutionVersioned,
  validateBoundaryInputResolutionVersionedRegistry,
} from '../src/domains/golden/index.ts';
import {
  calculateZiweiView,
  getChartInputErrorContract,
  isChartInputError,
  PUBLIC_BIRTH_DATE_RANGE_POLICY,
} from '../src/services/chart-engine.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const generatedAt = '2026-08-15T00:00:00.000Z';
const calculationOptions = { generatedAt, timezone: 'Asia/Shanghai' };

const baseProfile = {
  id: 'p5-a4b4-ziwei-lunar',
  name: 'P5-A4b4 紫微农历输入样例',
  relationship: '本人',
  birthDate: '2024-02-30',
  birthTime: '12:00',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'lunar',
  isLeapMonth: false,
  gender: 'male',
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function expectZiweiInputError(run, code, field) {
  let caught;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught, 'expected a ChartInputError');
  assert.equal(isChartInputError(caught), true);
  assert.equal(caught.code, code);
  assert.equal(caught.field, field);
  const contract = getChartInputErrorContract(caught);
  assert.equal(contract?.name, 'ChartInputError');
  assert.equal(contract?.category, 'input-validation');
  assert.equal(contract?.code, code);
  assert.equal(contract?.field, field);
  return contract;
}

test('P5-A4b4 cumulative resolution overlay 保持 v1/v2/v3 前缀并新增第八项 v4', () => {
  assert.equal(P5_A4B_INPUT_RESOLUTION_CASES.length, 3);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V2_CASES.length, 5);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V3_CASES.length, 6);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V4_CASES.length, 8);

  assert.deepEqual(
    P5_A4B_INPUT_RESOLUTION_V4_CASES.slice(0, 6).map(({ contractVersion, ...item }) => item),
    P5_A4B_INPUT_RESOLUTION_V3_CASES.map(({ contractVersion, ...item }) => item),
  );
  assert.deepEqual(
    P5_A4B_INPUT_RESOLUTION_V3_CASES.slice(0, 5).map(({ contractVersion, ...item }) => item),
    P5_A4B_INPUT_RESOLUTION_V2_CASES.map(({ contractVersion, ...item }) => item),
  );
  assert.deepEqual(
    P5_A4B_INPUT_RESOLUTION_V2_CASES.slice(0, 3).map(({ contractVersion, ...item }) => item),
    P5_A4B_INPUT_RESOLUTION_CASES.map(({ contractVersion, ...item }) => item),
  );
  assert.deepEqual(
    P5_A4B_INPUT_RESOLUTION_V4_CASES.map((item) => item.auditCaseId),
    [
      ...P5_A4B_INPUT_RESOLUTION_V3_CASES.map((item) => item.auditCaseId),
      'p5-a4a-ziwei-lunar-input',
      'p5-a4a-ziwei-leap-month',
    ],
  );

  assert.equal(P5_A4B_INPUT_RESOLUTION_CASES.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION), true);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V2_CASES.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION), true);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V3_CASES.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION), true);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V4_CASES.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION), true);
  assert.deepEqual(JSON.parse(JSON.stringify(P5_A4B_INPUT_RESOLUTION_V4_CASES)), P5_A4B_INPUT_RESOLUTION_V4_CASES);

  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(P5_A4B_INPUT_RESOLUTION_CASES), []);
  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(P5_A4B_INPUT_RESOLUTION_V2_CASES), []);
  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(P5_A4B_INPUT_RESOLUTION_V3_CASES), []);
  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(P5_A4B_INPUT_RESOLUTION_V4_CASES), []);
  assert.deepEqual(validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_CASES), P5_A4B_INPUT_RESOLUTION_CASES);
  assert.deepEqual(validateBoundaryInputResolutionV2Registry(P5_A4B_INPUT_RESOLUTION_V2_CASES), P5_A4B_INPUT_RESOLUTION_V2_CASES);
  assert.deepEqual(validateBoundaryInputResolutionV3Registry(P5_A4B_INPUT_RESOLUTION_V3_CASES), P5_A4B_INPUT_RESOLUTION_V3_CASES);
  assert.deepEqual(validateBoundaryInputResolutionV4Registry(P5_A4B_INPUT_RESOLUTION_V4_CASES), P5_A4B_INPUT_RESOLUTION_V4_CASES);
  assert.deepEqual(validateBoundaryInputResolutionVersioned(P5_A4B_INPUT_RESOLUTION_V4_CASES[7]), P5_A4B_INPUT_RESOLUTION_V4_CASES[7]);
  assert.deepEqual(validateBoundaryInputResolutionVersionedRegistry(P5_A4B_INPUT_RESOLUTION_V4_CASES), P5_A4B_INPUT_RESOLUTION_V4_CASES);

  for (const resolution of P5_A4B_INPUT_RESOLUTION_V4_CASES) {
    const original = P5_BOUNDARY_INPUT_AUDIT_CASES.find((item) => item.id === resolution.auditCaseId);
    assert.equal(original?.status, 'gap');
    assert.equal(original?.targetBatch, 'P5-A4b');
    assert.equal(resolution.status, 'resolved');
    assert.equal(resolution.targetBatch, 'P5-A4b');
    assert.equal(resolution.testRefs.every((ref) => ref.startsWith('tests/')), true);
    assert.equal(JSON.stringify(resolution).includes('commit'), false);
  }
});

test('P5-A4b4 v4 validator 拒绝版本混用、重复、缺项、非 JSON 和错误 audit 引用', () => {
  const mixedVersions = clone(P5_A4B_INPUT_RESOLUTION_V4_CASES);
  mixedVersions[0] = clone(P5_A4B_INPUT_RESOLUTION_V3_CASES[0]);
  assert.throws(
    () => validateBoundaryInputResolutionVersionedRegistry(mixedVersions),
    /exactly one contract version/,
  );

  const duplicateResolutionId = clone(P5_A4B_INPUT_RESOLUTION_V4_CASES);
  duplicateResolutionId[7].resolutionId = duplicateResolutionId[0].resolutionId;
  assert.throws(() => validateBoundaryInputResolutionV4Registry(duplicateResolutionId), /resolutionId duplicates/);

  const duplicateAuditCaseId = clone(P5_A4B_INPUT_RESOLUTION_V4_CASES);
  duplicateAuditCaseId[7].auditCaseId = duplicateAuditCaseId[0].auditCaseId;
  assert.throws(() => validateBoundaryInputResolutionV4Registry(duplicateAuditCaseId), /auditCaseId duplicates|resolution registry is missing/);

  assert.throws(
    () => validateBoundaryInputResolutionV4Registry(P5_A4B_INPUT_RESOLUTION_V4_CASES.slice(0, 7)),
    /exactly 8 resolutions|resolution registry is missing/,
  );

  const nonJson = clone(P5_A4B_INPUT_RESOLUTION_V4_CASES);
  nonJson[0].notes = new Date(generatedAt);
  assert.throws(() => validateBoundaryInputResolutionV4Registry(nonJson), /must be a plain JSON object/);

  const wrongAudit = clone(P5_A4B_INPUT_RESOLUTION_V4_CASES[7]);
  wrongAudit.auditCaseId = 'p5-a4a-bazi-solar-date-validity';
  assert.throws(() => validateBoundaryInputResolutionV4(wrongAudit), /auditCaseId is not supported/);
  assert.notDeepEqual(getBoundaryInputResolutionV4ValidationErrors(wrongAudit), []);
});

test('P5-A4b4 紫微普通农历日期按真实农历日数校验，不误用 Gregorian validator', () => {
  const result = calculateZiweiView(baseProfile, undefined, calculationOptions);

  assert.equal(result.solarDate, '2024-4-8');
  assert.equal(result.lunarDate, '二〇二四年二月三十');
  assert.deepEqual(result.inputSnapshot, {
    type: 'birth',
    timezone: 'Asia/Shanghai',
    profileId: baseProfile.id,
    birthDate: '2024-02-30',
    timeKnown: true,
    birthCity: '北京市',
    calendar: 'lunar',
    birthTime: '12:00',
    isLeapMonth: false,
    birthDateRangePolicy: PUBLIC_BIRTH_DATE_RANGE_POLICY,
    gender: 'male',
  });
});

test('P5-A4b4 紫微有效闰月样例保留闰月语义并传入既有 iztro 排盘', () => {
  const leap = calculateZiweiView({
    ...baseProfile,
    id: 'p5-a4b4-ziwei-leap',
    birthDate: '2025-06-01',
    isLeapMonth: true,
  }, undefined, calculationOptions);
  const ordinary = calculateZiweiView({
    ...baseProfile,
    id: 'p5-a4b4-ziwei-ordinary-six',
    birthDate: '2025-06-01',
    isLeapMonth: false,
  }, undefined, calculationOptions);

  assert.equal(leap.solarDate, '2025-7-25');
  assert.match(leap.lunarDate, /闰六月初一/);
  assert.equal(leap.inputSnapshot.isLeapMonth, true);
  assert.equal(ordinary.solarDate, '2025-6-25');
  assert.match(ordinary.lunarDate, /六月初一/);
  assert.doesNotMatch(ordinary.lunarDate, /闰六月/);
  assert.notEqual(leap.solarDate, ordinary.solarDate);
});

test('P5-A4b4 拒绝不存在的紫微闰月组合并返回稳定输入错误', () => {
  const contract = expectZiweiInputError(
    () => calculateZiweiView({
      ...baseProfile,
      birthDate: '2024-02-01',
      isLeapMonth: true,
    }, undefined, calculationOptions),
    'INVALID_LUNAR_LEAP_MONTH',
    'isLeapMonth',
  );
  assert.equal(contract?.message, '农历闰月无效，该年份不存在所选月份的闰月。');

  const anotherInvalid = expectZiweiInputError(
    () => calculateZiweiView({
      ...baseProfile,
      birthDate: '2023-04-01',
      isLeapMonth: true,
    }, undefined, calculationOptions),
    'INVALID_LUNAR_LEAP_MONTH',
    'isLeapMonth',
  );
  assert.equal(anotherInvalid?.message, contract?.message);
});

test('P5-A4b4 拒绝不存在的紫微农历日期而非交给 iztro 静默规范化', () => {
  for (const [birthDate, isLeapMonth] of [
    ['2024-02-31', false],
    ['2025-06-30', true],
    ['2024-02-00', false],
    ['2024-2-30', false],
    ['2024-13-01', false],
  ]) {
    const contract = expectZiweiInputError(
      () => calculateZiweiView({ ...baseProfile, birthDate, isLeapMonth }, undefined, calculationOptions),
      'INVALID_LUNAR_DATE',
      'birthDate',
    );
    assert.equal(contract?.message, '农历日期无效，请使用 YYYY-MM-DD 格式并填写该月真实日期。');
  }
});

function runAcrossHostTimezone(hostTimezone) {
  const source = `
    import { calculateZiweiView, getChartInputErrorContract } from './src/services/chart-engine.ts';
    const generatedAt = ${JSON.stringify(generatedAt)};
    const baseProfile = ${JSON.stringify(baseProfile)};
    const cases = [
      { id: 'ordinary', birthDate: '2024-02-30', isLeapMonth: false },
      { id: 'leap', birthDate: '2025-06-01', isLeapMonth: true },
      { id: 'invalid-leap', birthDate: '2024-02-01', isLeapMonth: true },
      { id: 'invalid-date', birthDate: '2024-02-31', isLeapMonth: false },
    ];
    const capture = (item) => {
      try {
        return { ok: true, result: calculateZiweiView({ ...baseProfile, ...item }, undefined, { generatedAt, timezone: 'Asia/Shanghai' }) };
      } catch (error) {
        return { ok: false, error: getChartInputErrorContract(error) };
      }
    };
    process.stdout.write(JSON.stringify(cases.map(capture)));
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

test('P5-A4b4 紫微农历有效/闰月/错误结果在 UTC 与 Asia/Shanghai 宿主 TZ 完全一致', () => {
  assert.deepEqual(runAcrossHostTimezone('UTC'), runAcrossHostTimezone('Asia/Shanghai'));
});
