/**
 * P5-B2 is a source-decision contract, not an imported city dataset.
 *
 * The snapshot records what can be proved from first-party pages and the
 * candidate repositories at audit time.  A repository's software license is
 * intentionally kept separate from the license of data copied from an
 * upstream authority.  The production resolver must not consume this file
 * as city data; it is an auditable release gate only.
 */

export const CITY_SOURCE_DECISION_CONTRACT_VERSION = 'p5-b2-city-source-decision.v1' as const;
export const P5_B2_CITY_SOURCE_DECISION_CONTRACT_VERSION = CITY_SOURCE_DECISION_CONTRACT_VERSION;
export const CITY_SOURCE_DECISION_RELEASE_BLOCKED = 'BLOCKED' as const;

export type CitySourceDecision = 'ALLOW' | 'CANDIDATE' | 'UNKNOWN' | 'BLOCKED';
export type CitySourceDimensionStatus = 'strong' | 'partial' | 'weak' | 'unknown' | 'blocked';
export type CitySourceEvidenceKind = 'official-page' | 'official-api' | 'legal-text' | 'raw-file' | 'repository-metadata';
export type CitySourceEvidenceTransport = 'https' | 'http-legacy';
export type CitySourceRedistributionFit = 'allowed' | 'conditional' | 'not-proven' | 'blocked';
export type CitySourceShareAlikeRisk = 'none' | 'conditional' | 'high' | 'unknown';

export interface CitySourceEvidence {
  kind: CitySourceEvidenceKind;
  url: string;
  transport: CitySourceEvidenceTransport;
  title: string;
  sourceVersion: string;
  contentHash: string;
  retrievedAt: string;
  fact: string;
}

export interface CitySourceDimensionAssessment {
  status: CitySourceDimensionStatus;
  fact: string;
  evidence: readonly string[];
}

export interface CitySourceLicenseAssessment {
  declaredLicense: string | null;
  licenseUrl: string | null;
  explicitForDataFiles: boolean;
  commercialOfflineRedistribution: CitySourceRedistributionFit;
  attributionRequired: boolean;
  attribution: string | null;
  shareAlikeRisk: CitySourceShareAlikeRisk;
  upstreamRightsProven: boolean;
  notes: string;
}

export interface CitySourceDecisionRecord {
  sourceId: string;
  name: string;
  role: 'primary-authority' | 'standard-reference' | 'licensed-enrichment' | 'candidate-import' | 'map-only' | 'rejected-candidate';
  decision: CitySourceDecision;
  upstreamSource: string;
  upstreamSourceUrl: string | null;
  versionSummary: string;
  coverage: string;
  dimensions: {
    authority: CitySourceDimensionAssessment;
    completeness: CitySourceDimensionAssessment;
    freshness: CitySourceDimensionAssessment;
    stableCodes: CitySourceDimensionAssessment;
    coordinates: CitySourceDimensionAssessment;
    aliases: CitySourceDimensionAssessment;
    history: CitySourceDimensionAssessment;
    licenseClarity: CitySourceDimensionAssessment;
    redistributionFit: CitySourceDimensionAssessment;
    operationalCost: CitySourceDimensionAssessment;
  };
  license: CitySourceLicenseAssessment;
  evidence: readonly CitySourceEvidence[];
  blockers: readonly string[];
  notes: string;
}

export interface CitySourceCombinationPlan {
  officialPageManualVerification: {
    sourceId: string;
    allowedUse: string;
    forbiddenUse: string;
    requiredAction: string;
  };
  licensedDataBundle: {
    sourceIds: readonly string[];
    allowedOnlyWhen: readonly string[];
    requiredRowEvidence: readonly string[];
  };
  appIdentity: {
    locationId: string;
    adminCode: string;
    historicalChanges: string;
    aliasConflicts: string;
  };
}

export interface CityDatabaseLicenseRisk {
  overall: 'high' | 'material' | 'unknown' | 'manageable';
  risks: readonly {
    sourceId: string;
    risk: string;
    consequence: string;
    mitigation: string;
  }[];
}

export interface CitySourceDecisionSnapshot {
  contractVersion: typeof CITY_SOURCE_DECISION_CONTRACT_VERSION;
  decisionSnapshotId: string;
  auditedAt: string;
  target: {
    region: '中国大陆';
    unit: '地级行政区';
    requiredFields: readonly string[];
    releaseIntent: string;
  };
  sources: readonly CitySourceDecisionRecord[];
  combinationPlan: CitySourceCombinationPlan;
  databaseLicensePropagationRisk: CityDatabaseLicenseRisk;
  releaseDecision: typeof CITY_SOURCE_DECISION_RELEASE_BLOCKED;
  blockers: readonly string[];
  nextMinimumBatch: {
    name: string;
    allowedWithoutUpstreamPermission: boolean;
    deliverables: readonly string[];
    gate: string;
  };
}

type UnknownRecord = Record<string, unknown>;

const DIMENSION_KEYS = [
  'authority',
  'completeness',
  'freshness',
  'stableCodes',
  'coordinates',
  'aliases',
  'history',
  'licenseClarity',
  'redistributionFit',
  'operationalCost',
] as const;

const DECISIONS: readonly CitySourceDecision[] = ['ALLOW', 'CANDIDATE', 'UNKNOWN', 'BLOCKED'];
const DIMENSION_STATUSES: readonly CitySourceDimensionStatus[] = ['strong', 'partial', 'weak', 'unknown', 'blocked'];
const EVIDENCE_KINDS: readonly CitySourceEvidenceKind[] = ['official-page', 'official-api', 'legal-text', 'raw-file', 'repository-metadata'];
const REDISTRIBUTION_FITS: readonly CitySourceRedistributionFit[] = ['allowed', 'conditional', 'not-proven', 'blocked'];
const SHARE_ALIKE_RISKS: readonly CitySourceShareAlikeRisk[] = ['none', 'conditional', 'high', 'unknown'];
const ROLES = ['primary-authority', 'standard-reference', 'licensed-enrichment', 'candidate-import', 'map-only', 'rejected-candidate'] as const;

