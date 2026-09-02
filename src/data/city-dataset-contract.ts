import {
  CHINA_CITY_DATASET_VERSION,
  listMainlandCities,
  type CityCoordinate,
} from '@/data/china-cities';

/**
 * P5-B1 is an audit contract, not a replacement for CityCoordinate.  The
 * production resolver intentionally keeps its small, backwards-compatible
 * record shape; this additive contract is where release evidence is tracked.
 */
export const CITY_DATASET_AUDIT_CONTRACT_VERSION = 'p5-b1-city-dataset-audit.v1' as const;
export const P5_B1_CITY_DATASET_AUDIT_CONTRACT_VERSION = CITY_DATASET_AUDIT_CONTRACT_VERSION;
export const CITY_DATASET_ID = 'china-cities' as const;
export const CITY_DATASET_RELEASE_BLOCKED = 'blocked' as const;
export const CITY_DATASET_RELEASE_READY = 'release-ready' as const;
export const CITY_DATASET_CURRENT_STATUS = 'partial' as const;

export type CityDatasetReleaseEligibility =
  | typeof CITY_DATASET_RELEASE_BLOCKED
  | typeof CITY_DATASET_RELEASE_READY;
export type CityDatasetStatus = 'prototype' | 'partial' | 'complete';
export type CityDatasetLicenseStatus = 'allowed' | 'unknown' | 'restricted' | 'blocked';
export type CityDatasetEvidenceStatus = 'missing' | 'candidate' | 'verified';
export type CityDatasetIdentityChange = 'none' | 'supersede' | 'replace';
export type CityAdministrativeLevel =
  | 'municipality'
  | 'prefecture-level-city'
  | 'prefecture'
  | 'autonomous-prefecture'
  | 'league'
  | null;

export interface CityDatasetRowEvidence {
  status: CityDatasetEvidenceStatus;
  source: string | null;
  sourceUrl: string | null;
  sourceVersion: string | null;
  retrievedAt: string | null;
  references: readonly string[];
  notes: string;
}

export interface CityDatasetAuditRecord {
  /** The existing row is an audited prototype record, not release-ready data. */
  status: CityDatasetStatus;
  /** Stable app identity. It must not be silently replaced by adminCode. */
  locationId: string;
  /** Future administrative identity; null is intentional until verified. */
  adminCode: string | null;
  province: string;
  city: string;
  canonicalName: string;
  aliases: readonly string[];
  administrativeLevel: CityAdministrativeLevel;
  timezone: 'Asia/Shanghai';
  latitude: number;
  longitude: number;
  centerType: 'city-center-approximate';
  source: string;
  sourceUrl: string | null;
  sourceVersion: string | null;
  retrievedAt: string | null;
  licenseStatus: CityDatasetLicenseStatus;
  licenseUrl: string | null;
  attribution: string | null;
  rowEvidence: {
    coordinate: CityDatasetRowEvidence;
    aliases: CityDatasetRowEvidence;
    administrative: CityDatasetRowEvidence;
    license: CityDatasetRowEvidence;
  };
  validFrom: string | null;
  validTo: string | null;
  supersedes: readonly string[];
  replacedBy: readonly string[];
  identityChange: CityDatasetIdentityChange;
  blockers: readonly string[];
}

export interface CityDatasetCoverage {
  region: '中国大陆';
  target: string;
  currentScope: string;
  status: CityDatasetStatus;
  recordCount: number;
  uniqueLocationIdCount: number;
  nameAliasTokenCount: number;
}

export interface CityDatasetIdentityPolicy {
  locationId: string;
  adminCode: string;
  administrativeChanges: string;
}

export interface CityDatasetPrecisionPolicy {
  coordinate: string;
  timezone: string;
  aliasResolution: string;
}

export interface CityDatasetAuditPolicy {
  identity: CityDatasetIdentityPolicy;
  precision: CityDatasetPrecisionPolicy;
}

