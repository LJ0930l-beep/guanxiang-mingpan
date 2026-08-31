import {
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  type BoundaryInputAuditCase,
} from '@/domains/golden/boundary-input-contract';

export const BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION = 'p5-a4b-input-resolution.v1' as const;
/** Explicit v1 aliases keep the original short exports source-compatible. */
export const BOUNDARY_INPUT_RESOLUTION_V1_CONTRACT_VERSION = BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION;
export const BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION = 'p5-a4b-input-resolution.v2' as const;
export const BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION = 'p5-a4b-input-resolution.v3' as const;
export const BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION = 'p5-a4b-input-resolution.v4' as const;
export const BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION = 'p5-a4b-input-resolution.v5' as const;
export const BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION = 'p5-a4b-input-resolution.v6' as const;
export const BOUNDARY_INPUT_RESOLUTION_STATUS = 'resolved' as const;

export const BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS = [
  'p5-a4a-ziwei-invalid-gregorian-date',
  'p5-a4a-astrology-invalid-gregorian-date',
  'p5-a4a-astrology-invalid-coordinate',
] as const;

export const BOUNDARY_INPUT_RESOLUTION_V2_AUDIT_CASE_IDS = [
  ...BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS,
  'p5-a4a-liuyao-invalid-date',
  'p5-a4a-liuyao-invalid-seed',
] as const;

export const BOUNDARY_INPUT_RESOLUTION_V3_AUDIT_CASE_IDS = [
  ...BOUNDARY_INPUT_RESOLUTION_V2_AUDIT_CASE_IDS,
  'p5-a4a-bazi-true-solar-cross-day',
] as const;

export const BOUNDARY_INPUT_RESOLUTION_V4_AUDIT_CASE_IDS = [
  ...BOUNDARY_INPUT_RESOLUTION_V3_AUDIT_CASE_IDS,
  'p5-a4a-ziwei-lunar-input',
  'p5-a4a-ziwei-leap-month',
] as const;

export const BOUNDARY_INPUT_RESOLUTION_V5_AUDIT_CASE_IDS = [
  ...BOUNDARY_INPUT_RESOLUTION_V4_AUDIT_CASE_IDS,
  'p5-a4a-ziwei-engine-error-path',
  'p5-a4a-astrology-engine-error-path',
  'p5-a4a-liuyao-engine-error-path',
  'p5-a4a-cross-error-copy-failure-mode',
] as const;

/** Cumulative safety overlay for the two original no-guessing gaps closed by P5-A5b. */
export const BOUNDARY_INPUT_RESOLUTION_V6_AUDIT_CASE_IDS = [
  ...BOUNDARY_INPUT_RESOLUTION_V5_AUDIT_CASE_IDS,
  'p5-a4a-astrology-missing-coordinate',
  'p5-a4a-cross-no-guessing',
] as const;

export const BOUNDARY_INPUT_RESOLUTION_V1_AUDIT_CASE_IDS = BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS;

export type BoundaryInputResolutionAuditCaseId = (typeof BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS)[number];
export type BoundaryInputResolutionV2AuditCaseId = (typeof BOUNDARY_INPUT_RESOLUTION_V2_AUDIT_CASE_IDS)[number];
export type BoundaryInputResolutionV3AuditCaseId = (typeof BOUNDARY_INPUT_RESOLUTION_V3_AUDIT_CASE_IDS)[number];
export type BoundaryInputResolutionV4AuditCaseId = (typeof BOUNDARY_INPUT_RESOLUTION_V4_AUDIT_CASE_IDS)[number];
export type BoundaryInputResolutionV5AuditCaseId = (typeof BOUNDARY_INPUT_RESOLUTION_V5_AUDIT_CASE_IDS)[number];
export type BoundaryInputResolutionV6AuditCaseId = (typeof BOUNDARY_INPUT_RESOLUTION_V6_AUDIT_CASE_IDS)[number];

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

