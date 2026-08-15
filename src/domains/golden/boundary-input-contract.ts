import {
  GOLDEN_VALIDATION_CLASSES,
  type GoldenValidationClass,
  type JsonObject,
} from '@/domains/golden/types';

export const BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION = 'p5-a4a-boundary-input.v1' as const;

export const BOUNDARY_AUDIT_MODULES = ['bazi', 'ziwei', 'astrology', 'liuyao', 'cross'] as const;
export type BoundaryAuditModule = (typeof BOUNDARY_AUDIT_MODULES)[number];

export const BOUNDARY_AUDIT_STATUSES = [
  'covered',
  'gap',
  'decision-required',
  'routed-p5-b',
  'not-applicable',
] as const;
export type BoundaryAuditStatus = (typeof BOUNDARY_AUDIT_STATUSES)[number];

export const BOUNDARY_AUDIT_TARGET_BATCHES = [
  'P5-A4a',
  'P5-A4b',
  'P5-B',
  'P5-C',
  'OWNER-DECISION',
  'none',
] as const;
export type BoundaryAuditTargetBatch = (typeof BOUNDARY_AUDIT_TARGET_BATCHES)[number];

export const BOUNDARY_AUDIT_CATEGORIES = [
  'bazi-solar-date-validity',
  'bazi-lunar-conversion-leap-month',
  'bazi-solar-term-boundary',
  'bazi-day-boundary',
  'bazi-true-solar-cross-day',
  'bazi-fixed-timezone',
  'bazi-unknown-birth-time',
  'bazi-unknown-city-longitude',
  'bazi-supported-date-range',
  'bazi-historical-dst',
  'ziwei-known-birth-time',
  'ziwei-unknown-birth-time',
  'ziwei-solar-input',
  'ziwei-lunar-input',
  'ziwei-leap-month-input',
  'ziwei-invalid-gregorian-date',
  'ziwei-date-range',
  'ziwei-unknown-city',
  'ziwei-engine-error-path',
  'astrology-exact-time-coordinate',
  'astrology-missing-time-approximate',
  'astrology-missing-coordinate',
  'astrology-invalid-coordinate',
  'astrology-invalid-gregorian-date',
  'astrology-date-range-calendar',
  'astrology-host-timezone',
  'astrology-engine-error-path',
  'liuyao-seed-date-scope-timezone',
  'liuyao-invalid-date',
  'liuyao-invalid-seed',
  'liuyao-invalid-scope',
  'liuyao-empty-question',
  'liuyao-invalid-yongshen',
  'liuyao-host-timezone',
  'liuyao-no-timing-promise',
  'liuyao-engine-error-path',
  'cross-no-guessing',
  'cross-error-copy-failure-mode',
  'cross-history-input-snapshot',
  'cross-city-coverage',
  'cross-a11y-copy-route',
] as const;
export type BoundaryAuditCategory = (typeof BOUNDARY_AUDIT_CATEGORIES)[number];

export interface BoundaryInputAuditCase {
  contractVersion: typeof BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION;
  id: string;
  module: BoundaryAuditModule;
  category: BoundaryAuditCategory;
  input: JsonObject;
  fixture: string;
  risk: string;
  currentBehavior: string;
  expectedPolicy: string;
  status: BoundaryAuditStatus;
  validationClass: GoldenValidationClass;
  evidenceRefs: readonly string[];
  targetBatch: BoundaryAuditTargetBatch;
  ownerDecisionRequired: boolean;
  notes: string;
}

const AUDIT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EVIDENCE_REF_PATTERN = /^(?:(?:src|tests|docs|scripts)\/[^\s#]+(?:#[^\s]+)?|package\.json(?:#[^\s]+)?|https?:\/\/\S+)$/;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isEnumValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && values.includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function collectJsonErrors(value: unknown, path: string, errors: string[], active: WeakSet<object>): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) errors.push(`${path} must contain only finite JSON numbers`);
    return;
  }
  if (typeof value !== 'object') {
    errors.push(`${path} is not a JSON value`);
    return;
  }
  if (active.has(value)) {
    errors.push(`${path} contains a cyclic reference`);
    return;
  }
  active.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectJsonErrors(item, `${path}[${index}]`, errors, active));
  } else if (isRecord(value)) {
    Object.keys(value).forEach((key) => collectJsonErrors(value[key], `${path}.${key}`, errors, active));
  } else {
    errors.push(`${path} must be a plain JSON object`);
  }
  active.delete(value);
}

function isJsonObject(value: unknown, path: string, errors: string[]): value is JsonObject {
  const initialErrorCount = errors.length;
  collectJsonErrors(value, path, errors, new WeakSet<object>());
  if (!isRecord(value)) errors.push(`${path} must be a JSON object`);
  return errors.length === initialErrorCount;
}

function requireProperty(record: UnknownRecord, property: string, path: string, errors: string[]): void {
  if (!hasOwn(record, property)) errors.push(`${path}.${property} is required`);
}

