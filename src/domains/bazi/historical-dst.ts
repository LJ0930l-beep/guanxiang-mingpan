import type { CalculationTimezone } from '@/types/charts';
import type { BirthProfile } from '@/types/domain';
import { ChartInputError } from '@/services/chart-errors';

/**
 * Frozen source for the China mainland historical DST policy.
 *
 * Source: IANA Time Zone Database release `tzdata2025b`, `asia` entry for
 * `Zone Asia/Shanghai` and `Rule PRC`:
 * https://data.iana.org/time-zones/releases/tzdata2025b.tar.gz
 *
 * The release's own note says the transition is 02:00 -> 03:00 at the start
 * and 02:00 -> 01:00 at the end.  The table below is intentionally checked
 * into the application so a chart never consults device/OS tzdata at runtime.
 */
export const BAZI_HISTORICAL_DST_POLICY_VERSION = 'cn-mainland-historical-dst-1986-1991.v1' as const;
export const BAZI_HISTORICAL_DST_DATA_SOURCE = 'IANA Time Zone Database' as const;
export const BAZI_HISTORICAL_DST_DATA_VERSION = 'tzdata2025b' as const;
export const BAZI_HISTORICAL_DST_DATA_SOURCE_URL = 'https://data.iana.org/time-zones/releases/tzdata2025b.tar.gz' as const;
/** The exact eggert/tz commit to which the frozen tzdata2025b release maps. */
export const BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT = '7e1145bfdb9630c127841dc8ce808a937a300938' as const;
export const BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT_URL = `https://github.com/eggert/tz/commit/${BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT}` as const;
export const BAZI_HISTORICAL_DST_SOURCE_FILE = 'asia' as const;
export const BAZI_HISTORICAL_DST_TIMEZONE = 'Asia/Shanghai' as const;
export const BAZI_HISTORICAL_DST_STANDARD_OFFSET_MINUTES = 480;
export const BAZI_HISTORICAL_DST_DAYLIGHT_OFFSET_MINUTES = 540;
export const BAZI_HISTORICAL_DST_ADJUSTMENT_MINUTES = -60;

export const BAZI_HISTORICAL_DST_SOURCE_RULE = {
  firstStart: 'Rule PRC 1986 only - May 4 2:00 1:00 D',
  recurringStart: 'Rule PRC 1987 1991 - Apr Sun>=11 2:00 1:00 D',
  end: 'Rule PRC 1986 1991 - Sep Sun>=11 2:00 0 S',
  zone: 'Zone Asia/Shanghai 8:00 PRC C%sT',
  wallClock: 'spring 02:00 -> 03:00; autumn 02:00 -> 01:00',
} as const;

export interface BaziHistoricalDstTransition {
  year: number;
  startDate: string;
  endDate: string;
  transitionTime: '02:00:00';
  springGapStart: '02:00:00';
  springGapEnd: '03:00:00';
  autumnOverlapStart: '01:00:00';
  autumnOverlapEnd: '02:00:00';
}

/**
 * Explicit dates are derived from the frozen `Sun>=11` rules in the source
 * release.  They are not generated from the host locale or timezone.
 */
