import { Lunar } from 'lunar-javascript';

import { resolveSolarTermBoundary } from '@/domains/bazi/solar-terms';
import type { Gender } from '@/types/domain';

/**
 * Engineering baseline for the structured dayun/liunian time layer.
 *
 * The owner-approved review charter (§7) admits a basic dayun and a
 * user-selected year comparison only with an explicit rule version, direction,
 * age convention and boundaries recorded. Conventional qi-yun arithmetic
 * (three days per year) is deterministic calendar work; the interpretive
 * weight of these facts stays pending professional review, so every fact
 * carries the baseline caveat and nothing here claims fortune conclusions.
 */
export const BAZI_DAYUN_RULE_VERSION = 'bazi-dayun-v1' as const;
export const BAZI_DAYUN_SOURCE = 'guanxiang-engineering-baseline:conventional-qi-yun-v1' as const;
export const BAZI_DAYUN_ENTRY_COUNT = 8 as const;
export const BAZI_LIUNIAN_YEAR_MIN = 1900 as const;
export const BAZI_LIUNIAN_YEAR_MAX = 2099 as const;

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
const YANG_STEMS = new Set<string>(['甲', '丙', '戊', '庚', '壬']);

const STEM_ELEMENTS: Record<string, string> = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
  己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
};
const STEM_POLARITY: Record<string, 'yin' | 'yang'> = {
  甲: 'yang', 乙: 'yin', 丙: 'yang', 丁: 'yin', 戊: 'yang',
  己: 'yin', 庚: 'yang', 辛: 'yin', 壬: 'yang', 癸: 'yin',
};
const GENERATES: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const OVERCOMES: Record<string, string> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

const SIX_HARMONIES = new Set<string>(['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未']);
const SIX_CLASHES = new Set<string>(['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']);

const PILLAR_LABELS: Record<string, string> = { year: '年柱', month: '月柱', day: '日柱', hour: '时柱' };

const SHANGHAI_OFFSET_MINUTES = 8 * 60;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export interface BaziDayunEntry {
  index: number;
  ganZhi: string;
  startAge: number;
  endAge: number;
  startDate: string;
  endDate: string;
}

export interface BaziLiunianBranchRelation {
  targetPillar: string;
  targetBranch: string;
  kind: '六合' | '六冲';
}

export interface BaziLiunianFacts {
  year: number;
  yearGanZhi: string;
  yearStemTenGod: string;
  branchRelations: BaziLiunianBranchRelation[];
  coveredByDayun?: { index: number; ganZhi: string; startAge: number; endAge: number };
  coverageNote?: string;
  anchor: 'lichun-exact';
}

export interface BaziTimeLayer {
  ruleVersion: typeof BAZI_DAYUN_RULE_VERSION;
  source: string;
  direction: 'forward' | 'backward';
  directionLabel: string;
  ageConvention: string;
  monthPillarGanZhi: string;
  qiYun: {
    years: number;
    months: number;
    days: number;
    date: string;
    distanceDays: number;
    anchorTerm: string;
    anchorTermTime: string;
    anchor: 'effective-calculation-time';
  };
  dayuns: BaziDayunEntry[];
  liunian?: BaziLiunianFacts;
  caveats: string[];
}

export interface BaziTimeLayerInput {
  gender: Gender;
  yearStem: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  natalBranches: { key: 'year' | 'month' | 'day' | 'hour'; branch: string }[];
  birthDate: string;
  effectiveCivilTime: string;
  liunianYear?: number;
}

type ProcessLike = { env: Record<string, string | undefined> };

function withShanghaiTimezone<T>(callback: () => T): T {
  const processLike = (globalThis as { process?: ProcessLike }).process;
  const previousTimezone = processLike?.env.TZ;
  if (processLike) processLike.env.TZ = 'Asia/Shanghai';
  try {
    return callback();
  } finally {
    if (processLike) processLike.env.TZ = previousTimezone;
  }
}

