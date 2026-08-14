import { Lunar } from 'lunar-javascript';

import type { BirthProfile } from '@/types/domain';
import type { BaziCalculationSettings, BaziDayBoundary } from '@/domains/bazi/types';

export interface BaziDayBoundaryResolution {
  rule: BaziDayBoundary;
  shiftedToNextDate: boolean;
  sourceCalendar: BirthProfile['calendar'];
  sourceDate: string;
  sourceTime: string;
  effectiveDate: string;
  effectiveTime: string;
  effectiveCalendar: BirthProfile['calendar'];
  effectiveIsLeapMonth?: boolean;
  note: string;
}

function readCivilDateTime(profile: BirthProfile) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(profile.birthDate);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(profile.birthTime ?? '00:00');
  if (!dateMatch || !timeMatch) throw new Error('出生日期或时辰格式无效，无法应用日界线规则。');
  const [, year, month, day] = dateMatch;
  const [, hour, minute, second = '00'] = timeMatch;
  const check = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
  if (
    check.getUTCFullYear() !== Number(year)
    || check.getUTCMonth() !== Number(month) - 1
    || check.getUTCDate() !== Number(day)
    || check.getUTCHours() !== Number(hour)
    || check.getUTCMinutes() !== Number(minute)
    || check.getUTCSeconds() !== Number(second)
  ) throw new Error('出生日期或时辰不是有效的公历字段。');
  return { year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute), second: Number(second) };
}

function isoDate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatTime(hour: number, minute: number, second: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function nextLunarDate(profile: BirthProfile, fields: ReturnType<typeof readCivilDateTime>) {
  const lunarMonth = profile.isLeapMonth ? -fields.month : fields.month;
  const lunar = Lunar.fromYmdHms(fields.year, lunarMonth, fields.day, fields.hour, fields.minute, fields.second);
  const next = lunar.next(1);
  return {
    date: isoDate(next.getYear(), Math.abs(next.getMonth()), next.getDay()),
    isLeapMonth: next.getMonth() < 0,
  };
}

/**
 * Resolve only the day-boundary rule. The returned date is still a civil
 * timestamp in the fixed Asia/Shanghai business timezone; no host Date
 * timezone getters are used for the decision.
 */
export function resolveBaziDayBoundary(
  profile: BirthProfile,
  settings: Pick<BaziCalculationSettings, 'dayBoundary'>,
): BaziDayBoundaryResolution {
  const fields = readCivilDateTime(profile);
  const sourceDate = profile.birthDate;
  const sourceTime = formatTime(fields.hour, fields.minute, fields.second);
  const isZiEarly = settings.dayBoundary === 'ziEarly' && fields.hour >= 23;

  if (!isZiEarly) {
    return {
      rule: settings.dayBoundary,
      shiftedToNextDate: false,
      sourceCalendar: profile.calendar,
      sourceDate,
      sourceTime,
      effectiveDate: sourceDate,
      effectiveTime: sourceTime,
      effectiveCalendar: profile.calendar,
      effectiveIsLeapMonth: profile.isLeapMonth,
      note: settings.dayBoundary === 'ziEarly'
        ? '子初换日规则已启用；23:00 前仍按当日柱。'
        : '午夜换日规则：00:00 起按当日柱。',
    };
  }

  if (profile.calendar === 'lunar') {
    const next = nextLunarDate(profile, fields);
    return {
      rule: settings.dayBoundary,
      shiftedToNextDate: true,
      sourceCalendar: profile.calendar,
      sourceDate,
      sourceTime,
      effectiveDate: next.date,
      effectiveTime: sourceTime,
      effectiveCalendar: 'lunar',
      effectiveIsLeapMonth: next.isLeapMonth,
      note: '子初换日规则：23:00 起按下一农历日计算日柱与时柱。',
    };
  }

  const next = new Date(Date.UTC(fields.year, fields.month - 1, fields.day + 1));
  return {
    rule: settings.dayBoundary,
    shiftedToNextDate: true,
    sourceCalendar: profile.calendar,
    sourceDate,
    sourceTime,
    effectiveDate: isoDate(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()),
    effectiveTime: sourceTime,
    effectiveCalendar: profile.calendar,
    effectiveIsLeapMonth: profile.isLeapMonth,
    note: '子初换日规则：23:00 起按次日柱与次日时柱计算。',
  };
}
