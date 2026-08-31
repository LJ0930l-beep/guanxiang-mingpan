import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION,
  BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION,
  P5_A4B_INPUT_RESOLUTION_V4_CASES,
  P5_A4B_INPUT_RESOLUTION_V5_CASES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  getBoundaryInputResolutionV5ValidationErrors,
  getBoundaryInputResolutionVersionedRegistryValidationErrors,
  validateBoundaryInputResolutionV5,
  validateBoundaryInputResolutionV5Registry,
  validateBoundaryInputResolutionVersioned,
  validateBoundaryInputResolutionVersionedRegistry,
} from '../src/domains/golden/index.ts';
import {
  CHART_ENGINE_ERROR_CATEGORY,
  CHART_ENGINE_ERROR_CODE,
  CHART_ENGINE_MODULES,
  ChartEngineError,
  ChartInputError,
  calculateAstrologyView,
  calculateBaziView,
  calculateLiuyaoView,
  calculateZiweiView,
  getChartEngineErrorContract,
  getChartFailureContract,
  getChartInputErrorContract,
  isChartEngineError,
  isChartEngineErrorContract,
  isChartInputError,
  withAsyncChartEngineErrorBoundary,
  withChartEngineErrorBoundary,
} from '../src/services/chart-engine.ts';

const generatedAt = '2026-08-15T00:00:00.000Z';
const calculationOptions = { generatedAt, timezone: 'Asia/Shanghai' };
const profile = {
  id: 'p5-a4b5-engine-errors',
  name: 'P5-A4b5 engine error fixture',
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

const clone = (value) => JSON.parse(JSON.stringify(value));

function captureSync(run) {
  try {
    return { ok: true, value: run() };
  } catch (error) {
    return { ok: false, error };
  }
}

async function captureAsync(run) {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    return { ok: false, error };
  }
}

test('P5-A4b5 四模块成功盘保持 complete 且不被错误边界改变', async () => {
  const bazi = calculateBaziView(profile, undefined, calculationOptions);
  const ziwei = calculateZiweiView(profile, undefined, calculationOptions);
  const astrology = calculateAstrologyView(profile, calculationOptions);
  const liuyao = await calculateLiuyaoView('P5-A4b5 固定成功样例', '父母', {
    ...calculationOptions,
    seed: 'p5-a4b5-fixed-seed',
    date: '2026-01-01T12:00:00.000Z',
  });

  for (const [module, chart] of Object.entries({ bazi, ziwei, astrology, liuyao })) {
    assert.equal(chart.module, module);
    assert.equal(chart.completeness === 'complete' || module === 'astrology', true);
    assert.equal(isChartEngineError(chart), false);
  }
  assert.equal(ziwei.palaces.length, 12);
  assert.equal(astrology.factors.some((factor) => factor.key === 'sun'), true);
  assert.equal(liuyao.lines.length, 6);
});

test('P5-A4b5 四模块输入错误仍保持原 ChartInputError 合同', async () => {
  const invalidProfile = { ...profile, birthDate: '2024-02-30' };
  const ziwei = captureSync(() => calculateZiweiView(invalidProfile, undefined, calculationOptions));
  const astrology = captureSync(() => calculateAstrologyView(invalidProfile, calculationOptions));
  const bazi = captureSync(() => calculateBaziView(invalidProfile, undefined, calculationOptions));
  const invalidSeed = await captureAsync(() => calculateLiuyaoView('seed input', '父母', {
    ...calculationOptions,
    seed: '   ',
    date: '2026-01-01T12:00:00.000Z',
  }));

  for (const result of [ziwei, astrology, invalidSeed]) {
    assert.equal(result.ok, false);
    assert.equal(isChartInputError(result.error), true);
    assert.equal(getChartFailureContract(result.error)?.category, 'input-validation');
    assert.equal(getChartEngineErrorContract(result.error), undefined);
  }
  assert.equal(bazi.ok, false);
  assert.equal(isChartInputError(bazi.error), false);
  assert.equal(isChartEngineError(bazi.error), false);
  assert.equal(bazi.error.message, '公历日期或时辰无效。');
  assert.deepEqual(getChartInputErrorContract(ziwei.error), getChartInputErrorContract(astrology.error));

  const emptyQuestion = await captureAsync(() => calculateLiuyaoView('   ', '父母', {
    ...calculationOptions,
    seed: 'p5-a4b5-empty-question',
    date: '2026-01-01T12:00:00.000Z',
  }));
  assert.equal(emptyQuestion.ok, false);
  assert.equal(emptyQuestion.error.message, '请先明确问题后再解卦');
  assert.equal(isChartEngineError(emptyQuestion.error), false);
});