export interface BoundaryInputResolutionV2 {
  contractVersion: typeof BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION;
  resolutionId: string;
  auditCaseId: BoundaryInputResolutionV2AuditCaseId;
  status: typeof BOUNDARY_INPUT_RESOLUTION_STATUS;
  targetBatch: 'P5-A4b';
  summary: string;
  testRefs: readonly string[];
  notes: string;
}

export interface BoundaryInputResolutionV3 {
  contractVersion: typeof BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION;
  resolutionId: string;
  auditCaseId: BoundaryInputResolutionV3AuditCaseId;
  status: typeof BOUNDARY_INPUT_RESOLUTION_STATUS;
  targetBatch: 'P5-A4b';
  summary: string;
  testRefs: readonly string[];
  notes: string;
}

export interface BoundaryInputResolutionV4 {
  contractVersion: typeof BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION;
  resolutionId: string;
  auditCaseId: BoundaryInputResolutionV4AuditCaseId;
  status: typeof BOUNDARY_INPUT_RESOLUTION_STATUS;
  targetBatch: 'P5-A4b';
  summary: string;
  testRefs: readonly string[];
  notes: string;
}

export interface BoundaryInputResolutionV5 {
  contractVersion: typeof BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION;
  resolutionId: string;
  auditCaseId: BoundaryInputResolutionV5AuditCaseId;
  status: typeof BOUNDARY_INPUT_RESOLUTION_STATUS;
  targetBatch: 'P5-A4b';
  summary: string;
  testRefs: readonly string[];
  notes: string;
}

export interface BoundaryInputResolutionV6 {
  contractVersion: typeof BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION;
  resolutionId: string;
  auditCaseId: BoundaryInputResolutionV6AuditCaseId;
  status: typeof BOUNDARY_INPUT_RESOLUTION_STATUS;
  targetBatch: 'P5-A4b';
  summary: string;
  testRefs: readonly string[];
  notes: string;
}

export type BoundaryInputResolutionV1 = BoundaryInputResolution;
export type BoundaryInputResolutionVersioned = BoundaryInputResolution | BoundaryInputResolutionV2 | BoundaryInputResolutionV3 | BoundaryInputResolutionV4 | BoundaryInputResolutionV5 | BoundaryInputResolutionV6;

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

function isResolutionV2AuditCaseId(value: unknown): value is BoundaryInputResolutionV2AuditCaseId {
  return typeof value === 'string'
    && BOUNDARY_INPUT_RESOLUTION_V2_AUDIT_CASE_IDS.includes(value as BoundaryInputResolutionV2AuditCaseId);
}

function isResolutionV3AuditCaseId(value: unknown): value is BoundaryInputResolutionV3AuditCaseId {
  return typeof value === 'string'
    && BOUNDARY_INPUT_RESOLUTION_V3_AUDIT_CASE_IDS.includes(value as BoundaryInputResolutionV3AuditCaseId);
}

function isResolutionV4AuditCaseId(value: unknown): value is BoundaryInputResolutionV4AuditCaseId {
  return typeof value === 'string'
    && BOUNDARY_INPUT_RESOLUTION_V4_AUDIT_CASE_IDS.includes(value as BoundaryInputResolutionV4AuditCaseId);
}

function isResolutionV5AuditCaseId(value: unknown): value is BoundaryInputResolutionV5AuditCaseId {
  return typeof value === 'string'
    && BOUNDARY_INPUT_RESOLUTION_V5_AUDIT_CASE_IDS.includes(value as BoundaryInputResolutionV5AuditCaseId);
}

function isResolutionV6AuditCaseId(value: unknown): value is BoundaryInputResolutionV6AuditCaseId {
  return typeof value === 'string'
    && BOUNDARY_INPUT_RESOLUTION_V6_AUDIT_CASE_IDS.includes(value as BoundaryInputResolutionV6AuditCaseId);
}

interface ResolutionContractSpec {
  contractVersion: string;
  auditCaseIds: readonly string[];
}

const V1_RESOLUTION_SPEC: ResolutionContractSpec = {
  contractVersion: BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION,
  auditCaseIds: BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS,
};

