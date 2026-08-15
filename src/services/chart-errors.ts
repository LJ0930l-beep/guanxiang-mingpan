export const CHART_INPUT_ERROR_CATEGORY = 'input-validation' as const;

export const CHART_INPUT_ERROR_CODES = [
  'INVALID_GREGORIAN_DATE',
  'INVALID_BIRTH_COORDINATES',
  'INVALID_LIUYAO_DATE',
  'INVALID_LIUYAO_SEED',
] as const;

export type ChartInputErrorCode = (typeof CHART_INPUT_ERROR_CODES)[number];

export const CHART_INPUT_ERROR_MESSAGES: Record<ChartInputErrorCode, string> = {
  INVALID_GREGORIAN_DATE: '公历日期无效，请使用 YYYY-MM-DD 格式并填写真实日期。',
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

export function isChartInputError(value: unknown): value is ChartInputError {
  return value instanceof ChartInputError;
}

export function getChartInputErrorContract(value: unknown): ChartInputErrorContract | undefined {
  if (value instanceof ChartInputError) return value.toContract();
  return isChartInputErrorContract(value) ? value : undefined;
}
