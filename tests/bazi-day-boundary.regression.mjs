import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateBaziView } from '../src/services/chart-engine.ts';

const generatedAt = '2026-08-14T00:00:00.000Z';
const baseProfile = {
  id: 'day-boundary-fixture',
  name: 'Day boundary fixture',
  relationship: '本人',
  birthCity: '北京市',
  calendar: 'solar',
  gender: 'male',
  timeKnown: true,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

function run(date, time, dayBoundary) {
  return calculateBaziView(
    { ...baseProfile, birthDate: date, birthTime: time },
    undefined,
    { generatedAt, bazi: { dayBoundary } },
  );
}

function dayPillar(result) {
  const day = result.pillars.find((pillar) => pillar.key === 'day');
  return `${day.stem}${day.branch}`;
}

test('P1-C 22:59 / 23:00 / 23:01 fixtures make the day-boundary switch visible', () => {
  const before = run('1988-02-15', '22:59', 'ziEarly');
  const at = run('1988-02-15', '23:00', 'ziEarly');
  const after = run('1988-02-15', '23:01', 'ziEarly');
  const midnightAt = run('1988-02-15', '23:00', 'midnight');
  const nextCivilDate = run('1988-02-16', '12:00', 'midnight');

  assert.equal(before.calculationEvidence.effectiveCalculationTime, '1988-02-15T22:59:00');
  assert.equal(at.calculationEvidence.effectiveCalculationTime, '1988-02-16T23:00:00');
  assert.equal(after.calculationEvidence.effectiveCalculationTime, '1988-02-16T23:01:00');
  assert.equal(dayPillar(before), dayPillar(midnightAt));
  assert.notEqual(dayPillar(at), dayPillar(midnightAt));
  assert.equal(dayPillar(at), dayPillar(nextCivilDate));
  assert.equal(dayPillar(at), dayPillar(after));
  assert.equal(midnightAt.calculationEvidence.dayBoundaryRule, 'midnight');
  assert.equal(at.calculationEvidence.dayBoundaryRule, 'ziEarly');
});

test('P1-C midnight remains explicit at 23:00 and does not shift the date', () => {
  const result = run('1988-02-15', '23:00', 'midnight');
  assert.equal(result.calculationEvidence.effectiveCalculationTime, '1988-02-15T23:00:00');
  assert.equal(result.calculationSettings.dayBoundary, 'midnight');
});
