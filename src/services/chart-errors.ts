export const CHART_INPUT_ERROR_CATEGORY = 'input-validation' as const;

/**
 * A calculation failure is deliberately smaller than the underlying Error.
 * The module is part of the public identity, while the code stays stable for
 * callers that only need to decide whether a retry is appropriate.
 */
export const CHART_ENGINE_ERROR_CATEGORY = 'engine-failure' as const;
export const CHART_ENGINE_ERROR_CODE = 'ENGINE_FAILURE' as const;
export const CHART_ENGINE_ERROR_CODES = [CHART_ENGINE_ERROR_CODE] as const;

export const CHART_ENGINE_MODULES = ['bazi', 'ziwei', 'astrology', 'liuyao'] as const;
export type ChartEngineModule = (typeof CHART_ENGINE_MODULES)[number];
export type ChartEngineErrorCode = (typeof CHART_ENGINE_ERROR_CODES)[number];

export const CHART_ENGINE_ERROR_MESSAGES: Record<ChartEngineModule, string> = {
  bazi: '八字排盘暂时无法完成，请稍后重试。',
  ziwei: '紫微排盘暂时无法完成，请稍后重试。',
  astrology: '星盘计算暂时无法完成，请稍后重试。',
  liuyao: '六爻起卦暂时无法完成，请稍后重试。',
};

export const CHART_INPUT_ERROR_CODES = [
  'INVALID_GREGORIAN_DATE',
  'UNSUPPORTED_BIRTH_DATE_RANGE',
  'INVALID_LUNAR_DATE',
  'INVALID_LUNAR_LEAP_MONTH',
  'INVALID_BIRTH_COORDINATES',
  'INVALID_LIUYAO_DATE',
  'INVALID_LIUYAO_SEED',
] as const;

export type ChartInputErrorCode = (typeof CHART_INPUT_ERROR_CODES)[number];

export const CHART_INPUT_ERROR_MESSAGES: Record<ChartInputErrorCode, string> = {
  INVALID_GREGORIAN_DATE: '公历日期无效，请使用 YYYY-MM-DD 格式并填写真实日期。',
  UNSUPPORTED_BIRTH_DATE_RANGE: '出生日期超出当前公开支持范围：1900-01-01 至 2099-12-31（含端点）。',
  INVALID_LUNAR_DATE: '农历日期无效，请使用 YYYY-MM-DD 格式并填写该月真实日期。',
  INVALID_LUNAR_LEAP_MONTH: '农历闰月无效，该年份不存在所选月份的闰月。',
  INVALID_BIRTH_COORDINATES: '出生坐标无效，请提供成对且在有效范围内的纬度和经度。',
  INVALID_LIUYAO_DATE: '六爻日期无效，请使用有效的本地时间或带时区 ISO 时间。',
  INVALID_LIUYAO_SEED: '六爻 seed 无效，请提供 1 至 256 个字符的非空字符串。',
};

export interface ChartInputErrorContract {
  name: 'ChartInputError';
  category: typeof CHART_INPUT_ERROR_CATEGORY;
  code: ChartInputErrorCode;
  field: string;
  message: string;
}

export interface ChartInputErrorOptions {
  code: ChartInputErrorCode;
  field: string;
}

export interface ChartEngineErrorContract {
  name: 'ChartEngineError';
  category: typeof CHART_ENGINE_ERROR_CATEGORY;
  module: ChartEngineModule;
  code: ChartEngineErrorCode;
}

export interface ChartEngineErrorOptions {
  module: ChartEngineModule;
  code?: ChartEngineErrorCode;
}

export class ChartInputError extends Error implements ChartInputErrorContract {
  readonly name = 'ChartInputError' as const;
  readonly category = CHART_INPUT_ERROR_CATEGORY;
  readonly code: ChartInputErrorCode;
  readonly field: string;

  constructor(options: ChartInputErrorOptions) {
    super(CHART_INPUT_ERROR_MESSAGES[options.code]);
    this.code = options.code;
    this.field = options.field;
    Object.setPrototypeOf(this, ChartInputError.prototype);
  }

  toContract(): ChartInputErrorContract {
    return {
      name: this.name,
      category: this.category,
      code: this.code,
      field: this.field,
      message: this.message,
    };
  }
}

