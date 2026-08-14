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

test('P1-A independent Bazi golden cases stay aligned with the application adapter', () => {
  assert.ok(BAZI_GOLDEN_CASES.length >= 2);
  for (const goldenCase of BAZI_GOLDEN_CASES) {
    assert.notEqual(goldenCase.sourceType, 'regression-only');
    assert.match(goldenCase.verifiedBy, /lunar-javascript@1\.7\.7/);
    assert.equal(goldenCase.verifiedAt, '2026-08-14');
    assert.deepEqual(calculateIndependentSolarPillars(goldenCase.input), goldenCase.expectedFourPillars, goldenCase.id);

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
    assert.equal(result.calculationEvidence.solarTermBoundary.status, 'resolved');
    assert.equal(result.calculationEvidence.trueSolarCorrection.applied, false);
  }
});

test('P1-C makes the zi-early day boundary explicit and effective', () => {
  const base = BAZI_GOLDEN_CASES[0];
  const profile = profileFromGoldenCase({
    ...base,
    input: { ...base.input, birthDate: '1988-02-15', birthTime: '23:00' },
  });
  const midnight = calculateBaziView(profile, undefined, { generatedAt, bazi: { dayBoundary: 'midnight' } });
  const ziEarly = calculateBaziView(profile, undefined, { generatedAt, bazi: { dayBoundary: 'ziEarly' } });

  assert.equal(midnight.calculationSettings.dayBoundary, 'midnight');
  assert.equal(ziEarly.calculationSettings.dayBoundary, 'ziEarly');
  assert.equal(ziEarly.calculationEvidence.dayBoundaryRule, 'ziEarly');
  assert.equal(ziEarly.calculationEvidence.effectiveCalculationTime, '1988-02-16T23:00:00');
  assert.notDeepEqual(
    ziEarly.pillars.map(({ stem, branch }) => `${stem}${branch}`),
    midnight.pillars.map(({ stem, branch }) => `${stem}${branch}`),
  );
  assert.ok(ziEarly.calculationEvidence.warnings.some((warning) => warning.includes('23:00')));
});

test('P1-D true-solar settings record correction evidence and change the effective time', () => {
  const profile = profileFromGoldenCase(BAZI_GOLDEN_CASES[0]);
  const result = calculateBaziView(profile, undefined, {
    generatedAt,
    bazi: { trueSolarTime: true, solarTimeModel: 'localMeanSolarTime' },
  });
  assert.equal(result.calculationSettings.trueSolarTime, true);
  assert.equal(result.calculationEvidence.trueSolarCorrection.applied, true);
  assert.equal(result.calculationEvidence.trueSolarCorrection.model, 'localMeanSolarTime');
  assert.equal(result.calculationEvidence.trueSolarCorrection.longitude, profile.longitude);
  assert.notEqual(
    result.calculationEvidence.trueSolarCorrection.effectiveTime,
    result.calculationEvidence.trueSolarCorrection.civilTime,
  );
});
