import { Lunar, LunarYear } from 'lunar-javascript';

import type { BirthProfile } from '@/types/domain';

export const CALENDAR_RESOLVER_VERSION = 'calendar-resolver-p1e-v1';
export const CALENDAR_RESOLVER_DATA_SOURCE = '6tail/lunar-javascript';
export const CALENDAR_RESOLVER_DATA_VERSION = '1.7.7';

export interface BaziCalendarConversionEvidence {
  sourceCalendar: BirthProfile['calendar'];
  inputDate: string;
  inputTime: string;
  isLeapMonth?: boolean;
  normalizedSolarDateTime: string;
  dataSource: string;
  dataVersion: string;
  resolverVersion: string;
  note: string;
}

export interface BaziCalendarResolution {
  normalizedSolarDate: string;
  normalizedSolarTime: string;
  conversion: BaziCalendarConversionEvidence;
}

function parseInput(profile: BirthProfile) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(profile.birthDate);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(profile.birthTime ?? '00:00');
  if (!dateMatch || !timeMatch) throw new Error('出生日期或时辰格式无效。');
  const [, year, month, day] = dateMatch;
  const [, hour, minute, second = '00'] = timeMatch;
  const fields = { year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute), second: Number(second) };
  if (profile.calendar === 'solar') {
    const check = new Date(Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second));
    if (
      check.getUTCFullYear() !== fields.year
      || check.getUTCMonth() !== fields.month - 1
      || check.getUTCDate() !== fields.day
      || check.getUTCHours() !== fields.hour
      || check.getUTCMinutes() !== fields.minute
      || check.getUTCSeconds() !== fields.second
    ) throw new Error('公历日期或时辰无效。');
  } else if (
    fields.year < 1 || fields.month < 1 || fields.month > 12 || fields.day < 1 || fields.day > 30
    || fields.hour < 0 || fields.hour > 23 || fields.minute < 0 || fields.minute > 59 || fields.second < 0 || fields.second > 59
  ) {
    throw new Error('农历日期无效：日期或时辰字段超出范围。');
  }
  return fields;
}

function formatSolar(solar: { getYear(): number; getMonth(): number; getDay(): number; getHour(): number; getMinute(): number; getSecond(): number }) {
  return {
    date: `${String(solar.getYear()).padStart(4, '0')}-${String(solar.getMonth()).padStart(2, '0')}-${String(solar.getDay()).padStart(2, '0')}`,
    time: `${String(solar.getHour()).padStart(2, '0')}:${String(solar.getMinute()).padStart(2, '0')}:${String(solar.getSecond()).padStart(2, '0')}`,
  };
}

export function resolveBaziCalendar(profile: BirthProfile): BaziCalendarResolution {
  const fields = parseInput(profile);
  const inputTime = `${String(fields.hour).padStart(2, '0')}:${String(fields.minute).padStart(2, '0')}:${String(fields.second).padStart(2, '0')}`;
  if (profile.calendar === 'solar') {
    return {
      normalizedSolarDate: profile.birthDate,
      normalizedSolarTime: inputTime,
      conversion: {
        sourceCalendar: profile.calendar,
        inputDate: profile.birthDate,
        inputTime,
        normalizedSolarDateTime: `${profile.birthDate}T${inputTime}`,
        dataSource: CALENDAR_RESOLVER_DATA_SOURCE,
        dataVersion: CALENDAR_RESOLVER_DATA_VERSION,
        resolverVersion: CALENDAR_RESOLVER_VERSION,
        note: '公历输入无需农历换算；日期字段已通过 UTC-only 校验。',
      },
    };
  }

  const leapMonth = LunarYear.fromYear(fields.year).getLeapMonth();
  if (profile.isLeapMonth && leapMonth !== fields.month) {
    throw new Error(`${fields.year} 年不存在闰 ${fields.month} 月，已拒绝继续排盘。`);
  }
  const lunarMonth = profile.isLeapMonth ? -fields.month : fields.month;
  let lunar;
  try {
    lunar = Lunar.fromYmdHms(fields.year, lunarMonth, fields.day, fields.hour, fields.minute, fields.second);
  } catch {
    throw new Error(`农历日期无效：${fields.year} 年${profile.isLeapMonth ? '闰' : ''}${fields.month} 月 ${fields.day} 日。`);
  }
  const solar = formatSolar(lunar.getSolar());
  return {
    normalizedSolarDate: solar.date,
    normalizedSolarTime: solar.time,
    conversion: {
      sourceCalendar: profile.calendar,
      inputDate: profile.birthDate,
      inputTime,
      isLeapMonth: profile.isLeapMonth,
      normalizedSolarDateTime: `${solar.date}T${solar.time}`,
      dataSource: CALENDAR_RESOLVER_DATA_SOURCE,
      dataVersion: CALENDAR_RESOLVER_DATA_VERSION,
      resolverVersion: CALENDAR_RESOLVER_VERSION,
      note: `农历${profile.isLeapMonth ? '闰' : ''}${fields.month}月${fields.day}日已转换为公历 ${solar.date}；后续节气、日界线与真太阳时均基于该公历时刻。`,
    },
  };
}
