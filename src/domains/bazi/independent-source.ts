import { Solar } from 'lunar-javascript';

import type { BaziGoldenInput, BaziPillarKey, ExpectedBaziPillar } from '@/domains/bazi/golden-cases';

/**
 * Independent cross-check adapter. It is test/evidence infrastructure only;
 * the shipped result still comes from the selected Bazi engine facade.
 */
export function calculateIndependentSolarPillars(input: BaziGoldenInput): Record<BaziPillarKey, ExpectedBaziPillar> {
  if (input.calendar !== 'solar') {
    throw new Error('P1-A independent source currently accepts solar-date fixtures only.');
  }
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour, minute] = (input.birthTime ?? '00:00').split(':').map(Number);
  const processLike = (globalThis as { process?: { env: Record<string, string | undefined> } }).process;
  const previousTimezone = processLike?.env.TZ;
  if (processLike) processLike.env.TZ = 'Asia/Shanghai';
  const eightChar = (() => {
    try {
      const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
      return solar.getLunar().getEightChar();
    } finally {
      if (processLike) processLike.env.TZ = previousTimezone;
    }
  })();
  return {
    year: { stem: eightChar.getYearGan(), branch: eightChar.getYearZhi() },
    month: { stem: eightChar.getMonthGan(), branch: eightChar.getMonthZhi() },
    day: { stem: eightChar.getDayGan(), branch: eightChar.getDayZhi() },
    hour: { stem: eightChar.getTimeGan(), branch: eightChar.getTimeZhi() },
  };
}
