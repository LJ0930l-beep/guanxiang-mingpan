import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  calculateAstrologyView,
  calculateZiweiView,
  getChartInputErrorContract,
  isChartInputError,
  isChartInputErrorContract,
} from '../src/services/chart-engine.ts';
import {
  P5_A4B_INPUT_RESOLUTION_CASES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  validateBoundaryInputResolutionRegistry,
} from '../src/domains/golden/index.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const generatedAt = '2026-08-15T00:00:00.000Z';

const fixtureProfile = {
  id: 'p5-a4b-shenzhen',
  name: 'P5-A4b 输入校验样例',
  relationship: '本人',
  birthDate: '2024-02-29',
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

const options = { generatedAt };
const clone = (value) => JSON.parse(JSON.stringify(value));

function expectChartInputError(run, code, field) {
  let caught;
  try {
    run();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught, 'expected an input error');
  assert.equal(isChartInputError(caught), true);
  const contract = getChartInputErrorContract(caught);
  assert.deepEqual(contract, {
    name: 'ChartInputError',
    category: 'input-validation',
    code,
    field,
    message: code === 'INVALID_GREGORIAN_DATE'
      ? '公历日期无效，请使用 YYYY-MM-DD 格式并填写真实日期。'
      : code === 'MISSING_BIRTH_COORDINATES'
        ? '无法识别出生城市，请补充城市或成对的纬度和经度。'
        : '出生坐标无效，请提供成对且在有效范围内的纬度和经度。',
  });
  return contract;
}

test('P5-A4b overlay 只解析三项 A4a gap，且保持纯 JSON、唯一 ID 和测试引用', () => {
  const resolutions = validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_CASES);
  assert.equal(resolutions.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(resolutions)), resolutions);
  assert.deepEqual(new Set(resolutions.map((item) => item.resolutionId)).size, 3);
  assert.deepEqual(
    resolutions.map((item) => item.auditCaseId).sort(),
    [
      'p5-a4a-astrology-invalid-coordinate',
      'p5-a4a-astrology-invalid-gregorian-date',
      'p5-a4a-ziwei-invalid-gregorian-date',
    ],
  );
  for (const resolution of resolutions) {
    const original = P5_BOUNDARY_INPUT_AUDIT_CASES.find((item) => item.id === resolution.auditCaseId);
    assert.equal(original?.status, 'gap');
    assert.equal(original?.targetBatch, 'P5-A4b');
    assert.equal(resolution.testRefs.every((ref) => ref.startsWith('tests/')), true);
    assert.equal(JSON.stringify(resolution).includes('commit'), false);
  }
});

test('P5-A4b 错误类型守卫区分实例与可序列化合同', () => {
  const error = new Error('not a chart input error');
  const contract = {
    name: 'ChartInputError',
    category: 'input-validation',
    code: 'INVALID_GREGORIAN_DATE',
    field: 'birthDate',
    message: '公历日期无效，请使用 YYYY-MM-DD 格式并填写真实日期。',
  };
  assert.equal(isChartInputError(error), false);
  assert.equal(isChartInputErrorContract(contract), true);
  assert.equal(isChartInputError(contract), false);
  assert.deepEqual(getChartInputErrorContract(contract), contract);
  assert.equal(isChartInputErrorContract({ ...contract, message: '不稳定的覆盖文案' }), false);
  assert.equal(getChartInputErrorContract({ ...contract, message: '不稳定的覆盖文案' }), undefined);
});

