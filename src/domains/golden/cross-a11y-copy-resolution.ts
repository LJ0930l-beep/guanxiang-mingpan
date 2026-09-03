import {
  P5_C_DEFERRED_INPUT_ROUTE_CASES,
  P5_C_DEFERRED_INPUT_ROUTE_ID,
} from '@/domains/golden/boundary-input-deferred-route';
import {
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  type BoundaryInputAuditCase,
} from '@/domains/golden/boundary-input-contract';

/**
 * Additive closure for the historical P5-C route.
 *
 * The deferred route is intentionally immutable history: changing it from
 * `not-implemented` would erase why the work was scheduled. This overlay is
 * the current implementation evidence and can be audited without rewriting
 * the original A4a registry or its route record.
 */
export const P5_C_CROSS_A11Y_COPY_RESOLUTION_CONTRACT_VERSION = 'p5-c-cross-a11y-copy-resolution.v1' as const;
export const P5_C_CROSS_A11Y_COPY_RESOLUTION_STATUS = 'resolved' as const;
export const P5_C_CROSS_A11Y_COPY_RESOLUTION_IMPLEMENTATION_STATUS = 'implemented' as const;
export const P5_C_CROSS_A11Y_COPY_RESOLUTION_TARGET_BATCH = 'P5-C' as const;
export const P5_C_CROSS_A11Y_COPY_RESOLUTION_AUDIT_CASE_ID = 'p5-a4a-cross-a11y-copy-route' as const;

export interface P5CCrossA11yCopyResolution {
  contractVersion: typeof P5_C_CROSS_A11Y_COPY_RESOLUTION_CONTRACT_VERSION;
  resolutionId: 'p5-c-cross-a11y-copy-resolution';
  auditCaseId: typeof P5_C_CROSS_A11Y_COPY_RESOLUTION_AUDIT_CASE_ID;
  sourceRouteId: typeof P5_C_DEFERRED_INPUT_ROUTE_ID;
  status: typeof P5_C_CROSS_A11Y_COPY_RESOLUTION_STATUS;
  implementationStatus: typeof P5_C_CROSS_A11Y_COPY_RESOLUTION_IMPLEMENTATION_STATUS;
  targetBatch: typeof P5_C_CROSS_A11Y_COPY_RESOLUTION_TARGET_BATCH;
  summary: string;
  evidenceRefs: readonly string[];
  routes: readonly string[];
  states: readonly string[];
  notes: string;
}

const TEST_REF_PATTERN = /^tests\/[^\s#]+(?:#[^\r\n]+)?$/;
const ROUTE_PATTERN = /^\/(?:[a-z0-9+\[\]-]+)(?:\/[a-z0-9+\[\]-]+)*$/;
const REQUIRED_STATES = ['loading', 'empty', 'failure', 'partial', 'blocked', 'unknown'] as const;
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function auditCaseById(auditRegistry: readonly BoundaryInputAuditCase[]): BoundaryInputAuditCase | undefined {
  return auditRegistry.find((item) => item.id === P5_C_CROSS_A11Y_COPY_RESOLUTION_AUDIT_CASE_ID);
}

function validateValue(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) return [`${path} must be an object`];
  const required = [
    'contractVersion', 'resolutionId', 'auditCaseId', 'sourceRouteId',
    'status', 'implementationStatus', 'targetBatch', 'summary', 'evidenceRefs',
    'routes', 'states', 'notes',
  ];
  for (const property of required) {
    if (!Object.prototype.hasOwnProperty.call(value, property)) errors.push(`${path}.${property} is required`);
  }
  if (value.contractVersion !== P5_C_CROSS_A11Y_COPY_RESOLUTION_CONTRACT_VERSION) errors.push(`${path}.contractVersion is invalid`);
  if (value.resolutionId !== 'p5-c-cross-a11y-copy-resolution') errors.push(`${path}.resolutionId is invalid`);
  if (value.auditCaseId !== P5_C_CROSS_A11Y_COPY_RESOLUTION_AUDIT_CASE_ID) errors.push(`${path}.auditCaseId is invalid`);
  if (value.sourceRouteId !== P5_C_DEFERRED_INPUT_ROUTE_ID) errors.push(`${path}.sourceRouteId must reference the immutable P5-C route`);
  if (value.status !== P5_C_CROSS_A11Y_COPY_RESOLUTION_STATUS) errors.push(`${path}.status must be resolved`);
  if (value.implementationStatus !== P5_C_CROSS_A11Y_COPY_RESOLUTION_IMPLEMENTATION_STATUS) errors.push(`${path}.implementationStatus must be implemented`);
  if (value.targetBatch !== P5_C_CROSS_A11Y_COPY_RESOLUTION_TARGET_BATCH) errors.push(`${path}.targetBatch must be P5-C`);
  if (!isNonEmptyString(value.summary)) errors.push(`${path}.summary must be a non-empty string`);
  if (!isNonEmptyString(value.notes)) errors.push(`${path}.notes must be a non-empty string`);
  if (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.length === 0 || value.evidenceRefs.some((item) => typeof item !== 'string' || !TEST_REF_PATTERN.test(item))) {
    errors.push(`${path}.evidenceRefs must contain test repository references`);
  }
  if (!Array.isArray(value.routes) || value.routes.length === 0 || value.routes.some((item) => typeof item !== 'string' || !ROUTE_PATTERN.test(item))) {
    errors.push(`${path}.routes must contain route paths`);
  }
  const states = Array.isArray(value.states) ? value.states : undefined;
  if (!states || states.length !== REQUIRED_STATES.length || REQUIRED_STATES.some((state) => !states.includes(state))) {
    errors.push(`${path}.states must cover the shared six-state matrix`);
  }
  return errors;
}