export const BAZI_HISTORICAL_DST_TRANSITIONS: readonly BaziHistoricalDstTransition[] = [
  {
    year: 1986,
    startDate: '1986-05-04',
    endDate: '1986-09-14',
    transitionTime: '02:00:00',
    springGapStart: '02:00:00',
    springGapEnd: '03:00:00',
    autumnOverlapStart: '01:00:00',
    autumnOverlapEnd: '02:00:00',
  },
  {
    year: 1987,
    startDate: '1987-04-12',
    endDate: '1987-09-13',
    transitionTime: '02:00:00',
    springGapStart: '02:00:00',
    springGapEnd: '03:00:00',
    autumnOverlapStart: '01:00:00',
    autumnOverlapEnd: '02:00:00',
  },
  {
    year: 1988,
    startDate: '1988-04-17',
    endDate: '1988-09-11',
    transitionTime: '02:00:00',
    springGapStart: '02:00:00',
    springGapEnd: '03:00:00',
    autumnOverlapStart: '01:00:00',
    autumnOverlapEnd: '02:00:00',
  },
  {
    year: 1989,
    startDate: '1989-04-16',
    endDate: '1989-09-17',
    transitionTime: '02:00:00',
    springGapStart: '02:00:00',
    springGapEnd: '03:00:00',
    autumnOverlapStart: '01:00:00',
    autumnOverlapEnd: '02:00:00',
  },
  {
    year: 1990,
    startDate: '1990-04-15',
    endDate: '1990-09-16',
    transitionTime: '02:00:00',
    springGapStart: '02:00:00',
    springGapEnd: '03:00:00',
    autumnOverlapStart: '01:00:00',
    autumnOverlapEnd: '02:00:00',
  },
  {
    year: 1991,
    startDate: '1991-04-14',
    endDate: '1991-09-15',
    transitionTime: '02:00:00',
    springGapStart: '02:00:00',
    springGapEnd: '03:00:00',
    autumnOverlapStart: '01:00:00',
    autumnOverlapEnd: '02:00:00',
  },
] as const;

export const BAZI_HISTORICAL_DST_POLICY = {
  version: BAZI_HISTORICAL_DST_POLICY_VERSION,
  timezone: BAZI_HISTORICAL_DST_TIMEZONE,
  dataSource: BAZI_HISTORICAL_DST_DATA_SOURCE,
  dataVersion: BAZI_HISTORICAL_DST_DATA_VERSION,
  dataSourceUrl: BAZI_HISTORICAL_DST_DATA_SOURCE_URL,
  dataSourceCommit: BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT,
  dataSourceCommitUrl: BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT_URL,
  sourceFile: BAZI_HISTORICAL_DST_SOURCE_FILE,
  standardOffsetMinutes: BAZI_HISTORICAL_DST_STANDARD_OFFSET_MINUTES,
  daylightOffsetMinutes: BAZI_HISTORICAL_DST_DAYLIGHT_OFFSET_MINUTES,
  adjustmentMinutes: BAZI_HISTORICAL_DST_ADJUSTMENT_MINUTES,
  sourceRule: BAZI_HISTORICAL_DST_SOURCE_RULE,
  transitions: BAZI_HISTORICAL_DST_TRANSITIONS,
} as const;

export type BaziHistoricalDstPolicy = typeof BAZI_HISTORICAL_DST_POLICY;
export type BaziHistoricalDstStatus = 'not-applicable' | 'standard-time' | 'daylight-time';

export interface BaziHistoricalDstResolution {
  policyVersion: typeof BAZI_HISTORICAL_DST_POLICY_VERSION;
  dataSource: typeof BAZI_HISTORICAL_DST_DATA_SOURCE;
  dataVersion: typeof BAZI_HISTORICAL_DST_DATA_VERSION;
  dataSourceUrl: typeof BAZI_HISTORICAL_DST_DATA_SOURCE_URL;
  dataSourceCommit: typeof BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT;
  dataSourceCommitUrl: typeof BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT_URL;
  sourceFile: typeof BAZI_HISTORICAL_DST_SOURCE_FILE;
  timezone: CalculationTimezone;
  sourceCalendar: BirthProfile['calendar'];
  /** The input is a local clock reading, never a host-zone Date. */
  inputClock: 'local-civil';
  /** Original user label; for lunar input this remains the lunar label. */
  sourceCivilTime: string;
  /** Solar civil time after lunar conversion and before DST normalization. */
  normalizedSolarDateTime: string;
  /** Standard-time civil timestamp used by the next calculation stage. */
  effectiveDate: string;
  effectiveTime: string;
  effectiveDateTime: string;
  status: BaziHistoricalDstStatus;
  applied: boolean;
  adjustmentMinutes: 0 | typeof BAZI_HISTORICAL_DST_ADJUSTMENT_MINUTES;
  inputOffsetMinutes: typeof BAZI_HISTORICAL_DST_STANDARD_OFFSET_MINUTES | typeof BAZI_HISTORICAL_DST_DAYLIGHT_OFFSET_MINUTES;
  effectiveOffsetMinutes: typeof BAZI_HISTORICAL_DST_STANDARD_OFFSET_MINUTES;
  dayOffset: -1 | 0;
  transition?: {
    startDate: string;
    endDate: string;
    transitionTime: '02:00:00';
  };
  note: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameJson(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => sameJson(item, right[index]));
  }
  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key, index) => key === rightKeys[index] && sameJson(left[key], right[key]));
  }
  return false;
}

