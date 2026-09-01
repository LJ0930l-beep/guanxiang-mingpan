import {
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  type BoundaryInputAuditCase,
} from '@/domains/golden/boundary-input-contract';

/**
 * Additive disposition for boundary cases that belong to a later release gate.
 * This is deliberately separate from the P5-A4b resolved-input overlay: a
 * deferred route must never look like a completed calculation feature.
 */
export const P5_C_DEFERRED_INPUT_ROUTE_CONTRACT_VERSION = 'p5-c-deferred-input-route.v1' as const;
export const P5_C_DEFERRED_INPUT_ROUTE_STATUS = 'deferred' as const;
export const P5_C_DEFERRED_INPUT_ROUTE_DISPOSITION = 'routed-to-p5-c' as const;
export const P5_C_DEFERRED_INPUT_ROUTE_IMPLEMENTATION_STATUS = 'not-implemented' as const;
export const P5_C_DEFERRED_INPUT_ROUTE_TARGET_BATCH = 'P5-C' as const;
export const P5_C_DEFERRED_INPUT_ROUTE_ID = 'p5-c-deferred-cross-a11y-copy-route' as const;

export const P5_C_DEFERRED_INPUT_ROUTE_AUDIT_CASE_IDS = [
  'p5-a4a-cross-a11y-copy-route',
] as const;

export type P5CDeferredInputRouteAuditCaseId = (typeof P5_C_DEFERRED_INPUT_ROUTE_AUDIT_CASE_IDS)[number];

export interface P5CDeferredInputRoute {
  contractVersion: typeof P5_C_DEFERRED_INPUT_ROUTE_CONTRACT_VERSION;
  routeId: string;
  auditCaseId: P5CDeferredInputRouteAuditCaseId;
  status: typeof P5_C_DEFERRED_INPUT_ROUTE_STATUS;
  disposition: typeof P5_C_DEFERRED_INPUT_ROUTE_DISPOSITION;
  implementationStatus: typeof P5_C_DEFERRED_INPUT_ROUTE_IMPLEMENTATION_STATUS;
  targetBatch: typeof P5_C_DEFERRED_INPUT_ROUTE_TARGET_BATCH;
  summary: string;
  testRefs: readonly string[];
  notes: string;
}