const V2_RESOLUTION_SPEC: ResolutionContractSpec = {
  contractVersion: BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION,
  auditCaseIds: BOUNDARY_INPUT_RESOLUTION_V2_AUDIT_CASE_IDS,
};

const V3_RESOLUTION_SPEC: ResolutionContractSpec = {
  contractVersion: BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION,
  auditCaseIds: BOUNDARY_INPUT_RESOLUTION_V3_AUDIT_CASE_IDS,
};

const V4_RESOLUTION_SPEC: ResolutionContractSpec = {
  contractVersion: BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION,
  auditCaseIds: BOUNDARY_INPUT_RESOLUTION_V4_AUDIT_CASE_IDS,
};

const V5_RESOLUTION_SPEC: ResolutionContractSpec = {
  contractVersion: BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION,
  auditCaseIds: BOUNDARY_INPUT_RESOLUTION_V5_AUDIT_CASE_IDS,
};

const V6_RESOLUTION_SPEC: ResolutionContractSpec = {
  contractVersion: BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION,
  auditCaseIds: BOUNDARY_INPUT_RESOLUTION_V6_AUDIT_CASE_IDS,
};

function isResolutionAuditCaseIdForSpec(value: unknown, spec: ResolutionContractSpec): boolean {
  return typeof value === 'string' && spec.auditCaseIds.includes(value);
}

function validateResolutionValue(value: unknown, path: string, spec: ResolutionContractSpec): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return [`${path} must be an object`];
  collectJsonErrors(value, path, errors, new WeakSet<object>());

  for (const property of ['contractVersion', 'resolutionId', 'auditCaseId', 'status', 'targetBatch', 'summary', 'testRefs', 'notes']) {
    if (!Object.prototype.hasOwnProperty.call(value, property)) errors.push(`${path}.${property} is required`);
  }
  if (value.contractVersion !== spec.contractVersion) {
    errors.push(`${path}.contractVersion must be ${spec.contractVersion}`);
  }
  if (typeof value.resolutionId !== 'string' || !RESOLUTION_ID_PATTERN.test(value.resolutionId)) {
    errors.push(`${path}.resolutionId must be a stable kebab-case identifier`);
  }
  if (!isResolutionAuditCaseIdForSpec(value.auditCaseId, spec)) errors.push(`${path}.auditCaseId is not supported`);
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
  const errors = validateResolutionValue(value, path, V1_RESOLUTION_SPEC);
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

export function getBoundaryInputResolutionV2ValidationErrors(
  value: unknown,
  path = 'boundaryInputResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  const errors = validateResolutionValue(value, path, V2_RESOLUTION_SPEC);
  if (errors.length > 0 || !isRecord(value) || !isResolutionV2AuditCaseId(value.auditCaseId)) return errors;
  const auditCase = auditCaseById(auditRegistry).get(value.auditCaseId);
  if (!auditCase) {
    errors.push(`${path}.auditCaseId must exist in the P5-A4a audit registry`);
  } else {
    if (auditCase.status !== 'gap') errors.push(`${path}.auditCaseId must map from an original gap case`);
    if (auditCase.targetBatch !== 'P5-A4b') errors.push(`${path}.auditCaseId must map from targetBatch P5-A4b`);
  }
  return errors;
}

export function validateBoundaryInputResolutionV2(value: unknown): BoundaryInputResolutionV2 {
  const errors = getBoundaryInputResolutionV2ValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v2 boundary input resolution:\n${errors.join('\n')}`);
  return value as BoundaryInputResolutionV2;
}

export function getBoundaryInputResolutionV3ValidationErrors(
  value: unknown,
  path = 'boundaryInputResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  const errors = validateResolutionValue(value, path, V3_RESOLUTION_SPEC);
  if (errors.length > 0 || !isRecord(value) || !isResolutionV3AuditCaseId(value.auditCaseId)) return errors;
  const auditCase = auditCaseById(auditRegistry).get(value.auditCaseId);
  if (!auditCase) {
    errors.push(`${path}.auditCaseId must exist in the P5-A4a audit registry`);
  } else {
    if (auditCase.status !== 'gap') errors.push(`${path}.auditCaseId must map from an original gap case`);
    if (auditCase.targetBatch !== 'P5-A4b') errors.push(`${path}.auditCaseId must map from targetBatch P5-A4b`);
  }
  return errors;
}

export function validateBoundaryInputResolutionV3(value: unknown): BoundaryInputResolutionV3 {
  const errors = getBoundaryInputResolutionV3ValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v3 boundary input resolution:\n${errors.join('\n')}`);
  return value as BoundaryInputResolutionV3;
}