export interface CityDatasetAuditSnapshot {
  contractVersion: typeof CITY_DATASET_AUDIT_CONTRACT_VERSION;
  datasetId: typeof CITY_DATASET_ID;
  datasetVersion: typeof CHINA_CITY_DATASET_VERSION;
  auditSnapshotId: string;
  auditedAt: string;
  status: CityDatasetStatus;
  coverage: CityDatasetCoverage;
  records: readonly CityDatasetAuditRecord[];
  releaseEligibility: CityDatasetReleaseEligibility;
  blockers: readonly string[];
  policy: CityDatasetAuditPolicy;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isNonEmptyString(value);
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isIsoDateTime(value: string): boolean {
  return !Number.isNaN(Date.parse(value)) && /T/.test(value);
}

function normalizeToken(value: string): string {
  return value.trim().replace(/[\s,，。·]/g, '');
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

function hasOwn(value: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function validateEvidence(value: unknown, path: string, errors: string[], releaseReady: boolean): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const key of ['status', 'source', 'sourceUrl', 'sourceVersion', 'retrievedAt', 'references', 'notes']) {
    if (!hasOwn(value, key)) errors.push(`${path}.${key} is required`);
  }
  if (!['missing', 'candidate', 'verified'].includes(String(value.status))) {
    errors.push(`${path}.status is invalid`);
  }
  if (!isNullableString(value.source)) errors.push(`${path}.source must be a string or null`);
  if (!isNullableString(value.sourceUrl)) errors.push(`${path}.sourceUrl must be a string or null`);
  if (!isNullableString(value.sourceVersion)) errors.push(`${path}.sourceVersion must be a string or null`);
  if (!isNullableString(value.retrievedAt)) errors.push(`${path}.retrievedAt must be a string or null`);
  if (typeof value.sourceUrl === 'string' && !/^https:\/\//.test(value.sourceUrl)) {
    errors.push(`${path}.sourceUrl must use https`);
  }
  if (typeof value.retrievedAt === 'string' && !isIsoDateTime(value.retrievedAt)) {
    errors.push(`${path}.retrievedAt must be an ISO date-time`);
  }
  if (!Array.isArray(value.references) || value.references.some((reference) => !isNonEmptyString(reference))) {
    errors.push(`${path}.references must be an array of non-empty strings`);
  }
  if (!isNonEmptyString(value.notes)) errors.push(`${path}.notes must be a non-empty string`);
  if (releaseReady && (value.status !== 'verified'
    || !isNonEmptyString(value.source)
    || !isNonEmptyString(value.sourceUrl)
    || !isNonEmptyString(value.sourceVersion)
    || !isNonEmptyString(value.retrievedAt)
    || !Array.isArray(value.references)
    || value.references.length === 0)) {
    errors.push(`${path} must be verified with source, version, retrieval time and references for release-ready data`);
  }
}

function validateRecord(value: unknown, path: string, errors: string[], releaseReady: boolean): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  const required = [
    'status', 'locationId', 'adminCode', 'province', 'city', 'canonicalName', 'aliases', 'administrativeLevel',
    'timezone', 'latitude', 'longitude', 'centerType', 'source', 'sourceUrl', 'sourceVersion',
    'retrievedAt', 'licenseStatus', 'licenseUrl', 'attribution', 'rowEvidence', 'validFrom', 'validTo',
    'supersedes', 'replacedBy', 'identityChange', 'blockers',
  ];
  required.forEach((key) => {
    if (!hasOwn(value, key)) errors.push(`${path}.${key} is required`);
  });
  if (!isNonEmptyString(value.locationId)) errors.push(`${path}.locationId must be a non-empty stable string`);
  if (!['prototype', 'partial', 'complete'].includes(String(value.status))) errors.push(`${path}.status is invalid`);
  if (!(value.adminCode === null || isNonEmptyString(value.adminCode))) errors.push(`${path}.adminCode must be a string or null`);
  if (value.adminCode === value.locationId && value.adminCode !== null) {
    errors.push(`${path}.adminCode must remain separate from locationId`);
  }
  for (const key of ['province', 'city', 'canonicalName', 'source']) {
    if (!isNonEmptyString(value[key])) errors.push(`${path}.${key} must be a non-empty string`);
  }
  if (!Array.isArray(value.aliases) || value.aliases.some((alias) => !isNonEmptyString(alias))) {
    errors.push(`${path}.aliases must be an array of non-empty strings`);
  }
  if (value.administrativeLevel !== null
    && !['municipality', 'prefecture-level-city', 'prefecture', 'autonomous-prefecture', 'league'].includes(String(value.administrativeLevel))) {
    errors.push(`${path}.administrativeLevel is invalid`);
  }
  if (value.timezone !== 'Asia/Shanghai') errors.push(`${path}.timezone must be Asia/Shanghai`);
  if (typeof value.latitude !== 'number' || !Number.isFinite(value.latitude) || value.latitude < -90 || value.latitude > 90) {
    errors.push(`${path}.latitude must be a finite number in [-90, 90]`);
  }
  if (typeof value.longitude !== 'number' || !Number.isFinite(value.longitude) || value.longitude < -180 || value.longitude > 180) {
    errors.push(`${path}.longitude must be a finite number in [-180, 180]`);
  }
  if (value.centerType !== 'city-center-approximate') errors.push(`${path}.centerType must be city-center-approximate`);
  if (!isNullableString(value.sourceUrl)) errors.push(`${path}.sourceUrl must be a string or null`);
  if (typeof value.sourceUrl === 'string' && !/^https:\/\//.test(value.sourceUrl)) errors.push(`${path}.sourceUrl must use https`);
  if (!isNullableString(value.sourceVersion)) errors.push(`${path}.sourceVersion must be a string or null`);
  if (!isNullableString(value.retrievedAt)) errors.push(`${path}.retrievedAt must be a string or null`);
  if (typeof value.retrievedAt === 'string' && !isIsoDateTime(value.retrievedAt)) errors.push(`${path}.retrievedAt must be an ISO date-time`);
  if (!['allowed', 'unknown', 'restricted', 'blocked'].includes(String(value.licenseStatus))) errors.push(`${path}.licenseStatus is invalid`);
  if (!isNullableString(value.licenseUrl)) errors.push(`${path}.licenseUrl must be a string or null`);
  if (typeof value.licenseUrl === 'string' && !/^https:\/\//.test(value.licenseUrl)) errors.push(`${path}.licenseUrl must use https`);
  if (!(value.attribution === null || isNonEmptyString(value.attribution))) errors.push(`${path}.attribution must be a string or null`);
  if (!isRecord(value.rowEvidence)) {
    errors.push(`${path}.rowEvidence must be an object`);
  } else {
    for (const key of ['coordinate', 'aliases', 'administrative', 'license']) {
      validateEvidence(value.rowEvidence[key], `${path}.rowEvidence.${key}`, errors, releaseReady);
    }
  }
  for (const key of ['validFrom', 'validTo']) {
    if (!(value[key] === null || (typeof value[key] === 'string' && isIsoDate(value[key])))) {
      errors.push(`${path}.${key} must be a valid ISO date or null`);
    }
  }
  for (const key of ['supersedes', 'replacedBy']) {
    if (!Array.isArray(value[key]) || value[key].some((item) => !isNonEmptyString(item))) {
      errors.push(`${path}.${key} must be an array of non-empty location IDs`);
    }
  }
  if (!['none', 'supersede', 'replace'].includes(String(value.identityChange))) errors.push(`${path}.identityChange is invalid`);
  const linkedIds = (Array.isArray(value.supersedes) ? value.supersedes : []).length
    + (Array.isArray(value.replacedBy) ? value.replacedBy : []).length;
  if (value.identityChange !== 'none' && linkedIds === 0) {
    errors.push(`${path}.identityChange requires supersedes or replacedBy`);
  }
  if (value.identityChange === 'none' && linkedIds > 0) {
    errors.push(`${path}.identityChange must declare supersede or replace when mappings are present`);
  }
  if (!Array.isArray(value.blockers) || value.blockers.some((blocker) => !isNonEmptyString(blocker))) {
    errors.push(`${path}.blockers must be an array of non-empty strings`);
  }
  if (releaseReady) {
    if (value.status !== 'complete') errors.push(`${path}.status must be complete for release-ready data`);
    if (value.adminCode === null) errors.push(`${path}.adminCode is required for release-ready data`);
    if (value.administrativeLevel === null) errors.push(`${path}.administrativeLevel is required for release-ready data`);
    if (!isNonEmptyString(value.sourceVersion)) errors.push(`${path}.sourceVersion is required for release-ready data`);
    if (!isNonEmptyString(value.retrievedAt)) errors.push(`${path}.retrievedAt is required for release-ready data`);
    if (value.licenseStatus !== 'allowed') errors.push(`${path}.licenseStatus must not be unknown, restricted or blocked for release-ready data`);
    if (!isNonEmptyString(value.licenseUrl)) errors.push(`${path}.licenseUrl is required for release-ready data`);
    if (!isNonEmptyString(value.attribution)) errors.push(`${path}.attribution is required for release-ready data`);
    if (Array.isArray(value.blockers) && value.blockers.length > 0) errors.push(`${path}.blockers must be empty for release-ready data`);
  }
}

function validateCoverage(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const key of ['region', 'target', 'currentScope', 'status', 'recordCount', 'uniqueLocationIdCount', 'nameAliasTokenCount']) {
    if (!hasOwn(value, key)) errors.push(`${path}.${key} is required`);
  }
  if (value.region !== '中国大陆') errors.push(`${path}.region must be 中国大陆`);
  for (const key of ['target', 'currentScope']) if (!isNonEmptyString(value[key])) errors.push(`${path}.${key} must be a non-empty string`);
  if (!['prototype', 'partial', 'complete'].includes(String(value.status))) errors.push(`${path}.status is invalid`);
  for (const key of ['recordCount', 'uniqueLocationIdCount', 'nameAliasTokenCount']) {
    if (typeof value[key] !== 'number' || !Number.isInteger(value[key]) || value[key] < 0) errors.push(`${path}.${key} must be a non-negative integer`);
  }
}

function validatePolicy(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value) || !isRecord(value.identity) || !isRecord(value.precision)) {
    errors.push(`${path} must contain identity and precision policies`);
    return;
  }
  for (const [group, keys] of Object.entries({
    identity: ['locationId', 'adminCode', 'administrativeChanges'],
    precision: ['coordinate', 'timezone', 'aliasResolution'],
  })) {
    const object = value[group];
    if (!isRecord(object)) continue;
    for (const key of keys) if (!isNonEmptyString(object[key])) errors.push(`${path}.${group}.${key} must be a non-empty string`);
  }
}