test('P5-A4b overlay validator 拒绝重复、缺项、非 JSON 值和错误 audit 引用', () => {
  const duplicateResolutionId = clone(P5_A4B_INPUT_RESOLUTION_CASES);
  duplicateResolutionId[1].resolutionId = duplicateResolutionId[0].resolutionId;
  assert.throws(
    () => validateBoundaryInputResolutionRegistry(duplicateResolutionId),
    /resolutionId duplicates/,
  );

  const duplicateAuditCaseId = clone(P5_A4B_INPUT_RESOLUTION_CASES);
  duplicateAuditCaseId[1].auditCaseId = duplicateAuditCaseId[0].auditCaseId;
  assert.throws(
    () => validateBoundaryInputResolutionRegistry(duplicateAuditCaseId),
    /auditCaseId duplicates|resolution registry is missing/,
  );

  const nonJsonDate = clone(P5_A4B_INPUT_RESOLUTION_CASES);
  nonJsonDate[0].notes = new Date('2026-08-15T00:00:00.000Z');
  assert.throws(
    () => validateBoundaryInputResolutionRegistry(nonJsonDate),
    /must be a plain JSON object/,
  );

  const nonJsonFunction = clone(P5_A4B_INPUT_RESOLUTION_CASES);
  nonJsonFunction[0].notes = () => 'not JSON';
  assert.throws(
    () => validateBoundaryInputResolutionRegistry(nonJsonFunction),
    /not a JSON value/,
  );

  const cyclic = clone(P5_A4B_INPUT_RESOLUTION_CASES);
  cyclic[0].notes = cyclic;
  assert.throws(
    () => validateBoundaryInputResolutionRegistry(cyclic),
    /cyclic reference/,
  );

  const firstAuditCaseId = P5_A4B_INPUT_RESOLUTION_CASES[0].auditCaseId;
  const missingAuditRegistry = P5_BOUNDARY_INPUT_AUDIT_CASES.filter((item) => item.id !== firstAuditCaseId);
  assert.throws(
    () => validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_CASES, missingAuditRegistry),
    /must exist in the P5-A4a audit registry|audit registry is missing/,
  );

  const nonGapAuditRegistry = P5_BOUNDARY_INPUT_AUDIT_CASES.map((item) => (
    item.id === firstAuditCaseId ? { ...item, status: 'covered' } : item
  ));
  assert.throws(
    () => validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_CASES, nonGapAuditRegistry),
    /original gap case/,
  );

  const nonTargetAuditRegistry = P5_BOUNDARY_INPUT_AUDIT_CASES.map((item) => (
    item.id === firstAuditCaseId ? { ...item, targetBatch: 'P5-B' } : item
  ));
  assert.throws(
    () => validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_CASES, nonTargetAuditRegistry),
    /targetBatch P5-A4b/,
  );
});

test('P5-A4b solar Gregorian 校验拒绝同一错误合同下的非法日期并接受合法闰日', () => {
  for (const birthDate of ['2023-02-29', '2024-02-30', '1900-02-29', '2024-2-29', '2024-04-31']) {
    const profile = { ...fixtureProfile, birthDate };
    const ziweiError = expectChartInputError(
      () => calculateZiweiView(profile, undefined, options),
      'INVALID_GREGORIAN_DATE',
      'birthDate',
    );
    const astrologyError = expectChartInputError(
      () => calculateAstrologyView(profile, options),
      'INVALID_GREGORIAN_DATE',
      'birthDate',
    );
    assert.deepEqual(astrologyError, ziweiError);
  }

  assert.doesNotThrow(() => calculateZiweiView(fixtureProfile, undefined, options));
  assert.doesNotThrow(() => calculateAstrologyView(fixtureProfile, options));
  const centuryLeapProfile = { ...fixtureProfile, birthDate: '2000-02-29' };
  assert.doesNotThrow(() => calculateZiweiView(centuryLeapProfile, undefined, options));
  assert.doesNotThrow(() => calculateAstrologyView(centuryLeapProfile, options));
});

