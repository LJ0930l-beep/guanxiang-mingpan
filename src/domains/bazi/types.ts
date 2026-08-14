import type { CalculationTimezone } from '@/types/charts';
import type { BaziCalendarConversionEvidence } from '@/domains/bazi/calendar-resolver';

export type BaziDayBoundary = 'midnight' | 'ziEarly';
export type BaziSolarTimeModel = 'none' | 'localMeanSolarTime' | 'apparentSolarTime';

/**
 * Settings owned by Guanxiang rather than by the third-party chart engine.
 * P1-A records the fields now; later batches will make each rule effective.
 */
export interface BaziCalculationSettings {
  timezone: CalculationTimezone;
  dayBoundary: BaziDayBoundary;
  trueSolarTime: boolean;
  solarTimeModel: BaziSolarTimeModel;
  locationDatasetVersion: string;
  calendarResolverVersion: string;
}

export const DEFAULT_BAZI_CALCULATION_SETTINGS: BaziCalculationSettings = {
  timezone: 'Asia/Shanghai',
  dayBoundary: 'midnight',
  trueSolarTime: false,
  solarTimeModel: 'none',
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
  applied: boolean;
  model: BaziSolarTimeModel;
  civilTime: string;
  effectiveTime: string;
  correctionMinutes: number;
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