function parseCivilTime(value: string): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) throw new Error('八字起运需要 Asia/Shanghai 民用时间：YYYY-MM-DDTHH:MM[:SS]。');
  const [, yearText, monthText, dayText, hourText, minuteText, secondText = '00'] = match;
  return { year: Number(yearText), month: Number(monthText), day: Number(dayText), hour: Number(hourText), minute: Number(minuteText), second: Number(secondText) };
}

function civilToEpochMs(value: string): number {
  const parts = parseCivilTime(value);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    - SHANGHAI_OFFSET_MINUTES * MINUTE_MS;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Calendar-safe Y+M+D addition on a civil date; overflow normalizes like a wall clock. */
function addYmd(date: string, years: number, months: number, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1 + months, d + days));
  shifted.setUTCFullYear(shifted.getUTCFullYear() + years);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

function addYears(date: string, years: number): string {
  return addYmd(date, years, 0, 0);
}

/** Textbook ten-god mapping between two stems; deterministic and total for all 100 pairs. */
export function tenGodOf(dayStem: string, otherStem: string): string {
  const dayElement = STEM_ELEMENTS[dayStem];
  const otherElement = STEM_ELEMENTS[otherStem];
  if (!dayElement || !otherElement) throw new Error(`十神映射收到未知天干：${dayStem}/${otherStem}`);
  const samePolarity = STEM_POLARITY[dayStem] === STEM_POLARITY[otherStem];
  if (dayElement === otherElement) return samePolarity ? '比肩' : '劫财';
  if (GENERATES[dayElement] === otherElement) return samePolarity ? '食神' : '伤官';
  if (OVERCOMES[dayElement] === otherElement) return samePolarity ? '偏财' : '正财';
  if (OVERCOMES[otherElement] === dayElement) return samePolarity ? '七杀' : '正官';
  return samePolarity ? '偏印' : '正印';
}

function branchRelation(left: string, right: string): '六合' | '六冲' | undefined {
  const pair = SIX_HARMONIES.has(`${left}${right}`) || SIX_HARMONIES.has(`${right}${left}`) ? '六合' : undefined;
  if (pair) return pair;
  return SIX_CLASHES.has(`${left}${right}`) || SIX_CLASHES.has(`${right}${left}`) ? '六冲' : undefined;
}

function ganZhiIndex(stem: string, branch: string): number {
  const stemIndex = STEMS.indexOf(stem as (typeof STEMS)[number]);
  const branchIndex = BRANCHES.indexOf(branch as (typeof BRANCHES)[number]);
  if (stemIndex < 0 || branchIndex < 0) throw new Error(`大运序列收到未知干支：${stem}${branch}`);
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stemIndex && index % 12 === branchIndex) return index;
  }
  throw new Error(`大运序列收到不存在的干支组合：${stem}${branch}`);
}

function ganZhiFromIndex(index: number): string {
  const normalized = ((index % 60) + 60) % 60;
  return STEMS[normalized % 10] + BRANCHES[normalized % 12];
}

/** 立春精确的流年干支：取所选年中立夏之后的固定锚点日，宿主时区不参与。 */
export function liunianYearGanZhi(year: number): string {
  return withShanghaiTimezone(() => Lunar.fromYmd(year, 7, 1).getYearInGanZhiExact());
}

export function assertLiunianYear(value: number): void {
  if (!Number.isInteger(value) || value < BAZI_LIUNIAN_YEAR_MIN || value > BAZI_LIUNIAN_YEAR_MAX) {
    throw new Error(`流年对照年份必须在 ${BAZI_LIUNIAN_YEAR_MIN}-${BAZI_LIUNIAN_YEAR_MAX} 之间。`);
  }
}

/**
 * Build the basic dayun plan and optional selected-year comparison.
 * Requires a known birth time: the qi-yun distance depends on the effective
 * calculation moment, which a partial (unknown-hour) chart deliberately
 * does not establish.
 */
