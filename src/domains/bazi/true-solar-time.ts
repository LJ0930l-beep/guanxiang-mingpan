import type { BaziCalculationSettings, BaziSolarTimeModel } from '@/domains/bazi/types';
import type { BirthProfile } from '@/types/domain';

export const TRUE_SOLAR_STANDARD_MERIDIAN = 120;
export const TRUE_SOLAR_DATA_VERSION = 'equation-of-time-noaa-v1';

export interface TrueSolarTimeResolution {
  applied: boolean;
  model: BaziSolarTimeModel;
  civilTime: string;
  effectiveDate: string;
  effectiveTime: string;
  correctionMinutes: number;
  longitude?: number;
  standardMeridian: number;
  dayOffset: number;
  precisionMinutes: number;
  note: string;
}

function parseCivilTime(profile: BirthProfile) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(profile.birthDate);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(profile.birthTime ?? '00:00');
  if (!dateMatch || !timeMatch) throw new Error('真太阳时计算需要有效的公历日期与时辰。');
  const [, year, month, day] = dateMatch;
  const [, hour, minute, second = '00'] = timeMatch;
  const fields = { year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute), second: Number(second) };
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

/** NOAA-style equation of time in minutes, evaluated with UTC-only arithmetic. */
export function equationOfTimeMinutes(year: number, month: number, day: number) {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = leap ? 366 : 365;
  const angle = (2 * Math.PI * (dayOfYear(year, month, day) - 81)) / totalDays;
  return 9.87 * Math.sin(2 * angle) - 7.53 * Math.cos(angle) - 1.5 * Math.sin(angle);
}

export function resolveTrueSolarTime(
  profile: BirthProfile,
  settings: Pick<BaziCalculationSettings, 'trueSolarTime' | 'solarTimeModel'>,
): TrueSolarTimeResolution {
  const fields = parseCivilTime(profile);
  const civilTime = `${profile.birthDate}T${String(fields.hour).padStart(2, '0')}:${String(fields.minute).padStart(2, '0')}:${String(fields.second).padStart(2, '0')}`;
  if (!settings.trueSolarTime || settings.solarTimeModel === 'none') {
    return {
      applied: false,
      model: 'none',
      civilTime,
      effectiveDate: profile.birthDate,
      effectiveTime: `${String(fields.hour).padStart(2, '0')}:${String(fields.minute).padStart(2, '0')}:${String(fields.second).padStart(2, '0')}`,
      correctionMinutes: 0,
      standardMeridian: TRUE_SOLAR_STANDARD_MERIDIAN,
      dayOffset: 0,
      precisionMinutes: 1,
      note: '未启用真太阳时；有效计算时刻等于输入民用时刻。',
    };
  }
  if (profile.calendar !== 'solar') throw new Error('真太阳时首版只接受公历输入；农历换算证据将在 P1-E 补齐。');
  if (profile.longitude == null || !Number.isFinite(profile.longitude) || profile.longitude < -180 || profile.longitude > 180) {
    throw new Error('启用真太阳时需要已确认的出生地经度，未知城市不会猜测坐标。');
  }

  const longitudeCorrection = (profile.longitude - TRUE_SOLAR_STANDARD_MERIDIAN) * 4;
  const eot = settings.solarTimeModel === 'apparentSolarTime'
    ? equationOfTimeMinutes(fields.year, fields.month, fields.day)
    : 0;
  const correctionMinutes = Math.round((longitudeCorrection + eot) * 10) / 10;
  const roundedCorrection = Math.round(correctionMinutes);
  const base = Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second);
  const effective = new Date(base + roundedCorrection * 60_000);
  const baseDay = Date.UTC(fields.year, fields.month - 1, fields.day);
  const effectiveDay = Date.UTC(effective.getUTCFullYear(), effective.getUTCMonth(), effective.getUTCDate());
  const dayOffset = Math.round((effectiveDay - baseDay) / 86_400_000);
  const modelLabel = settings.solarTimeModel === 'localMeanSolarTime' ? '地方平太阳时' : '视太阳时';
  return {
    applied: true,
    model: settings.solarTimeModel,
    civilTime,
    effectiveDate: formatDate(effective),
    effectiveTime: formatTime(effective),
    correctionMinutes,
    longitude: profile.longitude,
    standardMeridian: TRUE_SOLAR_STANDARD_MERIDIAN,
    dayOffset,
    precisionMinutes: 1,
    note: `${modelLabel}：标准经线 ${TRUE_SOLAR_STANDARD_MERIDIAN}°E；经度修正 ${longitudeCorrection.toFixed(1)} 分钟${settings.solarTimeModel === 'apparentSolarTime' ? `，均时差 ${eot.toFixed(1)} 分钟` : ''}。`,
  };
}
