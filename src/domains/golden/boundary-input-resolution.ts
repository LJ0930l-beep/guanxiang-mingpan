import {
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  type BoundaryInputAuditCase,
} from '@/domains/golden/boundary-input-contract';

export const BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION = 'p5-a4b-input-resolution.v1' as const;
export const BOUNDARY_INPUT_RESOLUTION_STATUS = 'resolved' as const;

export const BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS = [
  'p5-a4a-ziwei-invalid-gregorian-date',
  'p5-a4a-astrology-invalid-gregorian-date',
  'p5-a4a-astrology-invalid-coordinate',
] as const;

export type BoundaryInputResolutionAuditCaseId = (typeof BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS)[number];

export interface BoundaryInputResolution {
  contractVersion: typeof BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION;
  resolutionId: string;
  auditCaseId: BoundaryInputResolutionAuditCaseId;
  status: typeof BOUNDARY_INPUT_RESOLUTION_STATUS;
  targetBatch: 'P5-A4b';
  summary: string;
  testRefs: readonly string[];
  notes: string;
}

const RESOLUTION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEST_REF_PATTERN = /^tests\/[^\s#]+(?:#[^\s]+)?$/;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isResolutionAuditCaseId(value: unknown): value is BoundaryInputResolutionAuditCaseId {
  return typeof value === 'string'
    && BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS.includes(value as BoundaryInputResolutionAuditCaseId);
}

function validateResolutionValue(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return [`${path} must be an object`];
  collectJsonErrors(value, path, errors, new WeakSet<object>());

  for (const property of ['contractVersion', 'resolutionId', 'auditCaseId', 'status', 'targetBatch', 'summary', 'testRefs', 'notes']) {
    if (!Object.prototype.hasOwnProperty.call(value, property)) errors.push(`${path}.${property} is required`);
  }
  if (value.contractVersion !== BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION) {
    errors.push(`${path}.contractVersion must be ${BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION}`);
  }
  if (typeof value.resolutionId !== 'string' || !RESOLUTION_ID_PATTERN.test(value.resolutionId)) {
    errors.push(`${path}.resolutionId must be a stable kebab-case identifier`);
  }
  if (!isResolutionAuditCaseId(value.auditCaseId)) errors.push(`${path}.auditCaseId is not supported`);
  if (value.status !== BOUNDARY_INPUT_RESOLUTION_STATUS) errors.push(`${path}.status must be resolved`);
  if (value.targetBatch !== 'P5-A4b') errors.push(`${path}.targetBatch must be P5-A4b`);
  if (!isNonEmptyString(value.summary)) errors.push(`${path}.summary must be a non-empty string`);
  if (!Array.isArray(value.testRefs) || value.testRefs.length === 0 || value.testRefs.some((ref) => typeof ref !== 'string' || !TEST_REF_PATTERN.test(ref))) {
    errors.push(`${path}.testRefs must contain one or more test repository references`);
  }
  if (!isNonEmptyString(value.notes)) errors.push(`${path}.notes must be a non-empty string`);
  return errors;
}

function auditCaseById(auditRegistry: readonly BoundaryInputAuditCase[]): Map<string, BoundaryInputAuditCase> {
  return new Map(auditRegistry.map((auditCase) => [auditCase.id, auditCase]));
}

export function getBoundaryInputResolutionValidationErrors(
  value: unknown,
  path = 'boundaryInputResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  const errors = validateResolutionValue(value, path);
  if (errors.length > 0 || !isRecord(value) || !isResolutionAuditCaseId(value.auditCaseId)) return errors;
  const auditCase = auditCaseById(auditRegistry).get(value.auditCaseId);
  if (!auditCase) {
    errors.push(`${path}.auditCaseId must exist in the P5-A4a audit registry`);
  } else {
    if (auditCase.status !== 'gap') errors.push(`${path}.auditCaseId must map from an original gap case`);
    if (auditCase.targetBatch !== 'P5-A4b') errors.push(`${path}.auditCaseId must map from targetBatch P5-A4b`);
  }
  return errors;
}

