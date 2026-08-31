import { Lunar, LunarYear } from 'lunar-javascript';

import { ChartInputError } from '@/services/chart-errors';

const LUNAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function invalidLunarDate(): never {
  throw new ChartInputError({
    code: 'INVALID_LUNAR_DATE',
    field: 'birthDate',
  });
}

function invalidLunarLeapMonth(): never {
  throw new ChartInputError({
    code: 'INVALID_LUNAR_LEAP_MONTH',
    field: 'isLeapMonth',
  });
}

/**
 * Validates a Ziwei lunar birth date against the fixed lunar-javascript data
 * source before iztro receives it. The library is used only as the calendar
 * boundary authority here; no Bazi rules are reused.
 */
export function assertZiweiLunarDate(value: unknown, isLeapMonth: unknown = false): asserts value is string {
  const match = typeof value === 'string' ? LUNAR_DATE_PATTERN.exec(value) : null;
  if (!match) invalidLunarDate();

  if (typeof isLeapMonth !== 'boolean') invalidLunarLeapMonth();

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 30) invalidLunarDate();

  let leapMonth: number;
  try {
    leapMonth = LunarYear.fromYear(year).getLeapMonth();
  } catch {
    invalidLunarDate();
  }

  if (isLeapMonth && leapMonth !== month) invalidLunarLeapMonth();

  const lunarMonth = isLeapMonth ? -month : month;
  try {
    const lunar = Lunar.fromYmdHms(year, lunarMonth, day, 12, 0, 0);
    if (lunar.getYear() !== year || lunar.getMonth() !== lunarMonth || lunar.getDay() !== day) {
      invalidLunarDate();
    }
  } catch {
    invalidLunarDate();
  }
}