export function getP5CCrossA11yCopyResolutionValidationErrors(
  value: unknown,
  path = 'p5CCrossA11yCopyResolution',
  auditRegistry: readonly BoundaryInputAuditCase[] = P5_BOUNDARY_INPUT_AUDIT_CASES,
): readonly string[] {
  const errors = validateValue(value, path);
  if (errors.length > 0 || !isRecord(value)) return errors;
  const auditCase = auditCaseById(auditRegistry);
  if (!auditCase) errors.push(`${path}.auditCaseId must exist in the immutable A4a registry`);
  else {
    if (auditCase.status !== 'gap') errors.push(`${path}.auditCaseId must remain an original gap`);
    if (auditCase.targetBatch !== 'P5-C') errors.push(`${path}.auditCaseId must target P5-C`);
  }
  const route = P5_C_DEFERRED_INPUT_ROUTE_CASES.find((item) => item.routeId === value.sourceRouteId);
  if (!route) errors.push(`${path}.sourceRouteId must exist in the deferred route registry`);
  else if (route.auditCaseId !== value.auditCaseId || route.implementationStatus !== 'not-implemented') {
    errors.push(`${path}.sourceRouteId must reference the historical not-implemented route`);
  }
  return errors;
}

export function validateP5CCrossA11yCopyResolution(value: unknown): P5CCrossA11yCopyResolution {
  const errors = getP5CCrossA11yCopyResolutionValidationErrors(value);
  if (errors.length > 0) throw new Error(`Invalid P5-C cross-a11y-copy resolution:\n${errors.join('\n')}`);
  return value as P5CCrossA11yCopyResolution;
}

export const P5_C_CROSS_A11Y_COPY_RESOLUTION: P5CCrossA11yCopyResolution = {
  contractVersion: P5_C_CROSS_A11Y_COPY_RESOLUTION_CONTRACT_VERSION,
  resolutionId: 'p5-c-cross-a11y-copy-resolution',
  auditCaseId: P5_C_CROSS_A11Y_COPY_RESOLUTION_AUDIT_CASE_ID,
  sourceRouteId: P5_C_DEFERRED_INPUT_ROUTE_ID,
  status: P5_C_CROSS_A11Y_COPY_RESOLUTION_STATUS,
  implementationStatus: P5_C_CROSS_A11Y_COPY_RESOLUTION_IMPLEMENTATION_STATUS,
  targetBatch: P5_C_CROSS_A11Y_COPY_RESOLUTION_TARGET_BATCH,
  summary: 'P5-C 页面级 UX、可访问性和状态文案矩阵已由真实路由实现覆盖。',
  evidenceRefs: [
    'tests/p5-c-page-accessibility.regression.mjs#P5-C 四术工作区具备真实生成、保存、失败恢复和部分状态通路',
    'tests/p5-c-page-accessibility.regression.mjs#P5-C 状态文案矩阵覆盖 loading/empty/failure/partial/blocked/unknown 且不承诺结果',
  ],
  routes: ['/home', '/profiles', '/records', '/settings', '/module/[slug]'],
  states: [...REQUIRED_STATES],
  notes: '原始 A4a registry 与历史 deferred route 保持不变；本 additive resolution 只记录当前代码与测试证据，不替代 Sol High 独立验收或实体设备验收。',
};

validateP5CCrossA11yCopyResolution(P5_C_CROSS_A11Y_COPY_RESOLUTION);
