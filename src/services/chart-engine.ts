/**
 * Public calculation facade.
 *
 * Screens import from this file so the four calculation engines can evolve
 * independently without changing the application-facing API.
 */
export { calculateBaziView } from '@/services/engines/bazi-engine';
export { calculateLiuyaoView } from '@/services/engines/liuyao-engine';
export { calculateZiweiView } from '@/services/engines/ziwei-engine';
export { calculateAstrologyView } from '@/services/engines/astrology-engine';
export { assertZiweiLunarDate } from '@/domains/ziwei/lunar-input';
export {
  BAZI_HISTORICAL_DST_ADJUSTMENT_MINUTES,
  BAZI_HISTORICAL_DST_DATA_SOURCE,
  BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT,
  BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT_URL,
  BAZI_HISTORICAL_DST_DATA_SOURCE_URL,
  BAZI_HISTORICAL_DST_DATA_VERSION,
  BAZI_HISTORICAL_DST_DAYLIGHT_OFFSET_MINUTES,
  BAZI_HISTORICAL_DST_POLICY,
  BAZI_HISTORICAL_DST_POLICY_VERSION,
  BAZI_HISTORICAL_DST_SOURCE_FILE,
  BAZI_HISTORICAL_DST_SOURCE_RULE,
  BAZI_HISTORICAL_DST_STANDARD_OFFSET_MINUTES,
  BAZI_HISTORICAL_DST_TIMEZONE,
  BAZI_HISTORICAL_DST_TRANSITIONS,
  isBaziHistoricalDstPolicy,
  resolveBaziHistoricalDst,
} from '@/domains/bazi/historical-dst';
export type {
  BaziHistoricalDstPolicy,
  BaziHistoricalDstResolution,
  BaziHistoricalDstStatus,
  BaziHistoricalDstTransition,
} from '@/domains/bazi/historical-dst';
export {
  assertPublicBirthDateRange,
  isPublicBirthDateRangePolicy,
  PUBLIC_BIRTH_DATE_RANGE_END_DATE,
  PUBLIC_BIRTH_DATE_RANGE_POLICY,
  PUBLIC_BIRTH_DATE_RANGE_POLICY_VERSION,
  PUBLIC_BIRTH_DATE_RANGE_START_DATE,
} from '@/domains/policy/public-birth-date-range';
export {
  ENGINE_VERSIONS,
  LIUYAO_SEED_MAX_LENGTH,
  LIUYAO_SEED_SCOPE,
  normalizeLiuyaoDate,
  normalizeLiuyaoSeed,
} from '@/services/chart-engine-shared';
export {
  ASTROLOGY_CALCULATION_POLICY_VERSION,
  ASTROLOGY_DATE_LEVEL_APPROXIMATION_ANCHOR,
  ASTROLOGY_DATE_LEVEL_APPROXIMATION_POLICY,
  ASTROLOGY_DATE_LEVEL_APPROXIMATION_POLICY_VERSION,
  ASTROLOGY_DATE_LEVEL_APPROXIMATION_RULE_VERSION,
  ASTROLOGY_LOCATION_POLICY_VERSION,
  ASTROLOGY_PRECISION_POLICY_VERSION,
  createAstrologyCalculationPolicy,
  isAstrologyCalculationPolicy,
} from '@/domains/astrology/policy';
export type {
  AstrologyCalculationPolicy,
  AstrologyDateLevelApproximationPolicy,
  AstrologyLocationSource,
  AstrologyPrecision,
} from '@/domains/astrology/policy';
export {
  CHART_INPUT_ERROR_CATEGORY,
  CHART_INPUT_ERROR_CODES,
  CHART_INPUT_ERROR_MESSAGES,
  CHART_ENGINE_ERROR_CATEGORY,
  CHART_ENGINE_ERROR_CODE,
  CHART_ENGINE_ERROR_CODES,
  CHART_ENGINE_ERROR_MESSAGES,
  CHART_ENGINE_MODULES,
  ChartEngineError,
  ChartInputError,
  getChartEngineErrorContract,
  getChartFailureContract,
  getChartInputErrorContract,
  isChartEngineError,
  isChartEngineErrorContract,
  isChartInputError,
  isChartInputErrorContract,
  withAsyncChartEngineErrorBoundary,
  withChartEngineErrorBoundary,
} from '@/services/chart-errors';
export type {
  ChartEngineErrorCode,
  ChartEngineErrorContract,
  ChartEngineModule,
  ChartFailureContract,
  ChartInputErrorCode,
  ChartInputErrorContract,
} from '@/services/chart-errors';
export type { CalculationOptions } from '@/services/chart-engine-shared';
