export const GOLDEN_CASE_CONTRACT_VERSION = 'golden-case.v1' as const;

export const GOLDEN_MODULES = ['bazi', 'liuyao', 'ziwei', 'astrology'] as const;
export type GoldenModule = (typeof GOLDEN_MODULES)[number];

export const GOLDEN_VALIDATION_CLASSES = [
  'independent-validation',
  'regression-only',
  'pending-verification',
] as const;
export type GoldenValidationClass = (typeof GOLDEN_VALIDATION_CLASSES)[number];

export const GOLDEN_SOURCE_TYPES = [
  'independent-library',
  'published-reference',
  'repository-fixture',
  'current-output',
  'manual-review',
] as const;
export type GoldenSourceType = (typeof GOLDEN_SOURCE_TYPES)[number];

export const INDEPENDENT_VERIFICATION_STATUSES = ['verified', 'not-verified', 'pending'] as const;
export type IndependentVerificationStatus = (typeof INDEPENDENT_VERIFICATION_STATUSES)[number];

export const INDEPENDENT_VERIFICATION_SCOPES = [
  'technical-cross-check',
  'published-comparison',
  'professional-review',
  'regression-only',
  'pending',
] as const;
export type IndependentVerificationScope = (typeof INDEPENDENT_VERIFICATION_SCOPES)[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };
export type JsonObject = { readonly [key: string]: JsonValue };

export interface GoldenSourceReference {
  type: GoldenSourceType;
  locator: string;
  purpose: string;
}

export interface IndependentVerification {
  status: IndependentVerificationStatus;
  method: string;
  scope: IndependentVerificationScope;
  notes?: string;
}

export interface GoldenCase {
  contractVersion: typeof GOLDEN_CASE_CONTRACT_VERSION;
  id: string;
  module: GoldenModule;
  validationClass: GoldenValidationClass;
  input: JsonObject;
  calculationSettings: JsonObject;
  sourceReferences: readonly GoldenSourceReference[];
  sourceType: GoldenSourceType;
  independentVerification: IndependentVerification;
  expectedFacts: JsonObject;
  expectedEvidence: JsonObject;
  expectedInterpretation: JsonObject;
  expectedExplanation?: JsonObject;
  knownDisputes: readonly string[];
  verifiedBy: string | null;
  verifiedAt: string | null;
}