/**
 * Return all structural and cross-row errors without throwing.  Callers can
 * use this at an admin/release boundary; the current prototype snapshot is
 * intentionally valid as an audit but intentionally not release-ready.
 */
export function getCityDatasetAuditValidationErrors(
  value: unknown,
  path = 'cityDatasetAudit',
): readonly string[] {
  const errors: string[] = [];
  collectJsonErrors(value, path, errors, new WeakSet<object>());
  if (!isRecord(value)) return [...errors, `${path} must be an object`];
  for (const key of ['contractVersion', 'datasetId', 'datasetVersion', 'auditSnapshotId', 'auditedAt', 'status', 'coverage', 'records', 'releaseEligibility', 'blockers', 'policy']) {
    if (!hasOwn(value, key)) errors.push(`${path}.${key} is required`);
  }
  if (value.contractVersion !== CITY_DATASET_AUDIT_CONTRACT_VERSION) errors.push(`${path}.contractVersion must be ${CITY_DATASET_AUDIT_CONTRACT_VERSION}`);
  if (value.datasetId !== CITY_DATASET_ID) errors.push(`${path}.datasetId must be ${CITY_DATASET_ID}`);
  if (value.datasetVersion !== CHINA_CITY_DATASET_VERSION) errors.push(`${path}.datasetVersion must remain ${CHINA_CITY_DATASET_VERSION}`);
  if (!isNonEmptyString(value.auditSnapshotId)) errors.push(`${path}.auditSnapshotId must be a non-empty string`);
  if (typeof value.auditedAt !== 'string' || !isIsoDateTime(value.auditedAt)) errors.push(`${path}.auditedAt must be an ISO date-time`);
  if (!['prototype', 'partial', 'complete'].includes(String(value.status))) errors.push(`${path}.status is invalid`);
  validateCoverage(value.coverage, `${path}.coverage`, errors);
  validatePolicy(value.policy, `${path}.policy`, errors);
  const releaseReady = value.releaseEligibility === CITY_DATASET_RELEASE_READY;
  if (![CITY_DATASET_RELEASE_BLOCKED, CITY_DATASET_RELEASE_READY].includes(value.releaseEligibility as CityDatasetReleaseEligibility)) {
    errors.push(`${path}.releaseEligibility must be blocked or release-ready`);
  }
  if (!Array.isArray(value.blockers) || value.blockers.some((blocker) => !isNonEmptyString(blocker))) errors.push(`${path}.blockers must be an array of non-empty strings`);
  if (value.releaseEligibility === CITY_DATASET_RELEASE_BLOCKED && Array.isArray(value.blockers) && value.blockers.length === 0) errors.push(`${path}.blockers must explain why blocked`);
  if (releaseReady && Array.isArray(value.blockers) && value.blockers.length > 0) errors.push(`${path}.blockers must be empty for release-ready data`);

  if (!Array.isArray(value.records) || value.records.length === 0) {
    errors.push(`${path}.records must be a non-empty array`);
    return errors;
  }
  const locationIds = new Set<string>();
  const adminCodes = new Set<string>();
  const canonicalNames = new Map<string, number>();
  const tokens = new Map<string, { index: number; field: string }>();
  value.records.forEach((record, index) => {
    const recordPath = `${path}.records[${index}]`;
    validateRecord(record, recordPath, errors, releaseReady);
    if (!isRecord(record)) return;
    if (typeof record.locationId === 'string') {
      if (locationIds.has(record.locationId)) errors.push(`${recordPath}.locationId duplicates ${record.locationId}`);
      locationIds.add(record.locationId);
    }
    if (typeof record.adminCode === 'string') {
      if (adminCodes.has(record.adminCode)) errors.push(`${recordPath}.adminCode duplicates ${record.adminCode}`);
      adminCodes.add(record.adminCode);
    }
    if (typeof record.canonicalName === 'string') {
      const normalized = normalizeToken(record.canonicalName);
      if (canonicalNames.has(normalized)) errors.push(`${recordPath}.canonicalName conflicts with records[${canonicalNames.get(normalized)}]`);
      else canonicalNames.set(normalized, index);
    }
    if (typeof record.locationId === 'string' && typeof record.canonicalName === 'string') {
      const names = [record.canonicalName, ...(Array.isArray(record.aliases) ? record.aliases : [])];
      names.forEach((name, nameIndex) => {
        if (typeof name !== 'string') return;
        const normalized = normalizeToken(name);
        if (!normalized) return;
        const field = nameIndex === 0 ? 'canonicalName' : `aliases[${nameIndex - 1}]`;
        const previous = tokens.get(normalized);
        if (previous && previous.index !== index) {
          errors.push(`${recordPath}.${field} conflicts with records[${previous.index}].${previous.field}`);
        } else if (!previous) {
          tokens.set(normalized, { index, field });
        }
      });
    }
  });

  locationIds.forEach((locationId) => {
    if (adminCodes.has(locationId)) {
      errors.push(`${path}.locationId ${locationId} collides with an adminCode; identities must remain separate`);
    }
  });

  if (isRecord(value.coverage)) {
    if (value.coverage.recordCount !== value.records.length) errors.push(`${path}.coverage.recordCount does not match records`);
    if (value.coverage.uniqueLocationIdCount !== locationIds.size) errors.push(`${path}.coverage.uniqueLocationIdCount does not match records`);
    if (value.coverage.nameAliasTokenCount !== tokens.size) errors.push(`${path}.coverage.nameAliasTokenCount does not match records`);
    if (releaseReady && value.coverage.status !== 'complete') errors.push(`${path}.coverage.status must be complete for release-ready data`);
    if (releaseReady && value.status !== 'complete') errors.push(`${path}.status must be complete for release-ready data`);
  }
  return errors;
}

