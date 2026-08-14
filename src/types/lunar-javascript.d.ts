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
  }

  interface Lunar {
    getEightChar(): EightChar;
  }

  interface SolarValue {
    getLunar(): Lunar;
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
  };
}