export function buildBaziTimeLayer(input: BaziTimeLayerInput): BaziTimeLayer {
  const { gender, yearStem, monthStem, monthBranch, dayStem, birthDate, effectiveCivilTime } = input;
  const isYangYear = YANG_STEMS.has(yearStem);
  const forward = (isYangYear && gender === 'male') || (!isYangYear && gender === 'female');
  const resolution = resolveSolarTermBoundary(effectiveCivilTime);
  const birthEpochMs = civilToEpochMs(effectiveCivilTime);
  const anchorTerm = forward ? resolution.nextTerm : resolution.recentTerm;
  const distanceMs = forward
    ? resolution.nextTerm.epochMs - birthEpochMs
    : birthEpochMs - resolution.recentTerm.epochMs;
  if (distanceMs <= 0) throw new Error('八字起运距离计算异常：节气距离必须为正。');
  const distanceDays = distanceMs / DAY_MS;

  let years = Math.floor(distanceDays / 3);
  const yearRemainder = distanceDays - years * 3;
  let months = Math.floor(yearRemainder * 4);
  const monthRemainder = yearRemainder * 4 - months;
  let days = Math.round(monthRemainder * 30);
  if (days >= 30) {
    months += 1;
    days -= 30;
  }
  if (months >= 12) {
    years += Math.floor(months / 12);
    months %= 12;
  }

  const qiYunDate = addYmd(birthDate, years, months, days);
  const monthIndex = ganZhiIndex(monthStem, monthBranch);
  const step = forward ? 1 : -1;
  const dayuns: BaziDayunEntry[] = Array.from({ length: BAZI_DAYUN_ENTRY_COUNT }, (_, index) => ({
    index: index + 1,
    ganZhi: ganZhiFromIndex(monthIndex + step * (index + 1)),
    startAge: years + 10 * index,
    endAge: years + 10 * index + 10,
    startDate: addYears(qiYunDate, 10 * index),
    endDate: addYears(qiYunDate, 10 * (index + 1)),
  }));

  let liunian: BaziLiunianFacts | undefined;
  if (input.liunianYear !== undefined) {
    assertLiunianYear(input.liunianYear);
    const yearGanZhi = liunianYearGanZhi(input.liunianYear);
    const branchRelations = input.natalBranches.flatMap(({ key, branch }) => {
      const kind = branchRelation(yearGanZhi[1], branch);
      return kind ? [{ targetPillar: PILLAR_LABELS[key] ?? key, targetBranch: branch, kind }] : [];
    });
    const age = input.liunianYear - Number(birthDate.slice(0, 4));
    const covering = dayuns.find((entry) => age >= entry.startAge && age < entry.endAge);
    liunian = {
      year: input.liunianYear,
      yearGanZhi,
      yearStemTenGod: tenGodOf(dayStem, yearGanZhi[0]),
      branchRelations,
      ...(covering ? {
        coveredByDayun: { index: covering.index, ganZhi: covering.ganZhi, startAge: covering.startAge, endAge: covering.endAge },
      } : {
        coverageNote: '所选年份早于起运年龄，不在基础大运覆盖范围内。',
      }),
      anchor: 'lichun-exact',
    };
  }

  return {
    ruleVersion: BAZI_DAYUN_RULE_VERSION,
    source: BAZI_DAYUN_SOURCE,
    direction: forward ? 'forward' : 'backward',
    directionLabel: forward ? '顺行（阳年男 / 阴年女）' : '逆行（阴年男 / 阳年女）',
    ageConvention: '起运折算岁：起运数整年起步，每步大运十年；起运月/日仅用于起运日期，不另立虚岁口径。',
    monthPillarGanZhi: `${monthStem}${monthBranch}`,
    qiYun: {
      years,
      months,
      days,
      date: qiYunDate,
      distanceDays: Math.round(distanceDays * 1000) / 1000,
      anchorTerm: anchorTerm.name,
      anchorTermTime: anchorTerm.civilTime,
      anchor: 'effective-calculation-time',
    },
    dayuns,
    ...(liunian ? { liunian } : {}),
    caveats: [
      '大运与流年对照是结构事实（bazi-dayun-v1），不构成运势、吉凶或应期结论。',
      '起运采用通行三日折一年口径，专业复核前仅作工程基线。',
    ],
  };
}