/** Storage migration uses this guard to avoid inventing a policy on old data. */
export function isBaziHistoricalDstPolicy(value: unknown): value is BaziHistoricalDstPolicy {
  return sameJson(value, BAZI_HISTORICAL_DST_POLICY);
}

function formatSourceCivilTime(profile: Pick<BirthProfile, 'birthDate' | 'birthTime'>): string {
  const time = profile.birthTime ?? '00:00';
  return `${profile.birthDate}T${time.length === 5 ? `${time}:00` : time}`;
}

function parseDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('历史夏令时解析需要标准公历民用时刻。');
  const [, year, month, day, hour, minute, second] = match;
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
  ) throw new Error('历史夏令时解析需要有效的公历民用时刻。');
  return fields;
}

function formatDate(value: Date): string {
  return `${String(value.getUTCFullYear()).padStart(4, '0')}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

function formatTime(value: Date): string {
  return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}:${String(value.getUTCSeconds()).padStart(2, '0')}`;
}

function shiftMinutes(value: string, minutes: number): { date: string; time: string; dateTime: string; dayOffset: -1 | 0 } {
  const fields = parseDateTime(value);
  const base = Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second);
  const shifted = new Date(base + minutes * 60_000);
  const date = formatDate(shifted);
  const time = formatTime(shifted);
  const baseDate = Date.UTC(fields.year, fields.month - 1, fields.day);
  const shiftedDate = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  const dayOffset = Math.round((shiftedDate - baseDate) / 86_400_000);
  if (dayOffset !== -1 && dayOffset !== 0) throw new Error('历史夏令时修正超出预期的日期范围。');
  return { date, time, dateTime: `${date}T${time}`, dayOffset };
}

function baseResolution(
  sourceProfile: Pick<BirthProfile, 'birthDate' | 'birthTime' | 'calendar'>,
  normalizedSolarDateTime: string,
  status: BaziHistoricalDstStatus,
  applied: boolean,
  adjustmentMinutes: 0 | typeof BAZI_HISTORICAL_DST_ADJUSTMENT_MINUTES,
  inputOffsetMinutes: typeof BAZI_HISTORICAL_DST_STANDARD_OFFSET_MINUTES | typeof BAZI_HISTORICAL_DST_DAYLIGHT_OFFSET_MINUTES,
  effectiveDateTime: string,
  dayOffset: -1 | 0,
  transition?: BaziHistoricalDstResolution['transition'],
  note = '',
): BaziHistoricalDstResolution {
  const [effectiveDate, effectiveTime] = effectiveDateTime.split('T') as [string, string];
  return {
    policyVersion: BAZI_HISTORICAL_DST_POLICY_VERSION,
    dataSource: BAZI_HISTORICAL_DST_DATA_SOURCE,
    dataVersion: BAZI_HISTORICAL_DST_DATA_VERSION,
    dataSourceUrl: BAZI_HISTORICAL_DST_DATA_SOURCE_URL,
    dataSourceCommit: BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT,
    dataSourceCommitUrl: BAZI_HISTORICAL_DST_DATA_SOURCE_COMMIT_URL,
    sourceFile: BAZI_HISTORICAL_DST_SOURCE_FILE,
    timezone: BAZI_HISTORICAL_DST_TIMEZONE,
    sourceCalendar: sourceProfile.calendar,
    inputClock: 'local-civil',
    sourceCivilTime: formatSourceCivilTime(sourceProfile),
    normalizedSolarDateTime,
    effectiveDate,
    effectiveTime,
    effectiveDateTime,
    status,
    applied,
    adjustmentMinutes,
    inputOffsetMinutes,
    effectiveOffsetMinutes: BAZI_HISTORICAL_DST_STANDARD_OFFSET_MINUTES,
    dayOffset,
    ...(transition ? { transition } : {}),
    note,
  };
}

