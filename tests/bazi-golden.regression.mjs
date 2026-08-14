import assert from 'node:assert/strict';
import test from 'node:test';

import { BAZI_GOLDEN_CASES } from '../src/domains/bazi/golden-cases.ts';
import { calculateIndependentSolarPillars } from '../src/domains/bazi/independent-source.ts';
import { calculateBaziView } from '../src/services/chart-engine.ts';

const generatedAt = '2026-08-14T00:00:00.000Z';

function profileFromGoldenCase(goldenCase) {
  return {
    id: `golden-${goldenCase.id}`,
    name: 'Golden Case',
    relationship: '本人',
    ...goldenCase.input,
    timeKnown: true,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };
}

test('P1-A 八字 Golden Cases 同时通过独立来源与应用适配层', () => {
  assert.ok(BAZI_GOLDEN_CASES.length >= 2);
  for (const goldenCase of BAZI_GOLDEN_CASES) {
    assert.notEqual(goldenCase.sourceType, 'regression-only');
    assert.match(goldenCase.verifiedBy, /lunar-javascript@1\.7\.7/);
    assert.equal(goldenCase.verifiedAt, '2026-08-14');

    const independent = calculateIndependentSolarPillars(goldenCase.input);
    assert.deepEqual(independent, goldenCase.expectedFourPillars, goldenCase.id);

    const result = calculateBaziView(profileFromGoldenCase(goldenCase), undefined, {
      generatedAt,
      bazi: goldenCase.calculationSettings,
    });
    assert.deepEqual(
      Object.fromEntries(result.pillars.map((pillar) => [pillar.key, { stem: pillar.stem, branch: pillar.branch }])),
      goldenCase.expectedFourPillars,
      goldenCase.id,
    );
    assert.deepEqual(result.calculationSettings, goldenCase.calculationSettings);
    assert.equal(result.calculationEvidence.timezone, 'Asia/Shanghai');
    assert.equal(result.calculationEvidence.dayBoundaryRule, 'midnight');
    assert.equal(result.calculationEvidence.solarTermBoundary.status, 'pending');
    assert.equal(result.calculationEvidence.trueSolarCorrection.applied, false);
    assert.equal(result.calculationEvidence.trueSolarCorrection.correctionMinutes, 0);
    assert.ok(result.calculationEvidence.warnings.length >= 2);
  }
});

test('P1-A 未实现的子初与真太阳时设置不会被静默当成已生效', () => {
  const base = BAZI_GOLDEN_CASES[0];
  const profile = profileFromGoldenCase(base);
  assert.throws(
    () => calculateBaziView(profile, undefined, { bazi: { dayBoundary: 'ziEarly' } }),
    /子初换日将在 P1-C 开放/,
  );
  assert.throws(
    () => calculateBaziView(profile, undefined, { bazi: { trueSolarTime: true, solarTimeModel: 'localMeanSolarTime' } }),
    /真太阳时将在 P1-D 开放/,
  );
});

