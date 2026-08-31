/**
 * Versioned safety metadata for Astrology calculations.
 *
 * The policy is persisted with every newly-created Astrology snapshot.  It is
 * intentionally separate from the engine version: changing an engine does not
 * silently change whether a result was exact or a date-level approximation.
 */
export const ASTROLOGY_CALCULATION_POLICY_VERSION = 'astrology-calculation-policy.v1' as const;
export const ASTROLOGY_PRECISION_POLICY_VERSION = 'astrology-precision-policy.v1' as const;
export const ASTROLOGY_LOCATION_POLICY_VERSION = 'astrology-location-policy.v1' as const;
export const ASTROLOGY_DATE_LEVEL_APPROXIMATION_RULE_VERSION = 'astrology-date-level-approximation.v1' as const;
export const ASTROLOGY_DATE_LEVEL_APPROXIMATION_POLICY_VERSION = 'astrology-date-level-policy.v1' as const;
export const ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR = {
  timezone: 'Asia/Shanghai',
  localTime: '12:00:00',
  ruleVersion: ASTROLOGY_DATE_LEVEL_APPROXIMATION_RULE_VERSION,
  stabilityWindow: {
    start: '00:00:00',
    end: '23:59:59',
    method: 'compare-signs-at-day-start-and-day-end',
  },
} as const;

export type AstrologyPrecision = 'exact' | 'date-level-approximate';
export type AstrologyLocationSource = 'explicit-coordinates' | 'city-dataset';

/** Owner-approved policy independent of a particular birthplace. */
export const ASTROLOGY_DATE_LEVEL_APPROXIMATION_POLICY = {
  version: ASTROLOGY_DATE_LEVEL_APPROXIMATION_POLICY_VERSION,
  precision: 'date-level-approximate',
  anchor: ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR,
} as const;

export type AstrologyDateLevelApproximationPolicy = typeof ASTROLOGY_DATE_LEVEL_APPROXIMATION_POLICY;

export interface AstrologyCalculationPolicy {
  version: typeof ASTROLOGY_CALCULATION_POLICY_VERSION;
  precision: AstrologyPrecision;
  precisionPolicyVersion: typeof ASTROLOGY_PRECISION_POLICY_VERSION;
  locationSource: AstrologyLocationSource;
  locationPolicyVersion: typeof ASTROLOGY_LOCATION_POLICY_VERSION;
  locationId?: string;
  locationDatasetVersion?: string;
  approximationAnchor?: typeof ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR;
}

export function createAstrologyCalculationPolicy(input: {
  precision: AstrologyPrecision;
  locationSource: AstrologyLocationSource;
  locationId?: string;
  locationDatasetVersion?: string;
}): AstrologyCalculationPolicy {
  return {
    version: ASTROLOGY_CALCULATION_POLICY_VERSION,
    precision: input.precision,
    precisionPolicyVersion: ASTROLOGY_PRECISION_POLICY_VERSION,
    locationSource: input.locationSource,
    locationPolicyVersion: ASTROLOGY_LOCATION_POLICY_VERSION,
    ...(input.locationId ? { locationId: input.locationId } : {}),
    ...(input.locationDatasetVersion ? { locationDatasetVersion: input.locationDatasetVersion } : {}),
    ...(input.precision === 'date-level-approximate'
      ? { approximationAnchor: ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR }
      : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isAstrologyCalculationPolicy(value: unknown): value is AstrologyCalculationPolicy {
  if (!isRecord(value)
    || value.version !== ASTROLOGY_CALCULATION_POLICY_VERSION
    || (value.precision !== 'exact' && value.precision !== 'date-level-approximate')
    || value.precisionPolicyVersion !== ASTROLOGY_PRECISION_POLICY_VERSION
    || (value.locationSource !== 'explicit-coordinates' && value.locationSource !== 'city-dataset')
    || value.locationPolicyVersion !== ASTROLOGY_LOCATION_POLICY_VERSION) {
    return false;
  }
  if (value.locationId !== undefined && typeof value.locationId !== 'string') return false;
  if (value.locationDatasetVersion !== undefined && typeof value.locationDatasetVersion !== 'string') return false;
  if (value.precision === 'exact') return value.approximationAnchor === undefined;
  return sameApproximationAnchor(value.approximationAnchor);
}

function sameApproximationAnchor(value: unknown): value is typeof ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR {
  if (!isRecord(value) || value.timezone !== ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR.timezone
    || value.localTime !== ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR.localTime
    || value.ruleVersion !== ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR.ruleVersion
    || !isRecord(value.stabilityWindow)) {
    return false;
  }
  return value.stabilityWindow.start === ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR.stabilityWindow.start
    && value.stabilityWindow.end === ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR.stabilityWindow.end
    && value.stabilityWindow.method === ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR.stabilityWindow.method;
}