export function validateBoundaryInputResolution(value: unknown): BoundaryInputResolution {
  const errors = getBoundaryInputResolutionValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b boundary input resolution:\n${errors.join('\n')}`);
  return value as BoundaryInputResolution;
}

export function getBoundaryInputResolutionRegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  if (!Array.isArray(value)) return ['boundaryInputResolutions must be an array'];
  const errors: string[] = [];
  const ids = new Set<string>();
  const auditIds = new Set<string>();
  const auditMap = auditCaseById(auditRegistry);

  value.forEach((item, index) => {
    const path = `boundaryInputResolutions[${index}]`;
    const itemErrors = getBoundaryInputResolutionValidationErrors(item, path, auditRegistry);
    errors.push(...itemErrors);
    if (itemErrors.length === 0) {
      const resolution = item as BoundaryInputResolution;
      if (ids.has(resolution.resolutionId)) errors.push(`${path}.resolutionId duplicates ${resolution.resolutionId}`);
      ids.add(resolution.resolutionId);
      if (auditIds.has(resolution.auditCaseId)) errors.push(`${path}.auditCaseId duplicates ${resolution.auditCaseId}`);
      auditIds.add(resolution.auditCaseId);
    }
  });

  if (value.length !== BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS.length) {
    errors.push(`boundaryInputResolutions must contain exactly ${BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS.length} resolutions`);
  }
  for (const auditCaseId of BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS) {
    if (!auditMap.has(auditCaseId)) errors.push(`audit registry is missing ${auditCaseId}`);
    if (!auditIds.has(auditCaseId)) errors.push(`resolution registry is missing ${auditCaseId}`);
  }
  for (const auditCaseId of auditIds) {
    if (!BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS.includes(auditCaseId as BoundaryInputResolutionAuditCaseId)) {
      errors.push(`resolution registry contains unsupported auditCaseId ${auditCaseId}`);
    }
  }
  return errors;
}

export function validateBoundaryInputResolutionRegistry(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly BoundaryInputResolution[] {
  const errors = getBoundaryInputResolutionRegistryValidationErrors(value, auditRegistry);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b boundary input resolution registry:\n${errors.join('\n')}`);
  return value as readonly BoundaryInputResolution[];
}

export const P5_A4B_INPUT_RESOLUTION_CASES: readonly BoundaryInputResolution[] = [
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-ziwei-invalid-gregorian-date',
    auditCaseId: 'p5-a4a-ziwei-invalid-gregorian-date',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '紫微公历路径在进入 iztro 前统一拒绝格式错误或不存在的 Gregorian 日期。',
    testRefs: ['tests/p5-input-validation.regression.mjs#ziwei-invalid-gregorian-date'],
    notes: '只关闭安全输入合法性 gap；公开支持日期范围仍保留为负责人决策。',
  },
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-astrology-invalid-gregorian-date',
    auditCaseId: 'p5-a4a-astrology-invalid-gregorian-date',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '占星 solar/Gregorian 路径在进入第三方 Horoscope 前统一拒绝格式错误或不存在的日期。',
    testRefs: ['tests/p5-input-validation.regression.mjs#astrology-invalid-gregorian-date'],
    notes: '只关闭安全输入合法性 gap；lunar/calendar 限制和公开支持日期范围不在本批选择。',
  },
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-astrology-invalid-coordinate',
    auditCaseId: 'p5-a4a-astrology-invalid-coordinate',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '占星显式坐标在进入 Origin 前强制成对、有限且满足纬度/经度范围。',
    testRefs: ['tests/p5-input-validation.regression.mjs#astrology-invalid-coordinate'],
    notes: '两项坐标都缺失时仍保留 A4a 记录的 unknown-city/0,0 gap，本 resolution 不选择拒绝或近似策略。',
  },
] as const;

validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_CASES);
