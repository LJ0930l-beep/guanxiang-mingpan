import {
  GOLDEN_CASE_CONTRACT_VERSION,
  GOLDEN_MODULES,
  GOLDEN_SOURCE_TYPES,
  GOLDEN_VALIDATION_CLASSES,
  INDEPENDENT_VERIFICATION_SCOPES,
  INDEPENDENT_VERIFICATION_STATUSES,
  type GoldenCase,
  type GoldenSourceReference,
  type JsonObject,
} from '@/domains/golden/types';

const GOLDEN_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_UTC_DATETIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value: UnknownRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isEnumValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === 'string' && values.includes(value);
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

function isJsonObject(value: unknown, path: string, errors: string[]): value is JsonObject {
  const initialErrorCount = errors.length;
  collectJsonErrors(value, path, errors, new WeakSet<object>());
  if (!isRecord(value)) {
    errors.push(`${path} must be a JSON object`);
    return false;
  }
  return errors.length === initialErrorCount;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const dateMatch = ISO_DATE_PATTERN.exec(value);
  if (dateMatch) {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
  }
  const datetimeMatch = ISO_UTC_DATETIME_PATTERN.exec(value);
  if (!datetimeMatch) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getUTCFullYear() === Number(datetimeMatch[1])
    && parsed.getUTCMonth() + 1 === Number(datetimeMatch[2])
    && parsed.getUTCDate() === Number(datetimeMatch[3])
    && parsed.getUTCHours() === Number(datetimeMatch[4])
    && parsed.getUTCMinutes() === Number(datetimeMatch[5])
    && parsed.getUTCSeconds() === Number(datetimeMatch[6]);
}

function validateSourceReference(value: unknown, path: string, errors: string[]): value is GoldenSourceReference {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }
  if (!isEnumValue(GOLDEN_SOURCE_TYPES, value.type)) errors.push(`${path}.type is not a supported source type`);
  if (!isNonEmptyString(value.locator)) errors.push(`${path}.locator must be a non-empty string`);
  if (!isNonEmptyString(value.purpose)) errors.push(`${path}.purpose must be a non-empty string`);
  return errors.length === 0;
}

function validateIndependentVerification(value: unknown, path: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!isEnumValue(INDEPENDENT_VERIFICATION_STATUSES, value.status)) {
    errors.push(`${path}.status is not supported`);
  }
  if (!isNonEmptyString(value.method)) errors.push(`${path}.method must be a non-empty string`);
  if (!isEnumValue(INDEPENDENT_VERIFICATION_SCOPES, value.scope)) {
    errors.push(`${path}.scope is not supported`);
  }
  if (hasOwn(value, 'notes') && typeof value.notes !== 'string') errors.push(`${path}.notes must be a string`);
}

function requireProperty(record: UnknownRecord, property: string, path: string, errors: string[]): boolean {
  if (!hasOwn(record, property)) {
    errors.push(`${path}.${property} is required`);
    return false;
  }
  return true;
}

