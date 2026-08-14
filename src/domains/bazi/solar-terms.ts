import { Lunar } from 'lunar-javascript';

import type { BaziBoundaryWindow } from '@/domains/bazi/types';

export const SOLAR_TERM_DATA_SOURCE = '6tail/lunar-javascript';
export const SOLAR_TERM_DATA_VERSION = '1.7.7';
export const SOLAR_TERM_TIMEZONE = 'Asia/Shanghai' as const;
export const SOLAR_TERM_PRECISION_SECONDS = 1 as const;
export const SOLAR_TERM_BOUNDARY_WINDOW_MINUTES = 1 as const;

const SHANGHAI_OFFSET_MINUTES = 8 * 60;
const MINUTE_MS = 60 * 1000;

const MONTH_BOUNDARY_TERMS = [
  '立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
  '立秋', '白露', '寒露', '立冬', '大雪', '小寒',
] as const;

const MONTH_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const;

interface SolarTermPoint {
  name: string;
  civilTime: string;
  epochMs: number;
}

export interface SolarTermCurrentMonthBasis {
  termName: string;
  termTime: string;
  monthBranch: string;
  explanation: string;
}

export interface SolarTermResolution {
  inputCivilTime: string;
  timezone: typeof SOLAR_TERM_TIMEZONE;
  dataSource: string;
  dataVersion: string;
  precisionSeconds: typeof SOLAR_TERM_PRECISION_SECONDS;
  recentTerm: SolarTermPoint;
  nextTerm: SolarTermPoint;
  boundaryWindow?: BaziBoundaryWindow;
  currentMonthBasis: SolarTermCurrentMonthBasis;
  warnings: string[];
}

type ProcessLike = { env: Record<string, string | undefined> };

function withShanghaiTimezone<T>(callback: () => T): T {
  const processLike = (globalThis as { process?: ProcessLike }).process;
  const previousTimezone = processLike?.env.TZ;
  if (processLike) processLike.env.TZ = SOLAR_TERM_TIMEZONE;
  try {
    return callback();
  } finally {
    if (processLike) processLike.env.TZ = previousTimezone;
  }
}

function parseCivilTime(value: string): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) throw new Error('八字节气解析需要 Asia/Shanghai 民用时间：YYYY-MM-DDTHH:MM[:SS]。');
  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '00'] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    calendarCheck.getUTCFullYear() !== year
    || calendarCheck.getUTCMonth() !== month - 1
    || calendarCheck.getUTCDate() !== day
    || calendarCheck.getUTCHours() !== hour
    || calendarCheck.getUTCMinutes() !== minute
    || calendarCheck.getUTCSeconds() !== second
  ) {
    throw new Error('八字节气解析收到无效的民用时间。');
  }
  return { year, month, day, hour, minute, second };
}

function civilToEpochMs(value: string): number {
  const parts = parseCivilTime(value);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    - SHANGHAI_OFFSET_MINUTES * MINUTE_MS;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function epochToCivilTime(epochMs: number): string {
  const value = new Date(epochMs + SHANGHAI_OFFSET_MINUTES * MINUTE_MS);
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}T${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}`;
}

function readSolarTermTable(year: number): SolarTermPoint[] {
  return withShanghaiTimezone(() => {
    const table = Lunar.fromYmd(year, 1, 1).getJieQiTable();
    return MONTH_BOUNDARY_TERMS.flatMap((name) => {
      const value = table[name];
      if (!value) return [];
      const civilTime = `${value.getYear()}-${pad(value.getMonth())}-${pad(value.getDay())}T${pad(value.getHour())}:${pad(value.getMinute())}:${pad(value.getSecond())}`;
      return [{ name, civilTime, epochMs: civilToEpochMs(civilTime) }];
    });
  });
}

function collectSolarTerms(year: number): SolarTermPoint[] {
  const points = [
    ...readSolarTermTable(year - 1),
    ...readSolarTermTable(year),
    ...readSolarTermTable(year + 1),
  ];
  const unique = new Map<string, SolarTermPoint>();
  for (const point of points) unique.set(`${point.name}-${point.epochMs}`, point);
  return [...unique.values()].sort((left, right) => left.epochMs - right.epochMs);
}

function boundaryWindow(inputEpochMs: number, termEpochMs: number): BaziBoundaryWindow | undefined {
  if (Math.abs(inputEpochMs - termEpochMs) > SOLAR_TERM_BOUNDARY_WINDOW_MINUTES * MINUTE_MS) return undefined;
  return {
    start: epochToCivilTime(termEpochMs - SOLAR_TERM_BOUNDARY_WINDOW_MINUTES * MINUTE_MS),
    end: epochToCivilTime(termEpochMs + SOLAR_TERM_BOUNDARY_WINDOW_MINUTES * MINUTE_MS),
    precisionSeconds: SOLAR_TERM_PRECISION_SECONDS,
  };
}

export function resolveSolarTermBoundary(inputCivilTime: string): SolarTermResolution {
  const input = parseCivilTime(inputCivilTime);
  const inputEpochMs = civilToEpochMs(inputCivilTime);
  const terms = collectSolarTerms(input.year);
  const recentTerm = [...terms].reverse().find((term) => term.epochMs <= inputEpochMs);
  const nextTerm = terms.find((term) => term.epochMs > inputEpochMs);
  if (!recentTerm || !nextTerm) throw new Error('八字节气解析无法找到前后节气。');

  const termIndex = MONTH_BOUNDARY_TERMS.indexOf(recentTerm.name as (typeof MONTH_BOUNDARY_TERMS)[number]);
  const monthBranch = MONTH_BRANCHES[termIndex >= 0 ? termIndex : 0];
  const nearestTerm = Math.abs(inputEpochMs - recentTerm.epochMs) <= Math.abs(nextTerm.epochMs - inputEpochMs)
    ? recentTerm
    : nextTerm;
  return {
    inputCivilTime,
    timezone: SOLAR_TERM_TIMEZONE,
    dataSource: SOLAR_TERM_DATA_SOURCE,
    dataVersion: SOLAR_TERM_DATA_VERSION,
    precisionSeconds: SOLAR_TERM_PRECISION_SECONDS,
    recentTerm,
    nextTerm,
    boundaryWindow: boundaryWindow(inputEpochMs, nearestTerm.epochMs),
    currentMonthBasis: {
      termName: recentTerm.name,
      termTime: recentTerm.civilTime,
      monthBranch,
      explanation: `月柱以${recentTerm.name}（${recentTerm.civilTime}）为当前节令依据。`,
    },
    warnings: [],
  };
}
