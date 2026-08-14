import { calculateBaziView } from '../src/services/chart-engine.ts';

const profile = {
  id: 'lunar-fixture',
  name: 'Lunar fixture',
  relationship: '本人',
  birthDate: '2024-01-01',
  birthTime: '12:00',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'lunar',
  isLeapMonth: false,
  gender: 'male',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: '2026-08-14T00:00:00.000Z',
  updatedAt: '2026-08-14T00:00:00.000Z',
};

const result = calculateBaziView(profile, undefined, { generatedAt: '2026-08-14T00:00:00.000Z' });
console.log(JSON.stringify({
  pillars: result.pillars.map(({ key, stem, branch }) => ({ key, stem, branch })),
  evidence: result.calculationEvidence,
}));
