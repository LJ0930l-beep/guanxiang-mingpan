import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BOUNDARY_AUDIT_CATEGORIES,
  BOUNDARY_AUDIT_MODULES,
  BOUNDARY_AUDIT_STATUSES,
  P5_A4B_INPUT_RESOLUTION_CASES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  getBoundaryInputAuditValidationErrors,
  validateBoundaryInputResolutionRegistry,
  validateBoundaryInputAuditCase,
  validateBoundaryInputAuditRegistry,
} from '../src/domains/golden/index.ts';
import {
  calculateAstrologyView,
  calculateBaziView,
  calculateLiuyaoView,
  getChartInputErrorContract,
} from '../src/services/chart-engine.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const generatedAt = '2026-08-15T00:00:00.000Z';

const fixtureProfile = {
  id: 'p5-a4a-shenzhen',
  name: 'P5-A4a 边界审计样例',
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

const fixedLiuyaoOptions = {
  generatedAt,
  seed: 'p5-a4a-fixed-seed',
  date: '2026-01-01T12:00:00',
  timezone: 'Asia/Shanghai',
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function runAstrologyFixture(hostTimezone, profile = fixtureProfile) {
  const source = `
    import { calculateAstrologyView } from './src/services/chart-engine.ts';
    const profile = ${JSON.stringify(profile)};
    const result = calculateAstrologyView(profile, { generatedAt: ${JSON.stringify(generatedAt)} });
    process.stdout.write(JSON.stringify({
      calculationMode: result.calculationMode,
      sunSign: result.sunSign,
      moonSign: result.moonSign,
      ascendant: result.ascendant,
      midheaven: result.midheaven,
      factors: result.factors,
      aspects: result.aspects,
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

test('P5-A4a 审计合同覆盖四术及跨模块全部类别，且 registry 是纯 JSON', () => {
  const registry = validateBoundaryInputAuditRegistry(P5_BOUNDARY_INPUT_AUDIT_CASES);
  assert.equal(registry.length, 41);
  assert.deepEqual(JSON.parse(JSON.stringify(registry)), registry);
  assert.deepEqual(new Set(registry.map((item) => item.id)).size, registry.length);
  for (const module of BOUNDARY_AUDIT_MODULES) {
    assert.equal(registry.filter((item) => item.module === module).length > 0, true, module);
  }
  for (const category of BOUNDARY_AUDIT_CATEGORIES) {
    assert.equal(registry.some((item) => item.category === category), true, category);
  }
});

test('P5-A4a 审计合同门禁拒绝非 JSON、坏枚举和不诚实的状态组合', () => {
  const base = P5_BOUNDARY_INPUT_AUDIT_CASES[0];
  validateBoundaryInputAuditCase(base);

  const nonJson = clone(base);
  nonJson.fixture = new Date('2026-01-01T00:00:00.000Z');
  assert.throws(() => validateBoundaryInputAuditCase(nonJson), /plain JSON object/);

  const functionValue = clone(base);
  functionValue.notes = () => 'not JSON';
  assert.throws(() => validateBoundaryInputAuditCase(functionValue), /not a JSON value/);

  const cyclic = clone(base);
  cyclic.input.self = cyclic.input;
  assert.throws(() => validateBoundaryInputAuditCase(cyclic), /cyclic reference/);

  const badReference = clone(base);
  badReference.evidenceRefs = ['not-a-repository-reference'];
  assert.throws(() => validateBoundaryInputAuditCase(badReference), /evidenceRefs/);

  const badModuleCategory = clone(base);
  badModuleCategory.module = 'astrology';
  assert.throws(() => validateBoundaryInputAuditCase(badModuleCategory), /category must belong to module/);

  const badDecision = clone(base);
  badDecision.status = 'decision-required';
  badDecision.targetBatch = 'OWNER-DECISION';
  badDecision.ownerDecisionRequired = false;
  assert.throws(() => validateBoundaryInputAuditCase(badDecision), /ownerDecisionRequired=true/);

  const badGap = clone(base);
  badGap.status = 'gap';
  badGap.targetBatch = 'none';
  assert.throws(() => validateBoundaryInputAuditCase(badGap), /requires a concrete targetBatch/);

  const independent = clone(base);
  independent.validationClass = 'independent-validation';
  assert.throws(() => validateBoundaryInputAuditCase(independent), /published\/professional URL/);

  assert.equal(getBoundaryInputAuditValidationErrors(base).length, 0);
  assert.equal(BOUNDARY_AUDIT_STATUSES.includes('covered'), true);
});

test('P5-A4a 审计矩阵统计锁定真实现状，不把项目回归冒充独立真值', () => {
  const count = (key, value) => P5_BOUNDARY_INPUT_AUDIT_CASES.filter((item) => item[key] === value).length;
  assert.deepEqual(
    Object.fromEntries(BOUNDARY_AUDIT_MODULES.map((module) => [module, count('module', module)])),
    { bazi: 10, ziwei: 9, astrology: 8, liuyao: 9, cross: 5 },
  );
  assert.deepEqual(
    Object.fromEntries(BOUNDARY_AUDIT_STATUSES.map((status) => [status, count('status', status)])),
    { covered: 18, gap: 15, 'decision-required': 5, 'routed-p5-b': 1, 'not-applicable': 2 },
  );
  assert.equal(count('validationClass', 'regression-only'), 41);
  assert.equal(count('validationClass', 'independent-validation'), 0);
  assert.equal(P5_BOUNDARY_INPUT_AUDIT_CASES.some((item) => item.id === 'p5-a4a-astrology-missing-coordinate' && item.status === 'gap'), true);
  assert.equal(P5_BOUNDARY_INPUT_AUDIT_CASES.some((item) => item.id === 'p5-a4a-cross-no-guessing' && item.status === 'gap'), true);
  assert.equal(P5_BOUNDARY_INPUT_AUDIT_CASES.some((item) => item.id === 'p5-a4a-bazi-solar-date-validity' && item.status === 'covered'), true);
  assert.equal(P5_BOUNDARY_INPUT_AUDIT_CASES.some((item) => item.id === 'p5-a4a-ziwei-invalid-gregorian-date' && item.status === 'gap'), true);
  assert.equal(P5_BOUNDARY_INPUT_AUDIT_CASES.some((item) => item.id === 'p5-a4a-astrology-invalid-gregorian-date' && item.status === 'gap'), true);
  assert.equal(P5_BOUNDARY_INPUT_AUDIT_CASES.some((item) => item.id === 'p5-a4a-ziwei-solar-input' && item.status === 'covered'), true);
});

test('P5-A4a 占星未知城市保留原始 0,0 probe 证据，但新安全层 fail-fast', () => {
  const exact = calculateAstrologyView(fixtureProfile, { generatedAt });
  assert.equal(exact.calculationMode, 'exact');
  assert.throws(() => calculateAstrologyView({
    ...fixtureProfile,
    id: 'p5-a4a-unknown-city',
    birthCity: '福建省泉州市',
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
});

test('P5-A4a 审计 snapshot 不变，三项安全输入关闭由 A4b overlay 单独声明', () => {
  const registry = validateBoundaryInputAuditRegistry(P5_BOUNDARY_INPUT_AUDIT_CASES);
  const resolutions = validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_CASES);
  assert.equal(registry.length, 41);
  assert.deepEqual(JSON.parse(JSON.stringify(registry)), registry);
  assert.deepEqual(
    resolutions.map((resolution) => resolution.auditCaseId).sort(),
    [
      'p5-a4a-astrology-invalid-coordinate',
      'p5-a4a-astrology-invalid-gregorian-date',
      'p5-a4a-ziwei-invalid-gregorian-date',
    ],
  );
  for (const auditCaseId of resolutions.map((resolution) => resolution.auditCaseId)) {
    const auditCase = registry.find((item) => item.id === auditCaseId);
    assert.equal(auditCase?.status, 'gap');
    assert.equal(auditCase?.targetBatch, 'P5-A4b');
  }
});

test('P5-A4a 六爻输入失败路径与当前固定 scope 行为可复现', async () => {
  await assert.rejects(
    () => calculateLiuyaoView('', '官鬼', fixedLiuyaoOptions),
    /请先明确问题后再解卦/,
  );
  await assert.rejects(
    () => calculateLiuyaoView('问题', '不存在的用神', fixedLiuyaoOptions),
    /yongShenTargets 含非法值/,
  );
  await assert.rejects(
    () => calculateLiuyaoView('问题', '官鬼', { ...fixedLiuyaoOptions, date: '2026-02-30T12:00:00' }),
    /六爻日期无效/,
  );
});

test('P5-A4a 占星固定经纬度跨宿主 TZ 完全一致', () => {
  assert.deepEqual(runAstrologyFixture('UTC'), runAstrologyFixture('Asia/Shanghai'));
});

test('P5-A4a 八字合法闰日与非法闰日遵循当前日期校验', () => {
  const valid = { ...fixtureProfile, id: 'p5-a4a-valid-leap-day', birthDate: '2024-02-29' };
  const invalid = { ...fixtureProfile, id: 'p5-a4a-invalid-leap-day', birthDate: '2023-02-29' };
  assert.doesNotThrow(() => calculateBaziView(valid, undefined, { generatedAt }));
  assert.throws(() => calculateBaziView(invalid, undefined, { generatedAt }), /公历日期或时辰无效/);
});
