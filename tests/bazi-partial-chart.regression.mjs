import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculateBaziView } from '../src/services/chart-engine.ts';
import { buildChartRenderModel } from '../src/components/chart-render-model.ts';
import { BAZI_PARTIAL_CHART_ANCHOR, BAZI_PARTIAL_CHART_POLICY } from '../src/domains/policy/bazi-partial-chart.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const generatedAt = '2026-01-01T00:00:00.000Z';
const fixedCalculation = { generatedAt };

const unknownHourProfile = {
  id: 'fixture-unknown-hour-partial',
  name: '部分盘样例命主',
  relationship: '本人',
  birthDate: '1990-06-15',
  birthTime: undefined,
  birthCity: '北京市',
  timeKnown: false,
  calendar: 'solar',
  gender: 'male',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

function partialPillars(view) {
  return view.pillars.map((pillar) => `${pillar.stem}${pillar.branch}`);
}

test('部分盘与同日正午完整盘在三柱上完全一致', () => {
  const partial = calculateBaziView(unknownHourProfile, undefined, fixedCalculation);
  const exactAtNoon = calculateBaziView({
    ...unknownHourProfile,
    id: 'fixture-known-noon',
    birthTime: '12:00',
    timeKnown: true,
  }, undefined, fixedCalculation);

  assert.equal(partial.completeness, 'partial');
  assert.deepEqual(partial.missingPillars, ['hour']);
  assert.deepEqual(partialPillars(partial), partialPillars(exactAtNoon).slice(0, 3));
  assert.equal(partial.dayMaster, exactAtNoon.dayMaster);

  // The partial model drops the hour pillar everywhere, including relations.
  assert.equal(partial.normalizedChart.pillars.length, 3);
  assert.ok(!partial.normalizedChart.stems.some((stem) => stem.pillarKey === 'hour'));
  assert.ok(partial.normalizedChart.relations.every((relation) => !relation.pillarRefs.includes('bazi:branch:hour')));
  assert.equal(partial.relations.length, partial.normalizedChart.relations.slice(0, 6).length);

  // Explanation contract and strength chain still work on three pillars.
  assert.equal(partial.explanation.blocks.length, 8);
  assert.ok(partial.strengthAssessment);
  assert.equal(partial.timeLayer, undefined);
  assert.ok(partial.focus.some((item) => item.includes('时柱未提供')));
});

test('部分盘策略、锚点与指纹进入设置与输入快照', () => {
  const partial = calculateBaziView(unknownHourProfile, undefined, fixedCalculation);
  const exact = calculateBaziView({
    ...unknownHourProfile,
    id: 'fixture-known-noon',
    birthTime: '12:00',
    timeKnown: true,
  }, undefined, fixedCalculation);

  assert.equal(partial.calculationSettings.partialChartPolicy, BAZI_PARTIAL_CHART_POLICY);
  assert.equal(partial.calculationSettings.partialChartAnchor, BAZI_PARTIAL_CHART_ANCHOR);
  // The ziEarly convention cannot be established without an hour.
  assert.equal(partial.calculationSettings.dayBoundary, 'midnight');
  assert.equal(partial.inputSnapshot.timeKnown, false);
  assert.equal(partial.inputSnapshot.birthTime, undefined);
  assert.equal(partial.inputSnapshot.partialChartPolicy, BAZI_PARTIAL_CHART_POLICY);
  assert.notEqual(partial.inputFingerprint, exact.inputFingerprint);
  assert.ok(partial.partialChart.basis.includes('时柱不补造'));
  assert.deepEqual(partial.partialChart.missingPillars, ['hour']);
});

test('节气当日在未知时辰下产生年月柱候选范围', () => {
  // 2024-02-04: lichun at 16:27 (published fixture).  Before the term the
  // chart belongs to the previous year/month; after it, to the new one.
  const partial = calculateBaziView({
    ...unknownHourProfile,
    id: 'fixture-lichun-partial',
    birthDate: '2024-02-04',
  }, undefined, fixedCalculation);

  assert.equal(partial.completeness, 'partial');
  const candidatePillars = partial.partialChart.candidates.map((candidate) => candidate.pillar);
  assert.ok(candidatePillars.includes('year'), 'lichun day must raise a year-pillar candidate');
  assert.ok(candidatePillars.includes('month'), 'lichun day must raise a month-pillar candidate');

  const atMidnight = calculateBaziView({
    ...unknownHourProfile,
    id: 'fixture-lichun-0000',
    birthDate: '2024-02-04',
    birthTime: '00:00',
    timeKnown: true,
  }, undefined, fixedCalculation);
  const atEndOfDay = calculateBaziView({
    ...unknownHourProfile,
    id: 'fixture-lichun-2359',
    birthDate: '2024-02-04',
    birthTime: '23:59',
    timeKnown: true,
  }, undefined, fixedCalculation);
  const monthCandidates = partial.partialChart.candidates.find((candidate) => candidate.pillar === 'month');
  const monthGanZhi = monthCandidates.options.map((option) => option.ganZhi);
  assert.ok(monthGanZhi.includes(`${atMidnight.pillars[1].stem}${atMidnight.pillars[1].branch}`));
  assert.ok(monthGanZhi.includes(`${atEndOfDay.pillars[1].stem}${atEndOfDay.pillars[1].branch}`));
  assert.notEqual(
    `${atMidnight.pillars[1].stem}${atMidnight.pillars[1].branch}`,
    `${atEndOfDay.pillars[1].stem}${atEndOfDay.pillars[1].branch}`,
  );
});

test('历史夏令时期间远西经度的未知时辰产生日柱候选', () => {
  // Civil 00:00 in a DST season maps to 23:00 standard time of the previous
  // day, so the day pillar is genuinely hour-dependent for far-west sites.
  const partial = calculateBaziView({
    ...unknownHourProfile,
    id: 'fixture-dst-west-partial',
    birthDate: '1990-06-15',
    longitude: 75,
    latitude: 39.5,
    birthCity: '未知城市',
  }, undefined, { generatedAt, bazi: { trueSolarTime: true, solarTimeModel: 'apparentSolarTime' } });

  const dayCandidate = partial.partialChart.candidates.find((candidate) => candidate.pillar === 'day');
  assert.ok(dayCandidate, 'far-west DST date must raise a day-pillar candidate');
  assert.ok(dayCandidate.options.length >= 2);
  assert.ok(partial.caveats.some((caveat) => caveat.includes('日柱在日内存在多种可能')));
});

test('农历输入的未知时辰同样产出部分盘', () => {
  const partial = calculateBaziView({
    ...unknownHourProfile,
    id: 'fixture-lunar-partial',
    calendar: 'lunar',
    birthDate: '1990-05-23',
    isLeapMonth: false,
  }, undefined, fixedCalculation);
  assert.equal(partial.completeness, 'partial');
  assert.equal(partial.pillars.length, 3);
  assert.equal(partial.calculationSettings.partialChartPolicy, BAZI_PARTIAL_CHART_POLICY);
});

test('部分盘在宿主时区下完全一致并可进入共享渲染模型', () => {
  const utc = runPartialFixture('UTC');
  const shanghai = runPartialFixture('Asia/Shanghai');
  assert.deepEqual(utc, shanghai);

  const model = buildChartRenderModel(utc);
  assert.equal(model.pillars.length, 3);
  assert.equal(model.timeLayer, null);
  assert.ok(model.partialChart);
  assert.ok(Array.isArray(model.partialChart.candidates));
});

function runPartialFixture(hostTimezone) {
  const source = `
    import { calculateBaziView } from './src/services/chart-engine.ts';
    const profile = ${JSON.stringify(unknownHourProfile)};
    const view = calculateBaziView(profile, undefined, ${JSON.stringify(fixedCalculation)});
    process.stdout.write(JSON.stringify({
      payload: {
        pillars: view.pillars.map((pillar) => ({ key: pillar.key, stem: pillar.stem, branch: pillar.branch })),
        completeness: view.completeness,
        missingPillars: view.missingPillars,
        partialChart: view.partialChart,
        caveats: view.caveats,
        fingerprint: view.inputFingerprint,
        settings: {
          partialChartPolicy: view.calculationSettings.partialChartPolicy,
          partialChartAnchor: view.calculationSettings.partialChartAnchor,
          dayBoundary: view.calculationSettings.dayBoundary,
        },
        snapshot: {
          timeKnown: view.inputSnapshot.timeKnown,
          partialChartPolicy: view.inputSnapshot.partialChartPolicy,
        },
      },
    }));
  `;
  return JSON.parse(execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-loader', './scripts/ts-path-loader.mjs', '-e', source],
    { cwd: projectRoot, env: { ...process.env, TZ: hostTimezone }, encoding: 'utf8' },
  )).payload;
}
