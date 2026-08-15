import type { CalculationTimezone } from '@/types/charts';
import type { BaziCalendarConversionEvidence } from '@/domains/bazi/calendar-resolver';

export type BaziDayBoundary = 'midnight' | 'ziEarly';
export type BaziSolarTimeModel = 'none' | 'localMeanSolarTime' | 'apparentSolarTime';
export const BAZI_TRUE_SOLAR_TIME_V1 = 'true-solar-time-v1-approx' as const;
export const BAZI_TRUE_SOLAR_TIME_V2 = 'true-solar-time-v2-noaa' as const;
export const BAZI_TRUE_SOLAR_TIME_UNKNOWN = 'legacy-unknown' as const;
export type BaziSolarTimeVersion =
  | typeof BAZI_TRUE_SOLAR_TIME_V1
  | typeof BAZI_TRUE_SOLAR_TIME_V2
  | typeof BAZI_TRUE_SOLAR_TIME_UNKNOWN;
export type BaziTrueSolarProvenanceStatus = 'current' | 'legacy' | 'unknown' | 'not-applied';
export type BaziTrueSolarRoundingRule =
  | 'nearest-minute-half-away-from-zero'
  | 'legacy-js-math-round-after-tenth'
  | 'not-applied'
  | 'legacy-unknown';

/**
 * Settings owned by Guanxiang rather than by the third-party chart engine.
 * P1-A records the fields now; later batches will make each rule effective.
 */
export interface BaziCalculationSettings {
  timezone: CalculationTimezone;
  dayBoundary: BaziDayBoundary;
  trueSolarTime: boolean;
  solarTimeModel: BaziSolarTimeModel;
  trueSolarTimeVersion: BaziSolarTimeVersion;
  locationDatasetVersion: string;
  calendarResolverVersion: string;
}

export const DEFAULT_BAZI_CALCULATION_SETTINGS: BaziCalculationSettings = {
  timezone: 'Asia/Shanghai',
  dayBoundary: 'midnight',
  trueSolarTime: false,
  solarTimeModel: 'none',
  trueSolarTimeVersion: BAZI_TRUE_SOLAR_TIME_V2,
  locationDatasetVersion: 'china-cities-p1f-mainland-v1',
  calendarResolverVersion: 'solar-terms-p1b-v1',
};

export interface BaziBoundaryWindow {
  start: string;
  end: string;
  precisionSeconds: number;
}

export interface SolarTermBoundaryEvidence {
  status: 'pending' | 'resolved';
  recentTerm?: string;
  nextTerm?: string;
  boundaryWindow?: BaziBoundaryWindow;
  currentMonthBasis?: string;
  note: string;
}

export interface TrueSolarCorrectionEvidence {
  /**
   * Omitted when a legacy record enabled true-solar time but never persisted
   * the correction evidence.  In that case provenanceStatus is `unknown`;
   * `false` is reserved for a known, explicitly unapplied calculation.
   */
  applied?: boolean;
  model: BaziSolarTimeModel;
  algorithmVersion: BaziSolarTimeVersion;
  civilTime: string;
  effectiveTime: string;
  rawCorrectionMinutes: number;
  correctionMinutes: number;
  appliedCorrectionMinutes: number;
  roundingRule: BaziTrueSolarRoundingRule;
  dataSource: string;
  dataVersion: string;
  dataSourceUrl?: string;
  provenanceStatus: BaziTrueSolarProvenanceStatus;
  longitude?: number;
  standardMeridian?: number;
  precisionMinutes?: number;
  note?: string;
}

export interface BaziLocationEvidence {
  locationId?: string;
  name: string;
  province?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  timezone: CalculationTimezone;
  datasetVersion: string;
  source?: string;
}

/** Evidence fields are deliberately explicit when a resolver is not ready. */
export interface BaziCalculationEvidence {
  sourceCalendar: 'solar' | 'lunar';
  normalizedCivilTime: string;
  effectiveCalculationTime: string;
  timezone: CalculationTimezone;
  calendarConversion: BaziCalendarConversionEvidence;
  solarTermBoundary: SolarTermBoundaryEvidence;
  dayBoundaryRule: BaziDayBoundary;
  trueSolarCorrection: TrueSolarCorrectionEvidence;
  locationUsed?: BaziLocationEvidence;
  warnings: string[];
}
