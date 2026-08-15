import {
  GOLDEN_CASE_CONTRACT_VERSION,
  type GoldenCase,
  type JsonObject,
} from '@/domains/golden/types';
import { BAZI_GOLDEN_CASES, type BaziGoldenCase } from '@/domains/bazi/golden-cases';
import { HKO_PUBLISHED_REFERENCE_GOLDEN_CASES } from '@/domains/golden/published-references';
import { validateGoldenCaseRegistry } from '@/domains/golden/validator';

const REGRESSION_DISPUTE = '没有独立外部来源或专业复核；本条只用于防止回归，不代表专业真值。';

function mapIndependentBaziGoldenCase(sourceCase: BaziGoldenCase): GoldenCase {
  return {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: `bazi-calculation-${sourceCase.id.replace(/^solar-/, '')}`,
    module: 'bazi',
    validationClass: 'independent-validation',
    input: {
      fixtureId: sourceCase.id,
      birthDate: sourceCase.input.birthDate,
      birthTime: sourceCase.input.birthTime,
      birthCity: sourceCase.input.birthCity,
      calendar: sourceCase.input.calendar,
      ...(sourceCase.input.isLeapMonth === undefined ? {} : { isLeapMonth: sourceCase.input.isLeapMonth }),
      gender: sourceCase.input.gender,
      ...(sourceCase.input.latitude === undefined ? {} : { latitude: sourceCase.input.latitude }),
      ...(sourceCase.input.longitude === undefined ? {} : { longitude: sourceCase.input.longitude }),
    },
    calculationSettings: sourceCase.calculationSettings as unknown as JsonObject,
    sourceReferences: [
      {
        type: 'independent-library',
        locator: sourceCase.source,
        purpose: '独立计算交叉校验来源，不是 taibu-core 或本项目当前输出。',
      },
    ],
    sourceType: 'independent-library',
    independentVerification: {
      status: 'verified',
      method: '用独立来源计算四柱，并与应用适配层结果逐字段比较。',
      scope: 'technical-cross-check',
      notes: '只声明当前 fixture 的技术性交叉校验通过，不声明流派或专业权威性。',
    },
    expectedFacts: {
      fixtureId: sourceCase.id,
      source: sourceCase.source,
      sourceType: sourceCase.sourceType,
      expectedFourPillars: sourceCase.expectedFourPillars as unknown as JsonObject,
      expectedBoundaryNotes: sourceCase.expectedBoundaryNotes,
      rulePremise: sourceCase.rulePremise,
    },
    expectedEvidence: {
      fixtureLocation: 'tests/bazi-golden.regression.mjs#P1-A independent Bazi golden cases',
      assertions: ['independent-adapter-four-pillar-comparison', 'calculation-evidence-retained'],
    },
    expectedInterpretation: {
      notProfessionalTruth: true,
      scope: 'calculation-only',
      assertion: 'no-interpretive-conclusion',
    },
    knownDisputes: [
      '交叉校验只覆盖现有日期与输入规则，不能外推到节气边界、其他流派或所有日期。',
      ...sourceCase.expectedBoundaryNotes,
    ],
    verifiedBy: sourceCase.verifiedBy,
    verifiedAt: sourceCase.verifiedAt,
  };
}

const INDEPENDENT_BAZI_GOLDEN_CASES = BAZI_GOLDEN_CASES
  .filter((sourceCase) => sourceCase.sourceType === 'independent-library')
  .map(mapIndependentBaziGoldenCase);

/**
 * The registry records the current evidence boundary. Existing independent
 * Bazi cases are mapped from their source-of-truth records so their complete
 * inputs and expected facts cannot silently drift. Other entries keep compact
 * assertions and fixture pointers instead of copying large application
 * outputs into a second source of truth.
 */
