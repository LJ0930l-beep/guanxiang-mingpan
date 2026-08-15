import type {
  BaziCalculationSettings,
  BaziSolarTimeModel,
  BaziSolarTimeVersion,
  BaziTrueSolarProvenanceStatus,
  BaziTrueSolarRoundingRule,
} from '@/domains/bazi/types';
import {
  BAZI_TRUE_SOLAR_TIME_UNKNOWN,
  BAZI_TRUE_SOLAR_TIME_V1,
  BAZI_TRUE_SOLAR_TIME_V2,
} from '@/domains/bazi/types';
import type { BirthProfile } from '@/types/domain';
import { DEFAULT_CALCULATION_TIMEZONE, type CalculationTimezone } from '@/types/charts';

export const TRUE_SOLAR_STANDARD_MERIDIAN = 120;
export const TRUE_SOLAR_TIME_V1 = BAZI_TRUE_SOLAR_TIME_V1;
export const TRUE_SOLAR_TIME_V2 = BAZI_TRUE_SOLAR_TIME_V2;
export const TRUE_SOLAR_TIME_UNKNOWN = BAZI_TRUE_SOLAR_TIME_UNKNOWN;
export const TRUE_SOLAR_DATA_SOURCE = 'NOAA Solar Calculator equation-of-time PDF';
export const TRUE_SOLAR_DATA_VERSION = 'noaa-solareqns-pdf-229.18-v1';
export const TRUE_SOLAR_DATA_URL = 'https://gml.noaa.gov/grad/solcalc/solareqns.PDF';

const LEGACY_TRUE_SOLAR_DATA_SOURCE = 'Guanxiang legacy approximation';
const LEGACY_TRUE_SOLAR_DATA_VERSION = TRUE_SOLAR_TIME_V1;

export interface TrueSolarTimeResolution {
  applied: boolean;
  model: BaziSolarTimeModel;
  algorithmVersion: BaziSolarTimeVersion;
  civilTime: string;
  effectiveDate: string;
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
  standardMeridian: number;
  dayOffset: number;
  precisionMinutes: number;
  timezone: CalculationTimezone;
  note: string;
}

interface CivilTimeFields {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function parseCivilTime(profile: BirthProfile): CivilTimeFields {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(profile.birthDate);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(profile.birthTime ?? '00:00');
  if (!dateMatch || !timeMatch) throw new Error('真太阳时计算需要有效的公历日期与时辰。');
  const [, year, month, day] = dateMatch;
  const [, hour, minute, second = '00'] = timeMatch;
  const fields = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
  const check = new Date(Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second));
  if (
    check.getUTCFullYear() !== fields.year
    || check.getUTCMonth() !== fields.month - 1
    || check.getUTCDate() !== fields.day
    || check.getUTCHours() !== fields.hour
    || check.getUTCMinutes() !== fields.minute
    || check.getUTCSeconds() !== fields.second
  ) throw new Error('真太阳时计算需要有效的公历日期与时辰。');
  return fields;
}