test('P5-A4b 显式坐标在 Origin 前拒绝缺失、非有限、越界和非成对输入', () => {
  const cases = [
    [{ latitude: 22.5431, longitude: undefined }, 'birthCoordinates'],
    [{ latitude: undefined, longitude: 114.0579 }, 'birthCoordinates'],
    [{ latitude: Number.NaN, longitude: 114.0579 }, 'latitude'],
    [{ latitude: 22.5431, longitude: Number.POSITIVE_INFINITY }, 'longitude'],
    [{ latitude: 90.0001, longitude: 114.0579 }, 'latitude'],
    [{ latitude: 22.5431, longitude: -180.0001 }, 'longitude'],
    [{ latitude: '22.5431', longitude: 114.0579 }, 'latitude'],
  ];
  for (const [coordinates, field] of cases) {
    expectChartInputError(
      () => calculateAstrologyView({ ...fixtureProfile, ...coordinates }, options),
      'INVALID_BIRTH_COORDINATES',
      field,
    );
  }
});

test('P5-A4b 合法显式坐标和既有 resolver 命中不回归，未知地点 fail-fast', () => {
  const exact = calculateAstrologyView(fixtureProfile, options);
  assert.equal(exact.calculationMode, 'exact');
  for (const latitude of [-90, 90]) {
    for (const longitude of [-180, 180]) {
      assert.doesNotThrow(() => calculateAstrologyView({ ...fixtureProfile, latitude, longitude }, options));
    }
  }
  const resolvedFromCity = calculateAstrologyView({
    ...fixtureProfile,
    latitude: undefined,
    longitude: undefined,
  }, options);
  assert.equal(resolvedFromCity.calculationMode, 'exact');
  assert.equal(resolvedFromCity.calculationSettings.astrologyPolicy.locationSource, 'city-dataset');
  const knownCity = calculateAstrologyView({
    ...fixtureProfile,
    latitude: undefined,
    longitude: undefined,
    birthCity: '广东省深圳市',
  }, options);
  assert.equal(knownCity.calculationMode, 'exact');
  const unknownCity = {
    ...fixtureProfile,
    latitude: undefined,
    longitude: undefined,
    birthCity: '福建省泉州市',
  };
  expectChartInputError(
    () => calculateAstrologyView(unknownCity, options),
    'MISSING_BIRTH_COORDINATES',
    'birthCity',
  );
});

test('P5-A4b Ziwei lunar 路径不被 Gregorian validator 误拦', () => {
  const lunar = calculateZiweiView({
    ...fixtureProfile,
    birthDate: '2024-02-30',
    calendar: 'lunar',
    isLeapMonth: false,
  }, undefined, options);
  assert.match(lunar.lunarDate, /二月三十/);
});

function runAcrossHostTimezone(hostTimezone) {
  const source = `
    import { calculateAstrologyView, calculateZiweiView, getChartInputErrorContract } from './src/services/chart-engine.ts';
    const profile = ${JSON.stringify(fixtureProfile)};
    const options = ${JSON.stringify(options)};
    const summary = (chart) => ({
      calculationMode: chart.calculationMode,
      solarDate: chart.solarDate,
      sunSign: chart.sunSign,
      moonSign: chart.moonSign,
      factors: chart.factors,
      aspects: chart.aspects,
    });
    const capture = (run) => {
      try { run(); return { ok: true }; }
      catch (error) { return { ok: false, error: getChartInputErrorContract(error) }; }
    };
    const invalid = { ...profile, birthDate: '2024-02-30' };
    const invalidCoordinate = { ...profile, latitude: 91, longitude: 114.0579 };
    process.stdout.write(JSON.stringify({
      validZiwei: summary(calculateZiweiView(profile, undefined, options)),
      validAstrology: summary(calculateAstrologyView(profile, options)),
      invalidZiwei: capture(() => calculateZiweiView(invalid, undefined, options)),
      invalidAstrology: capture(() => calculateAstrologyView(invalid, options)),
      invalidCoordinate: capture(() => calculateAstrologyView(invalidCoordinate, options)),
    }));
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

test('P5-A4b 新输入结果与错误在 UTC/Asia-Shanghai 宿主 TZ 完全一致', () => {
  assert.deepEqual(runAcrossHostTimezone('UTC'), runAcrossHostTimezone('Asia/Shanghai'));
});
