export { GOLDEN_CASE_REGISTRY } from '@/domains/golden/registry';
export { HKO_PUBLISHED_REFERENCE_GOLDEN_CASES } from '@/domains/golden/published-references';
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
