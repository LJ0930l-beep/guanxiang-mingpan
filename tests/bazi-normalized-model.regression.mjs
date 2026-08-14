import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateBaziView } from '../src/services/chart-engine.ts';

const profile = {
  id: 'p2-a-shenzhen',
  name: 'P2-A 样例',
  relationship: '本人',
  birthDate: '2001-09-08',
  birthTime: '20:30',
  birthCity: '广东省深圳市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 22.5431,
  longitude: 114.0579,
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

test('P2-A normalized chart exposes stable IDs and raw relation edges', () => {
  const result = calculateBaziView(profile, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  const normalized = result.normalizedChart;

  assert.equal(normalized.modelVersion, 'bazi-normalized-v1');
  assert.equal(normalized.source.engineVersion, result.engineVersion);
  assert.deepEqual(normalized.pillars.map((pillar) => pillar.id), [
    'bazi:pillar:year',
    'bazi:pillar:month',
    'bazi:pillar:day',
    'bazi:pillar:hour',
  ]);
  assert.equal(normalized.dayMaster.id, 'bazi:stem:day');
  assert.equal(normalized.dayMaster.value, '甲');
  assert.equal(normalized.monthBranch.id, 'bazi:branch:month');
  assert.deepEqual(normalized.hiddenStems.filter((item) => item.pillarKey === 'year').map((item) => ({ id: item.id, value: item.value, qiType: item.qiType })), [
    { id: 'bazi:hidden:year:0', value: '丙', qiType: '本气' },
    { id: 'bazi:hidden:year:1', value: '庚', qiType: '中气' },
    { id: 'bazi:hidden:year:2', value: '戊', qiType: '余气' },
  ]);
  assert.deepEqual(normalized.relations.map(({ type, pillarRefs, affectedElement }) => ({ type, pillarRefs, affectedElement })), [
    { type: 'half-combine', pillarRefs: ['bazi:branch:year', 'bazi:branch:month'], affectedElement: 'metal' },
    { type: 'harm', pillarRefs: ['bazi:branch:month', 'bazi:branch:day'], affectedElement: undefined },
    { type: 'harm', pillarRefs: ['bazi:branch:month', 'bazi:branch:hour'], affectedElement: undefined },
    { type: 'punishment', pillarRefs: ['bazi:branch:day', 'bazi:branch:hour'], affectedElement: undefined },
  ]);
});

test('P2-A normalized IDs do not depend on UI display strings', () => {
  const result = calculateBaziView(profile, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  assert.notEqual(result.normalizedChart.relations[0]?.id, result.relations[0]);
  assert.equal(result.normalizedChart.stems.every((stem) => stem.id.startsWith('bazi:stem:')), true);
});
