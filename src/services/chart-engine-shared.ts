import { CHART_SNAPSHOT_VERSION, DEFAULT_CALCULATION_TIMEZONE } from '@/types/charts';
import type { BirthInputSnapshot, CalculationSettings, CalculationTimezone } from '@/types/charts';
import {
  BAZI_TRUE_SOLAR_TIME_UNKNOWN,
  BAZI_TRUE_SOLAR_TIME_V1,
  BAZI_TRUE_SOLAR_TIME_V2,
  DEFAULT_BAZI_CALCULATION_SETTINGS,
} from '@/domains/bazi/types';
import type { BaziCalculationSettings } from '@/domains/bazi/types';
import type { BirthProfile, Gender } from '@/types/domain';
import { ChartInputError } from '@/services/chart-errors';
import {
  assertPublicBirthDateRange,
  PUBLIC_BIRTH_DATE_RANGE_POLICY,
} from '@/domains/policy/public-birth-date-range';

export const ENGINE_VERSIONS = {
  bazi: 'taibu-core@3.4.0/bazi',
  liuyao: 'taibu-core@3.4.0/liuyao+guanxiang-rng-v1',
  ziwei: 'iztro@2.5.8',
  astrology: 'circular-natal-horoscope-js@1.1.0',
} as const;

export const LIUYAO_SEED_SCOPE = 'guanxiang-local-v1' as const;
export const LIUYAO_SEED_MAX_LENGTH = 256 as const;

export const signLabels: Record<string, string> = {
  aries: '白羊座', taurus: '金牛座', gemini: '双子座', cancer: '巨蟹座',
  leo: '狮子座', virgo: '处女座', libra: '天秤座', scorpio: '天蝎座',
  sagittarius: '射手座', capricorn: '摩羯座', aquarius: '水瓶座', pisces: '双鱼座',
};

export const bodyLabels: Record<string, string> = {
  sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星',
  jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星',
  ascendant: '上升点', midheaven: '天顶',
};

export const aspectLabels: Record<string, string> = {
  conjunction: '合相', opposition: '对冲', trine: '拱相', square: '刑相', sextile: '六合',
};

export const strengthLabels: Record<string, string> = {
  wang: '旺', xiang: '相', xiu: '休', qiu: '囚', si: '死',
};

interface BirthParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface ExplicitBirthCoordinates {
  latitude: number;
  longitude: number;
}

const GREGORIAN_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function daysInGregorianMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * Validates only the Gregorian date fields. It deliberately does not impose
 * an application-supported year range or inspect the host timezone.
 */
export function assertGregorianDate(value: unknown, field = 'birthDate'): asserts value is string {
  const match = typeof value === 'string' ? GREGORIAN_DATE_PATTERN.exec(value) : null;
  if (!match) {
    throw new ChartInputError({
      code: 'INVALID_GREGORIAN_DATE',
      field,
    });
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInGregorianMonth(year, month)) {
    throw new ChartInputError({
      code: 'INVALID_GREGORIAN_DATE',
      field,
    });
  }
}

