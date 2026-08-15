import { calculateBaziView } from '../src/services/chart-engine.ts';

const profile = {
  id: 'true-solar-fixture',
  name: 'True solar fixture',
  relationship: '本人',
  birthDate: '2024-06-21',
  birthTime: '05:30',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: '2026-08-14T00:00:00.000Z',
  updatedAt: '2026-08-14T00:00:00.000Z',
};

const result = calculateBaziView(profile, undefined, {
  generatedAt: '2026-08-14T00:00:00.000Z',
  bazi: {
    trueSolarTime: true,
    solarTimeModel: 'apparentSolarTime',
    trueSolarTimeVersion: 'true-solar-time-v2-noaa',
  },
});

console.log(JSON.stringify({
  settings: result.calculationSettings,
  snapshotMeta: { calculationSettings: result.calculationSettings },
  pillars: result.pillars.map(({ key, stem, branch }) => ({ key, stem, branch })),
  evidence: result.calculationEvidence,
}));