export const GOLDEN_CASE_REGISTRY: readonly GoldenCase[] = [
  ...INDEPENDENT_BAZI_GOLDEN_CASES,
  ...HKO_PUBLISHED_REFERENCE_GOLDEN_CASES,
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'bazi-interpretation-fixtures',
    module: 'bazi',
    validationClass: 'regression-only',
    input: {
      fixtureId: 'BAZI_INTERPRETATION_GOLDEN_CASES',
      fixtureLocation: 'src/domains/bazi/interpretation/golden-cases.ts',
      purpose: '覆盖强弱状态、置信度和关系证据引用的规则回归。',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      engineVersion: 'taibu-core@3.4.0/bazi',
      interpretationVersion: 'bazi-rules-v2',
    },
    sourceReferences: [
      {
        type: 'repository-fixture',
        locator: 'tests/bazi-history.regression.mjs#P2-F Interpretation Golden',
        purpose: '记录当前项目用于回归的解释 fixture 和用途。',
      },
    ],
    sourceType: 'repository-fixture',
    independentVerification: {
      status: 'not-verified',
      method: 'not-applicable',
      scope: 'regression-only',
      notes: '项目自身的规则输出不能作为自身的独立专业验证来源。',
    },
    expectedFacts: {
      fixtureId: 'BAZI_INTERPRETATION_GOLDEN_CASES',
      assertion: 'strength-and-relation-regression',
    },
    expectedEvidence: {
      fixtureLocation: 'tests/bazi-history.regression.mjs',
      assertion: 'interpretation-results-reference-evidence-nodes',
    },
    expectedInterpretation: {
      notProfessionalTruth: true,
      scope: 'rule-regression-only',
      assertion: 'known-rule-output-remains-explainable',
    },
    knownDisputes: [REGRESSION_DISPUTE],
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'ziwei-fixed-chart-engine-fixture',
    module: 'ziwei',
    validationClass: 'regression-only',
    input: {
      fixtureId: 'fixture-2001-shenzhen',
      fixtureLocation: 'tests/chart-engine.regression.mjs#紫微固定样例',
      purpose: '回归十二宫、命身主和四化结构。',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      engineVersion: 'iztro@2.5.8',
    },
    sourceReferences: [
      {
        type: 'repository-fixture',
        locator: 'tests/chart-engine.regression.mjs#紫微固定样例保持十二宫、命身主与四化稳定',
        purpose: '记录当前项目固定样例的回归用途，不构成外部验证。',
      },
    ],
    sourceType: 'repository-fixture',
    independentVerification: {
      status: 'not-verified',
      method: 'not-applicable',
      scope: 'regression-only',
      notes: 'iztro 输出与项目自身适配结果的稳定性测试不等于独立专业复核。',
    },
    expectedFacts: {
      fixtureId: 'fixture-2001-shenzhen',
      assertion: 'palaces-life-body-masters-mutagens-regression',
    },
    expectedEvidence: {
      fixtureLocation: 'tests/chart-engine.regression.mjs',
      assertion: 'fixed-engine-output-is-repeatable',
    },
    expectedInterpretation: {
      notProfessionalTruth: true,
      scope: 'regression-only',
      assertion: 'no-independent-ziwei-claim',
    },
    knownDisputes: [REGRESSION_DISPUTE],
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'astrology-fixed-chart-engine-fixture',
    module: 'astrology',
    validationClass: 'regression-only',
    input: {
      fixtureId: 'fixture-2001-shenzhen',
      fixtureLocation: 'tests/chart-engine.regression.mjs#西方星盘固定样例',
      purpose: '回归精确模式、角点、行星位置和相位数量。',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      engineVersion: 'circular-natal-horoscope-js@1.1.0',
    },
    sourceReferences: [
      {
        type: 'repository-fixture',
        locator: 'tests/chart-engine.regression.mjs#西方星盘固定样例保持精确模式、角点和标准十星',
        purpose: '记录当前项目固定样例的回归用途，不构成外部验证。',
      },
    ],
    sourceType: 'repository-fixture',
    independentVerification: {
      status: 'not-verified',
      method: 'not-applicable',
      scope: 'regression-only',
      notes: '第三方库的稳定调用结果仍需要外部来源或人工复核才能提升验证级别。',
    },
    expectedFacts: {
      fixtureId: 'fixture-2001-shenzhen',
      assertion: 'exact-mode-factors-and-aspects-regression',
    },
    expectedEvidence: {
      fixtureLocation: 'tests/chart-engine.regression.mjs',
      assertion: 'exact-mode-retains-angle-and-house-evidence',
    },
    expectedInterpretation: {
      notProfessionalTruth: true,
      scope: 'regression-only',
      assertion: 'no-independent-astrology-claim',
    },
    knownDisputes: [REGRESSION_DISPUTE, '城市坐标是当前离线数据集的近似中心，不是逐地址测量。'],
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'liuyao-fixed-seed-fixture',
    module: 'liuyao',
    validationClass: 'regression-only',
    input: {
      fixtureId: 'fixture-liuyao-seed-v1',
      question: '这个版本能否顺利完成并上线？',
      target: '官鬼',
      fixtureLocation: 'tests/chart-engine.regression.mjs#六爻固定种子',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      seed: 'fixture-liuyao-seed-v1',
      date: '2026-01-01T12:00:00.000Z',
      seedScope: 'guanxiang-local-v1',
      engineVersion: 'taibu-core@3.4.0/liuyao+guanxiang-rng-v1',
    },
    sourceReferences: [
      {
        type: 'repository-fixture',
        locator: 'tests/chart-engine.regression.mjs#六爻固定种子保持卦名、干支时间和六爻证据稳定',
        purpose: '记录 seed/date/scope/timezone 固定回归的用途，不构成断卦真值。',
      },
    ],
    sourceType: 'repository-fixture',
    independentVerification: {
      status: 'not-verified',
      method: 'not-applicable',
      scope: 'regression-only',
      notes: 'taibu-core 自身输出和固定种子重复运行不能作为独立专业验证。',
    },
    expectedFacts: {
      fixtureId: 'fixture-liuyao-seed-v1',
      assertion: 'seed-date-scope-timezone-and-lines-regression',
    },
    expectedEvidence: {
      fixtureLocation: 'tests/chart-engine.regression.mjs',
      assertion: 'hexagram-and-line-evidence-repeatable',
    },
    expectedInterpretation: {
      notProfessionalTruth: true,
      scope: 'regression-only',
      assertion: 'no-divination-or-timing-promise',
    },
    knownDisputes: [REGRESSION_DISPUTE, '六爻固定种子只验证复现，不验证用神、旺衰或应期的专业结论。'],
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'phase4-bazi-explanation-fixture',
    module: 'bazi',
    validationClass: 'regression-only',
    input: {
      fixtureId: 'p4-h-golden',
      fixtureLocation: 'tests/phase4-golden.regression.mjs#P4-H 四模块解释快照',
      purpose: '回归解释快照、证据引用和普通备份 deepEqual。',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      explanationVersion: 'bazi-explanation-v1',
    },
    sourceReferences: [
      {
        type: 'repository-fixture',
        locator: 'tests/phase4-golden.regression.mjs#P4-H 四模块都生成可保存解释快照',
        purpose: '记录 Phase 4 解释层回归入口与用途。',
      },
    ],
    sourceType: 'repository-fixture',
    independentVerification: {
      status: 'not-verified',
      method: 'not-applicable',
      scope: 'regression-only',
      notes: '解释快照回归不构成专业内容复核。',
    },
    expectedFacts: { fixtureId: 'p4-h-golden', assertion: 'bazi-explanation-snapshot-present' },
    expectedEvidence: { assertion: 'explanation-block-refs-resolve-to-evidence-nodes' },
    expectedInterpretation: { notProfessionalTruth: true, scope: 'regression-only', assertion: 'safe-basic-observation-only' },
    expectedExplanation: { assertion: 'snapshot-round-trips-through-normal-backup' },
    knownDisputes: [REGRESSION_DISPUTE],
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'phase4-liuyao-explanation-fixture',
    module: 'liuyao',
    validationClass: 'regression-only',
    input: {
      fixtureId: 'p4-h-golden',
      question: '这个版本的证据链是否清晰？',
      target: '官鬼',
      fixtureLocation: 'tests/phase4-golden.regression.mjs#P4-H 四模块解释快照',
      purpose: '回归六爻解释快照和不承诺应期的边界。',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      seed: 'p4-h-golden-seed',
      date: '2026-08-15T12:34:56',
      seedScope: 'guanxiang-local-v1',
      explanationVersion: 'liuyao-explanation-v1',
    },
    sourceReferences: [
      {
        type: 'repository-fixture',
        locator: 'tests/phase4-golden.regression.mjs#P4-H 四模块都生成可保存解释快照',
        purpose: '记录 Phase 4 解释层回归入口与用途。',
      },
    ],
    sourceType: 'repository-fixture',
    independentVerification: {
      status: 'not-verified',
      method: 'not-applicable',
      scope: 'regression-only',
      notes: '解释快照回归不构成六爻专业内容复核。',
    },
    expectedFacts: { fixtureId: 'p4-h-golden', assertion: 'liuyao-explanation-snapshot-present' },
    expectedEvidence: { assertion: 'explanation-block-refs-resolve-to-evidence-nodes' },
    expectedInterpretation: { notProfessionalTruth: true, scope: 'regression-only', assertion: 'no-timing-promise' },
    expectedExplanation: { assertion: 'snapshot-round-trips-through-normal-backup' },
    knownDisputes: [REGRESSION_DISPUTE, '六爻解释不对现实事件作确定性预测，也不提供应期承诺。'],
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'phase4-ziwei-explanation-fixture',
    module: 'ziwei',
    validationClass: 'regression-only',
    input: {
      fixtureId: 'p4-h-golden',
      fixtureLocation: 'tests/phase4-golden.regression.mjs#P4-H 四模块解释快照',
      purpose: '回归紫微解释快照、证据引用和 Glossary 边界。',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      explanationVersion: 'ziwei-explanation-v1',
    },
    sourceReferences: [
      {
        type: 'repository-fixture',
        locator: 'tests/phase4-golden.regression.mjs#P4-H 四模块都生成可保存解释快照',
        purpose: '记录 Phase 4 解释层回归入口与用途。',
      },
    ],
    sourceType: 'repository-fixture',
    independentVerification: {
      status: 'not-verified',
      method: 'not-applicable',
      scope: 'regression-only',
      notes: '解释快照回归不构成紫微专业内容复核。',
    },
    expectedFacts: { fixtureId: 'p4-h-golden', assertion: 'ziwei-explanation-snapshot-present' },
    expectedEvidence: { assertion: 'explanation-block-refs-resolve-to-evidence-nodes' },
    expectedInterpretation: { notProfessionalTruth: true, scope: 'regression-only', assertion: 'safe-basic-observation-only' },
    expectedExplanation: { assertion: 'snapshot-round-trips-through-normal-backup' },
    knownDisputes: [REGRESSION_DISPUTE],
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    contractVersion: GOLDEN_CASE_CONTRACT_VERSION,
    id: 'phase4-astrology-explanation-fixture',
    module: 'astrology',
    validationClass: 'regression-only',
    input: {
      fixtureId: 'p4-h-golden',
      fixtureLocation: 'tests/phase4-golden.regression.mjs#P4-H 四模块解释快照',
      purpose: '回归精确/近似盘解释快照和未知坐标边界。',
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      explanationVersion: 'astrology-explanation-v1',
    },
    sourceReferences: [
      {
        type: 'repository-fixture',
        locator: 'tests/phase4-golden.regression.mjs#P4-H 四模块都生成可保存解释快照',
        purpose: '记录 Phase 4 解释层回归入口与用途。',
      },
    ],
    sourceType: 'repository-fixture',
    independentVerification: {
      status: 'not-verified',
      method: 'not-applicable',
      scope: 'regression-only',
      notes: '解释快照回归不构成占星专业内容复核。',
    },
    expectedFacts: { fixtureId: 'p4-h-golden', assertion: 'astrology-explanation-snapshot-present' },
    expectedEvidence: { assertion: 'precision-boundary-and-evidence-refs-retained' },
    expectedInterpretation: { notProfessionalTruth: true, scope: 'regression-only', assertion: 'approximate-chart-does-not-guess-angles' },
    expectedExplanation: { assertion: 'snapshot-round-trips-through-normal-backup' },
    knownDisputes: [REGRESSION_DISPUTE, '近似星盘不应被解释为包含可靠上升、天顶或宫位的精确盘。'],
    verifiedBy: null,
    verifiedAt: null,
  },
];

validateGoldenCaseRegistry(GOLDEN_CASE_REGISTRY);
