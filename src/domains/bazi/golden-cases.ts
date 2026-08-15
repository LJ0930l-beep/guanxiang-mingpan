import type { BaziCalculationSettings } from '@/domains/bazi/types';

export type BaziPillarKey = 'year' | 'month' | 'day' | 'hour';

export interface BaziGoldenInput {
  birthDate: string;
  birthTime: string;
  birthCity: string;
  calendar: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  gender: 'male' | 'female';
  latitude?: number;
  longitude?: number;
}

export interface ExpectedBaziPillar {
  stem: string;
  branch: string;
}

export type GoldenCaseSourceType = 'independent-library' | 'published-reference' | 'regression-only';

export interface BaziGoldenCase {
  id: string;
  source: string;
  sourceType: GoldenCaseSourceType;
  input: BaziGoldenInput;
  calculationSettings: BaziCalculationSettings;
  expectedFourPillars: Record<BaziPillarKey, ExpectedBaziPillar>;
  expectedBoundaryNotes: string[];
  rulePremise: string;
  verifiedBy: string;
  verifiedAt: string;
}

/**
 * Expected values were transcribed from the independent MIT lunar-javascript
 * adapter, not copied from taibu-core output. Boundary cases are intentionally
 * left for P1-B/P1-E instead of being mislabeled as verified here.
 */
export const BAZI_GOLDEN_CASES: readonly BaziGoldenCase[] = [
  {
    id: 'solar-1986-05-29-beijing',
    source: '6tail/lunar-javascript@1.7.7 EightChar API',
    sourceType: 'independent-library',
    input: {
      birthDate: '1986-05-29',
      birthTime: '12:00',
      birthCity: '北京市',
      calendar: 'solar',
      gender: 'female',
      latitude: 39.9042,
      longitude: 116.4074,
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      dayBoundary: 'midnight',
      trueSolarTime: false,
      solarTimeModel: 'none',
      trueSolarTimeVersion: 'true-solar-time-v2-noaa',
      locationDatasetVersion: 'china-cities-p1a-sparse-v1',
      calendarResolverVersion: 'solar-terms-p1b-v1',
    },
    expectedFourPillars: {
      year: { stem: '丙', branch: '寅' },
      month: { stem: '癸', branch: '巳' },
      day: { stem: '癸', branch: '酉' },
      hour: { stem: '戊', branch: '午' },
    },
    expectedBoundaryNotes: [],
    rulePremise: 'Asia/Shanghai civil time; solar input; midnight day boundary; no true-solar correction.',
    verifiedBy: 'lunar-javascript@1.7.7',
    verifiedAt: '2026-08-14',
  },
  {
    id: 'solar-2024-02-10-shenzhen',
    source: '6tail/lunar-javascript@1.7.7 EightChar API',
    sourceType: 'independent-library',
    input: {
      birthDate: '2024-02-10',
      birthTime: '12:00',
      birthCity: '广东省深圳市',
      calendar: 'solar',
      gender: 'male',
      latitude: 22.5431,
      longitude: 114.0579,
    },
    calculationSettings: {
      timezone: 'Asia/Shanghai',
      dayBoundary: 'midnight',
      trueSolarTime: false,
      solarTimeModel: 'none',
      trueSolarTimeVersion: 'true-solar-time-v2-noaa',
      locationDatasetVersion: 'china-cities-p1a-sparse-v1',
      calendarResolverVersion: 'solar-terms-p1b-v1',
    },
    expectedFourPillars: {
      year: { stem: '甲', branch: '辰' },
      month: { stem: '丙', branch: '寅' },
      day: { stem: '甲', branch: '辰' },
      hour: { stem: '庚', branch: '午' },
    },
    expectedBoundaryNotes: [],
    rulePremise: 'Asia/Shanghai civil time; solar input; midnight day boundary; no true-solar correction.',
    verifiedBy: 'lunar-javascript@1.7.7',
    verifiedAt: '2026-08-14',
  },
];