function validateAuditCaseValue(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return [`${path} must be an object`];

  collectJsonErrors(value, path, errors, new WeakSet<object>());
  [
    'contractVersion',
    'id',
    'module',
    'category',
    'input',
    'fixture',
    'risk',
    'currentBehavior',
    'expectedPolicy',
    'status',
    'validationClass',
    'evidenceRefs',
    'targetBatch',
    'ownerDecisionRequired',
    'notes',
  ].forEach((property) => requireProperty(value, property, path, errors));

  if (value.contractVersion !== BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION) {
    errors.push(`${path}.contractVersion must be ${BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION}`);
  }
  if (typeof value.id !== 'string' || !AUDIT_ID_PATTERN.test(value.id)) {
    errors.push(`${path}.id must be a stable kebab-case identifier`);
  }
  if (!isEnumValue(BOUNDARY_AUDIT_MODULES, value.module)) errors.push(`${path}.module is not supported`);
  if (!isEnumValue(BOUNDARY_AUDIT_CATEGORIES, value.category)) errors.push(`${path}.category is not supported`);
  if (isEnumValue(BOUNDARY_AUDIT_MODULES, value.module)
    && isEnumValue(BOUNDARY_AUDIT_CATEGORIES, value.category)
    && !value.category.startsWith(`${value.module}-`)) {
    errors.push(`${path}.category must belong to module ${value.module}`);
  }
  if (!isJsonObject(value.input, `${path}.input`, errors)) {
    // The detailed JSON errors are already included above.
  }
  for (const property of ['fixture', 'risk', 'currentBehavior', 'expectedPolicy', 'notes']) {
    if (!isNonEmptyString(value[property])) errors.push(`${path}.${property} must be a non-empty string`);
  }
  if (!isEnumValue(BOUNDARY_AUDIT_STATUSES, value.status)) errors.push(`${path}.status is not supported`);
  if (!isEnumValue(GOLDEN_VALIDATION_CLASSES, value.validationClass)) {
    errors.push(`${path}.validationClass is not supported`);
  }
  if (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.some((ref) => typeof ref !== 'string' || !EVIDENCE_REF_PATTERN.test(ref))) {
    errors.push(`${path}.evidenceRefs must contain only repository anchors or published URLs`);
  }
  if (!isEnumValue(BOUNDARY_AUDIT_TARGET_BATCHES, value.targetBatch)) {
    errors.push(`${path}.targetBatch is not supported`);
  }
  if (typeof value.ownerDecisionRequired !== 'boolean') {
    errors.push(`${path}.ownerDecisionRequired must be a boolean`);
  }

  if (value.status === 'decision-required' && value.ownerDecisionRequired !== true) {
    errors.push(`${path}.decision-required must set ownerDecisionRequired=true`);
  }
  if (value.status !== 'decision-required' && value.ownerDecisionRequired === true) {
    errors.push(`${path}.ownerDecisionRequired is only valid for decision-required items`);
  }
  if (['gap', 'decision-required', 'routed-p5-b'].includes(String(value.status)) && value.targetBatch === 'none') {
    errors.push(`${path}.${value.status} requires a concrete targetBatch`);
  }
  if (value.status === 'not-applicable' && value.targetBatch !== 'none') {
    errors.push(`${path}.not-applicable must use targetBatch=none`);
  }
  if (value.status === 'routed-p5-b' && value.targetBatch !== 'P5-B') {
    errors.push(`${path}.routed-p5-b must target P5-B`);
  }
  if (Array.isArray(value.evidenceRefs) && value.evidenceRefs.length === 0 && !/无[^。；;]*证据|暂无直接证据|none/i.test(String(value.notes))) {
    errors.push(`${path}.notes must explicitly explain empty evidenceRefs`);
  }
  if (value.validationClass === 'independent-validation'
    && (!Array.isArray(value.evidenceRefs) || !value.evidenceRefs.some((ref) => /^https?:\/\//.test(String(ref))))) {
    errors.push(`${path} independent-validation requires a published/professional URL evidence reference`);
  }

  return errors;
}

export function getBoundaryInputAuditValidationErrors(value: unknown, path = 'boundaryAuditCase'): readonly string[] {
  return validateAuditCaseValue(value, path);
}

export function validateBoundaryInputAuditCase(value: unknown): BoundaryInputAuditCase {
  const errors = validateAuditCaseValue(value, 'boundaryAuditCase');
  if (errors.length > 0) throw new Error(`Invalid P5-A4a boundary audit case:\n${errors.join('\n')}`);
  return value as BoundaryInputAuditCase;
}

export function validateBoundaryInputAuditRegistry(value: unknown): readonly BoundaryInputAuditCase[] {
  if (!Array.isArray(value)) throw new Error('Invalid P5-A4a boundary audit registry: registry must be an array');
  const errors: string[] = [];
  const ids = new Set<string>();
  const cases: BoundaryInputAuditCase[] = [];
  value.forEach((item, index) => {
    const path = `boundaryAuditCases[${index}]`;
    const itemErrors = validateAuditCaseValue(item, path);
    errors.push(...itemErrors);
    if (itemErrors.length === 0) {
      const auditCase = item as BoundaryInputAuditCase;
      if (ids.has(auditCase.id)) errors.push(`${path}.id duplicates ${auditCase.id}`);
      ids.add(auditCase.id);
      cases.push(auditCase);
    }
  });
  for (const module of BOUNDARY_AUDIT_MODULES) {
    if (!cases.some((item) => item.module === module)) errors.push(`registry is missing module ${module}`);
  }
  for (const category of BOUNDARY_AUDIT_CATEGORIES) {
    if (!cases.some((item) => item.category === category)) errors.push(`registry is missing category ${category}`);
  }
  if (errors.length > 0) throw new Error(`Invalid P5-A4a boundary audit registry:\n${errors.join('\n')}`);
  return cases;
}

export const P5_BOUNDARY_INPUT_AUDIT_CASES: readonly BoundaryInputAuditCase[] = [
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-solar-date-validity',
    module: 'bazi',
    category: 'bazi-solar-date-validity',
    input: { validLeapDay: '2024-02-29', invalidLeapDay: '2023-02-29', calendar: 'solar' },
    fixture: 'tests/p5-boundary-input-audit.regression.mjs#bazi-leap-day-probe',
    risk: '公历日期字段校验必须同时锁定合法闰日与非法闰日，避免库静默规范化。',
    currentBehavior: '公历输入通过 UTC-only 字段 round-trip 校验；本批回归锁定 2024-02-29 通过、2023-02-29 以统一错误拒绝。',
    expectedPolicy: '维持公历合法日期、闰日、非法日期和错误文案的固定回归；不接受库静默规范化非法日期。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['src/domains/bazi/calendar-resolver.ts#parseInput', 'tests/p5-boundary-input-audit.regression.mjs#bazi-leap-day-probe'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '本批已补工程边界回归；不代表公历历法之外的专业命理真值。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-lunar-leap-month',
    module: 'bazi',
    category: 'bazi-lunar-conversion-leap-month',
    input: { lunarNewYear: '2024-01-01T12:00', invalidLeapMonth: '2024-01-15', isLeapMonth: true },
    fixture: 'tests/bazi-calendar-regression.mjs#P1-E',
    risk: '闰月标记错误会改变农历到公历的输入事实，不能降级为普通月。',
    currentBehavior: '现有回归确认 2024 正月初一转换为 2024-02-10，并确认不存在闰一月时显式拒绝；转换 evidence 保留来源和版本。',
    expectedPolicy: '保留历法来源、闰月标志和明确失败文案；继续扩充不同年份闰月组合的覆盖。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/bazi-calendar-regression.mjs#P1-E', 'src/domains/bazi/calendar-resolver.ts#resolveBaziCalendar'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '这是当前转换稳定性回归，不代表农历/四柱流派专业真值。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-solar-term-boundary',
    module: 'bazi',
    category: 'bazi-solar-term-boundary',
    input: { before: '2024-02-04T16:26:07', exactMinute: '2024-02-04T16:27:07', after: '2024-02-04T16:28:07', timezone: 'Asia/Shanghai' },
    fixture: 'tests/bazi-solar-terms.regression.mjs#P1-B',
    risk: '节气边界直接影响月令依据；分钟/秒精度和流派换年不能混为一谈。',
    currentBehavior: '现有 resolver 在 T-1/T/T+1 返回最近/下一节气、当前月柱依据和固定精度；UTC 与 Asia/Shanghai 宿主环境结果一致。',
    expectedPolicy: '继续按已声明精度展示当前节令；新增公开资料只验证其公开精度，不扩展为流派真值。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/bazi-solar-terms.regression.mjs#P1-B', 'src/domains/bazi/solar-terms.ts#resolveSolarTermBoundary'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: 'HKO published-reference 已单独记录；本项仍只审计 resolver 回归边界。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-day-boundary',
    module: 'bazi',
    category: 'bazi-day-boundary',
    input: { times: ['22:59', '23:00', '23:01'], rules: ['midnight', 'ziEarly'], timezone: 'Asia/Shanghai' },
    fixture: 'tests/bazi-day-boundary.regression.mjs#P1-C',
    risk: '子初换日会改变日柱/时柱；错误处理会造成跨日且不可见的历史差异。',
    currentBehavior: '现有测试锁定 22:59/23:00/23:01、midnight/ziEarly 的 effectiveCalculationTime 和实际 day/hour pillar。',
    expectedPolicy: '维持规则显式持久化、边界可复现，新增真太阳时与子初组合时仍展示最终有效时刻。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/bazi-day-boundary.regression.mjs#P1-C', 'tests/bazi-true-solar-v2-compat.regression.mjs#P5-A3a-boundary'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '只证明当前规则实现稳定，不证明某一流派日界线是专业唯一真值。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-true-solar-cross-day',
    module: 'bazi',
    category: 'bazi-true-solar-cross-day',
    input: { eastLongitude: 121, westLongitude: 116.4074, cases: ['near-midnight', 'negative-correction'], timezone: 'Asia/Shanghai' },
    fixture: 'tests/bazi-true-solar-v2-compat.regression.mjs#P5-A3a-boundary',
    risk: '真太阳时修正可能跨日、跨时辰或与子初换日交叠；目前东经/负修正覆盖不等于完整东西经跨日矩阵。',
    currentBehavior: '现有 fixture 覆盖东经 121 度到 23:00/次日 00:00 以及北京负修正 09:13/09:14/09:15 时柱边界，但没有完整东西经跨日与日期边界矩阵。',
    expectedPolicy: '补齐东/西经、正/负修正、午夜/子初组合，并分别锁定中间 correction.effectiveTime 与最终 effectiveCalculationTime。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/bazi-true-solar-v2-compat.regression.mjs#P5-A3a-boundary', 'src/domains/bazi/true-solar-time.ts#resolveTrueSolarTime'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '已有边界证据但覆盖不完整；不在本批修改公式或日界线。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-fixed-timezone',
    module: 'bazi',
    category: 'bazi-fixed-timezone',
    input: { businessTimezone: 'Asia/Shanghai', hostTimezones: ['UTC', 'Asia/Shanghai'] },
    fixture: 'tests/bazi-solar-terms.regression.mjs#P1-B-host-tz',
    risk: '宿主时区泄漏会让同一出生民用时刻在 Web、Node 和 iPhone 上产生不同结果。',
    currentBehavior: '节气、真太阳时和统一 calculationSettings 已固定 Asia/Shanghai，并有跨 TZ deepEqual 回归。',
    expectedPolicy: '所有新增日期/时区路径继续使用固定业务时区和 UTC-only 字段运算，禁止读取 process/OS timezone。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/bazi-solar-terms.regression.mjs#P1-B-host-tz', 'tests/bazi-true-solar.regression.mjs#P1-D-host-tz', 'src/services/chart-engine-shared.ts#calculationSettings'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '跨宿主 TZ 是工程复现事实，不是专业历法验证。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-unknown-time',
    module: 'bazi',
    category: 'bazi-unknown-birth-time',
    input: { birthDate: '2001-09-08', birthTime: null, timeKnown: false },
    fixture: 'tests/chart-engine.regression.mjs#input-boundaries',
    risk: '缺时辰时继续生成四柱会伪造时柱、真太阳时和日界线精度。',
    currentBehavior: '八字 facade 通过 requireExactBirth 在缺时辰或 timeKnown=false 时拒绝；现有测试锁定错误文案。',
    expectedPolicy: '继续拒绝需要精确时辰的八字路径；若未来提供按日级别模式，必须另立输入/解释合同并明确偏差。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/chart-engine.regression.mjs#input-boundaries', 'src/services/chart-engine-shared.ts#requireExactBirth'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '当前只验证拒绝策略，不代表时辰未知时的命理结论。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-unknown-longitude',
    module: 'bazi',
    category: 'bazi-unknown-city-longitude',
    input: { trueSolarTime: true, longitude: null, city: '未收录城市' },
    fixture: 'tests/bazi-current-replay.regression.mjs#legacy-unknown-preconditions',
    risk: '真太阳时缺经度时猜测坐标会直接改变有效时刻和时柱。',
    currentBehavior: '启用真太阳时且经度缺失/越界时，resolver 明确抛出“未知城市不会猜测坐标”；当前 replay 前置测试覆盖缺经度拒绝。',
    expectedPolicy: '继续阻止无法确认经度的真太阳时计算；城市精确覆盖路线进入 P5-B，不能以城市包含关系猜测。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/bazi-current-replay.regression.mjs#legacy-unknown-preconditions', 'src/domains/bazi/true-solar-time.ts#resolveTrueSolarTime', 'src/data/china-cities.ts#resolveCityCoordinates'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '覆盖的是无经度阻止，不等于城市数据已经完整。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-supported-date-range',
    module: 'bazi',
    category: 'bazi-supported-date-range',
    input: { solarRange: '未在应用合同声明', lunarRange: '依赖 lunar-javascript@1.7.7' },
    fixture: 'src/domains/bazi/calendar-resolver.ts#CALENDAR_RESOLVER_DATA_VERSION',
    risk: '未声明可支持日期范围会把第三方库偶然可计算误解为产品承诺。',
    currentBehavior: '应用只做字段级日期校验并调用 lunar-javascript；没有八字公开支持起止年、历史历法范围或超范围错误合同。',
    expectedPolicy: '由负责人决定公开支持日期范围、超范围降级/阻止和文案，再建立固定边界 fixture。',
    status: 'decision-required',
    validationClass: 'regression-only',
    evidenceRefs: ['src/domains/bazi/calendar-resolver.ts#parseInput', 'package.json#dependencies'],
    targetBatch: 'OWNER-DECISION',
    ownerDecisionRequired: true,
    notes: '这是公开能力承诺决策门；当前没有 published/professional date-range source。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-bazi-historical-dst',
    module: 'bazi',
    category: 'bazi-historical-dst',
    input: { years: '1986-1991', jurisdiction: '中国大陆', timezone: 'Asia/Shanghai' },
    fixture: 'src/types/charts.ts#DEFAULT_CALCULATION_TIMEZONE',
    risk: '历史夏令时是否应用会改变民用时刻、节气边界和四柱输入；当前固定 Asia/Shanghai 不等于历史 DST 规则。',
    currentBehavior: '当前计算设置只记录固定 Asia/Shanghai，代码没有历史 DST 开关或 1986–1991 规则数据，也没有对应 regression fixture。',
    expectedPolicy: '负责人必须先决定是否承诺历史 DST、采用哪一法源和如何标记不确定性；未经决策不得猜测或补算。',
    status: 'decision-required',
    validationClass: 'regression-only',
    evidenceRefs: ['src/types/charts.ts#DEFAULT_CALCULATION_TIMEZONE', 'src/services/chart-engine-shared.ts#calculationSettings'],
    targetBatch: 'OWNER-DECISION',
    ownerDecisionRequired: true,
    notes: '本项只登记决策门，不选择历史 DST 规则，也不声称当前结果覆盖该时期。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-ziwei-known-time',
    module: 'ziwei',
    category: 'ziwei-known-birth-time',
    input: { birthDate: '2001-09-08', birthTime: '20:30', calendar: 'solar', gender: 'male' },
    fixture: 'tests/chart-engine.regression.mjs#ziwei-fixed-chart',
    risk: '时辰索引变化会影响紫微命宫、身宫和星曜安置。',
    currentBehavior: 'iztro facade 将已知时辰映射为 timeIndex 并生成 12 宫；固定样例锁定命身主、四化和宫位结构。',
    expectedPolicy: '保持时辰索引规则、引擎版本和输入快照可复现；流派差异另行记录。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/chart-engine.regression.mjs#ziwei-fixed-chart', 'src/services/engines/ziwei-engine.ts#calculateZiweiView'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '固定引擎回归不代表紫微专业流派真值。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-ziwei-unknown-time',
    module: 'ziwei',
    category: 'ziwei-unknown-birth-time',
    input: { birthDate: '2001-09-08', birthTime: null, timeKnown: false },
    fixture: 'tests/chart-engine.regression.mjs#input-boundaries',
    risk: '缺时辰继续安星会伪造命宫/身宫和时辰相关星曜。',
    currentBehavior: '紫微 facade 在进入 iztro 前调用 requireExactBirth，缺时辰明确拒绝。',
    expectedPolicy: '继续拒绝精确紫微盘；若产品未来允许时辰区间或多盘候选，必须另立解释和结果协议。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/chart-engine.regression.mjs#input-boundaries', 'src/services/chart-engine-shared.ts#requireExactBirth'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '当前只覆盖拒绝路径。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-ziwei-solar-input',
    module: 'ziwei',
    category: 'ziwei-solar-input',
    input: { calendar: 'solar', date: '2001-09-08', time: '20:30', leapMonth: false },
    fixture: 'tests/chart-engine.regression.mjs#ziwei-fixed-chart',
    risk: '合法 solar 输入需要稳定固定样例；无效公历日期不能被误归入本项或被库静默解释。',
    currentBehavior: '已知合法样例走 iztro.astro.bySolar；紫微 facade 本身只通过 birthParts 拆分数字，不调用 Bazi calendar-resolver。',
    expectedPolicy: '保留合法 solar 输入的固定回归；无效公历日期由 ziwei-invalid-gregorian-date 单独登记和处理，不能把第三方库返回视为应用输入验证。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/chart-engine.regression.mjs#ziwei-fixed-chart', 'src/services/engines/ziwei-engine.ts#bySolar'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '本项只覆盖合法 solar 样例；非法日期由 ziwei-invalid-gregorian-date 的 P5-A4b gap 登记。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-ziwei-lunar-input',
    module: 'ziwei',
    category: 'ziwei-lunar-input',
    input: { calendar: 'lunar', date: '2024-01-01', time: '12:00', leapMonth: false },
    fixture: 'src/services/engines/ziwei-engine.ts#byLunar',
    risk: '紫微农历输入没有经过当前 Bazi 农历转换证据链，闰月和日期合法性可能与用户理解不一致。',
    currentBehavior: '紫微 facade 直接把 `birthDate`、timeIndex 和 isLeapMonth 传给 iztro.byLunar；当前统一测试没有紫微农历 fixture。',
    expectedPolicy: '增加紫微公历/农历/闰月分支的独立回归和错误文案，明确不复用未声明的四柱流派规则。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/ziwei-engine.ts#byLunar', 'src/services/chart-engine-shared.ts#birthParts'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '当前无直接紫微农历测试 evidence。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-ziwei-leap-month',
    module: 'ziwei',
    category: 'ziwei-leap-month-input',
    input: { calendar: 'lunar', date: '2023-02-01', isLeapMonth: true },
    fixture: 'src/services/engines/ziwei-engine.ts#byLunar',
    risk: '闰月布尔值会影响紫微安星；只传 boolean 而不验证当年是否存在该闰月会产生错误盘。',
    currentBehavior: '当前 facade 将 profile.isLeapMonth ?? false 原样传给 iztro；没有按年份核对闰月存在性或专用测试。',
    expectedPolicy: '确定紫微闰月输入校验边界，建立存在/不存在闰月组合和失败文案回归。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/ziwei-engine.ts#byLunar'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '当前行为只来自 facade 代码，未作专业流派推断。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-ziwei-invalid-gregorian-date',
    module: 'ziwei',
    category: 'ziwei-invalid-gregorian-date',
    input: { invalidDate: '2024-02-30', nonLeapFeb29: '2023-02-29', calendar: 'solar' },
    fixture: 'tests/p5-boundary-input-audit.regression.mjs#ziwei-invalid-date-probe',
    risk: '无效公历日期若被 iztro 静默接受，会把无效输入伪装成有效紫微盘。',
    currentBehavior: '只读 probe 显示紫微对 2024-02-30 仍返回结果，并给出 solarDate=2024-2-30；shared birthParts 只检查 Number.isFinite。',
    expectedPolicy: '在 facade 入口增加 Gregorian 合法性校验，拒绝 2024-02-30 等无效日期并给出稳定、可理解的输入错误文案。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/p5-boundary-input-audit.regression.mjs#ziwei-invalid-date-probe', 'src/services/chart-engine-shared.ts#birthParts', 'src/services/engines/ziwei-engine.ts#calculateZiweiView'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '这是安全的输入合法性缺口，不是公开支持日期范围的负责人决策，也不是专业紫微真值声明。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-ziwei-date-range',
    module: 'ziwei',
    category: 'ziwei-date-range',
    input: { supportedRange: '未声明', lowerProbe: '0000-01-01', upperProbe: '9999-12-31' },
    fixture: 'src/services/engines/ziwei-engine.ts#calculateZiweiView',
    risk: '没有公开支持日期范围会把第三方库偶然可计算误解为产品承诺。',
    currentBehavior: '应用没有公开紫微支持起止年、历法范围或超范围错误合同；无效公历拒绝另由 ziwei-invalid-gregorian-date 登记。',
    expectedPolicy: '负责人决定公开支持日期范围、超范围拒绝/降级和历史记录承诺，再建立对应回归与文案。',
    status: 'decision-required',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/ziwei-engine.ts#calculateZiweiView', 'src/services/chart-engine-shared.ts#birthParts'],
    targetBatch: 'OWNER-DECISION',
    ownerDecisionRequired: true,
    notes: '这是公开支持范围决策，不包含普通无效日期拒绝；不对 iztro 或紫微专业日期范围作权威认证。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-ziwei-unknown-city',
    module: 'ziwei',
    category: 'ziwei-unknown-city',
    input: { birthCity: '未收录城市', latitude: null, longitude: null },
    fixture: 'src/services/engines/ziwei-engine.ts#calculateZiweiView',
    risk: '用户可能以为城市会改变紫微盘，但当前算法不消费城市/坐标，说明不清会造成输入语义误解。',
    currentBehavior: '紫微 facade 只读取出生日期、时辰、历法、性别和时辰索引，不读取 birthCity/latitude/longitude。',
    expectedPolicy: '将城市字段标为对当前紫微算法不适用，不显示地理精度承诺；若未来引擎使用城市，另开兼容批。',
    status: 'not-applicable',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/ziwei-engine.ts#calculateZiweiView'],
    targetBatch: 'none',
    ownerDecisionRequired: false,
    notes: '当前算法不消费城市/坐标；这是“不适用”而非城市精度已验证。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-ziwei-engine-error-path',
    module: 'ziwei',
    category: 'ziwei-engine-error-path',
    input: { malformedDate: '2024-02-30', malformedGender: 'other', malformedLunarFlag: 'not-boolean' },
    fixture: 'src/services/engines/ziwei-engine.ts#calculateZiweiView',
    risk: '引擎异常若直接冒泡或返回半成品，会让 UI 无法区分输入失败与计算失败。',
    currentBehavior: '当前没有紫微 engine error contract 或专用异常回归；gender 由 shared helper 校验，但日期/闰月路径未统一封装。',
    expectedPolicy: '为输入拒绝、第三方库异常和半成品结果建立统一失败分类与用户文案。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/ziwei-engine.ts#calculateZiweiView', 'src/services/chart-engine-shared.ts#requireGender'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '本项只登记异常边界，不在本批改引擎调用。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-astrology-exact-coordinate',
    module: 'astrology',
    category: 'astrology-exact-time-coordinate',
    input: { birthDate: '2001-09-08', birthTime: '20:30', latitude: 22.5431, longitude: 114.0579, city: '广东省深圳市' },
    fixture: 'tests/chart-engine.regression.mjs#astrology-exact-chart',
    risk: '完整时辰和坐标是上升、天顶和宫位的必要输入；丢失任一字段会改变精确度。',
    currentBehavior: '现有固定样例生成 exact 模式，包含角点、宫位、标准十星和主要相位，并写入 Asia/Shanghai snapshot。',
    expectedPolicy: '精确模式只在输入时辰和已确认坐标完整时启用，保留坐标数据集版本和精度说明。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/chart-engine.regression.mjs#astrology-exact-chart', 'tests/astrology-explanation.regression.mjs#P4-E-exact', 'src/services/engines/astrology-engine.ts#calculateAstrologyView'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '当前仅为引擎/适配回归，不代表天文专业位置的独立校验。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-astrology-missing-time',
    module: 'astrology',
    category: 'astrology-missing-time-approximate',
    input: { birthDate: '2001-09-08', birthTime: null, timeKnown: false, coordinates: 'known' },
    fixture: 'tests/chart-engine.regression.mjs#input-boundaries',
    risk: '产品若宣称缺时辰可生成近似星盘，当前 facade 实际会拒绝；若强行降级会改变上升/宫位和公开承诺。',
    currentBehavior: 'astrology facade 在任何坐标分支前调用 requireExactBirth，缺时辰直接抛错，没有当前可运行的按日近似路径。',
    expectedPolicy: '负责人决定是否提供缺时辰近似模式及其隐藏字段/文案；未决前继续拒绝，不能把“缺坐标近似”误写成“缺时辰近似”。',
    status: 'decision-required',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/chart-engine.regression.mjs#input-boundaries', 'src/services/engines/astrology-engine.ts#calculateAstrologyView', 'src/services/chart-engine-shared.ts#requireExactBirth'],
    targetBatch: 'OWNER-DECISION',
    ownerDecisionRequired: true,
    notes: '这是精度/产品承诺变化，不在本批实现。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-astrology-missing-coordinate',
    module: 'astrology',
    category: 'astrology-missing-coordinate',
    input: { birthDate: '2001-09-08', birthTime: '20:30', birthCity: '福建省泉州市', latitude: null, longitude: null },
    fixture: 'tests/p5-boundary-input-audit.regression.mjs#astrology-unknown-coordinate-probe',
    risk: '未知城市被标为 approximate，但当前 Origin 仍收到 0,0；这会改变行星位置而不只是隐藏角点/宫位。',
    currentBehavior: '代码使用 `city?.latitude ?? 0` 与 `city?.longitude ?? 0`；只读 probe 显示未知坐标的太阳/月亮黄经与已知深圳坐标不同，虽然角点/宫位被隐藏。',
    expectedPolicy: '未知坐标不得以 0,0 代替；应阻止或采用明确、不改变民用时刻语义的近似策略，并显示偏差来源。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/astrology-engine.ts#calculateAstrologyView', 'tests/p5-boundary-input-audit.regression.mjs#astrology-unknown-coordinate-probe'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '已用代码与本项目只读 probe 证明 currentBehavior；本批只登记，不修算法。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-astrology-invalid-coordinate',
    module: 'astrology',
    category: 'astrology-invalid-coordinate',
    input: { latitude: 95, longitude: 220, alternative: { latitude: 'x', longitude: null } },
    fixture: 'src/services/engines/astrology-engine.ts#calculateAstrologyView',
    risk: '非法纬经度可能进入第三方 Origin，产生异常或伪精确结果。',
    currentBehavior: 'astrology facade 只判断 latitude/longitude 是否非 null，不做有限数、纬度 ±90、经度 ±180 范围校验。',
    expectedPolicy: '统一校验纬经度范围和 NaN/Infinity，失败时明确提示并禁止进入 exact/approximate 计算。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/astrology-engine.ts#calculateAstrologyView', 'src/data/china-cities.ts#resolveCityCoordinates'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '没有现成 invalid-coordinate regression；当前只登记输入门禁缺口。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-astrology-invalid-gregorian-date',
    module: 'astrology',
    category: 'astrology-invalid-gregorian-date',
    input: { invalidGregorian: '2024-02-30', nonLeapFeb29: '2023-02-29' },
    fixture: 'tests/p5-boundary-input-audit.regression.mjs#astrology-invalid-date-probe',
    risk: '无效公历日期若依赖第三方异常而没有应用层校验，会产生不稳定的失败语义或伪精确结果。',
    currentBehavior: '只读 probe 显示 2024-02-30/2023-02-29 会由 circular-natal-horoscope-js 路径抛出底层错误；应用没有统一 Gregorian 校验或中文错误分类。',
    expectedPolicy: '在 facade 入口增加 Gregorian 合法性校验，稳定拒绝无效日期并给出可理解的输入错误文案。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/p5-boundary-input-audit.regression.mjs#astrology-invalid-date-probe', 'src/services/chart-engine-shared.ts#birthParts', 'src/services/engines/astrology-engine.ts#calculateAstrologyView'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '这是安全的输入合法性缺口，不是公开支持日期范围的负责人决策，也不是天文位置独立验证。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-astrology-date-range',
    module: 'astrology',
    category: 'astrology-date-range-calendar',
    input: { supportedRange: '未声明', lowerProbe: '0000-01-01', upperProbe: '9999-12-31', calendar: 'Gregorian' },
    fixture: 'src/services/engines/astrology-engine.ts#calculateAstrologyView',
    risk: '没有公开支持日期范围和历法限制会把第三方库偶然可计算误解为产品承诺。',
    currentBehavior: '应用没有统一的占星支持起止年、历法限制或超范围错误合同；普通无效公历拒绝另由 astrology-invalid-gregorian-date 登记。',
    expectedPolicy: '负责人决定公开支持日期范围、历法限制、超范围拒绝/降级和历史记录承诺，再建立对应回归与文案。',
    status: 'decision-required',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/astrology-engine.ts#calculateAstrologyView', 'src/services/chart-engine-shared.ts#birthParts'],
    targetBatch: 'OWNER-DECISION',
    ownerDecisionRequired: true,
    notes: '这是公开支持范围/历法限制决策，不包含普通无效日期拒绝；不对占星天文数据作独立验证。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-astrology-host-timezone',
    module: 'astrology',
    category: 'astrology-host-timezone',
    input: { birthDate: '2001-09-08', birthTime: '20:30', timezoneSetting: 'Asia/Shanghai', hostTimezones: ['UTC', 'Asia/Shanghai'] },
    fixture: 'tests/p5-boundary-input-audit.regression.mjs#astrology-host-tz-probe',
    risk: '占星库内部时区解析若依赖宿主环境，会使 Web 与 iPhone 同一输入不一致。',
    currentBehavior: '已知深圳坐标的只读 probe 在 UTC 与 Asia/Shanghai 宿主环境返回相同 factors/aspects；facade 仍需持续防止新增 Date/local getter 泄漏。',
    expectedPolicy: '将跨宿主 TZ deepEqual 固化为回归，并在城市/坐标模型变化时重新审计。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/p5-boundary-input-audit.regression.mjs#astrology-host-tz-probe', 'src/services/chart-engine-shared.ts#calculationSettings'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '只验证当前固定 fixture 的工程复现，不外推所有日期和第三方库版本。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-astrology-engine-error-path',
    module: 'astrology',
    category: 'astrology-engine-error-path',
    input: { cases: ['invalid-date', 'invalid-coordinate', 'library-throw'] },
    fixture: 'src/services/engines/astrology-engine.ts#calculateAstrologyView',
    risk: '第三方 Origin/Horoscope 异常直接冒泡时，UI 无法稳定区分输入错误、坐标缺失和引擎失败。',
    currentBehavior: '当前没有 astrology engine error adapter 或统一错误类型；输入字段在 Origin 前也未完成统一合法性门禁。',
    expectedPolicy: '建立输入失败/依赖失败/无可用盘面的可识别错误路径和文案，避免显示半成品。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/astrology-engine.ts#calculateAstrologyView', 'tests/p5-boundary-input-audit.regression.mjs#astrology-invalid-date-probe'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '只登记现状和后续测试入口，不在本批改变 third-party 调用。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-liuyao-seed-date-scope-timezone',
    module: 'liuyao',
    category: 'liuyao-seed-date-scope-timezone',
    input: { seed: 'fixture-liuyao-seed-v1', date: '2026-01-01T12:00:00.000Z', seedScope: 'guanxiang-local-v1', timezone: 'Asia/Shanghai' },
    fixture: 'tests/chart-engine.regression.mjs#liuyao-fixed-seed',
    risk: 'seed/date/scope/timezone 任一字段未持久化或受宿主 TZ 影响都会破坏六爻复盘。',
    currentBehavior: '固定 seed/date 重复运行 deepEqual；inputSnapshot 与 calculationSettings 都写入 Asia/Shanghai、seed、date、seedScope；UTC/Asia/Shanghai 宿主结果一致。',
    expectedPolicy: '继续要求 seed/date/scope/timezone 进入 payload 与 snapshot，禁止默认依赖当前时间用于历史复算。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/chart-engine.regression.mjs#liuyao-fixed-seed', 'tests/chart-engine.regression.mjs#liuyao-host-tz', 'src/services/engines/liuyao-engine.ts#calculateLiuyaoView'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '只验证可复现工程合同，不验证卦象/用神专业真值。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-liuyao-invalid-date',
    module: 'liuyao',
    category: 'liuyao-invalid-date',
    input: { invalidDate: '2026-02-30T12:00:00', missingTime: '2026-08-15' },
    fixture: 'src/services/chart-engine-shared.ts#normalizeLiuyaoDate',
    risk: '六爻日期无效或缺时间会改变干支时间、旺衰和空亡证据。',
    currentBehavior: 'normalizeLiuyaoDate 使用格式和 UTC 字段 round-trip 校验；本批 probe 已锁定 2026-02-30 与缺时间会抛出明确错误，但带时区偏移、毫秒、秒边界等矩阵仍未完整覆盖。',
    expectedPolicy: '为非法日期、缺时间、带时区偏移和秒/毫秒输入建立固定矩阵，文案保持可理解。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/chart-engine-shared.ts#normalizeLiuyaoDate', 'tests/p5-boundary-input-audit.regression.mjs#liuyao-invalid-date-probe'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '本批已有单点非法日期/缺时间 probe；剩余 offset/millis/边界矩阵和统一文案仍需后续补齐。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-liuyao-invalid-seed',
    module: 'liuyao',
    category: 'liuyao-invalid-seed',
    input: { emptySeed: '', nonStringSeed: 123, whitespaceSeed: '   ' },
    fixture: 'tests/p5-boundary-input-audit.regression.mjs#liuyao-invalid-seed-probe',
    risk: 'seed 没有格式边界会让“可复现”与“用户输入随机源”语义不清。',
    currentBehavior: 'calculateLiuyaoView 只在 options 缺省时自动生成 seed；空字符串当前可进入 taibu-core 并返回结果，没有 seed validator。',
    expectedPolicy: '确定 seed 是否仅为内部复现字段；若可由用户/导入提供，则定义非空格式、长度和错误文案。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/p5-boundary-input-audit.regression.mjs#liuyao-invalid-seed-probe', 'src/services/engines/liuyao-engine.ts#calculateLiuyaoView'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '空 seed 的返回只是当前代码事实，不是对随机算法的专业评价。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-liuyao-invalid-scope',
    module: 'liuyao',
    category: 'liuyao-invalid-scope',
    input: { exposedOption: false, fixedScope: 'guanxiang-local-v1' },
    fixture: 'src/services/chart-engine-shared.ts#LIUYAO_SEED_SCOPE',
    risk: '若未来允许外部 scope，未知 scope 可能破坏 seed 兼容；当前 API 没有 scope 入参。',
    currentBehavior: 'seedScope 由 facade 常量固定为 guanxiang-local-v1，CalculationOptions 不接受 caller-provided scope，因此当前没有非法 scope 输入路径。',
    expectedPolicy: '若以后开放 scope，先建立枚举/迁移/拒绝策略；当前不虚构一个不存在的用户输入测试。',
    status: 'not-applicable',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/chart-engine-shared.ts#LIUYAO_SEED_SCOPE', 'src/services/engines/liuyao-engine.ts#calculateLiuyaoView'],
    targetBatch: 'none',
    ownerDecisionRequired: false,
    notes: '当前没有 scope 入参，所以本项不适用；不是 scope 已获得专业验证。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-liuyao-empty-question',
    module: 'liuyao',
    category: 'liuyao-empty-question',
    input: { question: '', whitespaceQuestion: '   ' },
    fixture: 'tests/p5-boundary-input-audit.regression.mjs#liuyao-empty-question-probe',
    risk: '空问题会让用神、动变与复盘对象失去语义；必须阻止生成或明确提示。',
    currentBehavior: 'taibu-core 当前对空问题抛出“请先明确问题后再解卦”；facade 自身没有先验 question validator。',
    expectedPolicy: '在产品输入层保留非空/具体问题门禁，错误文案和无障碍提示纳入 P5-C。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/p5-boundary-input-audit.regression.mjs#liuyao-empty-question-probe', 'src/services/engines/liuyao-engine.ts#calculateLiuyaoView'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '覆盖的是当前依赖错误行为，仍需后续统一输入门禁。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-liuyao-invalid-yongshen',
    module: 'liuyao',
    category: 'liuyao-invalid-yongshen',
    input: { question: '问题', target: '不存在的用神' },
    fixture: 'tests/p5-boundary-input-audit.regression.mjs#liuyao-invalid-target-probe',
    risk: '非法用神会使纳甲、六亲和证据图失去可解释对象。',
    currentBehavior: 'taibu-core 当前对非法 target 抛出 yongShenTargets 非法值错误；facade 通过类型断言而非运行时枚举校验。',
    expectedPolicy: '在 UI/facade 入口使用显式用神枚举校验，错误归类为输入失败而非引擎崩溃。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/p5-boundary-input-audit.regression.mjs#liuyao-invalid-target-probe', 'src/services/engines/liuyao-engine.ts#calculateLiuyaoView'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '已锁定当前失败行为；本批不改输入层。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-liuyao-host-timezone',
    module: 'liuyao',
    category: 'liuyao-host-timezone',
    input: { date: '2026-01-01T12:00:00.000Z', businessTimezone: 'Asia/Shanghai', hostTimezones: ['UTC', 'Asia/Shanghai'] },
    fixture: 'tests/chart-engine.regression.mjs#liuyao-host-tz',
    risk: 'taibu-core 读取 Date local getter 会令固定 seed 在不同宿主时区变卦。',
    currentBehavior: 'normalizeLiuyaoDate 先将输入固定为 Asia/Shanghai 民用字段；现有 UTC/Asia/Shanghai fixture deepEqual。',
    expectedPolicy: '所有六爻 replay/导入继续写入 timezone 并保持跨 OS TZ 一致。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/chart-engine.regression.mjs#liuyao-host-tz', 'src/services/chart-engine-shared.ts#normalizeLiuyaoDate'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '只验证固定 fixture 复现，不验证任何断卦结论。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-liuyao-no-timing-promise',
    module: 'liuyao',
    category: 'liuyao-no-timing-promise',
    input: { explanationCategories: ['time-strength', 'summary'], forbiddenClaims: ['应期', '一定成功', '必然失败'] },
    fixture: 'tests/liuyao-explanation.regression.mjs#P4-G',
    risk: '把空亡/动爻强行翻译成具体日期会形成无法验证的时间承诺。',
    currentBehavior: '解释回归断言文本不出现应期/何时/确定性成功失败承诺，并保留时间强弱证据。',
    expectedPolicy: '继续只展示时间事实和不确定性，不输出应期承诺；未来付费内容也需沿用该边界。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/liuyao-explanation.regression.mjs#P4-G', 'src/domains/liuyao/explanation/index.ts#buildLiuyaoExplanation'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '这是内容安全回归，不是对六爻预测有效性的验证。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-liuyao-engine-error-path',
    module: 'liuyao',
    category: 'liuyao-engine-error-path',
    input: { cases: ['empty-question', 'invalid-target', 'invalid-date', 'library-rejection'] },
    fixture: 'src/services/engines/liuyao-engine.ts#calculateLiuyaoView',
    risk: '依赖抛出的英文/内部错误若直接到 UI，会使失败原因和恢复动作不稳定。',
    currentBehavior: '日期由 shared helper 统一错误，空问题/非法用神主要依赖 taibu-core 抛错；没有统一 Liuyao error taxonomy。',
    expectedPolicy: '建立输入失败与引擎失败的统一分类、错误码/文案和重试边界。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/engines/liuyao-engine.ts#calculateLiuyaoView', 'src/services/chart-engine-shared.ts#normalizeLiuyaoDate'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '只登记错误链缺口，不在本批改 taibu-core adapter。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-cross-no-guessing',
    module: 'cross',
    category: 'cross-no-guessing',
    input: { unknownCity: '福建省泉州市', missingLongitude: true, missingTime: true },
    fixture: 'tests/chart-engine.regression.mjs#input-boundaries',
    risk: '缺失时辰、未知城市和缺经度时猜测会制造虚假的精确度。',
    currentBehavior: '现有测试确认八字/紫微缺时辰拒绝、真太阳时缺经度拒绝、城市 resolver 精确匹配且未知地点不按包含关系猜测；占星仍有 0,0 fallback gap。',
    expectedPolicy: '四术统一采用“拒绝、降级或不适用”显式策略，任何降级必须保存输入缺失原因；先修复占星 0,0 fallback，再宣称跨模块无猜测闭环。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/chart-engine.regression.mjs#input-boundaries', 'tests/bazi-current-replay.regression.mjs#legacy-unknown-preconditions', 'tests/p5-boundary-input-audit.regression.mjs#astrology-unknown-coordinate-probe', 'src/data/china-cities.ts#resolveCityCoordinates'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: '八字/紫微/城市 resolver 已有不猜测事实，但占星未知坐标 0,0 fallback 使跨模块原则尚未闭环；本项按整体合同登记 gap。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-cross-error-copy-failure-mode',
    module: 'cross',
    category: 'cross-error-copy-failure-mode',
    input: { modules: ['bazi', 'ziwei', 'astrology', 'liuyao'], failureKinds: ['validation', 'missing-input', 'engine-error'] },
    fixture: 'src/services/chart-engine-shared.ts#requireExactBirth',
    risk: '不同模块直接抛出不同语言/层级错误，用户无法知道是补资料、换城市还是稍后重试。',
    currentBehavior: '当前错误文案散落在 shared helper、resolver 和第三方引擎调用中，没有统一失败类型或跨模块文案合同。',
    expectedPolicy: '先在 P5-A4b 建立跨模块失败分类、错误码、可恢复动作和稳定错误 contract；UI/读屏文案与呈现另路由 P5-C。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['src/services/chart-engine-shared.ts#requireExactBirth', 'src/domains/bazi/calendar-resolver.ts#parseInput', 'src/services/engines/liuyao-engine.ts#calculateLiuyaoView'],
    targetBatch: 'P5-A4b',
    ownerDecisionRequired: false,
    notes: 'error taxonomy/contract 目标为 P5-A4b；UI、读屏与无障碍 copy 由 cross-a11y-copy-route 单独路由 P5-C。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-cross-history-input-snapshot',
    module: 'cross',
    category: 'cross-history-input-snapshot',
    input: { legacyRecord: 'pre-snapshot-v1', missingInput: true, expectedFallback: 'legacy snapshot with unknown fields' },
    fixture: 'tests/storage-schema.regression.mjs#legacy-reading-migration',
    risk: '历史记录缺少 inputSnapshot 时补造输入会把未知事实伪装成当前规则。',
    currentBehavior: 'storage migration 为旧记录生成 legacy/liuyao fallback snapshot，保留 unknown seed/date 等标签；Snapshot Viewer 只读保存快照，不接受当前命主覆盖。',
    expectedPolicy: '继续以 unknown/legacy 标签展示，禁止自动重算或猜测出生时辰、城市、seed；新增模块字段时沿同一迁移门禁。',
    status: 'covered',
    validationClass: 'regression-only',
    evidenceRefs: ['tests/storage-schema.regression.mjs#legacy-reading-migration', 'tests/archive-snapshot.regression.mjs#P3-A', 'src/storage/schema.ts#legacyInputSnapshot'],
    targetBatch: 'P5-A4a',
    ownerDecisionRequired: false,
    notes: '覆盖当前 schema 迁移/只读语义，不等于所有未来历史形态已验证。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-cross-city-coverage',
    module: 'cross',
    category: 'cross-city-coverage',
    input: { datasetVersion: 'china-cities-p1f-mainland-v1', scope: 'mainland prefecture-level coverage' },
    fixture: 'src/data/china-cities.ts#CHINA_CITY_DATASET_VERSION',
    risk: '城市表不是全国完整地级市库，未知城市会影响坐标、真太阳时和占星精确模式。',
    currentBehavior: '城市 resolver 只做版本化精确匹配；当前数据说明明确为直辖市、省会及常用地级市的近似中心，不承诺全国完整覆盖。',
    expectedPolicy: '将完整大陆地级市覆盖、逐条来源/许可/别名/坐标审计和版本策略路由 P5-B；未知地点继续不猜测。',
    status: 'routed-p5-b',
    validationClass: 'regression-only',
    evidenceRefs: ['src/data/china-cities.ts#CHINA_CITY_DATASET_VERSION', 'tests/chart-engine.regression.mjs#city-exact-match', 'docs/DATASET_PROVENANCE.md#mainland-v1'],
    targetBatch: 'P5-B',
    ownerDecisionRequired: false,
    notes: '本批只登记路由，不扩充城市数据或改变 resolver。',
  },
  {
    contractVersion: BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
    id: 'p5-a4a-cross-a11y-copy-route',
    module: 'cross',
    category: 'cross-a11y-copy-route',
    input: { failureMessages: ['缺时辰', '未知城市', '非法日期', '引擎失败'], surfaces: ['Web', 'iPhone', 'screen-reader'] },
    fixture: 'docs/ROADMAP.md#P5-C',
    risk: '边界失败文案若没有读屏、字体缩放和减少动态效果验收，用户可能无法完成补资料或理解降级。',
    currentBehavior: '当前有部分 accessibilityLabel 和错误 Text，但没有四术边界失败文案矩阵、读屏顺序和减少动态效果的专用门禁。',
    expectedPolicy: '将错误文案、恢复动作、读屏顺序、对比度和触控目标纳入 P5-C，审计后再承诺无障碍体验。',
    status: 'gap',
    validationClass: 'regression-only',
    evidenceRefs: ['docs/ROADMAP.md#P5-C', 'src/screens/module-workspace.tsx#accessibility', 'src/screens/records-screen.tsx#accessibility'],
    targetBatch: 'P5-C',
    ownerDecisionRequired: false,
    notes: '这是 UX/a11y 路由，不在本批修改 UI。',
  },
] as const;

validateBoundaryInputAuditRegistry(P5_BOUNDARY_INPUT_AUDIT_CASES);