test('P5-A4b5 同步/异步局部 seam 将未知异常包装为同形安全 contract', async () => {
  const expectedKeys = ['category', 'code', 'module', 'name'];
  const contracts = [];
  for (const module of CHART_ENGINE_MODULES) {
    const captured = captureSync(() => withChartEngineErrorBoundary(module, () => {
      throw {
        name: 'LowLevelEngineError',
        message: 'PII secret low-level detail',
        stack: 'secret stack',
        cause: { token: 'private-token' },
      };
    }));
    assert.equal(captured.ok, false);
    assert.equal(isChartEngineError(captured.error), true);
    const contract = getChartEngineErrorContract(captured.error);
    assert.ok(contract);
    contracts.push(contract);
    assert.deepEqual(Object.keys(contract).sort(), expectedKeys);
    assert.equal(contract.category, CHART_ENGINE_ERROR_CATEGORY);
    assert.equal(contract.code, CHART_ENGINE_ERROR_CODE);
    assert.equal(contract.module, module);
    assert.equal(Object.hasOwn(contract, 'message'), false);
    assert.equal(Object.hasOwn(contract, 'cause'), false);
    assert.equal(Object.hasOwn(contract, 'stack'), false);
    assert.doesNotMatch(JSON.stringify(contract), /PII|secret|token|LowLevel/);
    assert.doesNotMatch(JSON.stringify(captured.error), /PII|secret|token|LowLevel/);
    assert.equal(captured.error.message.includes('暂时无法完成'), true);
  }

  assert.deepEqual(
    contracts.map((contract) => Object.keys(contract).sort()),
    contracts.map(() => expectedKeys),
  );
  assert.deepEqual(new Set(contracts.map((contract) => contract.module)), new Set(CHART_ENGINE_MODULES));

  const asyncCaptured = await captureAsync(() => withAsyncChartEngineErrorBoundary('liuyao', async () => {
    throw new Error('async low-level PII secret');
  }));
  assert.equal(asyncCaptured.ok, false);
  assert.deepEqual(getChartEngineErrorContract(asyncCaptured.error), {
    name: 'ChartEngineError',
    category: CHART_ENGINE_ERROR_CATEGORY,
    module: 'liuyao',
    code: CHART_ENGINE_ERROR_CODE,
  });
  assert.doesNotMatch(JSON.stringify(asyncCaptured.error), /PII|secret|low-level/);
});

test('P5-A4b5 稳定 engine error 不重复包装，ChartInputError 按原实例重抛', async () => {
  const stable = new ChartEngineError({ module: 'ziwei' });
  const stableSync = captureSync(() => withChartEngineErrorBoundary('ziwei', () => {
    throw stable;
  }));
  assert.equal(stableSync.ok, false);
  assert.equal(stableSync.error, stable);

  const serialized = stable.toContract();
  const stableSerialized = await captureAsync(() => withAsyncChartEngineErrorBoundary('ziwei', async () => {
    throw serialized;
  }));
  assert.equal(stableSerialized.ok, false);
  assert.equal(stableSerialized.error, serialized);
  assert.equal(isChartEngineErrorContract(stableSerialized.error), true);

  const input = new ChartInputError({ code: 'INVALID_GREGORIAN_DATE', field: 'birthDate' });
  const inputSync = captureSync(() => withChartEngineErrorBoundary('bazi', () => {
    throw input;
  }));
  const inputAsync = await captureAsync(() => withAsyncChartEngineErrorBoundary('liuyao', async () => {
    throw input;
  }));
  assert.equal(inputSync.error, input);
  assert.equal(inputAsync.error, input);
  assert.equal(getChartEngineErrorContract(input), undefined);
});