function hasCoordinate(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function invalidCoordinates(field: string): never {
  throw new ChartInputError({
    code: 'INVALID_BIRTH_COORDINATES',
    field,
  });
}

/**
 * Returns an explicit coordinate pair when the profile supplied one. A pair
 * that is absent remains absent so callers can preserve their existing
 * unknown-city behavior; a partial or malformed pair is always rejected.
 */
export function explicitBirthCoordinates(profile: BirthProfile): ExplicitBirthCoordinates | undefined {
  const hasLatitude = hasCoordinate(profile.latitude);
  const hasLongitude = hasCoordinate(profile.longitude);
  if (!hasLatitude && !hasLongitude) return undefined;
  if (!hasLatitude || !hasLongitude) invalidCoordinates('birthCoordinates');

  if (typeof profile.latitude !== 'number' || !Number.isFinite(profile.latitude)) {
    invalidCoordinates('latitude');
  }
  if (typeof profile.longitude !== 'number' || !Number.isFinite(profile.longitude)) {
    invalidCoordinates('longitude');
  }
  if (profile.latitude < -90 || profile.latitude > 90) invalidCoordinates('latitude');
  if (profile.longitude < -180 || profile.longitude > 180) invalidCoordinates('longitude');

  return { latitude: profile.latitude, longitude: profile.longitude };
}

export interface CalculationOptions {
  /** Fixed timestamp used by regression tests and imported/replayed records. */
  generatedAt?: string;
  /** Fixed automatic-casting seed used when replaying a Liuyao record. */
  seed?: string;
  /** Fixed local ISO date used for Liuyao ganzhi and strength calculation. */
  date?: string;
  /** Civil-time timezone for all calculations. The first release fixes this to Asia/Shanghai. */
  timezone?: CalculationTimezone;
  /** P1-A records the Bazi rule slots; P1-C/P1-D will make non-default values effective. */
  bazi?: Partial<BaziCalculationSettings>;
}

export function calculationSettings(
  options?: CalculationOptions,
  includeBirthDateRangePolicy = false,
): CalculationSettings {
  const timezone = options?.timezone ?? DEFAULT_CALCULATION_TIMEZONE;
  if (timezone !== DEFAULT_CALCULATION_TIMEZONE) {
    throw new Error(`当前版本仅支持 ${DEFAULT_CALCULATION_TIMEZONE}，不允许依赖设备或服务器时区。`);
  }
  return {
    timezone,
    ...(includeBirthDateRangePolicy ? { birthDateRangePolicy: PUBLIC_BIRTH_DATE_RANGE_POLICY } : {}),
  };
}

export function baziCalculationSettings(options?: CalculationOptions): BaziCalculationSettings {
  const base = {
    ...DEFAULT_BAZI_CALCULATION_SETTINGS,
    timezone: calculationSettings(options).timezone,
    ...options?.bazi,
    birthDateRangePolicy: PUBLIC_BIRTH_DATE_RANGE_POLICY,
  };
  if (base.dayBoundary !== 'midnight' && base.dayBoundary !== 'ziEarly') {
    throw new Error('八字日界线规则无效；当前仅支持 midnight 或 ziEarly。');
  }
  if ((base.trueSolarTime && base.solarTimeModel === 'none') || (!base.trueSolarTime && base.solarTimeModel !== 'none')) {
    throw new Error('真太阳时设置无效：启用时必须选择 localMeanSolarTime 或 apparentSolarTime。');
  }
  if (![BAZI_TRUE_SOLAR_TIME_V1, BAZI_TRUE_SOLAR_TIME_V2, BAZI_TRUE_SOLAR_TIME_UNKNOWN].includes(base.trueSolarTimeVersion)) {
    throw new Error('真太阳时规则版本无效。');
  }
  return base;
}

export function generatedAt(options?: CalculationOptions) {
  return options?.generatedAt ?? new Date().toISOString();
}

export function birthInputSnapshot(
  profile: BirthProfile,
  gender?: Gender,
  settings: CalculationSettings = { timezone: DEFAULT_CALCULATION_TIMEZONE },
): BirthInputSnapshot {
  const snapshot: BirthInputSnapshot = {
    type: 'birth',
    timezone: settings.timezone,
    profileId: profile.id,
    birthDate: profile.birthDate,
    timeKnown: profile.timeKnown,
    birthCity: profile.birthCity,
    calendar: profile.calendar,
  };
  const effectiveGender = gender ?? profile.gender;
  if (profile.birthTime) snapshot.birthTime = profile.birthTime;
  if (profile.isLeapMonth !== undefined) snapshot.isLeapMonth = profile.isLeapMonth;
  if (effectiveGender) snapshot.gender = effectiveGender;
  if (profile.locationId) snapshot.locationId = profile.locationId;
  if (profile.locationDatasetVersion) snapshot.locationDatasetVersion = profile.locationDatasetVersion;
  if (profile.latitude !== undefined) snapshot.latitude = profile.latitude;
  if (profile.longitude !== undefined) snapshot.longitude = profile.longitude;
  if (settings.birthDateRangePolicy) snapshot.birthDateRangePolicy = settings.birthDateRangePolicy;
  if (settings.astrologyPolicy) snapshot.astrologyPolicy = settings.astrologyPolicy;
  return snapshot;
}

/**
 * Apply the owner-approved public date contract after a module-specific
 * calendar validator has accepted the input.  Keeping this call in the
 * shared layer makes the range and error contract identical for all birth
 * chart modules while leaving Liuyao outside the birth-date policy.
 */
export { assertPublicBirthDateRange };

function formatDateInTimezone(value: Date, timezone: CalculationTimezone): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  const hour = values.hour === '24' ? '00' : values.hour;
  return `${values.year}-${values.month}-${values.day}T${hour}:${values.minute}:${values.second}`;
}

