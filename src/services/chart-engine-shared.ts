import { CHART_SNAPSHOT_VERSION, DEFAULT_CALCULATION_TIMEZONE } from '@/types/charts';
import type { BirthInputSnapshot, CalculationSettings, CalculationTimezone } from '@/types/charts';
import { DEFAULT_BAZI_CALCULATION_SETTINGS } from '@/domains/bazi/types';
import type { BaziCalculationSettings } from '@/domains/bazi/types';
import type { BirthProfile, Gender } from '@/types/domain';

export const ENGINE_VERSIONS = {
  bazi: 'taibu-core@3.4.0/bazi',
  liuyao: 'taibu-core@3.4.0/liuyao+guanxiang-rng-v1',
  ziwei: 'iztro@2.5.8',
  astrology: 'circular-natal-horoscope-js@1.1.0',
} as const;

export const LIUYAO_SEED_SCOPE = 'guanxiang-local-v1' as const;

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

export function calculationSettings(options?: CalculationOptions): CalculationSettings {
  const timezone = options?.timezone ?? DEFAULT_CALCULATION_TIMEZONE;
  if (timezone !== DEFAULT_CALCULATION_TIMEZONE) {
    throw new Error(`当前版本仅支持 ${DEFAULT_CALCULATION_TIMEZONE}，不允许依赖设备或服务器时区。`);
  }
  return { timezone };
}

export function baziCalculationSettings(options?: CalculationOptions): BaziCalculationSettings {
  const base = {
    ...DEFAULT_BAZI_CALCULATION_SETTINGS,
    timezone: calculationSettings(options).timezone,
    ...options?.bazi,
  };
  if (base.dayBoundary !== 'midnight' && base.dayBoundary !== 'ziEarly') {
    throw new Error('八字日界线规则无效；当前仅支持 midnight 或 ziEarly。');
  }
  if ((base.trueSolarTime && base.solarTimeModel === 'none') || (!base.trueSolarTime && base.solarTimeModel !== 'none')) {
    throw new Error('真太阳时设置无效：启用时必须选择 localMeanSolarTime 或 apparentSolarTime。');
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
  if (profile.latitude !== undefined) snapshot.latitude = profile.latitude;
  if (profile.longitude !== undefined) snapshot.longitude = profile.longitude;
  return snapshot;
}

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
export function normalizeLiuyaoDate(input: string, timezone: CalculationTimezone = DEFAULT_CALCULATION_TIMEZONE): string {
  const normalized = input.trim().replace(' ', 'T');
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)) {
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) throw new Error('六爻日期无效，请检查年月日时分是否合理。');
    return formatDateInTimezone(parsed, timezone);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{1,3})?$/.exec(normalized);
  if (!match) throw new Error('六爻日期必须包含时间，请使用 ISO 时间或 YYYY-MM-DDTHH:MM[:SS]。');
  const [, year, month, day, hour, minute, second = '00'] = match;
  const check = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
  if (
    check.getUTCFullYear() !== Number(year)
    || check.getUTCMonth() !== Number(month) - 1
    || check.getUTCDate() !== Number(day)
    || check.getUTCHours() !== Number(hour)
    || check.getUTCMinutes() !== Number(minute)
    || check.getUTCSeconds() !== Number(second)
  ) {
    throw new Error('六爻日期无效，请检查年月日时分是否合理。');
  }
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
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
