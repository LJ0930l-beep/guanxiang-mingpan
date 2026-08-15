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
  ChartInputError,
  getChartInputErrorContract,
  isChartInputError,
  isChartInputErrorContract,
} from '@/services/chart-errors';
export type {
  ChartInputErrorCode,
  ChartInputErrorContract,
} from '@/services/chart-errors';
export type { CalculationOptions } from '@/services/chart-engine-shared';