function isRecord(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isIsoDateTime(value: string): boolean {
  return /T/.test(value) && !Number.isNaN(Date.parse(value));
}

function isHttpsOrLegacyHttp(value: string, transport: unknown): boolean {
  if (/^https:\/\//.test(value)) return transport === 'https';
  return /^http:\/\//.test(value) && transport === 'http-legacy';
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

function validateStringArray(value: unknown, path: string, errors: string[], allowEmpty = false): void {
  if (!Array.isArray(value) || value.some((item) => !isNonEmptyString(item)) || (!allowEmpty && value.length === 0)) {
    errors.push(`${path} must be an array of ${allowEmpty ? '' : 'one or more '}non-empty strings`);
  }
}

function validateEvidence(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const key of ['kind', 'url', 'transport', 'title', 'sourceVersion', 'contentHash', 'retrievedAt', 'fact']) {
    if (!hasOwn(value, key)) errors.push(`${path}.${key} is required`);
  }
  if (!EVIDENCE_KINDS.includes(value.kind as CitySourceEvidenceKind)) errors.push(`${path}.kind is invalid`);
  if (!isNonEmptyString(value.url)) errors.push(`${path}.url must be a non-empty string`);
  if (isNonEmptyString(value.url) && !isHttpsOrLegacyHttp(value.url, value.transport)) {
    errors.push(`${path}.url/transport must be https or explicitly marked http-legacy`);
  }
  if (!['https', 'http-legacy'].includes(String(value.transport))) errors.push(`${path}.transport is invalid`);
  if (!isNonEmptyString(value.title)) errors.push(`${path}.title must be a non-empty string`);
  if (!isNonEmptyString(value.sourceVersion)) errors.push(`${path}.sourceVersion must be a non-empty string`);
  if (!isNonEmptyString(value.contentHash) || !/^sha256:[0-9a-f]{64}$/.test(String(value.contentHash))) {
    errors.push(`${path}.contentHash must be sha256:<64 lowercase hex characters>`);
  }
  if (!isNonEmptyString(value.retrievedAt) || !isIsoDateTime(String(value.retrievedAt))) errors.push(`${path}.retrievedAt must be an ISO date-time`);
  if (!isNonEmptyString(value.fact)) errors.push(`${path}.fact must be a non-empty string`);
}

function validateDimension(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const key of ['status', 'fact', 'evidence']) if (!hasOwn(value, key)) errors.push(`${path}.${key} is required`);
  if (!DIMENSION_STATUSES.includes(value.status as CitySourceDimensionStatus)) errors.push(`${path}.status is invalid`);
  if (!isNonEmptyString(value.fact)) errors.push(`${path}.fact must be a non-empty string`);
  validateStringArray(value.evidence, `${path}.evidence`, errors);
}

function validateLicense(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const key of ['declaredLicense', 'licenseUrl', 'explicitForDataFiles', 'commercialOfflineRedistribution', 'attributionRequired', 'attribution', 'shareAlikeRisk', 'upstreamRightsProven', 'notes']) {
    if (!hasOwn(value, key)) errors.push(`${path}.${key} is required`);
  }
  if (!isNullableString(value.declaredLicense)) errors.push(`${path}.declaredLicense must be a string or null`);
  if (!isNullableString(value.licenseUrl)) errors.push(`${path}.licenseUrl must be a string or null`);
  if (typeof value.licenseUrl === 'string' && !/^https:\/\//.test(value.licenseUrl)) errors.push(`${path}.licenseUrl must use https`);
  if (typeof value.explicitForDataFiles !== 'boolean') errors.push(`${path}.explicitForDataFiles must be boolean`);
  if (!REDISTRIBUTION_FITS.includes(value.commercialOfflineRedistribution as CitySourceRedistributionFit)) errors.push(`${path}.commercialOfflineRedistribution is invalid`);
  if (typeof value.attributionRequired !== 'boolean') errors.push(`${path}.attributionRequired must be boolean`);
  if (!isNullableString(value.attribution)) errors.push(`${path}.attribution must be a string or null`);
  if (!SHARE_ALIKE_RISKS.includes(value.shareAlikeRisk as CitySourceShareAlikeRisk)) errors.push(`${path}.shareAlikeRisk is invalid`);
  if (typeof value.upstreamRightsProven !== 'boolean') errors.push(`${path}.upstreamRightsProven must be boolean`);
  if (!isNonEmptyString(value.notes)) errors.push(`${path}.notes must be a non-empty string`);
}

function validateSource(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const key of ['sourceId', 'name', 'role', 'decision', 'upstreamSource', 'upstreamSourceUrl', 'versionSummary', 'coverage', 'dimensions', 'license', 'evidence', 'blockers', 'notes']) {
    if (!hasOwn(value, key)) errors.push(`${path}.${key} is required`);
  }
  if (!isNonEmptyString(value.sourceId)) errors.push(`${path}.sourceId must be a non-empty string`);
  if (!isNonEmptyString(value.name)) errors.push(`${path}.name must be a non-empty string`);
  if (!ROLES.includes(value.role as typeof ROLES[number])) errors.push(`${path}.role is invalid`);
  if (!DECISIONS.includes(value.decision as CitySourceDecision)) errors.push(`${path}.decision is invalid`);
  if (!isNonEmptyString(value.upstreamSource)) errors.push(`${path}.upstreamSource must be a non-empty string`);
  if (!isNullableString(value.upstreamSourceUrl)) errors.push(`${path}.upstreamSourceUrl must be a string or null`);
  if (typeof value.upstreamSourceUrl === 'string' && !/^https:\/\//.test(value.upstreamSourceUrl)) errors.push(`${path}.upstreamSourceUrl must use https`);
  if (!isNonEmptyString(value.versionSummary)) errors.push(`${path}.versionSummary must be a non-empty string`);
  if (!isNonEmptyString(value.coverage)) errors.push(`${path}.coverage must be a non-empty string`);
  if (!isRecord(value.dimensions)) {
    errors.push(`${path}.dimensions must be an object`);
  } else {
    for (const key of DIMENSION_KEYS) validateDimension(value.dimensions[key], `${path}.dimensions.${key}`, errors);
  }
  validateLicense(value.license, `${path}.license`, errors);
  if (!Array.isArray(value.evidence) || value.evidence.length === 0) errors.push(`${path}.evidence must be a non-empty array`);
  else value.evidence.forEach((item, index) => validateEvidence(item, `${path}.evidence[${index}]`, errors));
  validateStringArray(value.blockers, `${path}.blockers`, errors, true);
  if (!isNonEmptyString(value.notes)) errors.push(`${path}.notes must be a non-empty string`);
  const license = isRecord(value.license) ? value.license : null;
  if (value.decision === 'ALLOW' && (license?.explicitForDataFiles !== true || license?.commercialOfflineRedistribution !== 'allowed' || license?.upstreamRightsProven !== true)) {
    errors.push(`${path}.decision ALLOW requires explicit data-file license, allowed commercial offline redistribution and proven upstream rights`);
  }
  if (value.decision === 'BLOCKED' && Array.isArray(value.blockers) && value.blockers.length === 0) errors.push(`${path}.blockers must explain a BLOCKED decision`);
}

function validateCombinationPlan(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!isRecord(value.officialPageManualVerification)) errors.push(`${path}.officialPageManualVerification must be an object`);
  else {
    for (const key of ['sourceId', 'allowedUse', 'forbiddenUse', 'requiredAction']) if (!isNonEmptyString(value.officialPageManualVerification[key])) errors.push(`${path}.officialPageManualVerification.${key} must be a non-empty string`);
  }
  if (!isRecord(value.licensedDataBundle)) errors.push(`${path}.licensedDataBundle must be an object`);
  else {
    validateStringArray(value.licensedDataBundle.sourceIds, `${path}.licensedDataBundle.sourceIds`, errors, true);
    validateStringArray(value.licensedDataBundle.allowedOnlyWhen, `${path}.licensedDataBundle.allowedOnlyWhen`, errors);
    validateStringArray(value.licensedDataBundle.requiredRowEvidence, `${path}.licensedDataBundle.requiredRowEvidence`, errors);
  }
  if (!isRecord(value.appIdentity)) errors.push(`${path}.appIdentity must be an object`);
  else {
    for (const key of ['locationId', 'adminCode', 'historicalChanges', 'aliasConflicts']) if (!isNonEmptyString(value.appIdentity[key])) errors.push(`${path}.appIdentity.${key} must be a non-empty string`);
  }
}

function validateDatabaseRisk(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!['high', 'material', 'unknown', 'manageable'].includes(String(value.overall))) errors.push(`${path}.overall is invalid`);
  if (!Array.isArray(value.risks) || value.risks.length === 0) {
    errors.push(`${path}.risks must be a non-empty array`);
    return;
  }
  value.risks.forEach((risk, index) => {
    const riskPath = `${path}.risks[${index}]`;
    if (!isRecord(risk)) {
      errors.push(`${riskPath} must be an object`);
      return;
    }
    for (const key of ['sourceId', 'risk', 'consequence', 'mitigation']) if (!isNonEmptyString(risk[key])) errors.push(`${riskPath}.${key} must be a non-empty string`);
  });
}

