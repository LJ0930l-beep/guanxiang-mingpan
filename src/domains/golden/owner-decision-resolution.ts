import {
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  type BoundaryInputAuditCase,
} from '@/domains/golden/boundary-input-contract';
import {
  PUBLIC_BIRTH_DATE_RANGE_POLICY,
  isPublicBirthDateRangePolicy,
  type PublicBirthDateRangePolicy,
} from '@/domains/policy/public-birth-date-range';

/**
 * Owner decisions are deliberately kept out of the P5-A4b input-resolution
 * overlay.  A4b only accepts original `gap` cases, while this registry
 * records the explicit acceptance of the three immutable `decision-required`
 * cases by the product owner.
 */
export const OWNER_DECISION_RESOLUTION_CONTRACT_VERSION = 'p5-a5a-owner-decision.v1' as const;
export const OWNER_DECISION_RESOLUTION_STATUS = 'accepted' as const;
export const PUBLIC_BIRTH_DATE_RANGE_DECISION_ID = 'cn-mainland-public-birth-date-range' as const;
export const OWNER_DECISION_RESOLUTION_TARGET_BATCH = 'P5-A5a' as const;

export const OWNER_DECISION_RESOLUTION_AUDIT_CASE_IDS = [
  'p5-a4a-bazi-supported-date-range',
  'p5-a4a-ziwei-date-range',
  'p5-a4a-astrology-date-range',
] as const;

export type OwnerDecisionResolutionAuditCaseId = (typeof OWNER_DECISION_RESOLUTION_AUDIT_CASE_IDS)[number];

export interface OwnerDecisionResolution {
  contractVersion: typeof OWNER_DECISION_RESOLUTION_CONTRACT_VERSION;
  resolutionId: string;
  decisionId: typeof PUBLIC_BIRTH_DATE_RANGE_DECISION_ID;
  auditCaseId: OwnerDecisionResolutionAuditCaseId;
  status: typeof OWNER_DECISION_RESOLUTION_STATUS;
  targetBatch: typeof OWNER_DECISION_RESOLUTION_TARGET_BATCH;
  policy: PublicBirthDateRangePolicy;
  summary: string;
  testRefs: readonly string[];
  notes: string;
}

export type OwnerDecisionResolutionVersioned = OwnerDecisionResolution;

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

function sameJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => sameJson(item, right[index]));
  }
  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) => key === rightKeys[index] && sameJson(left[key], right[key]));
  }
  return false;
}

interface OwnerDecisionResolutionContractSpec {
  contractVersion: string;
  auditCaseIds: readonly string[];
}

const CONTRACT_SPEC: OwnerDecisionResolutionContractSpec = {
  contractVersion: OWNER_DECISION_RESOLUTION_CONTRACT_VERSION,
  auditCaseIds: OWNER_DECISION_RESOLUTION_AUDIT_CASE_IDS,
};

function auditCaseById(auditRegistry: readonly BoundaryInputAuditCase[]): Map<string, BoundaryInputAuditCase> {
  return new Map(auditRegistry.map((auditCase) => [auditCase.id, auditCase]));
}