function validateGoldenCaseValue(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return [`${path} must be an object`];
  }

  // The contract is a pure JSON value in its entirety, not only in the
  // currently-known semantic fields. This also guards future extension
  // fields from silently accepting functions, Date instances, or cycles.
  collectJsonErrors(value, path, errors, new WeakSet<object>());

  const requiredProperties = [
    'contractVersion',
    'id',
    'module',
    'validationClass',
    'input',
    'calculationSettings',
    'sourceReferences',
    'sourceType',
    'independentVerification',
    'expectedFacts',
    'expectedEvidence',
    'expectedInterpretation',
    'knownDisputes',
    'verifiedBy',
    'verifiedAt',
  ];
  requiredProperties.forEach((property) => requireProperty(value, property, path, errors));

  if (value.contractVersion !== GOLDEN_CASE_CONTRACT_VERSION) {
    errors.push(`${path}.contractVersion must be ${GOLDEN_CASE_CONTRACT_VERSION}`);
  }
  if (typeof value.id !== 'string' || !GOLDEN_ID_PATTERN.test(value.id)) {
    errors.push(`${path}.id must be a stable kebab-case identifier`);
  }
  if (!isEnumValue(GOLDEN_MODULES, value.module)) errors.push(`${path}.module is not supported`);
  if (!isEnumValue(GOLDEN_VALIDATION_CLASSES, value.validationClass)) {
    errors.push(`${path}.validationClass is not supported`);
  }

  isJsonObject(value.input, `${path}.input`, errors);
  isJsonObject(value.calculationSettings, `${path}.calculationSettings`, errors);
  isJsonObject(value.expectedFacts, `${path}.expectedFacts`, errors);
  isJsonObject(value.expectedEvidence, `${path}.expectedEvidence`, errors);
  isJsonObject(value.expectedInterpretation, `${path}.expectedInterpretation`, errors);
  if (hasOwn(value, 'expectedExplanation')) isJsonObject(value.expectedExplanation, `${path}.expectedExplanation`, errors);

  if (!Array.isArray(value.sourceReferences)) {
    errors.push(`${path}.sourceReferences must be an array`);
  } else {
    value.sourceReferences.forEach((reference, index) => validateSourceReference(reference, `${path}.sourceReferences[${index}]`, errors));
  }
  if (!isEnumValue(GOLDEN_SOURCE_TYPES, value.sourceType)) errors.push(`${path}.sourceType is not supported`);

  validateIndependentVerification(value.independentVerification, `${path}.independentVerification`, errors);

  if (!Array.isArray(value.knownDisputes) || value.knownDisputes.some((item) => typeof item !== 'string')) {
    errors.push(`${path}.knownDisputes must be an array of strings`);
  }
  if (!(typeof value.verifiedBy === 'string' || value.verifiedBy === null)) {
    errors.push(`${path}.verifiedBy must be a string or null`);
  }
  if (!(typeof value.verifiedAt === 'string' || value.verifiedAt === null)) {
    errors.push(`${path}.verifiedAt must be an ISO date string or null`);
  } else if (typeof value.verifiedAt === 'string' && !isValidIsoDate(value.verifiedAt)) {
    errors.push(`${path}.verifiedAt must be a valid ISO date or UTC datetime`);
  }

  if (isRecord(value.expectedInterpretation) && value.expectedInterpretation.notProfessionalTruth !== true) {
    errors.push(`${path}.expectedInterpretation.notProfessionalTruth must be true`);
  }

  if (isRecord(value.independentVerification) && Array.isArray(value.sourceReferences)) {
    const sourceTypes = value.sourceReferences.map((reference) => (isRecord(reference) ? reference.type : undefined));
    const classification = value.validationClass;
    if (classification === 'independent-validation') {
      if (value.sourceReferences.length === 0) errors.push(`${path} independent-validation requires sourceReferences`);
      if (value.sourceType === 'repository-fixture' || value.sourceType === 'current-output') {
        errors.push(`${path} independent-validation cannot use a repository/current output source`);
      }
      if (sourceTypes.some((type) => type === 'repository-fixture' || type === 'current-output' || type === undefined)) {
        errors.push(`${path} independent-validation sourceReferences must be external`);
      }
      if (value.independentVerification.status !== 'verified') {
        errors.push(`${path} independent-validation requires independentVerification.status=verified`);
      }
      if (value.independentVerification.scope === 'regression-only' || value.independentVerification.scope === 'pending') {
        errors.push(`${path} independent-validation has a contradictory verification scope`);
      }
      if (!isNonEmptyString(value.verifiedBy)) errors.push(`${path} independent-validation requires verifiedBy`);
      if (!isValidIsoDate(value.verifiedAt)) errors.push(`${path} independent-validation requires verifiedAt`);
    }
    if (classification === 'regression-only') {
      if (value.independentVerification.status !== 'not-verified') {
        errors.push(`${path} regression-only cannot claim independent verification`);
      }
      if (value.independentVerification.scope !== 'regression-only') {
        errors.push(`${path} regression-only requires regression-only verification scope`);
      }
      if (value.verifiedBy !== null || value.verifiedAt !== null) {
        errors.push(`${path} regression-only must leave verifiedBy and verifiedAt null`);
      }
      if (!Array.isArray(value.knownDisputes) || value.knownDisputes.length === 0) {
        errors.push(`${path} regression-only must record a known limitation or dispute`);
      }
      if (value.sourceType !== 'repository-fixture' && value.sourceType !== 'current-output') {
        errors.push(`${path} regression-only must identify a repository fixture or current output source`);
      }
    }
    if (classification === 'pending-verification') {
      if (value.independentVerification.status !== 'pending') {
        errors.push(`${path} pending-verification cannot claim independent verification`);
      }
      if (value.independentVerification.scope !== 'pending') {
        errors.push(`${path} pending-verification requires pending verification scope`);
      }
      if (value.verifiedBy !== null || value.verifiedAt !== null) {
        errors.push(`${path} pending-verification must leave verifiedBy and verifiedAt null`);
      }
    }
  }

  return errors;
}

export function getGoldenCaseValidationErrors(value: unknown, path = 'goldenCase'): readonly string[] {
  return validateGoldenCaseValue(value, path);
}

export function validateGoldenCase(value: unknown): GoldenCase {
  const errors = validateGoldenCaseValue(value, 'goldenCase');
  if (errors.length > 0) throw new Error(`Invalid Golden Case contract:\n${errors.join('\n')}`);
  return value as GoldenCase;
}

export function validateGoldenCaseRegistry(value: unknown): readonly GoldenCase[] {
  if (!Array.isArray(value)) throw new Error('Invalid Golden Case registry: registry must be an array');

  const errors: string[] = [];
  const cases: GoldenCase[] = [];
  const ids = new Set<string>();
  value.forEach((item, index) => {
    const path = `goldenCases[${index}]`;
    const itemErrors = validateGoldenCaseValue(item, path);
    errors.push(...itemErrors);
    if (itemErrors.length === 0) {
      const goldenCase = item as GoldenCase;
      if (ids.has(goldenCase.id)) errors.push(`${path}.id duplicates ${goldenCase.id}`);
      ids.add(goldenCase.id);
      cases.push(goldenCase);
    }
  });
  if (errors.length > 0) throw new Error(`Invalid Golden Case registry:\n${errors.join('\n')}`);
  return cases;
}
