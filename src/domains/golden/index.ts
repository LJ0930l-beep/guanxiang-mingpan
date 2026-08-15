export { GOLDEN_CASE_REGISTRY } from '@/domains/golden/registry';
export { HKO_PUBLISHED_REFERENCE_GOLDEN_CASES } from '@/domains/golden/published-references';
export {
  BOUNDARY_INPUT_AUDIT_CONTRACT_VERSION,
  BOUNDARY_AUDIT_CATEGORIES,
  BOUNDARY_AUDIT_MODULES,
  BOUNDARY_AUDIT_STATUSES,
  BOUNDARY_AUDIT_TARGET_BATCHES,
  P5_BOUNDARY_INPUT_AUDIT_CASES,
  getBoundaryInputAuditValidationErrors,
  validateBoundaryInputAuditCase,
  validateBoundaryInputAuditRegistry,
  type BoundaryAuditCategory,
  type BoundaryAuditModule,
  type BoundaryAuditStatus,
  type BoundaryAuditTargetBatch,
  type BoundaryInputAuditCase,
} from '@/domains/golden/boundary-input-contract';
export {
  BOUNDARY_INPUT_RESOLUTION_AUDIT_CASE_IDS,
  BOUNDARY_INPUT_RESOLUTION_CONTRACT_VERSION,
  BOUNDARY_INPUT_RESOLUTION_STATUS,
  P5_A4B_INPUT_RESOLUTION_CASES,
  getBoundaryInputResolutionRegistryValidationErrors,
  getBoundaryInputResolutionValidationErrors,
  validateBoundaryInputResolution,
  validateBoundaryInputResolutionRegistry,
  type BoundaryInputResolution,
  type BoundaryInputResolutionAuditCaseId,
} from '@/domains/golden/boundary-input-resolution';
export {
  getGoldenCaseValidationErrors,
  validateGoldenCase,
  validateGoldenCaseRegistry,
} from '@/domains/golden/validator';
export {
  GOLDEN_CASE_CONTRACT_VERSION,
  GOLDEN_MODULES,
  GOLDEN_SOURCE_TYPES,
  GOLDEN_VALIDATION_CLASSES,
  INDEPENDENT_VERIFICATION_SCOPES,
  INDEPENDENT_VERIFICATION_STATUSES,
  type GoldenCase,
  type GoldenModule,
  type GoldenSourceReference,
  type GoldenSourceType,
  type GoldenValidationClass,
  type IndependentVerification,
  type JsonObject,
  type JsonValue,
} from '@/domains/golden/types';