export function getBoundaryInputResolutionV4ValidationErrors(
  value: unknown,
  path = 'boundaryInputResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  const errors = validateResolutionValue(value, path, V4_RESOLUTION_SPEC);
  if (errors.length > 0 || !isRecord(value) || !isResolutionV4AuditCaseId(value.auditCaseId)) return errors;
  const auditCase = auditCaseById(auditRegistry).get(value.auditCaseId);
  if (!auditCase) {
    errors.push(`${path}.auditCaseId must exist in the P5-A4a audit registry`);
  } else {
    if (auditCase.status !== 'gap') errors.push(`${path}.auditCaseId must map from an original gap case`);
    if (auditCase.targetBatch !== 'P5-A4b') errors.push(`${path}.auditCaseId must map from targetBatch P5-A4b`);
  }
  return errors;
}

export function validateBoundaryInputResolutionV4(value: unknown): BoundaryInputResolutionV4 {
  const errors = getBoundaryInputResolutionV4ValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v4 boundary input resolution:\n${errors.join('\n')}`);
  return value as BoundaryInputResolutionV4;
}

export function getBoundaryInputResolutionV5ValidationErrors(
  value: unknown,
  path = 'boundaryInputResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  const errors = validateResolutionValue(value, path, V5_RESOLUTION_SPEC);
  if (errors.length > 0 || !isRecord(value) || !isResolutionV5AuditCaseId(value.auditCaseId)) return errors;
  const auditCase = auditCaseById(auditRegistry).get(value.auditCaseId);
  if (!auditCase) {
    errors.push(`${path}.auditCaseId must exist in the P5-A4a audit registry`);
  } else {
    if (auditCase.status !== 'gap') errors.push(`${path}.auditCaseId must map from an original gap case`);
    if (auditCase.targetBatch !== 'P5-A4b') errors.push(`${path}.auditCaseId must map from targetBatch P5-A4b`);
  }
  return errors;
}

export function validateBoundaryInputResolutionV5(value: unknown): BoundaryInputResolutionV5 {
  const errors = getBoundaryInputResolutionV5ValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v5 boundary input resolution:\n${errors.join('\n')}`);
  return value as BoundaryInputResolutionV5;
}

export function getBoundaryInputResolutionV6ValidationErrors(
  value: unknown,
  path = 'boundaryInputResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  const errors = validateResolutionValue(value, path, V6_RESOLUTION_SPEC);
  if (errors.length > 0 || !isRecord(value) || !isResolutionV6AuditCaseId(value.auditCaseId)) return errors;
  const auditCase = auditCaseById(auditRegistry).get(value.auditCaseId);
  if (!auditCase) {
    errors.push(`${path}.auditCaseId must exist in the P5-A4a audit registry`);
  } else {
    if (auditCase.status !== 'gap') errors.push(`${path}.auditCaseId must map from an original gap case`);
    if (auditCase.targetBatch !== 'P5-A4b') errors.push(`${path}.auditCaseId must map to targetBatch P5-A4b`);
  }
  return errors;
}