function formatDate(date: Date) {
  return `${String(date.getUTCFullYear()).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function formatTime(date: Date) {
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;
}

function dayOfYear(year: number, month: number, day: number) {
  const current = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 1);
  return Math.floor((current - start) / 86_400_000) + 1;
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * P1-D's original low-order approximation. It is retained for explicit v1
 * replay and is not an NOAA source claim.
 */
export function legacyEquationOfTimeMinutes(year: number, month: number, day: number) {
  const totalDays = isLeapYear(year) ? 366 : 365;
  const angle = (2 * Math.PI * (dayOfYear(year, month, day) - 81)) / totalDays;
  return 9.87 * Math.sin(2 * angle) - 7.53 * Math.cos(angle) - 1.5 * Math.sin(angle);
}

/** Backward-compatible export for callers that used the pre-v2 helper. */
export const equationOfTimeMinutes = legacyEquationOfTimeMinutes;

/**
 * NOAA Solar Calculator equation-of-time coefficients from solareqns.PDF.
 * The calculation uses fixed Asia/Shanghai civil fields as UTC-only
 * arithmetic; the Date object is never read through host-local getters.
 */
export function noaaEquationOfTimeMinutes(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
  second = 0,
) {
  const totalDays = isLeapYear(year) ? 366 : 365;
  const fractionalHour = hour + minute / 60 + second / 3_600;
  const gamma = (2 * Math.PI / totalDays) * (dayOfYear(year, month, day) - 1 + (fractionalHour - 12) / 24);
  return 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
}

function roundHalfAwayFromZero(value: number) {
  return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}

function displayMinutes(value: number) {
  return roundHalfAwayFromZero(value * 10) / 10;
}

function legacyDisplayMinutes(value: number) {
  return Math.round(value * 10) / 10;
}

function versionIsKnown(value: unknown): value is BaziSolarTimeVersion {
  return value === TRUE_SOLAR_TIME_V1 || value === TRUE_SOLAR_TIME_V2 || value === TRUE_SOLAR_TIME_UNKNOWN;
}

function sourceForVersion(version: BaziSolarTimeVersion) {
  if (version === TRUE_SOLAR_TIME_V2) return TRUE_SOLAR_DATA_SOURCE;
  if (version === TRUE_SOLAR_TIME_V1) return LEGACY_TRUE_SOLAR_DATA_SOURCE;
  return 'legacy-record';
}

function dataVersionForVersion(version: BaziSolarTimeVersion) {
  if (version === TRUE_SOLAR_TIME_V2) return TRUE_SOLAR_DATA_VERSION;
  if (version === TRUE_SOLAR_TIME_V1) return LEGACY_TRUE_SOLAR_DATA_VERSION;
  return TRUE_SOLAR_TIME_UNKNOWN;
}

function notAppliedResolution(
  profile: BirthProfile,
  fields: CivilTimeFields,
  version: BaziSolarTimeVersion,
  timezone: CalculationTimezone,
): TrueSolarTimeResolution {
  const civilTime = `${profile.birthDate}T${String(fields.hour).padStart(2, '0')}:${String(fields.minute).padStart(2, '0')}:${String(fields.second).padStart(2, '0')}`;
  const provenanceStatus: BaziTrueSolarProvenanceStatus = version === TRUE_SOLAR_TIME_UNKNOWN ? 'unknown' : 'not-applied';
  return {
    applied: false,
    model: 'none',
    algorithmVersion: version,
    civilTime,
    effectiveDate: profile.birthDate,
    effectiveTime: `${String(fields.hour).padStart(2, '0')}:${String(fields.minute).padStart(2, '0')}:${String(fields.second).padStart(2, '0')}`,
    rawCorrectionMinutes: 0,
    correctionMinutes: 0,
    appliedCorrectionMinutes: 0,
    roundingRule: 'not-applied',
    dataSource: sourceForVersion(version),
    dataVersion: dataVersionForVersion(version),
    provenanceStatus,
    standardMeridian: TRUE_SOLAR_STANDARD_MERIDIAN,
    dayOffset: 0,
    precisionMinutes: 1,
    timezone,
    note: version === TRUE_SOLAR_TIME_UNKNOWN
      ? '未记录真太阳时规则版本；未启用真太阳时，历史结果不会重新计算。'
      : '未启用真太阳时；有效计算时刻等于输入民用时刻。',
  };
}

export function resolveTrueSolarTime(
  profile: BirthProfile,
  settings: Pick<BaziCalculationSettings, 'trueSolarTime' | 'solarTimeModel'>
    & Partial<Pick<BaziCalculationSettings, 'trueSolarTimeVersion' | 'timezone'>>,
): TrueSolarTimeResolution {
  const fields = parseCivilTime(profile);
  const timezone = settings.timezone ?? DEFAULT_CALCULATION_TIMEZONE;
  if (timezone !== DEFAULT_CALCULATION_TIMEZONE) {
    throw new Error(`当前版本仅支持 ${DEFAULT_CALCULATION_TIMEZONE}，不允许依赖设备或服务器时区。`);
  }
  const version = settings.trueSolarTimeVersion ?? TRUE_SOLAR_TIME_V2;
  if (!versionIsKnown(version)) {
    if (settings.trueSolarTime) throw new Error(`未知真太阳时规则版本：${String(version)}。`);
    return notAppliedResolution(profile, fields, TRUE_SOLAR_TIME_UNKNOWN, timezone);
  }
  if (!settings.trueSolarTime || settings.solarTimeModel === 'none') {
    return notAppliedResolution(profile, fields, version, timezone);
  }
  if (version === TRUE_SOLAR_TIME_UNKNOWN) {
    throw new Error('未知真太阳时规则版本不能执行实际计算。');
  }
  if (profile.calendar !== 'solar') throw new Error('真太阳时首版只接受公历输入；农历换算必须先完成公历归一化。');
  if (profile.longitude == null || !Number.isFinite(profile.longitude) || profile.longitude < -180 || profile.longitude > 180) {
    throw new Error('启用真太阳时需要已确认的出生地经度，未知城市不会猜测坐标。');
  }

  const longitudeCorrection = (profile.longitude - TRUE_SOLAR_STANDARD_MERIDIAN) * 4;
  const eot = settings.solarTimeModel === 'apparentSolarTime'
    ? version === TRUE_SOLAR_TIME_V2
      ? noaaEquationOfTimeMinutes(fields.year, fields.month, fields.day, fields.hour, fields.minute, fields.second)
      : legacyEquationOfTimeMinutes(fields.year, fields.month, fields.day)
    : 0;
  const rawCorrectionMinutes = longitudeCorrection + eot;
  const correctionMinutes = version === TRUE_SOLAR_TIME_V2
    ? displayMinutes(rawCorrectionMinutes)
    : legacyDisplayMinutes(rawCorrectionMinutes);
  const appliedCorrectionMinutes = version === TRUE_SOLAR_TIME_V2
    ? roundHalfAwayFromZero(rawCorrectionMinutes)
    : Math.round(correctionMinutes);
  const base = Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second);
  const effective = new Date(base + appliedCorrectionMinutes * 60_000);
  const baseDay = Date.UTC(fields.year, fields.month - 1, fields.day);
  const effectiveDay = Date.UTC(effective.getUTCFullYear(), effective.getUTCMonth(), effective.getUTCDate());
  const dayOffset = Math.round((effectiveDay - baseDay) / 86_400_000);
  const modelLabel = settings.solarTimeModel === 'localMeanSolarTime' ? '地方平太阳时' : '视太阳时';
  const roundingRule: BaziTrueSolarRoundingRule = version === TRUE_SOLAR_TIME_V2
    ? 'nearest-minute-half-away-from-zero'
    : 'legacy-js-math-round-after-tenth';
  const dataSource = sourceForVersion(version);
  const dataVersion = dataVersionForVersion(version);
  return {
    applied: true,
    model: settings.solarTimeModel,
    algorithmVersion: version,
    civilTime: `${profile.birthDate}T${String(fields.hour).padStart(2, '0')}:${String(fields.minute).padStart(2, '0')}:${String(fields.second).padStart(2, '0')}`,
    effectiveDate: formatDate(effective),
    effectiveTime: formatTime(effective),
    rawCorrectionMinutes,
    correctionMinutes,
    appliedCorrectionMinutes,
    roundingRule,
    dataSource,
    dataVersion,
    ...(version === TRUE_SOLAR_TIME_V2 ? { dataSourceUrl: TRUE_SOLAR_DATA_URL } : {}),
    provenanceStatus: version === TRUE_SOLAR_TIME_V2 ? 'current' : 'legacy',
    longitude: profile.longitude,
    standardMeridian: TRUE_SOLAR_STANDARD_MERIDIAN,
    dayOffset,
    precisionMinutes: 1,
    timezone,
    note: `${modelLabel}：规则 ${version}；标准经线 ${TRUE_SOLAR_STANDARD_MERIDIAN}°E；经度修正 ${longitudeCorrection.toFixed(1)} 分钟${settings.solarTimeModel === 'apparentSolarTime' ? `，均时差 ${eot.toFixed(1)} 分钟` : ''}；实际按 ${roundingRule} 取整。`,
  };
}
