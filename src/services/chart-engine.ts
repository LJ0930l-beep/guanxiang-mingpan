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