export function validateBoundaryInputResolutionV6(value: unknown): BoundaryInputResolutionV6 {
  const errors = getBoundaryInputResolutionV6ValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v6 boundary input resolution:\n${errors.join('\n')}`);
  return value as BoundaryInputResolutionV6;
}

function getBoundaryInputResolutionRegistryValidationErrorsForSpec(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[],
  spec: ResolutionContractSpec,
  validateItem: (item: unknown, path: string, auditRegistry: readonly BoundaryInputAuditCase[]) => readonly string[],
): readonly string[] {
  if (!Array.isArray(value)) return ['boundaryInputResolutions must be an array'];
  const errors: string[] = [];
  const ids = new Set<string>();
  const auditIds = new Set<string>();
  const auditMap = auditCaseById(auditRegistry);

  value.forEach((item, index) => {
    const path = `boundaryInputResolutions[${index}]`;
    const itemErrors = validateItem(item, path, auditRegistry);
    errors.push(...itemErrors);
    if (itemErrors.length === 0 && isRecord(item)) {
      const resolutionId = item.resolutionId;
      const auditCaseId = item.auditCaseId;
      if (typeof resolutionId === 'string') {
        if (ids.has(resolutionId)) errors.push(`${path}.resolutionId duplicates ${resolutionId}`);
        ids.add(resolutionId);
      }
      if (typeof auditCaseId === 'string') {
        if (auditIds.has(auditCaseId)) errors.push(`${path}.auditCaseId duplicates ${auditCaseId}`);
        auditIds.add(auditCaseId);
      }
    }
  });

  if (value.length !== spec.auditCaseIds.length) {
    errors.push(`boundaryInputResolutions must contain exactly ${spec.auditCaseIds.length} resolutions`);
  }
  for (const auditCaseId of spec.auditCaseIds) {
    if (!auditMap.has(auditCaseId)) errors.push(`audit registry is missing ${auditCaseId}`);
    if (!auditIds.has(auditCaseId)) errors.push(`resolution registry is missing ${auditCaseId}`);
  }
  for (const auditCaseId of auditIds) {
    if (!spec.auditCaseIds.includes(auditCaseId)) {
      errors.push(`resolution registry contains unsupported auditCaseId ${auditCaseId}`);
    }
  }
  return errors;
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

export function getBoundaryInputResolutionV2RegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  return getBoundaryInputResolutionRegistryValidationErrorsForSpec(
    value,
    auditRegistry,
    V2_RESOLUTION_SPEC,
    getBoundaryInputResolutionV2ValidationErrors,
  );
}

export function validateBoundaryInputResolutionV2Registry(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly BoundaryInputResolutionV2[] {
  const errors = getBoundaryInputResolutionV2RegistryValidationErrors(value, auditRegistry);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v2 boundary input resolution registry:\n${errors.join('\n')}`);
  return value as readonly BoundaryInputResolutionV2[];
}

export function getBoundaryInputResolutionV3RegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  return getBoundaryInputResolutionRegistryValidationErrorsForSpec(
    value,
    auditRegistry,
    V3_RESOLUTION_SPEC,
    getBoundaryInputResolutionV3ValidationErrors,
  );
}

export function validateBoundaryInputResolutionV3Registry(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly BoundaryInputResolutionV3[] {
  const errors = getBoundaryInputResolutionV3RegistryValidationErrors(value, auditRegistry);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v3 boundary input resolution registry:\n${errors.join('\n')}`);
  return value as readonly BoundaryInputResolutionV3[];
}

export function getBoundaryInputResolutionV4RegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  return getBoundaryInputResolutionRegistryValidationErrorsForSpec(
    value,
    auditRegistry,
    V4_RESOLUTION_SPEC,
    getBoundaryInputResolutionV4ValidationErrors,
  );
}

export function validateBoundaryInputResolutionV4Registry(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly BoundaryInputResolutionV4[] {
  const errors = getBoundaryInputResolutionV4RegistryValidationErrors(value, auditRegistry);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v4 boundary input resolution registry:\n${errors.join('\n')}`);
  return value as readonly BoundaryInputResolutionV4[];
}

export function getBoundaryInputResolutionV5RegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  return getBoundaryInputResolutionRegistryValidationErrorsForSpec(
    value,
    auditRegistry,
    V5_RESOLUTION_SPEC,
    getBoundaryInputResolutionV5ValidationErrors,
  );
}