/**
 * Publicly exposed calculation failures never carry the original exception.
 * Error.message remains safe for the existing UI catch path, while
 * toContract/JSON serialization intentionally omit message, stack and cause.
 */
export class ChartEngineError extends Error implements ChartEngineErrorContract {
  readonly name = 'ChartEngineError' as const;
  readonly category = CHART_ENGINE_ERROR_CATEGORY;
  readonly module: ChartEngineModule;
  readonly code: ChartEngineErrorCode;

  constructor(options: ChartEngineErrorOptions) {
    const code = options.code ?? CHART_ENGINE_ERROR_CODE;
    super(CHART_ENGINE_ERROR_MESSAGES[options.module]);
    this.module = options.module;
    this.code = code;
    Object.setPrototypeOf(this, ChartEngineError.prototype);
  }

  toContract(): ChartEngineErrorContract {
    return {
      name: this.name,
      category: this.category,
      module: this.module,
      code: this.code,
    };
  }

  toJSON(): ChartEngineErrorContract {
    return this.toContract();
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function isChartInputErrorContract(value: unknown): value is ChartInputErrorContract {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Partial<ChartInputErrorContract>;
  const code = candidate.code;
  return candidate.name === 'ChartInputError'
    && candidate.category === CHART_INPUT_ERROR_CATEGORY
    && typeof code === 'string'
    && CHART_INPUT_ERROR_CODES.includes(code as ChartInputErrorCode)
    && typeof candidate.field === 'string'
    && candidate.field.trim().length > 0
    && candidate.message === CHART_INPUT_ERROR_MESSAGES[code as ChartInputErrorCode];
}

export function isChartEngineErrorContract(value: unknown): value is ChartEngineErrorContract {
  if (!isPlainRecord(value)) return false;
  const keys = Object.keys(value).sort();
  if (keys.join('|') !== 'category|code|module|name') return false;
  return value.name === 'ChartEngineError'
    && value.category === CHART_ENGINE_ERROR_CATEGORY
    && typeof value.module === 'string'
    && CHART_ENGINE_MODULES.includes(value.module as ChartEngineModule)
    && value.code === CHART_ENGINE_ERROR_CODE;
}

export function isChartInputError(value: unknown): value is ChartInputError {
  return value instanceof ChartInputError;
}

export function isChartEngineError(value: unknown): value is ChartEngineError {
  return value instanceof ChartEngineError;
}

export function getChartInputErrorContract(value: unknown): ChartInputErrorContract | undefined {
  if (value instanceof ChartInputError) return value.toContract();
  return isChartInputErrorContract(value) ? value : undefined;
}

export function getChartEngineErrorContract(value: unknown): ChartEngineErrorContract | undefined {
  if (value instanceof ChartEngineError) return value.toContract();
  return isChartEngineErrorContract(value) ? value : undefined;
}

export type ChartFailureContract = ChartInputErrorContract | ChartEngineErrorContract;

/** Returns either an existing input contract or the safe engine contract. */
export function getChartFailureContract(value: unknown): ChartFailureContract | undefined {
  return getChartInputErrorContract(value) ?? getChartEngineErrorContract(value);
}

function normalizeChartEngineFailure(module: ChartEngineModule, reason: unknown): never {
  // Preserve both in-process and serialized stable contracts. In particular,
  // a retry boundary must not turn one ChartEngineError into a new one.
  if (isChartInputError(reason) || isChartInputErrorContract(reason)) throw reason;
  if (isChartEngineError(reason) || isChartEngineErrorContract(reason)) throw reason;
  throw new ChartEngineError({ module });
}

/**
 * Local, deterministic seam used by each synchronous facade and by tests.
 * It never stores or exposes the callback's exception.
 */
export function withChartEngineErrorBoundary<T>(module: ChartEngineModule, operation: () => T): T {
  try {
    return operation();
  } catch (reason) {
    return normalizeChartEngineFailure(module, reason);
  }
}

/** Async counterpart for the Liuyao facade; stable failures are not wrapped twice. */
export async function withAsyncChartEngineErrorBoundary<T>(
  module: ChartEngineModule,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (reason) {
    return normalizeChartEngineFailure(module, reason);
  }
}