function validateResolutionValue(
  value: unknown,
  path: string,
  auditRegistry: readonly BoundaryInputAuditCase[],
): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return [`${path} must be an object`];
  collectJsonErrors(value, path, errors, new WeakSet<object>());

  for (const property of [
    'contractVersion',
    'resolutionId',
    'decisionId',
    'auditCaseId',
    'status',
    'targetBatch',
    'policy',
    'summary',
    'testRefs',
    'notes',
  ]) {
    if (!Object.prototype.hasOwnProperty.call(value, property)) errors.push(`${path}.${property} is required`);
  }
  if (value.contractVersion !== CONTRACT_SPEC.contractVersion) {
    errors.push(`${path}.contractVersion must be ${CONTRACT_SPEC.contractVersion}`);
  }
  if (typeof value.resolutionId !== 'string' || !RESOLUTION_ID_PATTERN.test(value.resolutionId)) {
    errors.push(`${path}.resolutionId must be a stable kebab-case identifier`);
  }
  if (value.decisionId !== PUBLIC_BIRTH_DATE_RANGE_DECISION_ID) {
    errors.push(`${path}.decisionId must be ${PUBLIC_BIRTH_DATE_RANGE_DECISION_ID}`);
  }
  if (!CONTRACT_SPEC.auditCaseIds.includes(value.auditCaseId as string)) {
    errors.push(`${path}.auditCaseId is not supported`);
  }
  if (value.status !== OWNER_DECISION_RESOLUTION_STATUS) {
    errors.push(`${path}.status must be accepted`);
  }
  if (value.targetBatch !== OWNER_DECISION_RESOLUTION_TARGET_BATCH) {
    errors.push(`${path}.targetBatch must be ${OWNER_DECISION_RESOLUTION_TARGET_BATCH}`);
  }
  if (!isPublicBirthDateRangePolicy(value.policy) || !sameJson(value.policy, PUBLIC_BIRTH_DATE_RANGE_POLICY)) {
    errors.push(`${path}.policy must match the owner-approved public birth-date range policy`);
  }
  if (!isNonEmptyString(value.summary)) errors.push(`${path}.summary must be a non-empty string`);
  if (!Array.isArray(value.testRefs)
    || value.testRefs.length === 0
    || value.testRefs.some((ref) => typeof ref !== 'string' || !TEST_REF_PATTERN.test(ref))) {
    errors.push(`${path}.testRefs must contain one or more test repository references`);
  }
  if (!isNonEmptyString(value.notes)) errors.push(`${path}.notes must be a non-empty string`);

  const auditCase = auditCaseById(auditRegistry).get(String(value.auditCaseId));
  if (!auditCase) {
    errors.push(`${path}.auditCaseId must exist in the P5-A4a audit registry`);
  } else {
    if (auditCase.status !== 'decision-required') {
      errors.push(`${path}.auditCaseId must map from a decision-required case`);
    }
    if (auditCase.targetBatch !== 'OWNER-DECISION' || auditCase.ownerDecisionRequired !== true) {
      errors.push(`${path}.auditCaseId must map from an owner decision case`);
    }
  }
  return errors;
}

export function getOwnerDecisionResolutionValidationErrors(
  value: unknown,
  path = 'ownerDecisionResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  return validateResolutionValue(value, path, auditRegistry);
}

export function validateOwnerDecisionResolution(value: unknown): OwnerDecisionResolution {
  const errors = getOwnerDecisionResolutionValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-A5a owner decision resolution:\n${errors.join('\n')}`);
  return value as OwnerDecisionResolution;
}

export function getOwnerDecisionResolutionRegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  if (!Array.isArray(value)) return ['ownerDecisionResolutions must be an array'];
  const errors: string[] = [];
  const resolutionIds = new Set<string>();
  const auditCaseIds = new Set<string>();
  const auditMap = auditCaseById(auditRegistry);

  value.forEach((item, index) => {
    const path = `ownerDecisionResolutions[${index}]`;
    const itemErrors = validateResolutionValue(item, path, auditRegistry);
    errors.push(...itemErrors);
    if (itemErrors.length === 0 && isRecord(item)) {
      if (typeof item.resolutionId === 'string') {
        if (resolutionIds.has(item.resolutionId)) errors.push(`${path}.resolutionId duplicates ${item.resolutionId}`);
        resolutionIds.add(item.resolutionId);
      }
      if (typeof item.auditCaseId === 'string') {
        if (auditCaseIds.has(item.auditCaseId)) errors.push(`${path}.auditCaseId duplicates ${item.auditCaseId}`);
        auditCaseIds.add(item.auditCaseId);
      }
    }
  });

  if (value.length !== CONTRACT_SPEC.auditCaseIds.length) {
    errors.push(`ownerDecisionResolutions must contain exactly ${CONTRACT_SPEC.auditCaseIds.length} resolutions`);
  }
  for (const auditCaseId of CONTRACT_SPEC.auditCaseIds) {
    if (!auditMap.has(auditCaseId)) errors.push(`audit registry is missing ${auditCaseId}`);
    if (!auditCaseIds.has(auditCaseId)) errors.push(`owner decision registry is missing ${auditCaseId}`);
  }
  for (const auditCaseId of auditCaseIds) {
    if (!CONTRACT_SPEC.auditCaseIds.includes(auditCaseId)) {
      errors.push(`owner decision registry contains unsupported auditCaseId ${auditCaseId}`);
    }
  }
  return errors;
}

export function validateOwnerDecisionResolutionRegistry(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly OwnerDecisionResolution[] {
  const errors = getOwnerDecisionResolutionRegistryValidationErrors(value, auditRegistry);
  if (errors.length > 0) throw new Error(`Invalid P5-A5a owner decision resolution registry:\n${errors.join('\n')}`);
  return value as readonly OwnerDecisionResolution[];
}

export function getOwnerDecisionResolutionVersionedValidationErrors(
  value: unknown,
  path = 'ownerDecisionResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  if (isRecord(value) && value.contractVersion !== OWNER_DECISION_RESOLUTION_CONTRACT_VERSION) {
    return [`${path}.contractVersion is not supported`];
  }
  return getOwnerDecisionResolutionValidationErrors(value, path, auditRegistry);
}

export function validateOwnerDecisionResolutionVersioned(value: unknown): OwnerDecisionResolutionVersioned {
  const errors = getOwnerDecisionResolutionVersionedValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-A5a owner decision resolution:\n${errors.join('\n')}`);
  return value as OwnerDecisionResolutionVersioned;
}

export function getOwnerDecisionResolutionVersionedRegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return ['ownerDecisionResolutions must be a non-empty array'];
  }
  const versions = new Set(value.map((item) => (isRecord(item) ? item.contractVersion : undefined)));
  if (versions.size !== 1 || !versions.has(OWNER_DECISION_RESOLUTION_CONTRACT_VERSION)) {
    return ['ownerDecisionResolutions must contain exactly one supported contract version'];
  }
  return getOwnerDecisionResolutionRegistryValidationErrors(value, auditRegistry);
}

export function validateOwnerDecisionResolutionVersionedRegistry(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly OwnerDecisionResolutionVersioned[] {
  const errors = getOwnerDecisionResolutionVersionedRegistryValidationErrors(value, auditRegistry);
  if (errors.length > 0) throw new Error(`Invalid P5-A5a owner decision resolution registry:\n${errors.join('\n')}`);
  return value as readonly OwnerDecisionResolutionVersioned[];
}

export const P5_A5A_OWNER_DECISION_RESOLUTION_CASES: readonly OwnerDecisionResolution[] = [
  {
    contractVersion: OWNER_DECISION_RESOLUTION_CONTRACT_VERSION,
    resolutionId: 'p5-a5a-accept-bazi-public-birth-date-range',
    decisionId: PUBLIC_BIRTH_DATE_RANGE_DECISION_ID,
    auditCaseId: 'p5-a4a-bazi-supported-date-range',
    status: OWNER_DECISION_RESOLUTION_STATUS,
    targetBatch: OWNER_DECISION_RESOLUTION_TARGET_BATCH,
    policy: PUBLIC_BIRTH_DATE_RANGE_POLICY,
    summary: '八字首发公开出生日期窗口采用 1900-01-01 至 2099-12-31，端点均包含，范围外直接拒绝。',
    testRefs: ['tests/p5-public-birth-date-range.regression.mjs#bazi-date-range'],
    notes: 'solar 按真实 Gregorian 日期校验；lunar 先完成真实农历/闰月校验，再按农历输入日期窗口判断。',
  },
  {
    contractVersion: OWNER_DECISION_RESOLUTION_CONTRACT_VERSION,
    resolutionId: 'p5-a5a-accept-ziwei-public-birth-date-range',
    decisionId: PUBLIC_BIRTH_DATE_RANGE_DECISION_ID,
    auditCaseId: 'p5-a4a-ziwei-date-range',
    status: OWNER_DECISION_RESOLUTION_STATUS,
    targetBatch: OWNER_DECISION_RESOLUTION_TARGET_BATCH,
    policy: PUBLIC_BIRTH_DATE_RANGE_POLICY,
    summary: '紫微首发公开出生日期窗口采用 1900-01-01 至 2099-12-31，端点均包含，范围外直接拒绝。',
    testRefs: ['tests/p5-public-birth-date-range.regression.mjs#ziwei-date-range'],
    notes: 'solar 先做 Gregorian 校验；lunar/闰月先做真实农历校验，再按农历输入日期窗口判断。',
  },
  {
    contractVersion: OWNER_DECISION_RESOLUTION_CONTRACT_VERSION,
    resolutionId: 'p5-a5a-accept-astrology-public-birth-date-range',
    decisionId: PUBLIC_BIRTH_DATE_RANGE_DECISION_ID,
    auditCaseId: 'p5-a4a-astrology-date-range',
    status: OWNER_DECISION_RESOLUTION_STATUS,
    targetBatch: OWNER_DECISION_RESOLUTION_TARGET_BATCH,
    policy: PUBLIC_BIRTH_DATE_RANGE_POLICY,
    summary: '占星首发公开出生日期窗口采用 1900-01-01 至 2099-12-31，端点均包含，范围外直接拒绝。',
    testRefs: ['tests/p5-public-birth-date-range.regression.mjs#astrology-date-range'],
    notes: '本批覆盖 Astrology solar/Gregorian 输入；不扩展缺时辰、缺坐标或 lunar 占星策略。',
  },
] as const;

validateOwnerDecisionResolutionVersionedRegistry(P5_A5A_OWNER_DECISION_RESOLUTION_CASES);