export function validateBoundaryInputResolutionV5Registry(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly BoundaryInputResolutionV5[] {
  const errors = getBoundaryInputResolutionV5RegistryValidationErrors(value, auditRegistry);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v5 boundary input resolution registry:\n${errors.join('\n')}`);
  return value as readonly BoundaryInputResolutionV5[];
}

export function getBoundaryInputResolutionV6RegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  return getBoundaryInputResolutionRegistryValidationErrorsForSpec(
    value,
    auditRegistry,
    V6_RESOLUTION_SPEC,
    getBoundaryInputResolutionV6ValidationErrors,
  );
}

export function validateBoundaryInputResolutionV6Registry(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly BoundaryInputResolutionV6[] {
  const errors = getBoundaryInputResolutionV6RegistryValidationErrors(value, auditRegistry);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b v6 boundary input resolution registry:\n${errors.join('\n')}`);
  return value as readonly BoundaryInputResolutionV6[];
}

/** Version-aware entry points for consumers that receive a serialized overlay. */
export function getBoundaryInputResolutionVersionedValidationErrors(
  value: unknown,
  path = 'boundaryInputResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  if (isRecord(value) && value.contractVersion === BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION) {
    return getBoundaryInputResolutionV6ValidationErrors(value, path, auditRegistry);
  }
  if (isRecord(value) && value.contractVersion === BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION) {
    return getBoundaryInputResolutionV5ValidationErrors(value, path, auditRegistry);
  }
  if (isRecord(value) && value.contractVersion === BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION) {
    return getBoundaryInputResolutionV4ValidationErrors(value, path, auditRegistry);
  }
  if (isRecord(value) && value.contractVersion === BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION) {
    return getBoundaryInputResolutionV3ValidationErrors(value, path, auditRegistry);
  }
  if (isRecord(value) && value.contractVersion === BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION) {
    return getBoundaryInputResolutionV2ValidationErrors(value, path, auditRegistry);
  }
  return getBoundaryInputResolutionValidationErrors(value, path, auditRegistry);
}