export function getCitySourceDecisionValidationErrors(value: unknown, path = 'citySourceDecision'): readonly string[] {
  const errors: string[] = [];
  collectJsonErrors(value, path, errors, new WeakSet<object>());
  if (!isRecord(value)) return [...errors, `${path} must be an object`];
  for (const key of ['contractVersion', 'decisionSnapshotId', 'auditedAt', 'target', 'sources', 'combinationPlan', 'databaseLicensePropagationRisk', 'releaseDecision', 'blockers', 'nextMinimumBatch']) {
    if (!hasOwn(value, key)) errors.push(`${path}.${key} is required`);
  }
  if (value.contractVersion !== CITY_SOURCE_DECISION_CONTRACT_VERSION) errors.push(`${path}.contractVersion must be ${CITY_SOURCE_DECISION_CONTRACT_VERSION}`);
  if (!isNonEmptyString(value.decisionSnapshotId)) errors.push(`${path}.decisionSnapshotId must be a non-empty string`);
  if (!isNonEmptyString(value.auditedAt) || !isIsoDateTime(String(value.auditedAt))) errors.push(`${path}.auditedAt must be an ISO date-time`);
  if (!isRecord(value.target)) errors.push(`${path}.target must be an object`);
  else {
    if (value.target.region !== '中国大陆') errors.push(`${path}.target.region must be 中国大陆`);
    if (value.target.unit !== '地级行政区') errors.push(`${path}.target.unit must be 地级行政区`);
    validateStringArray(value.target.requiredFields, `${path}.target.requiredFields`, errors);
    if (!isNonEmptyString(value.target.releaseIntent)) errors.push(`${path}.target.releaseIntent must be a non-empty string`);
  }
  if (!Array.isArray(value.sources) || value.sources.length === 0) errors.push(`${path}.sources must be a non-empty array`);
  else {
    const ids = new Set<string>();
    value.sources.forEach((source, index) => {
      const sourcePath = `${path}.sources[${index}]`;
      validateSource(source, sourcePath, errors);
      if (isRecord(source) && typeof source.sourceId === 'string') {
        if (ids.has(source.sourceId)) errors.push(`${sourcePath}.sourceId duplicates ${source.sourceId}`);
        ids.add(source.sourceId);
      }
    });
  }
  validateCombinationPlan(value.combinationPlan, `${path}.combinationPlan`, errors);
  validateDatabaseRisk(value.databaseLicensePropagationRisk, `${path}.databaseLicensePropagationRisk`, errors);
  if (value.releaseDecision !== CITY_SOURCE_DECISION_RELEASE_BLOCKED) errors.push(`${path}.releaseDecision must be BLOCKED until commercial offline rights are proven`);
  validateStringArray(value.blockers, `${path}.blockers`, errors);
  if (Array.isArray(value.blockers) && value.blockers.length === 0) errors.push(`${path}.blockers must explain the fail-closed decision`);
  if (!isRecord(value.nextMinimumBatch)) errors.push(`${path}.nextMinimumBatch must be an object`);
  else {
    for (const key of ['name', 'gate']) if (!isNonEmptyString(value.nextMinimumBatch[key])) errors.push(`${path}.nextMinimumBatch.${key} must be a non-empty string`);
    if (typeof value.nextMinimumBatch.allowedWithoutUpstreamPermission !== 'boolean') errors.push(`${path}.nextMinimumBatch.allowedWithoutUpstreamPermission must be boolean`);
    validateStringArray(value.nextMinimumBatch.deliverables, `${path}.nextMinimumBatch.deliverables`, errors);
  }
  return errors;
}