test('P5-A4b5 v5 overlay 保持 v4 前缀、精确关闭四个 immutable gap 且可版本感知校验', () => {
  assert.equal(P5_A4B_INPUT_RESOLUTION_V4_CASES.length, 8);
  assert.equal(P5_A4B_INPUT_RESOLUTION_V5_CASES.length, 12);
  assert.deepEqual(
    P5_A4B_INPUT_RESOLUTION_V5_CASES.slice(0, 8).map(({ contractVersion, ...item }) => item),
    P5_A4B_INPUT_RESOLUTION_V4_CASES.map(({ contractVersion, ...item }) => item),
  );
  assert.equal(P5_A4B_INPUT_RESOLUTION_V5_CASES.every((item) => item.contractVersion === BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION), true);
  assert.deepEqual(
    P5_A4B_INPUT_RESOLUTION_V5_CASES.map((item) => item.auditCaseId),
    [
      ...P5_A4B_INPUT_RESOLUTION_V4_CASES.map((item) => item.auditCaseId),
      'p5-a4a-ziwei-engine-error-path',
      'p5-a4a-astrology-engine-error-path',
      'p5-a4a-liuyao-engine-error-path',
      'p5-a4a-cross-error-copy-failure-mode',
    ],
  );
  assert.deepEqual(JSON.parse(JSON.stringify(P5_A4B_INPUT_RESOLUTION_V5_CASES)), P5_A4B_INPUT_RESOLUTION_V5_CASES);

  assert.deepEqual(getBoundaryInputResolutionVersionedRegistryValidationErrors(P5_A4B_INPUT_RESOLUTION_V5_CASES), []);
  assert.deepEqual(validateBoundaryInputResolutionV5Registry(P5_A4B_INPUT_RESOLUTION_V5_CASES), P5_A4B_INPUT_RESOLUTION_V5_CASES);
  assert.deepEqual(validateBoundaryInputResolutionVersionedRegistry(P5_A4B_INPUT_RESOLUTION_V5_CASES), P5_A4B_INPUT_RESOLUTION_V5_CASES);
  assert.deepEqual(validateBoundaryInputResolutionVersioned(P5_A4B_INPUT_RESOLUTION_V5_CASES[11]), P5_A4B_INPUT_RESOLUTION_V5_CASES[11]);

  for (const resolution of P5_A4B_INPUT_RESOLUTION_V5_CASES) {
    const original = P5_BOUNDARY_INPUT_AUDIT_CASES.find((item) => item.id === resolution.auditCaseId);
    assert.equal(original?.status, 'gap');
    assert.equal(original?.targetBatch, 'P5-A4b');
    assert.equal(resolution.status, 'resolved');
    assert.equal(resolution.targetBatch, 'P5-A4b');
    assert.equal(resolution.testRefs.every((ref) => ref.startsWith('tests/')), true);
    assert.equal(JSON.stringify(resolution).includes('commit'), false);
  }
});

test('P5-A4b5 v5 validator 拒绝版本混用、重复、缺项、非 JSON 与错误 audit 引用', () => {
  const mixedVersions = clone(P5_A4B_INPUT_RESOLUTION_V5_CASES);
  mixedVersions[0] = clone(P5_A4B_INPUT_RESOLUTION_V4_CASES[0]);
  assert.throws(
    () => validateBoundaryInputResolutionVersionedRegistry(mixedVersions),
    /exactly one contract version/,
  );

  const duplicateResolutionId = clone(P5_A4B_INPUT_RESOLUTION_V5_CASES);
  duplicateResolutionId[11].resolutionId = duplicateResolutionId[0].resolutionId;
  assert.throws(() => validateBoundaryInputResolutionV5Registry(duplicateResolutionId), /resolutionId duplicates/);

  const duplicateAuditCaseId = clone(P5_A4B_INPUT_RESOLUTION_V5_CASES);
  duplicateAuditCaseId[11].auditCaseId = duplicateAuditCaseId[0].auditCaseId;
  assert.throws(() => validateBoundaryInputResolutionV5Registry(duplicateAuditCaseId), /auditCaseId duplicates|resolution registry is missing/);

  const missing = P5_A4B_INPUT_RESOLUTION_V5_CASES.slice(0, 11);
  assert.throws(() => validateBoundaryInputResolutionV5Registry(missing), /exactly 12 resolutions|resolution registry is missing/);

  const nonJson = clone(P5_A4B_INPUT_RESOLUTION_V5_CASES);
  nonJson[0].notes = new Date(generatedAt);
  assert.throws(() => validateBoundaryInputResolutionV5Registry(nonJson), /must be a plain JSON object/);

  const wrongAudit = clone(P5_A4B_INPUT_RESOLUTION_V5_CASES[11]);
  wrongAudit.auditCaseId = 'p5-a4a-bazi-solar-date-validity';
  assert.notDeepEqual(getBoundaryInputResolutionV5ValidationErrors(wrongAudit), []);
  assert.throws(() => validateBoundaryInputResolutionV5(wrongAudit), /auditCaseId is not supported/);
});

test('P5-A4b5 v5 版本常量独立于 v4 且 immutable audit 统计与 gap 原样保留', () => {
  assert.notEqual(BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION, BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION);
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
});