export function validateBoundaryInputResolutionVersioned(value: unknown): BoundaryInputResolutionVersioned {
  const errors = getBoundaryInputResolutionVersionedValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b boundary input resolution:\n${errors.join('\n')}`);
  return value as BoundaryInputResolutionVersioned;
}

export function getBoundaryInputResolutionVersionedRegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return ['boundaryInputResolutions must be a non-empty array'];
  }
  const versions = new Set(value.map((item) => (isRecord(item) ? item.contractVersion : undefined)));
  if (versions.size !== 1) return ['boundaryInputResolutions must contain exactly one contract version'];
  if (versions.has(BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION)) {
    return getBoundaryInputResolutionV6RegistryValidationErrors(value, auditRegistry);
  }
  if (versions.has(BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION)) {
    return getBoundaryInputResolutionV5RegistryValidationErrors(value, auditRegistry);
  }
  if (versions.has(BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION)) {
    return getBoundaryInputResolutionV4RegistryValidationErrors(value, auditRegistry);
  }
  if (versions.has(BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION)) {
    return getBoundaryInputResolutionV3RegistryValidationErrors(value, auditRegistry);
  }
  if (versions.has(BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION)) {
    return getBoundaryInputResolutionV2RegistryValidationErrors(value, auditRegistry);
  }
  return getBoundaryInputResolutionRegistryValidationErrors(value, auditRegistry);
}

export function validateBoundaryInputResolutionVersionedRegistry(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly BoundaryInputResolutionVersioned[] {
  const errors = getBoundaryInputResolutionVersionedRegistryValidationErrors(value, auditRegistry);
  if (errors.length > 0) throw new Error(`Invalid P5-A4b boundary input resolution registry:\n${errors.join('\n')}`);
  return value as readonly BoundaryInputResolutionVersioned[];
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

export const P5_A4B_INPUT_RESOLUTION_V2_CASES: readonly BoundaryInputResolutionV2[] = [
  ...P5_A4B_INPUT_RESOLUTION_CASES.map((resolution): BoundaryInputResolutionV2 => ({
    ...resolution,
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION,
  })),
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-liuyao-invalid-date',
    auditCaseId: 'p5-a4a-liuyao-invalid-date',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '六爻日期先按原始 civil 年月日时分秒严格校验，再将 Z 或数值偏移转换为 Asia/Shanghai 民用时间。',
    testRefs: ['tests/p5-liuyao-input-validation.regression.mjs#liuyao-invalid-date'],
    notes: '只关闭六爻日期输入合法性 gap；日期范围、DST、缺时辰和引擎错误分类仍不在本批。',
  },
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V2_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-liuyao-invalid-seed',
    auditCaseId: 'p5-a4a-liuyao-invalid-seed',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '六爻 seed 仅接受原始长度不超过 256 的非空字符串，并保留合法原字符串进入 payload 与 inputSnapshot。',
    testRefs: ['tests/p5-liuyao-input-validation.regression.mjs#liuyao-invalid-seed'],
    notes: '只关闭六爻 seed 输入合法性 gap；seedScope 仍固定为 guanxiang-local-v1，不改变引擎失败 taxonomy。',
  },
] as const;

export const P5_A4B_INPUT_RESOLUTION_V3_CASES: readonly BoundaryInputResolutionV3[] = [
  ...P5_A4B_INPUT_RESOLUTION_V2_CASES.map((resolution): BoundaryInputResolutionV3 => ({
    ...resolution,
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION,
  })),
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V3_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-bazi-true-solar-cross-day',
    auditCaseId: 'p5-a4a-bazi-true-solar-cross-day',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '八字真太阳时回归矩阵冻结 120°E 标准经线两侧的正负修正、民用跨日和 midnight/ziEarly 最终有效计算时刻。',
    testRefs: ['tests/p5-bazi-true-solar-boundary.regression.mjs#bazi-true-solar-cross-day-matrix'],
    notes: '只关闭当前 regression-only 边界证据 gap；沿用已验收 NOAA v2 实现，不宣称专业或独立真值，不修改公式或日界线。',
  },
] as const;

export const P5_A4B_INPUT_RESOLUTION_V4_CASES: readonly BoundaryInputResolutionV4[] = [
  ...P5_A4B_INPUT_RESOLUTION_V3_CASES.map((resolution): BoundaryInputResolutionV4 => ({
    ...resolution,
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION,
  })),
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-ziwei-lunar-input',
    auditCaseId: 'p5-a4a-ziwei-lunar-input',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '紫微农历路径在进入 iztro 前按固定 lunar-javascript 日历数据校验日期格式、月份和当月实际日数。',
    testRefs: ['tests/p5-ziwei-lunar-input.regression.mjs#ziwei-lunar-input'],
    notes: '只关闭紫微农历日期输入合法性 gap；日历库边界是工程输入契约，不宣称独立历法或紫微专业真值。',
  },
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V4_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-ziwei-leap-month',
    auditCaseId: 'p5-a4a-ziwei-leap-month',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '紫微农历闰月路径在进入 iztro 前按 lunar-javascript 年历核对闰月存在性，并拒绝不存在的闰月组合。',
    testRefs: ['tests/p5-ziwei-lunar-input.regression.mjs#ziwei-leap-month'],
    notes: '闰月只作为输入事实传递给既有 iztro 排盘；不复用未声明的四柱流派规则，也不改变排盘算法。',
  },
] as const;

export const P5_A4B_INPUT_RESOLUTION_V5_CASES: readonly BoundaryInputResolutionV5[] = [
  ...P5_A4B_INPUT_RESOLUTION_V4_CASES.map((resolution): BoundaryInputResolutionV5 => ({
    ...resolution,
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION,
  })),
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-ziwei-engine-error-path',
    auditCaseId: 'p5-a4a-ziwei-engine-error-path',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '紫微引擎及盘面映射异常统一收敛为稳定、JSON-safe、fail-closed 的模块化安全错误，不返回部分盘。',
    testRefs: ['tests/p5-engine-errors.regression.mjs#ziwei-engine-error-path'],
    notes: '只关闭紫微 engine-error gap；输入 ChartInputError 原样重抛，正常成功盘、算法与公开日期边界保持不变。',
  },
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-astrology-engine-error-path',
    auditCaseId: 'p5-a4a-astrology-engine-error-path',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '占星引擎及盘面映射异常统一收敛为稳定、JSON-safe、fail-closed 的模块化安全错误，不返回部分盘。',
    testRefs: ['tests/p5-engine-errors.regression.mjs#astrology-engine-error-path'],
    notes: '只关闭占星 engine-error gap；保留既有 unknown-city/0,0 近似盘行为，不改变 Astrology 0,0/no-guessing 证据。',
  },
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-liuyao-engine-error-path',
    auditCaseId: 'p5-a4a-liuyao-engine-error-path',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '六爻异步引擎及盘面映射异常统一收敛为稳定、JSON-safe、fail-closed 的模块化安全错误，不返回部分盘。',
    testRefs: ['tests/p5-engine-errors.regression.mjs#liuyao-engine-error-path'],
    notes: '只关闭六爻 engine-error gap；输入校验、seedScope 和成功盘结构保持兼容。',
  },
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V5_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-cross-error-copy-failure-mode',
    auditCaseId: 'p5-a4a-cross-error-copy-failure-mode',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '四模块共享同一安全失败 contract、模块标识和用户可见失败文案，跨模块不复制底层异常细节且稳定错误不重复包装。',
    testRefs: ['tests/p5-engine-errors.regression.mjs#cross-module-error-contract'],
    notes: '仅收敛跨模块 engine-error 语义；不扩展 UI redesign，不改变 A4a immutable registry 或跨模块 no-guessing gap。',
  },
] as const;

export const P5_A4B_INPUT_RESOLUTION_V6_CASES: readonly BoundaryInputResolutionV6[] = [
  ...P5_A4B_INPUT_RESOLUTION_V5_CASES.map((resolution): BoundaryInputResolutionV6 => ({
    ...resolution,
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION,
  })),
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-astrology-missing-coordinate',
    auditCaseId: 'p5-a4a-astrology-missing-coordinate',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '占星缺少成对显式坐标且城市无法识别时直接 fail-fast，要求补充城市或成对坐标，不再把 0,0 传入 Horoscope。',
    testRefs: ['tests/p5-astrology-safety.regression.mjs#missing-coordinate-fail-fast'],
    notes: '旧 A4a registry 与 0,0 probe 证据保持 immutable；新行为通过累计 v6 additive resolution 记录。',
  },
  {
    contractVersion: BOUNDARY_INPUT_RESOLUTION_V6_CONTRACT_VERSION,
    resolutionId: 'p5-a4b-resolve-cross-no-guessing',
    auditCaseId: 'p5-a4a-cross-no-guessing',
    status: 'resolved',
    targetBatch: 'P5-A4b',
    summary: '占星地点解析与时辰精度统一 fail-closed：显式成对坐标优先，未知城市不猜测，不输出依赖未知时辰的角点、宫位或相位。',
    testRefs: ['tests/p5-astrology-safety.regression.mjs#cross-module-no-guessing'],
    notes: '只扩展占星安全解析和日期级精度边界；A4a immutable 统计、原始 evidence 文本与其他术数保持不变。',
  },
] as const;

validateBoundaryInputResolutionRegistry(P5_A4B_INPUT_RESOLUTION_CASES);
validateBoundaryInputResolutionV2Registry(P5_A4B_INPUT_RESOLUTION_V2_CASES);
validateBoundaryInputResolutionV3Registry(P5_A4B_INPUT_RESOLUTION_V3_CASES);
validateBoundaryInputResolutionV4Registry(P5_A4B_INPUT_RESOLUTION_V4_CASES);
validateBoundaryInputResolutionV5Registry(P5_A4B_INPUT_RESOLUTION_V5_CASES);
validateBoundaryInputResolutionV6Registry(P5_A4B_INPUT_RESOLUTION_V6_CASES);