export function validateCitySourceDecisionSnapshot(value: unknown): CitySourceDecisionSnapshot {
  const errors = getCitySourceDecisionValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-B2 city source-decision snapshot:\n${errors.join('\n')}`);
  return value as CitySourceDecisionSnapshot;
}

export const validateCitySourceDecision = validateCitySourceDecisionSnapshot;

export function isCitySourceDecisionSnapshot(value: unknown): value is CitySourceDecisionSnapshot {
  return getCitySourceDecisionValidationErrors(value).length === 0;
}

const AUDITED_AT = '2026-09-02T21:36:30.1129972+08:00';

function evidence(
  kind: CitySourceEvidenceKind,
  url: string,
  transport: CitySourceEvidenceTransport,
  title: string,
  sourceVersion: string,
  contentHash: string,
  fact: string,
): CitySourceEvidence {
  return { kind, url, transport, title, sourceVersion, contentHash: `sha256:${contentHash}`, retrievedAt: AUDITED_AT, fact };
}

function dimension(status: CitySourceDimensionStatus, fact: string, evidenceIds: readonly string[]): CitySourceDimensionAssessment {
  return { status, fact, evidence: evidenceIds };
}

const MCA_VERSION_URL = 'https://dmfw.mca.gov.cn/XzqhVersionPublish.html';
const MCA_API_URL = 'https://dmfw.mca.gov.cn/xzqh/getList?code=0&trimCode=true&maxLevel=3';
const MCA_HISTORY_URL = 'http://xzqh.mca.gov.cn/description?dcpid=1';
const MCA_HISTORY_2026_URL = 'http://xzqh.mca.gov.cn/description?dcpid=2026';
const MCA_HISTORY_2025_URL = 'http://xzqh.mca.gov.cn/description?dcpid=2025';
const MCA_HISTORY_2024_URL = 'http://xzqh.mca.gov.cn/description?dcpid=2024';
const MCA_HISTORY_2021_URL = 'http://xzqh.mca.gov.cn/description?dcpid=2021';

const mcaSource: CitySourceDecisionRecord = {
  sourceId: 'mca-dmfw-admin-and-history',
  name: '民政部中国·国家地名信息库行政区划版本与变更公告',
  role: 'primary-authority',
  decision: 'UNKNOWN',
  upstreamSource: '民政部及其中国·国家地名信息库；行政区划代码管理办法（民政部令第79号）',
  upstreamSourceUrl: 'https://www.moj.gov.cn/pub/sfbgw/flfggz/flfggzbmgz/202512/t20251204_528920.html',
  versionSummary: '当前页面标注数据截止 2025-12-31（tableName Xzqh20251231）；API 返回省/地/县/乡四级，抓取观测 34 省级、333 地级、2847 县级。',
  coverage: '权威行政区划名称/代码与年度变更记录；不提供可直接打包的逐行坐标、别名集或历史实体表。',
  dimensions: {
    authority: dimension('strong', '民政部页面明确说明省、地、县、乡四级代码及国务院/民政部门确定职责。', ['mca-version', 'mca-code-rules']),
    completeness: dimension('partial', 'API 覆盖四级当前树，但页面提示行政区划/地名信息可能不完整或不准确；地级目标仍需逐行核验。', ['mca-api', 'mca-platform-notice']),
    freshness: dimension('strong', '版本页数据截止 2025-12-31，平台 HTML 最近修改 2026-02-28；仍需按年度公告增量复核。', ['mca-version', 'mca-history']),
    stableCodes: dimension('strong', '规章规定代码唯一、撤销后不复用；地级代码为六位形态，变更归属时旧码废止并赋新码。', ['mca-code-rules']),
    coordinates: dimension('blocked', '官方版本/API证据未提供本合同所需逐行经纬度。', ['mca-api']),
    aliases: dimension('unknown', '标准名称可核验，但常用简称/历史别名的逐行授权与冲突规则未形成数据文件。', ['mca-version', 'mca-history']),
    history: dimension('strong', '年度变更页面列出 2021–2026 的县级以上行政区划变更，可作人工核验来源。', ['mca-history', 'mca-history-2026', 'mca-history-2025', 'mca-history-2024', 'mca-history-2021']),
    licenseClarity: dimension('unknown', '页面、API 和规章证明权威性，不构成针对页面/API复制、离线打包或商业再分发的数据许可。', ['mca-version', 'mca-platform-notice', 'mca-code-rules']),
    redistributionFit: dimension('unknown', '可人工访问核验；没有发现允许商业离线复制的明确条款或书面授权。', ['mca-version', 'mca-platform-notice']),
    operationalCost: dimension('partial', '页面/API 可访问，但历史页仍为 HTTP；需要年度快照、公告比对、证据哈希和人工复核。', ['mca-version', 'mca-history']),
  },
  license: {
    declaredLicense: null,
    licenseUrl: null,
    explicitForDataFiles: false,
    commercialOfflineRedistribution: 'not-proven',
    attributionRequired: true,
    attribution: '民政部/中国·国家地名信息库；当前仅人工核验，未获离线复制授权。',
    shareAlikeRisk: 'unknown',
    upstreamRightsProven: false,
    notes: '权威来源不等于公开数据许可；在取得书面商业离线再分发授权或法务确认前，不复制其数据文件。',
  },
  evidence: [
    evidence('official-page', MCA_VERSION_URL, 'https', '行政区划版本发布页', 'Xzqh20251231; Last-Modified 2026-02-28', '4b5198d67feed8fce221ecfdacd551793a629d3f0bb3e12ffed57de9539530fe', '页面声明数据截止 2025-12-31，包含全国省、地、县、乡四级行政区划代码。'),
    evidence('official-api', MCA_API_URL, 'https', '行政区划树 API 观测', 'response 2026-09-02; maxLevel=3', '9908f56c5ae53136caade2d0aae79742f0872146b46be4b9c0d06c460706cf94', '只读 GET 观测返回四级树；本合同不把响应写入生产数据。'),
    evidence('official-page', 'https://dmfw.mca.gov.cn/us.html', 'https', '平台使用与免责声明', 'Last-Modified 2022-11-22', '12b19b07255a6ed9328710001bd4e56c0c0dce4e7f9ababf3acdb3d362df00d1', '平台提供查询、下载和 API，并提示信息可能不完整/不准确；未见商业离线授权。'),
    evidence('legal-text', 'https://www.moj.gov.cn/pub/sfbgw/flfggz/flfggzbmgz/202512/t20251204_528920.html', 'https', '行政区划代码管理办法', '民政部令第79号; 发布时间 2025-06-30; 生效 2025-09-01', '94362a41ff048b2998af8887e9c4d3bb98ddd24f58061a8773d4721bf24c6984', '规章规定代码唯一、撤销不复用、年度发布和变更赋码规则；不是数据再分发许可。'),
    evidence('official-page', MCA_HISTORY_URL, 'http-legacy', '县级以上行政区划变更情况入口', 'annual index observed 2026-09-02', 'c09a08d03a099a9e123f21ea30dfb84477141119e6a8b1af2b40a1cafbb96060', '年度变更入口及 1999–2026 年份链接；遗留 HTTP，需在打包前人工确认可用性。'),
    evidence('official-page', MCA_HISTORY_2026_URL, 'http-legacy', '2026 年行政区划变更', '2026 annual page', '25c2e9b99014ea52fdd23484d9ec9a4ae5cb023756f6e90f9c6a07e0c8bab855', '记录 2026 年公告的县级以上变更，作为历史人工核验。'),
    evidence('official-page', MCA_HISTORY_2025_URL, 'http-legacy', '2025 年行政区划变更', '2025 annual page', '85225657e2ac608a3b31740674e93c72e865af6eac066a57e10bf4e73663d7b8', '记录 2025 年公告的县级以上变更，作为历史人工核验。'),
    evidence('official-page', MCA_HISTORY_2024_URL, 'http-legacy', '2024 年行政区划变更', '2024 annual page', 'de86403cbdcecab96a8b3813e35bfe27cdb8ecd14fc4a76cf23dca532bf4c442', '记录 2024 年公告的县级以上变更，作为历史人工核验。'),
    evidence('official-page', MCA_HISTORY_2021_URL, 'http-legacy', '2021 年行政区划变更', '2021 annual page', '9a4d5065773c28983c2eb257c02ea20b38b7c6a6337ef746bc54c6b1c7acc5e7', '记录 2021 年公告的县级以上变更，作为历史人工核验。'),
  ],
  blockers: ['offline-redistribution-license-not-proven', 'row-coordinate-data-not-published-in-a-licensed-file', 'history-page-is-http-legacy'],
  notes: 'ALLOW 需要民政部/权利人书面确认页面/API及导出的名称、代码和历史信息可商业离线复制；当前只允许人工核验。',
};

const gbtSource: CitySourceDecisionRecord = {
  sourceId: 'gbt-2260-admin-code-standard',
  name: 'GB/T 2260-2007 中华人民共和国行政区划代码',
  role: 'standard-reference',
  decision: 'UNKNOWN',
  upstreamSource: '国家市场监督管理总局国家标准信息公共服务平台',
  upstreamSourceUrl: 'https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=C9C488FD717AFDCD52157F41C3302C6D',
  versionSummary: 'GB/T 2260-2007；发布 2007-11-14，实施 2008-02-01，页面标注附第 1 号修改单。',
  coverage: '行政区划代码标准形态与标准文本；不是 2025/2026 当前全国城市数据快照，不含坐标、别名和历史变更表。',
  dimensions: {
    authority: dimension('strong', '国家标准平台列出标准号、主管部门/归口和状态。', ['gbt-page']),
    completeness: dimension('weak', '标准文本不是当前全国地级行政区记录集合。', ['gbt-page']),
    freshness: dimension('weak', '标准为 2007 版本，当前代码应以民政部年度发布为准。', ['gbt-page', 'mca-version']),
    stableCodes: dimension('strong', '可作为六位代码形态/校验参考，不能替代当前行政代码发布。', ['gbt-page', 'mca-code-rules']),
    coordinates: dimension('blocked', '不含坐标。', ['gbt-page']),
    aliases: dimension('blocked', '不含别名。', ['gbt-page']),
    history: dimension('blocked', '不含行政区划历史变更表。', ['gbt-page']),
    licenseClarity: dimension('unknown', '平台提供标准信息/预览，页面含版权声明；未证明标准表格可按本产品离线复制。', ['gbt-page']),
    redistributionFit: dimension('unknown', '只能作为内部代码规则参考，商业打包标准文本/表格需单独核验。', ['gbt-page']),
    operationalCost: dimension('partial', '低成本用于形态校验；维护需跟随现行民政部代码规则。', ['gbt-page', 'mca-version']),
  },
  license: {
    declaredLicense: null,
    licenseUrl: null,
    explicitForDataFiles: false,
    commercialOfflineRedistribution: 'not-proven',
    attributionRequired: true,
    attribution: '国家标准信息公共服务平台与 GB/T 2260-2007 标准号；仅作参考，具体再分发待核验。',
    shareAlikeRisk: 'unknown',
    upstreamRightsProven: false,
    notes: '标准机构身份和可查阅性不等于可复制、打包和商业再分发许可。',
  },
  evidence: [
    evidence('official-page', 'https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=C9C488FD717AFDCD52157F41C3302C6D', 'https', 'GB/T 2260-2007 标准信息页', 'GB/T 2260-2007; 2008-02-01 effective', 'e2725d6c78bd705ad864ed10fcc3e5415d48b71ffa3c473503a2b9002fab5068', '官方标准页记录标准号、发布日期、实施日期和修改单信息；不作为当前数据文件许可证明。'),
    evidence('legal-text', 'https://xzfg.moj.gov.cn/law/download?LawID=439&type=pdf', 'https', '行政区划管理条例', 'official PDF observed 2026-09-02', 'b308f609ff71597834434b585cb79721833cb5f36d42a2cc045ea65a680d360a', '官方法规说明行政区划变更、代码确定/公布和档案要求；不授予 GB/T 数据复制权。'),
  ],
  blockers: ['not-current-city-data', 'standard-text-and-table-redistribution-not-proven'],
  notes: '保留为内部代码格式和规范引用，不把 GB/T 文字或表格直接作为生产数据包。',
};

const geonamesSource: CitySourceDecisionRecord = {
  sourceId: 'geonames-cc-by-enrichment',
  name: 'GeoNames 全球地名数据库',
  role: 'licensed-enrichment',
  decision: 'CANDIDATE',
  upstreamSource: 'GeoNames contributors and aggregated sources',
  upstreamSourceUrl: 'https://www.geonames.org/export/index.html',
  versionSummary: '每日 country/allCountries 导出；CC BY 4.0；Readme 记录 WGS84 坐标、alternateNames 与 from/to 历史字段。',
  coverage: '全球地名/特征；可提供中国名称、坐标、别名与部分历史，但不是民政部权威地级行政区代码源。',
  dimensions: {
    authority: dimension('weak', '来源聚合且官方导出页不承诺中国行政代码权威性。', ['geonames-export', 'geonames-readme']),
    completeness: dimension('partial', '覆盖全球大量地名并有 cities/admin 文件，但中国地级目标需逐行与民政部比对。', ['geonames-export', 'geonames-readme']),
    freshness: dimension('strong', '官方导出页说明 daily extract；准确性/及时性/完整性不作保证。', ['geonames-export', 'geonames-readme']),
    stableCodes: dimension('weak', 'GeoNames geonameId 是其自身特征 ID，不是中国六位行政代码；需与 adminCode 分离。', ['geonames-readme']),
    coordinates: dimension('strong', 'Readme 明确 latitude/longitude 为 WGS84；仍须标注地理中心近似而非出生点。', ['geonames-readme']),
    aliases: dimension('strong', 'alternateNamesV2 含语言、首选/简称/俗称/历史标记及 from/to 字段。', ['geonames-readme']),
    history: dimension('partial', 'alternateNames 有日期字段且 daily modifications/deletes 可追踪，但不等于民政部行政沿革。', ['geonames-readme']),
    licenseClarity: dimension('strong', 'GeoNames About/Export/Readme 明确 CC BY 4.0、归因和商业使用；仍需核查聚合第三方权利。', ['geonames-about', 'geonames-export', 'geonames-readme', 'cc-by']),
    redistributionFit: dimension('partial', '允许商业离线复制并要求归因，但 as-is、第三方来源、逐行官方身份和商标/人格权仍需审计。', ['geonames-export', 'cc-by']),
    operationalCost: dimension('partial', '下载成本低；需固定版本/哈希、许可文本、逐行映射及每日更新策略。', ['geonames-export', 'geonames-readme']),
  },
  license: {
    declaredLicense: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    explicitForDataFiles: true,
    commercialOfflineRedistribution: 'conditional',
    attributionRequired: true,
    attribution: 'GeoNames; include source link, CC BY 4.0 link and a notice describing modifications.',
    shareAlikeRisk: 'none',
    upstreamRightsProven: false,
    notes: 'GeoNames 明确允许商业使用/再分发并要求归因；CC BY 不含 ShareAlike，但聚合第三方来源及其他人格/隐私/商标权不由 CC BY 自动覆盖。',
  },
  evidence: [
    evidence('official-page', 'https://www.geonames.org/about.html', 'https', 'GeoNames About', 'observed 2026-09-02; CC BY 4.0; Last-Modified 2024-09-06', '5f2d1ce44aed6a4b7490e5381026ffe4228a2a19bdf4c08d2bb82ee4648bdc6f', 'About 页声明数据库可在 Creative Commons Attribution 下免费下载，含地名和 alternate names。'),
    evidence('official-page', 'https://www.geonames.org/export/index.html', 'https', 'GeoNames Export', 'daily extracts; CC BY; commercial usage allowed', 'cff50de7340403d235b00fcb28146606bc15c603314608f3f03b8135ca415380', '官方导出页说明免费、CC BY、商业使用允许、需给 credit，并声明 as-is/no warranty。'),
    evidence('raw-file', 'https://download.geonames.org/export/dump/readme.txt', 'https', 'GeoNames dump Readme', 'modified 2026-09-02', 'b1957379b6c1242c700c98ac9a8aa0a09f56c3c0a50ee72175527005f48ef2c5', 'Readme 定义 allCountries/cities、WGS84、alternateNames 语言/历史字段、daily modifications/deletes。'),
    evidence('legal-text', 'https://creativecommons.org/licenses/by/4.0/', 'https', 'Creative Commons Attribution 4.0 deed', 'CC BY 4.0', '231a5dac65bbf135ba27145969a63cd289faadc172f1512c4810a6c60ba91036', '许可证允许商业分享/改编，要求归因、链接许可证和说明修改；不自动覆盖第三方权利。'),
  ],
  blockers: ['not-authoritative-for-china-admin-code', 'row-level-third-party-rights-and-quality-review-required'],
  notes: '只作为明确 CC BY 的坐标/别名候选；不得用 geonameId 替代中国 adminCode。要进入 pilot，需完成中国地级逐行对照、归因载荷和固定快照。',
};

const modoodSource: CitySourceDecisionRecord = {
  sourceId: 'modood-administrative-divisions-of-china',
  name: 'modood/Administrative-divisions-of-China',
  role: 'rejected-candidate',
  decision: 'BLOCKED',
  upstreamSource: '国家统计局统计用区划和城乡划分代码（README 自述）',
  upstreamSourceUrl: 'https://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/2023/',
  versionSummary: 'README 标注 2023 统计代码截止 2023-06-30/发布 2023-09-11；仓库 2025-12-27 更新提示数据不再更新；LICENSE 为 WTFPL。',
  coverage: '省/市/区县/乡镇/村五级名称代码与 SQLite；无坐标、别名集和行政历史字段。',
  dimensions: {
    authority: dimension('partial', '仓库自述来自 NBS 统计代码，但不是民政部当前行政区划发布。', ['modood-readme']),
    completeness: dimension('partial', '五级静态文件齐全但不保证当前地级行政实体完整。', ['modood-readme']),
    freshness: dimension('blocked', 'README 明确提醒不再更新，数据截止 2023。', ['modood-readme', 'modood-metadata']),
    stableCodes: dimension('partial', '包含统计代码，但不能视为当前民政部六位行政代码或沿革 ID。', ['modood-readme']),
    coordinates: dimension('blocked', '没有坐标字段。', ['modood-readme']),
    aliases: dimension('blocked', '没有逐行别名字段/证据。', ['modood-readme']),
    history: dimension('blocked', '没有历史变更映射。', ['modood-readme']),
    licenseClarity: dimension('weak', 'WTFPL 明确覆盖仓库软件/文件表达，但 README 的 NBS 数据上游许可未证明。', ['modood-license', 'modood-readme']),
    redistributionFit: dimension('blocked', '数据过时且上游数据权利不明；仓库 WTFPL 不能自动授予上游数据再分发权。', ['modood-license', 'modood-readme']),
    operationalCost: dimension('weak', '导入容易但后续必须自行补齐更新、坐标、别名、历史和授权审计。', ['modood-readme']),
  },
  license: {
    declaredLicense: 'WTFPL v2 (repository license)',
    licenseUrl: 'https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/LICENSE',
    explicitForDataFiles: false,
    commercialOfflineRedistribution: 'blocked',
    attributionRequired: false,
    attribution: 'WTFPL repository notice only; no verified upstream NBS data attribution terms.',
    shareAlikeRisk: 'none',
    upstreamRightsProven: false,
    notes: '不能因为 GitHub 仓库 LICENSE 为 WTFPL 就推断 NBS 数据文件许可；当前不导入。',
  },
  evidence: [
    evidence('raw-file', 'https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/README.md', 'https', 'modood README', '2023 codes; latest commit c49d495 (2025-12-27)', '44814b160f3d5e1d3157fb3db15e78d5d9e75b2f75a7eadd6e7f9934c3097ac5', 'README 明确数据不再更新、来源 NBS、最新 2023 统计代码截止日期。'),
    evidence('raw-file', 'https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/LICENSE', 'https', 'modood repository license', 'WTFPL v2', 'ee820ff0db4ce628569e0975ac27dc926052a9f85d102b101edb104311ef4d90', 'LICENSE 允许仓库作品的复制/修改/分发，但不证明上游 NBS 数据权利。'),
  ],
  blockers: ['stale-2023-data', 'no-coordinate-alias-history-fields', 'upstream-data-license-not-proven'],
  notes: '拒绝作为生产离线数据源；最多保留为代码结构参考。',
};

const kk418Source: CitySourceDecisionRecord = {
  sourceId: 'kk418-cn-division',
  name: 'kk-418/cn-division',
  role: 'candidate-import',
  decision: 'UNKNOWN',
  upstreamSource: '民政部 dmfw REST（README 自述；仓库用 MIT 发布代码）',
  upstreamSourceUrl: 'https://dmfw.mca.gov.cn/xzqh/getList?code=0&trimCode=true&maxLevel=3',
  versionSummary: 'README 标注 2026 版/342 cities；release 2026.0.0，commit cc9c0c4（2026-04-26）；LICENSE MIT。',
  coverage: '省/地/县/乡代码树，排除台港澳；含少量东莞等补丁；无坐标、别名和历史变更数据。',
  dimensions: {
    authority: dimension('partial', 'README 指向民政部 REST，但仓库是二次抓取/构建，需逐行回源核验。', ['kk418-readme', 'kk418-metadata']),
    completeness: dimension('strong', 'README 宣称 342 地级城市和大陆范围；仍需与官方当前树逐项比对。', ['kk418-readme']),
    freshness: dimension('strong', '候选中较新，标记 2026.0.0；当前官方接口路径与 README 示例 /9095 路径出现 404 差异。', ['kk418-readme', 'kk418-metadata']),
    stableCodes: dimension('strong', '输出省 2 位、地 4 位、县 6 位等代码形态；仍须保留六位 adminCode 独立于 locationId。', ['kk418-readme']),
    coordinates: dimension('blocked', '没有坐标字段。', ['kk418-readme']),
    aliases: dimension('blocked', '没有别名/冲突别名字段。', ['kk418-readme']),
    history: dimension('blocked', '没有历史变更映射。', ['kk418-readme']),
    licenseClarity: dimension('weak', 'MIT 明确覆盖仓库代码，但未明确覆盖从民政部抓取的数据文件。', ['kk418-license', 'kk418-readme']),
    redistributionFit: dimension('unknown', '可作待核验转换工具；商业离线打包须有民政部/上游书面许可。', ['kk418-license', 'mca-version']),
    operationalCost: dimension('partial', '构建脚本和版本化输出可复用，但需修正接口路径、固定源响应哈希并补全坐标/别名/历史。', ['kk418-readme']),
  },
  license: {
    declaredLicense: 'MIT (repository license)',
    licenseUrl: 'https://raw.githubusercontent.com/kk-418/cn-division/main/LICENSE',
    explicitForDataFiles: false,
    commercialOfflineRedistribution: 'not-proven',
    attributionRequired: true,
    attribution: 'kk-418 repository MIT notice plus pending credit to the MCA upstream source.',
    shareAlikeRisk: 'none',
    upstreamRightsProven: false,
    notes: 'MIT 只证明仓库作者授予其作品的许可；不自动覆盖民政部 API 响应或其衍生数据。',
  },
  evidence: [
    evidence('raw-file', 'https://raw.githubusercontent.com/kk-418/cn-division/main/README.md', 'https', 'kk-418 cn-division README', '2026.0.0; latest commit cc9c0c4 (2026-04-26)', 'e5c8aca7916b961ed35d8ca02eaa20c88524b288f397a4b011ef740c88de71b1', 'README 说明 2026 版、MCA REST 来源、代码层级、范围及补丁。'),
    evidence('raw-file', 'https://raw.githubusercontent.com/kk-418/cn-division/main/LICENSE', 'https', 'kk-418 repository license', 'MIT', '1847e0e0698142ed4347c1441a9fa81c8fbddd44b1d8bbcd5e3647f991759d7f', 'MIT 授予软件复制/修改/分发/销售权；未授予上游数据权利。'),
    evidence('repository-metadata', 'https://api.github.com/repos/kk-418/cn-division/commits/main', 'https', 'kk-418 latest commit metadata', 'cc9c0c4cb2c84afd6e15bb9156dc569b2dfca84f; 2026-04-26', '8a7a9b83f99511d67fa3ea1a0232fbfae79249298b6b6a5abca679f2b0ff04bd', '仓库提交/版本元数据用于固定候选版本；不替代源数据许可。'),
  ],
  blockers: ['upstream-mca-data-license-not-proven', 'no-coordinate-alias-history-fields', 'source-api-path-differs-from-readme'],
  notes: '唯一可进入 pilot 评估的行政代码候选之一，但当前仍 UNKNOWN；未获书面许可前不导入生产。',
};

const adyliuSource: CitySourceDecisionRecord = {
  sourceId: 'adyliu-china-area',
  name: 'adyliu/china_area',
  role: 'rejected-candidate',
  decision: 'BLOCKED',
  upstreamSource: '国家统计局统计用区划和城乡划分代码（README 自述）',
  upstreamSourceUrl: 'https://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/2023/',
  versionSummary: 'README 提供 2010–2024 历史快照/MD5，2024 文件基于 2023-06-30 统计代码；最新 commit eea7df7（2023-12-23）；GPL-3.0。',
  coverage: '全国五级统计区划和多年 CSV/SQL 快照；无坐标、逐行别名或行政变更语义。',
  dimensions: {
    authority: dimension('partial', 'README 指向 NBS 统计代码，不是民政部当前行政区划权威源。', ['adyliu-readme']),
    completeness: dimension('strong', '历史五级快照覆盖面大并提供 MD5；当前地级完整性仍不能由 README 证明。', ['adyliu-readme']),
    freshness: dimension('blocked', '最新提交 2023-12-23，数据说明虽有 2024 文件但源代码截止 2023。', ['adyliu-readme', 'adyliu-metadata']),
    stableCodes: dimension('partial', '含统计区划代码，不能替代当前民政部六位行政代码。', ['adyliu-readme']),
    coordinates: dimension('blocked', '没有坐标字段。', ['adyliu-readme']),
    aliases: dimension('blocked', '没有逐行别名证据。', ['adyliu-readme']),
    history: dimension('partial', '多年快照可供比较，但没有经审计的行政沿革/身份映射。', ['adyliu-readme']),
    licenseClarity: dimension('weak', 'GPL-3.0 覆盖仓库作品；NBS 数据文件上游许可未证明。', ['adyliu-license', 'adyliu-readme']),
    redistributionFit: dimension('blocked', 'GPL 数据库传播/组合风险与上游权利不明叠加，不适合首发商业离线包。', ['adyliu-license', 'adyliu-readme']),
    operationalCost: dimension('weak', '历史文件易下载但长期维护、GPL 合规和逐行核验成本高。', ['adyliu-readme', 'adyliu-license']),
  },
  license: {
    declaredLicense: 'GPL-3.0 (repository license)',
    licenseUrl: 'https://raw.githubusercontent.com/adyliu/china_area/master/LICENSE',
    explicitForDataFiles: false,
    commercialOfflineRedistribution: 'blocked',
    attributionRequired: true,
    attribution: 'adyliu repository GPL-3.0 notice plus pending credit to the NBS upstream source.',
    shareAlikeRisk: 'high',
    upstreamRightsProven: false,
    notes: '数据库/程序组合的 GPL 传播影响需法务确认；更根本的是仓库 LICENSE 不能证明 NBS 数据授权。',
  },
  evidence: [
    evidence('raw-file', 'https://raw.githubusercontent.com/adyliu/china_area/master/README.md', 'https', 'adyliu china_area README', '2024 files; source cutoff 2023-06-30; latest commit eea7df7', 'a20d554c93e6aa6b96f6e5c55670c3ccf29196b9764f759adb4cf73656dc690e', 'README 说明五级历史快照、NBS 来源、数据日期和 MD5。'),
    evidence('raw-file', 'https://raw.githubusercontent.com/adyliu/china_area/master/LICENSE', 'https', 'adyliu repository license', 'GPL-3.0', '589ed823e9a84c56feb95ac58e7cf384626b9cbf4fda2a907bc36e103de1bad2', 'GPL-3.0 为仓库许可，不能推断上游统计数据许可。'),
    evidence('repository-metadata', 'https://api.github.com/repos/adyliu/china_area/commits/master', 'https', 'adyliu latest commit metadata', 'eea7df71f46367de0bb8031d76a00b778c704cd6; 2023-12-23', 'daf9d21c17c2ea14490b7e0a7457c0b38246b947990733cd104b8e8af521072b', '提交元数据固定候选版本；不替代上游数据许可。'),
  ],
  blockers: ['stale-source-and-no-current-mca-authority', 'gpl-database-propagation-risk', 'upstream-nbs-data-license-not-proven', 'no-coordinate-alias-fields'],
  notes: '拒绝作为首发商业离线数据；仅可在法律确认后用于历史对比工具。',
};

const osmSource: CitySourceDecisionRecord = {
  sourceId: 'openstreetmap-odbl-enrichment',
  name: 'OpenStreetMap / ODbL',
  role: 'licensed-enrichment',
  decision: 'BLOCKED',
  upstreamSource: 'OpenStreetMap contributors; OpenStreetMap Foundation',
  upstreamSourceUrl: 'https://www.openstreetmap.org/copyright',
  versionSummary: '当前 OSM 数据库按 ODbL 1.0 提供；地图/地名/边界可作坐标补充，但抽取和衍生数据库有 ShareAlike/通知要求。',
  coverage: '全球开放地图与地名；不提供民政部六位代码权威性和完整历史行政沿革。',
  dimensions: {
    authority: dimension('weak', 'OSM contributor 数据不是中国行政代码权威发布。', ['osm-copyright']),
    completeness: dimension('partial', '全球覆盖广，但中国地级要素、边界和名称质量需逐项审计。', ['osm-copyright', 'odbl']),
    freshness: dimension('strong', 'OSM 持续更新；离线包必须固定 snapshot/version/hash。', ['osm-copyright']),
    stableCodes: dimension('weak', 'OSM object IDs 不等同于中国 adminCode。', ['osm-copyright', 'odbl']),
    coordinates: dimension('strong', '地图要素可提供坐标/几何，但本合同未导入并需标注用途/精度。', ['osm-copyright']),
    aliases: dimension('partial', '名称标签丰富但标签语义/来源不统一。', ['osm-copyright']),
    history: dimension('partial', '编辑历史可追踪但不是法定行政区划沿革。', ['osm-copyright']),
    licenseClarity: dimension('strong', 'OSM 官方版权页和 ODbL 法律文本明确数据库权利、归因和 ShareAlike。', ['osm-copyright', 'odbl']),
    redistributionFit: dimension('blocked', '商业使用可行但抽取/衍生数据库触发 ODbL、归因和公开相同许可义务；与官方数据组合边界未设计。', ['osm-copyright', 'odbl']),
    operationalCost: dimension('weak', '需固定 planet/extract、完整 notices、ODbL 兼容发布和复杂数据血缘审计。', ['osm-copyright', 'odbl']),
  },
  license: {
    declaredLicense: 'Open Data Commons Open Database License (ODbL) 1.0',
    licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
    explicitForDataFiles: true,
    commercialOfflineRedistribution: 'conditional',
    attributionRequired: true,
    attribution: '© OpenStreetMap contributors; https://www.openstreetmap.org/copyright',
    shareAlikeRisk: 'high',
    upstreamRightsProven: false,
    notes: 'ODbL 允许商业利用但对衍生数据库/实质抽取有同许可和通知要求；OSM 贡献者/第三方来源权利仍需审计。',
  },
  evidence: [
    evidence('official-page', 'https://www.openstreetmap.org/copyright', 'https', 'OpenStreetMap copyright', 'ODbL 1.0; observed 2026-09-02', '3bf7e8ddeb9212b3c999cfa81029e11b235e84c3b43022babaf41c7a35a0b5c2', '官方版权页说明 OSM 数据库采用 ODbL，复制/分发/改编需归因，衍生数据库有同许可要求。'),
    evidence('legal-text', 'https://opendatacommons.org/licenses/odbl/1-0/', 'https', 'ODbL 1.0 legal code', 'ODbL 1.0', '058a4f42571027bab20c80fcbfa0530efe7ccc142a4bbd081bfdabf55e0e2beb', '法律文本定义数据库权利、商业使用、抽取/再利用、通知和 ShareAlike。'),
  ],
  blockers: ['odbl-sharealike-and-notice-design-not-approved', 'not-authoritative-for-mca-admin-code', 'third-party-contributor-rights-require-audit'],
  notes: '不作为首发中国行政城市 bundle；如未来单独提供地图层，须走 ODbL 专项合规设计。',
};

const naturalEarthSource: CitySourceDecisionRecord = {
  sourceId: 'natural-earth-public-domain-map',
  name: 'Natural Earth',
  role: 'map-only',
  decision: 'CANDIDATE',
  upstreamSource: 'Natural Earth project; selected third-party releases noted on terms page',
  upstreamSourceUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
  versionSummary: '官方条款声明 raster/vector data 为 public domain，可商业电子传播；地图产品不保证中国地级完整代码/坐标/历史。',
  coverage: '全球制图底图/行政边界可视化；仅地图层候选，不是城市身份或历史数据源。',
  dimensions: {
    authority: dimension('weak', '适合制图底图，不是民政部行政代码发布。', ['natural-earth-terms']),
    completeness: dimension('partial', '全球底图覆盖，但中国地级行政粒度/属性需逐项验证。', ['natural-earth-terms']),
    freshness: dimension('unknown', '条款页没有给出可替代民政部当前版本的行政数据新鲜度保证。', ['natural-earth-terms']),
    stableCodes: dimension('blocked', '不提供中国六位 adminCode。', ['natural-earth-terms']),
    coordinates: dimension('partial', '几何可服务可视化，不是逐城市地理中心坐标证据。', ['natural-earth-terms']),
    aliases: dimension('weak', '条款页提及名称来源，但不提供本合同所需逐行别名集。', ['natural-earth-terms']),
    history: dimension('blocked', '不提供行政沿革。', ['natural-earth-terms']),
    licenseClarity: dimension('strong', '条款页明确项目数据 public domain；第三方数据条款需区分。', ['natural-earth-terms']),
    redistributionFit: dimension('strong', '项目 raster/vector data 可商业电子传播且无需许可/credit；仅限合适的底图层。', ['natural-earth-terms']),
    operationalCost: dimension('partial', '底图包易维护；身份/代码仍需官方独立管线。', ['natural-earth-terms']),
  },
  license: {
    declaredLicense: 'Public domain (Natural Earth project data)',
    licenseUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
    explicitForDataFiles: true,
    commercialOfflineRedistribution: 'allowed',
    attributionRequired: false,
    attribution: 'No credit required for Natural Earth project data under the terms page; check third-party exceptions.',
    shareAlikeRisk: 'none',
    upstreamRightsProven: false,
    notes: '条款页对 Natural Earth 项目 raster/vector data 授予 public domain 口径，但第三方发布/网站版权需分离确认。',
  },
  evidence: [
    evidence('legal-text', 'https://www.naturalearthdata.com/about/terms-of-use/', 'https', 'Natural Earth terms of use', 'public domain data; observed 2026-09-02', '2f5525b367a555f4d1a236a059b39c5f97355294f987167a5c1ad3415733d1d1', '官方条款说明 raster/vector data 为 public domain，允许商业电子传播；同时提示来源/免责声明。'),
  ],
  blockers: ['map-only-not-city-admin-dataset', 'no-six-digit-code-or-history'],
  notes: '仅可作为未来地图展示底图候选；不能满足 P5-B 中国大陆地级城市身份数据。',
};

export const CITY_SOURCE_DECISION_SOURCES: readonly CitySourceDecisionRecord[] = [
  mcaSource,
  gbtSource,
  geonamesSource,
  modoodSource,
  kk418Source,
  adyliuSource,
  osmSource,
  naturalEarthSource,
];

export const CHINA_CITY_SOURCE_DECISION_SNAPSHOT: CitySourceDecisionSnapshot = {
  contractVersion: CITY_SOURCE_DECISION_CONTRACT_VERSION,
  decisionSnapshotId: 'china-cities-p5-b2-source-audit-2026-09-02',
  auditedAt: AUDITED_AT,
  target: {
    region: '中国大陆',
    unit: '地级行政区',
    requiredFields: ['canonicalName', 'adminCode', 'administrativeLevel', 'latitude', 'longitude', 'aliases', 'history', 'source', 'version', 'hash', 'retrievedAt', 'license', 'attribution'],
    releaseIntent: '中国大陆首发可公开发布的、合法商业离线再分发的地级行政区名称/六位代码/坐标/别名/历史数据。',
  },
  sources: CITY_SOURCE_DECISION_SOURCES,
  combinationPlan: {
    officialPageManualVerification: {
      sourceId: 'mca-dmfw-admin-and-history',
      allowedUse: '仅人工核验当前版本、六位代码、公告日期与历史变更；保留 URL、版本、哈希、抓取时间和核验人。',
      forbiddenUse: '未获书面许可不得把页面/API响应复制进离线 bundle、数据库或可下载资源。',
      requiredAction: '向民政部/权利人取得商业离线复制与再分发书面授权，或取得法务书面结论。',
    },
    licensedDataBundle: {
      sourceIds: ['geonames-cc-by-enrichment'],
      allowedOnlyWhen: ['CC BY 4.0 归因文本、链接、修改说明随包提供', '逐行与民政部当前名称/代码核对完成', '第三方来源权利与质量风险已书面审查', '坐标标注 city-center-approximate，不宣称出生点精确'],
      requiredRowEvidence: ['source', 'sourceVersion', 'contentHash', 'retrievedAt', 'license', 'attribution', 'adminCode mapping', 'coordinate precision'],
    },
    appIdentity: {
      locationId: '稳定 app 身份；历史快照中不得因行政代码变化而静默替换',
      adminCode: '独立六位行政代码字段；代码撤销/变更必须显式 validFrom/validTo、supersedes/replacedBy',
      historicalChanges: '新旧身份显式映射；名称/边界/驻地变化不静默重写历史记录',
      aliasConflicts: '冲突别名不首条猜测；要求省级限定或显式候选选择并保留证据',
    },
  },
  databaseLicensePropagationRisk: {
    overall: 'high',
    risks: [
      { sourceId: 'mca-dmfw-admin-and-history', risk: '权威页面/API缺少商业离线许可', consequence: '复制进数据库/安装包可能构成未授权再分发', mitigation: '仅人工核验；先取得书面许可/法务结论' },
      { sourceId: 'geonames-cc-by-enrichment', risk: 'CC BY 归因及聚合第三方权利', consequence: '漏归因或第三方权利不覆盖会使商业 bundle 不合规', mitigation: '固定快照、逐行血缘、归因清单、第三方权利审查' },
      { sourceId: 'openstreetmap-odbl-enrichment', risk: 'ODbL ShareAlike、通知和实质抽取义务', consequence: '组合数据库可能触发公开同许可/源码或数据库义务', mitigation: '当前不混入；未来单独地图层并由法务审查' },
      { sourceId: 'adyliu-china-area', risk: 'GPL-3.0 仓库许可与上游 NBS 权利不明', consequence: '数据库/程序组合传播和上游复制权双重不确定', mitigation: '首发阻断；不导入生产' },
      { sourceId: 'modood-administrative-divisions-of-china', risk: 'WTFPL 仓库许可被误当作上游数据许可', consequence: '可能无授权复制 NBS 数据且使用过时身份', mitigation: '只作结构参考；不导入' },
    ],
  },
  releaseDecision: CITY_SOURCE_DECISION_RELEASE_BLOCKED,
  blockers: [
    'no-source-proves-legal-commercial-offline-redistribution-of-authoritative-mca-city-data',
    'no-single-source-covers-authority-codes-coordinates-aliases-history-and-license',
    'current-production-city-dataset-remains-partial-and-missing-row-provenance',
    'database-license-propagation-risks-require-written-authorization-or-legal-review',
  ],
  nextMinimumBatch: {
    name: 'P5-B2 source-decision audit tooling only',
    allowedWithoutUpstreamPermission: true,
    deliverables: ['保留本合同与证据哈希/URL/version/retrievedAt', '建立逐行 source/version/hash/license/attribution 校验器', '建立离线包 manifest 与 locationId/adminCode/history 不变性测试', '不导入任何未获授权来源数据、不关闭 p5-a4a-cross-city-coverage'],
    gate: '只有书面再分发授权或法务确认、逐行完整性/坐标/别名/历史证据及测试 DoD 全部满足，才可将 releaseDecision 改为 ALLOW 并启动 pilot import。',
  },
};

export const P5_B2_CITY_SOURCE_DECISION_SNAPSHOT = CHINA_CITY_SOURCE_DECISION_SNAPSHOT;
export const CITY_SOURCE_DECISION_SNAPSHOT = CHINA_CITY_SOURCE_DECISION_SNAPSHOT;

validateCitySourceDecisionSnapshot(CHINA_CITY_SOURCE_DECISION_SNAPSHOT);
