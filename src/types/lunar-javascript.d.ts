declare module 'lunar-javascript' {
  interface EightChar {
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    setSect(sect: number): void;
  }

  interface Lunar {
    getEightChar(): EightChar;
    next(days: number): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): SolarValue;
  }

  interface SolarValue {
    getLunar(): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
  }

  interface SolarTermValue {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
  }

  interface LunarValue {
    getJieQiTable(): Record<string, SolarTermValue>;
  }

  export const Solar: {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): SolarValue;
  };

  export const Lunar: {
    fromYmd(year: number, month: number, day: number): LunarValue;
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Lunar;
  };

  export const LunarYear: {
    fromYear(year: number): { getLeapMonth(): number };
  };
}
