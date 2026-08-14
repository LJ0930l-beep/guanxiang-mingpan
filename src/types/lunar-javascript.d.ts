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

  export const Solar: {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): SolarValue;
  };
}