const ROUTE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEST_REF_PATTERN = /^tests\/[^\s#]+(?:#[^\s]+)?$/;
const REQUIRED_ROUTE_SUMMARY = '路由到 P5-C，功能尚未实现';

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

function isSupportedAuditCaseId(value: unknown): value is P5CDeferredInputRouteAuditCaseId {
  return typeof value === 'string'
    && P5_C_DEFERRED_INPUT_ROUTE_AUDIT_CASE_IDS.includes(value as P5CDeferredInputRouteAuditCaseId);
}

function auditCaseById(auditRegistry: readonly BoundaryInputAuditCase[]): Map<string, BoundaryInputAuditCase> {
  return new Map(auditRegistry.map((auditCase) => [auditCase.id, auditCase]));
}

function validateRouteValue(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return [`${path} must be an object`];
  collectJsonErrors(value, path, errors, new WeakSet<object>());

  for (const property of [
    'contractVersion',
    'routeId',
    'auditCaseId',
    'status',
    'disposition',
    'implementationStatus',
    'targetBatch',
    'summary',
    'testRefs',
    'notes',
  ]) {
    if (!Object.prototype.hasOwnProperty.call(value, property)) errors.push(`${path}.${property} is required`);
  }

  if (value.contractVersion !== P5_C_DEFERRED_INPUT_ROUTE_CONTRACT_VERSION) {
    errors.push(`${path}.contractVersion must be ${P5_C_DEFERRED_INPUT_ROUTE_CONTRACT_VERSION}`);
  }
  if (typeof value.routeId !== 'string' || !ROUTE_ID_PATTERN.test(value.routeId)) {
    errors.push(`${path}.routeId must be a stable kebab-case identifier`);
  }
  if (!isSupportedAuditCaseId(value.auditCaseId)) errors.push(`${path}.auditCaseId is not supported`);
  if (value.status !== P5_C_DEFERRED_INPUT_ROUTE_STATUS) {
    errors.push(`${path}.status must be deferred`);
  }
  if (value.disposition !== P5_C_DEFERRED_INPUT_ROUTE_DISPOSITION) {
    errors.push(`${path}.disposition must be routed-to-p5-c`);
  }
  if (value.implementationStatus !== P5_C_DEFERRED_INPUT_ROUTE_IMPLEMENTATION_STATUS) {
    errors.push(`${path}.implementationStatus must be not-implemented`);
  }
  if (value.targetBatch !== P5_C_DEFERRED_INPUT_ROUTE_TARGET_BATCH) {
    errors.push(`${path}.targetBatch must be P5-C`);
  }
  if (!isNonEmptyString(value.summary)) {
    errors.push(`${path}.summary must be a non-empty string`);
  } else if (!value.summary.includes(REQUIRED_ROUTE_SUMMARY)) {
    errors.push(`${path}.summary must explicitly say routed to P5-C and not implemented`);
  }
  if (!Array.isArray(value.testRefs)
    || value.testRefs.length === 0
    || value.testRefs.some((ref) => typeof ref !== 'string' || !TEST_REF_PATTERN.test(ref))) {
    errors.push(`${path}.testRefs must contain one or more test repository references`);
  }
  if (!isNonEmptyString(value.notes)) errors.push(`${path}.notes must be a non-empty string`);
  return errors;
}

export function getP5CDeferredInputRouteValidationErrors(
  value: unknown,
  path = 'p5CDeferredInputRoute',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  const errors = validateRouteValue(value, path);
  if (errors.length > 0 || !isRecord(value) || !isSupportedAuditCaseId(value.auditCaseId)) return errors;
  const auditCase = auditCaseById(auditRegistry).get(value.auditCaseId);
  if (!auditCase) {
    errors.push(`${path}.auditCaseId must exist in the P5-A4a audit registry`);
  } else {
    if (auditCase.status !== 'gap') errors.push(`${path}.auditCaseId must remain an original gap case`);
    if (auditCase.targetBatch !== 'P5-C') errors.push(`${path}.auditCaseId must map to targetBatch P5-C`);
  }
  return errors;
}

export function validateP5CDeferredInputRoute(value: unknown): P5CDeferredInputRoute {
  const errors = getP5CDeferredInputRouteValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-C deferred input route:\n${errors.join('\n')}`);
  return value as P5CDeferredInputRoute;
}

export function getP5CDeferredInputRouteRegistryValidationErrors(
  value: unknown,
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  if (!Array.isArray(value)) return ['p5CDeferredInputRoutes must be an array'];
  const errors: string[] = [];
  const routeIds = new Set<string>();
  const auditCaseIds = new Set<string>();

  value.forEach((item, index) => {
    const path = `p5CDeferredInputRoutes[${index}]`;
    const itemErrors = getP5CDeferredInputRouteValidationErrors(item, path, auditRegistry);
    errors.push(...itemErrors);
    if (itemErrors.length === 0 && isRecord(item)) {
      if (typeof item.routeId === 'string') {
        if (routeIds.has(item.routeId)) errors.push(`${path}.routeId duplicates ${item.routeId}`);
        routeIds.add(item.routeId);
      }
      if (typeof item.auditCaseId === 'string') {
        if (auditCaseIds.has(item.auditCaseId)) errors.push(`${path}.auditCaseId duplicates ${item.auditCaseId}`);
        auditCaseIds.add(item.auditCaseId);
      }
    }
  });

  if (value.length !== P5_C_DEFERRED_INPUT_ROUTE_AUDIT_CASE_IDS.length) {
    errors.push(`p5CDeferredInputRoutes must contain exactly ${P5_C_DEFERRED_INPUT_ROUTE_AUDIT_CASE_IDS.length} route`);
  }
  const auditMap = auditCaseById(auditRegistry);
  for (const auditCaseId of P5_C_DEFERRED_INPUT_ROUTE_AUDIT_CASE_IDS) {
    if (!auditMap.has(auditCaseId)) errors.push(`audit registry is missing ${auditCaseId}`);
    if (!auditCaseIds.has(auditCaseId)) errors.push(`route registry is missing ${auditCaseId}`);
  }
  for (const auditCaseId of auditCaseIds) {
    if (!P5_C_DEFERRED_INPUT_ROUTE_AUDIT_CASE_IDS.includes(auditCaseId as P5CDeferredInputRouteAuditCaseId)) {
      errors.push(`route registry contains unsupported auditCaseId ${auditCaseId}`);
    }
  }
  return errors;
}

export function validateP5CDeferredInputRouteRegistry(value: unknown): readonly P5CDeferredInputRoute[] {
  const errors = getP5CDeferredInputRouteRegistryValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-C deferred input route registry:\n${errors.join('\n')}`);
  return value as readonly P5CDeferredInputRoute[];
}

export const P5_C_DEFERRED_INPUT_ROUTE_CASES: readonly P5CDeferredInputRoute[] = [
  {
    contractVersion: P5_C_DEFERRED_INPUT_ROUTE_CONTRACT_VERSION,
    routeId: P5_C_DEFERRED_INPUT_ROUTE_ID,
    auditCaseId: 'p5-a4a-cross-a11y-copy-route',
    status: P5_C_DEFERRED_INPUT_ROUTE_STATUS,
    disposition: P5_C_DEFERRED_INPUT_ROUTE_DISPOSITION,
    implementationStatus: P5_C_DEFERRED_INPUT_ROUTE_IMPLEMENTATION_STATUS,
    targetBatch: P5_C_DEFERRED_INPUT_ROUTE_TARGET_BATCH,
    summary: '路由到 P5-C，功能尚未实现。',
    testRefs: ['tests/p5-deferred-input-route.regression.mjs#cross-a11y-copy-route-deferred'],
    notes: '此条仅登记后续批次归属，不表示功能已完成；P5-C 必须另行完成键盘、读屏、字体缩放、减少动态效果、对比度、触控目标和错误文案矩阵后才能关闭。',
  },
] as const;

validateP5CDeferredInputRouteRegistry(P5_C_DEFERRED_INPUT_ROUTE_CASES);