export function validateCityDatasetAuditSnapshot(value: unknown): CityDatasetAuditSnapshot {
  const errors = getCityDatasetAuditValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-B1 city dataset audit snapshot:\n${errors.join('\n')}`);
  return value as CityDatasetAuditSnapshot;
}

export const validateCityDatasetAudit = validateCityDatasetAuditSnapshot;

export function validateCityDatasetReleaseEligibility(value: unknown): CityDatasetAuditSnapshot {
  const snapshot = validateCityDatasetAuditSnapshot(value);
  if (snapshot.releaseEligibility !== CITY_DATASET_RELEASE_READY) {
    throw new Error('City dataset release eligibility is blocked; release-ready claims fail closed.');
  }
  return snapshot;
}

export function isCityDatasetAuditSnapshot(value: unknown): value is CityDatasetAuditSnapshot {
  return getCityDatasetAuditValidationErrors(value).length === 0;
}

function missingEvidence(kind: string): CityDatasetRowEvidence {
  return {
    status: 'missing',
    source: null,
    sourceUrl: null,
    sourceVersion: null,
    retrievedAt: null,
    references: [],
    notes: `${kind} 的逐行来源尚未核验；不能把当前人工编排当作第三方证据。`,
  };
}

function auditRecord(city: CityCoordinate): CityDatasetAuditRecord {
  return {
    status: 'prototype',
    locationId: city.locationId,
    adminCode: null,
    province: city.province,
    city: city.city,
    canonicalName: city.name,
    aliases: [...city.aliases],
    administrativeLevel: null,
    timezone: city.timezone,
    latitude: city.latitude,
    longitude: city.longitude,
    centerType: 'city-center-approximate',
    source: city.source,
    sourceUrl: null,
    sourceVersion: city.datasetVersion,
    retrievedAt: null,
    licenseStatus: 'unknown',
    licenseUrl: null,
    attribution: '观象人工编排；第三方来源、许可证和离线再分发权利尚未逐条核验。',
    rowEvidence: {
      coordinate: missingEvidence('坐标'),
      aliases: missingEvidence('别名'),
      administrative: missingEvidence('行政层级与归属'),
      license: missingEvidence('许可证'),
    },
    validFrom: null,
    validTo: null,
    supersedes: [],
    replacedBy: [],
    identityChange: 'none',
    blockers: [
      'missing-admin-code',
      'missing-administrative-level',
      'missing-row-coordinate-provenance',
      'missing-row-alias-provenance',
      'offline-redistribution-license-unknown',
    ],
  };
}

const currentRows = listMainlandCities().map(auditRecord);
const currentTokenCount = currentRows.reduce((count, row) => count + 1 + row.aliases.length, 0);

/**
 * Audit snapshot of the existing 35-record prototype.  It is deliberately
 * blocked: the snapshot records what is missing, without inventing evidence
 * or changing the production resolver's records.
 */
export const CHINA_CITY_DATASET_AUDIT_REGISTRY: readonly CityDatasetAuditRecord[] = currentRows;
export const P5_B1_CITY_DATASET_AUDIT_REGISTRY = CHINA_CITY_DATASET_AUDIT_REGISTRY;

export const CHINA_CITY_DATASET_AUDIT_SNAPSHOT: CityDatasetAuditSnapshot = {
  contractVersion: CITY_DATASET_AUDIT_CONTRACT_VERSION,
  datasetId: CITY_DATASET_ID,
  datasetVersion: CHINA_CITY_DATASET_VERSION,
  auditSnapshotId: 'china-cities-p1f-mainland-v1-audit-2026-09-02',
  auditedAt: '2026-09-02T00:00:00.000+08:00',
  status: 'partial',
  coverage: {
    region: '中国大陆',
    target: '中国大陆全部地级行政区（地级市、地区、自治州、盟），并覆盖直辖市名称与常用别名。',
    currentScope: '直辖市、省会/自治区首府及少量原型已使用的常见地级市；不是全国完整地级行政区库。',
    status: CITY_DATASET_CURRENT_STATUS,
    recordCount: currentRows.length,
    uniqueLocationIdCount: currentRows.length,
    nameAliasTokenCount: currentTokenCount,
  },
  records: currentRows,
  releaseEligibility: CITY_DATASET_RELEASE_BLOCKED,
  blockers: [
    'coverage-not-complete',
    'p5-a4a-cross-city-coverage-routed-p5-b',
    'missing-admin-code',
    'missing-administrative-level',
    'missing-row-coordinate-provenance',
    'missing-row-alias-provenance',
    'offline-redistribution-license-unknown',
  ],
  policy: {
    identity: {
      locationId: 'Stable app identity retained in snapshots; never silently replaced by adminCode.',
      adminCode: 'Future administrative code is a separate nullable field and requires its own evidence.',
      administrativeChanges: 'Use a new record with explicit supersedes/replacedBy mapping; never silently migrate identity.',
    },
    precision: {
      coordinate: 'City-centre coordinates are approximate; explicit latitude/longitude pairs take precedence and are not a precise birthplace or true-solar guarantee.',
      timezone: 'Asia/Shanghai',
      aliasResolution: 'Exact normalized token matching only; conflicting aliases require province qualification or an explicit candidate choice.',
    },
  },
};

export const P5_B1_CITY_DATASET_AUDIT_SNAPSHOT = CHINA_CITY_DATASET_AUDIT_SNAPSHOT;
export const CITY_DATASET_AUDIT_SNAPSHOT = CHINA_CITY_DATASET_AUDIT_SNAPSHOT;

// Keep this registry self-checking while still allowing blocked prototype data.
validateCityDatasetAuditSnapshot(CHINA_CITY_DATASET_AUDIT_SNAPSHOT);
