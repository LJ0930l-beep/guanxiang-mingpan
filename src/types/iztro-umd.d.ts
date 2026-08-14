declare module 'iztro/dist/iztro.min.js' {
  interface Star {
    name: string;
    brightness?: string;
    mutagen?: string;
  }

  interface Palace {
    name: string;
    heavenlyStem: string;
    earthlyBranch: string;
    isBodyPalace: boolean;
    majorStars: Star[];
    minorStars: Star[];
    decadal?: { range?: [number, number] };
  }

  interface Astrolabe {
    solarDate: string;
    lunarDate: string;
    soul: string;
    body: string;
    fiveElementsClass: string;
    earthlyBranchOfSoulPalace: string;
    earthlyBranchOfBodyPalace: string;
    palaces: Palace[];
  }

  export const astro: {
    bySolar: (date: string, timeIndex: number, gender: 'male' | 'female', fixLeap: boolean, language: string) => Astrolabe;
    byLunar: (date: string, timeIndex: number, gender: 'male' | 'female', isLeapMonth: boolean, fixLeap: boolean, language: string) => Astrolabe;
  };
}