function compareRange(value: string, start: string, end: string): boolean {
  return value >= start && value < end;
}

function dstInputError(code: 'NONEXISTENT_LOCAL_TIME' | 'AMBIGUOUS_LOCAL_TIME'): never {
  throw new ChartInputError({ code, field: 'birthTime' });
}

/**
 * Resolves an already Gregorian-normalized solar civil timestamp.  Lunar
 * inputs are passed in with their original profile only for audit metadata;
 * DST comparisons always use the converted solar timestamp.
 */
export function resolveBaziHistoricalDst(
  sourceProfile: Pick<BirthProfile, 'birthDate' | 'birthTime' | 'calendar'>,
  normalizedSolarDateTime: string,
  settings: { timezone: CalculationTimezone; historicalDstPolicy: BaziHistoricalDstPolicy },
): BaziHistoricalDstResolution {
  if (settings.timezone !== BAZI_HISTORICAL_DST_TIMEZONE) {
    throw new Error(`历史夏令时规则仅支持 ${BAZI_HISTORICAL_DST_TIMEZONE}。`);
  }
  if (!isBaziHistoricalDstPolicy(settings.historicalDstPolicy)) {
    throw new Error('历史夏令时规则版本无效。');
  }
  parseDateTime(normalizedSolarDateTime);
  const year = Number(normalizedSolarDateTime.slice(0, 4));
  const transition = BAZI_HISTORICAL_DST_TRANSITIONS.find((item) => item.year === year);
  if (!transition) {
    return baseResolution(
      sourceProfile,
      normalizedSolarDateTime,
      'not-applicable',
      false,
      0,
      BAZI_HISTORICAL_DST_STANDARD_OFFSET_MINUTES,
      normalizedSolarDateTime,
      0,
      undefined,
      '不在中国大陆 1986–1991 历史夏令时政策年份内，未应用夏令时修正。',
    );
  }

  const springGapStart = `${transition.startDate}T${transition.springGapStart}`;
  const springGapEnd = `${transition.startDate}T${transition.springGapEnd}`;
  const autumnOverlapStart = `${transition.endDate}T${transition.autumnOverlapStart}`;
  const autumnOverlapEnd = `${transition.endDate}T${transition.autumnOverlapEnd}`;
  if (compareRange(normalizedSolarDateTime, springGapStart, springGapEnd)) dstInputError('NONEXISTENT_LOCAL_TIME');
  if (compareRange(normalizedSolarDateTime, autumnOverlapStart, autumnOverlapEnd)) dstInputError('AMBIGUOUS_LOCAL_TIME');

  const active = compareRange(normalizedSolarDateTime, springGapEnd, autumnOverlapStart);
  if (!active) {
    return baseResolution(
      sourceProfile,
      normalizedSolarDateTime,
      'standard-time',
      false,
      0,
      BAZI_HISTORICAL_DST_STANDARD_OFFSET_MINUTES,
      normalizedSolarDateTime,
      0,
      {
        startDate: transition.startDate,
        endDate: transition.endDate,
        transitionTime: transition.transitionTime,
      },
      `中国大陆历史夏令时政策 ${BAZI_HISTORICAL_DST_POLICY_VERSION}：该时刻处于标准时（UTC+08:00），未修正。`,
    );
  }

  const shifted = shiftMinutes(normalizedSolarDateTime, BAZI_HISTORICAL_DST_ADJUSTMENT_MINUTES);
  return baseResolution(
    sourceProfile,
    normalizedSolarDateTime,
    'daylight-time',
    true,
    BAZI_HISTORICAL_DST_ADJUSTMENT_MINUTES,
    BAZI_HISTORICAL_DST_DAYLIGHT_OFFSET_MINUTES,
    shifted.dateTime,
    shifted.dayOffset,
    {
      startDate: transition.startDate,
      endDate: transition.endDate,
      transitionTime: transition.transitionTime,
    },
    `中国大陆历史夏令时政策 ${BAZI_HISTORICAL_DST_POLICY_VERSION}：民用钟表处于 UTC+09:00；按规则减 60 分钟后以 UTC+08:00 有效时刻计算。`,
  );
}