/**
 * taibu-core currently parses a date string and then reads local Date getters.
 * Passing a timezone-free civil timestamp makes those getters represent the
 * already-normalized Asia/Shanghai wall clock, independent of the host TZ.
 */
const LIUYAO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?$/i;

function invalidLiuyaoDate(): never {
  throw new ChartInputError({ code: 'INVALID_LIUYAO_DATE', field: 'date' });
}

function invalidLiuyaoSeed(): never {
  throw new ChartInputError({ code: 'INVALID_LIUYAO_SEED', field: 'seed' });
}

function assertLiuyaoCivilDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): void {
  if (
    month < 1
    || month > 12
    || day < 1
    || day > daysInGregorianMonth(year, month)
    || hour < 0
    || hour > 23
    || minute < 0
    || minute > 59
    || second < 0
    || second > 59
  ) {
    invalidLiuyaoDate();
  }
}

function offsetMinutes(value: string): number {
  if (value.toUpperCase() === 'Z') return 0;
  const match = /^([+-])(\d{2}):?(\d{2})$/.exec(value);
  if (!match) invalidLiuyaoDate();
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  if (hours > 23 || minutes > 59) invalidLiuyaoDate();
  const total = hours * 60 + minutes;
  return match[1] === '+' ? total : -total;
}

/**
 * Normalizes a Liuyao date without consulting the host process timezone.
 * Date fields are checked before any Date object is created so JavaScript
 * cannot silently roll an invalid civil date into the following month.
 */
export function normalizeLiuyaoDate(input: unknown, timezone: CalculationTimezone = DEFAULT_CALCULATION_TIMEZONE): string {
  if (typeof input !== 'string') invalidLiuyaoDate();
  const normalized = input.trim().replace(' ', 'T');
  const match = LIUYAO_DATE_PATTERN.exec(normalized);
  if (!match) invalidLiuyaoDate();

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, , offsetText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? '00');
  assertLiuyaoCivilDate(year, month, day, hour, minute, second);

  if (!offsetText) return `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText ?? '00'}`;

  const offset = offsetMinutes(offsetText);
  const civil = new Date(0);
  civil.setUTCFullYear(year, month - 1, day);
  civil.setUTCHours(hour, minute, second, 0);
  const parsed = new Date(civil.getTime() - offset * 60_000);
  if (Number.isNaN(parsed.getTime())) invalidLiuyaoDate();
  return formatDateInTimezone(parsed, timezone);
}

/**
 * Validates replay seeds while preserving the caller's original string. The
 * trimmed value is used only for the emptiness check; the original string's
 * Unicode code-point length enforces the limit, and surrounding whitespace is
 * therefore not silently rewritten in a persisted payload.
 */
export function normalizeLiuyaoSeed(input: unknown): string {
  if (typeof input !== 'string') invalidLiuyaoSeed();
  const trimmed = input.trim();
  if (trimmed.length === 0 || Array.from(input).length > LIUYAO_SEED_MAX_LENGTH) invalidLiuyaoSeed();
  return input;
}

export function birthParts(profile: BirthProfile): BirthParts {
  const [year, month, day] = profile.birthDate.split('-').map(Number);
  const [hour = 0, minute = 0] = (profile.birthTime ?? '').split(':').map(Number);
  if (![year, month, day].every(Number.isFinite)) throw new Error('出生日期格式无效，请在命主管理中修正。');
  return { year, month, day, hour, minute };
}

export function requireExactBirth(profile: BirthProfile) {
  if (!profile.timeKnown || !profile.birthTime) {
    throw new Error('这套盘需要准确出生时辰。当前命主只保存了日期，请先补充时辰。');
  }
}

export function requireGender(profile: BirthProfile, override?: Gender): Gender {
  const gender = profile.gender ?? override;
  if (!gender) throw new Error('八字与紫微排盘需要性别参数，请先选择本次排盘使用的性别。');
  return gender;
}

export { CHART_SNAPSHOT_VERSION };
