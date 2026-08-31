import { ChartInputError } from '@/services/chart-errors';

/**
 * Public birth-date support is a product contract, not an inference from the
 * date range that a third-party ephemeris or calendar library happens to
 * calculate.  Keep the version and the inclusive boundaries together so a
 * saved chart can explain which release policy admitted its input.
 */
export const PUBLIC_BIRTH_DATE_RANGE_POLICY_VERSION = 'cn-mainland-public-birth-date-range.v1' as const;
export const PUBLIC_BIRTH_DATE_RANGE_START_DATE = '1900-01-01' as const;
export const PUBLIC_BIRTH_DATE_RANGE_END_DATE = '2099-12-31' as const;

export const PUBLIC_BIRTH_DATE_RANGE_POLICY = {
  version: PUBLIC_BIRTH_DATE_RANGE_POLICY_VERSION,
  startDate: PUBLIC_BIRTH_DATE_RANGE_START_DATE,
  endDate: PUBLIC_BIRTH_DATE_RANGE_END_DATE,
  inclusive: true,
} as const;

export type PublicBirthDateRangePolicy = typeof PUBLIC_BIRTH_DATE_RANGE_POLICY;
export type PublicBirthCalendar = 'solar' | 'lunar';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function daysInGregorianMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function invalidDate(calendar: PublicBirthCalendar): never {
  throw new ChartInputError({
    code: calendar === 'solar' ? 'INVALID_GREGORIAN_DATE' : 'INVALID_LUNAR_DATE',
    field: 'birthDate',
  });
}

function assertDateShape(value: unknown, calendar: PublicBirthCalendar): asserts value is string {
  const match = typeof value === 'string' ? DATE_PATTERN.exec(value) : null;
  if (!match) invalidDate(calendar);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (calendar === 'solar') {
    if (month < 1 || month > 12 || day < 1 || day > daysInGregorianMonth(year, month)) invalidDate(calendar);
  } else if (year < 1 || month < 1 || month > 12 || day < 1 || day > 30) {
    // Actual lunar month length and leap-month existence are validated by the
    // owning module before this policy is applied.  This check only prevents
    // malformed fields from being mistaken for a range decision.
    invalidDate(calendar);
  }
}

/**
 * Returns true only for a policy object that exactly describes the current
 * versioned contract.  Storage migration uses this guard to retain a known
 * policy without inventing one for legacy snapshots that never saved it.
 */
export function isPublicBirthDateRangePolicy(value: unknown): value is PublicBirthDateRangePolicy {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  const keys = Object.keys(candidate).sort();
  return keys.join('|') === 'endDate|inclusive|startDate|version'
    && candidate.version === PUBLIC_BIRTH_DATE_RANGE_POLICY_VERSION
    && candidate.startDate === PUBLIC_BIRTH_DATE_RANGE_START_DATE
    && candidate.endDate === PUBLIC_BIRTH_DATE_RANGE_END_DATE
    && candidate.inclusive === true;
}

/**
 * Enforces the owner-approved inclusive date window.  Solar input receives a
 * strict Gregorian check here.  Lunar callers must run their real calendar
 * and leap-month validation first; this function then applies the same
 * YYYY-MM-DD input-year/date window without treating lunar input as Gregorian.
 */
export function assertPublicBirthDateRange(
  value: unknown,
  calendar: PublicBirthCalendar,
): asserts value is string {
  assertDateShape(value, calendar);
  if (value < PUBLIC_BIRTH_DATE_RANGE_START_DATE || value > PUBLIC_BIRTH_DATE_RANGE_END_DATE) {
    throw new ChartInputError({
      code: 'UNSUPPORTED_BIRTH_DATE_RANGE',
      field: 'birthDate',
    });
  }
}
