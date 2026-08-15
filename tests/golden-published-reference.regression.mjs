import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GOLDEN_CASE_REGISTRY,
  validateGoldenCase,
  validateGoldenCaseRegistry,
} from '../src/domains/golden/index.ts';
import { resolveSolarTermBoundary } from '../src/domains/bazi/solar-terms.ts';
import { calculateBaziView } from '../src/services/chart-engine.ts';

const generatedAt = '2026-08-15T00:00:00.000Z';

function publishedCase(id) {
  const item = GOLDEN_CASE_REGISTRY.find((candidate) => candidate.id === id);
  assert.ok(item, id);
  return item;
}

test('P5-A2 HKO published-reference Golden 通过合同且来源全部是公开资料', () => {
  const cases = GOLDEN_CASE_REGISTRY.filter((item) => item.sourceType === 'published-reference');

  assert.equal(cases.length, 2);
  assert.doesNotThrow(() => validateGoldenCaseRegistry(cases));
  for (const item of cases) {
    assert.doesNotThrow(() => validateGoldenCase(item));
    assert.equal(item.validationClass, 'independent-validation');
    assert.equal(item.sourceType, 'published-reference');
    assert.equal(item.independentVerification.status, 'verified');
    assert.equal(item.independentVerification.scope, 'published-comparison');
    assert.equal(item.sourceReferences.length > 0, true);
    assert.equal(item.sourceReferences.every((reference) => reference.type === 'published-reference'), true);
    assert.equal(item.verifiedAt, '2026-08-15');
    assert.equal(item.expectedInterpretation.notProfessionalTruth, true);
  }
});

test('P5-A2 HKO 2024 立春只比较公开分钟，resolver 在该分钟进入立春', () => {
  const item = publishedCase('bazi-hko-2024-li-chun-minute');
  const facts = item.expectedFacts;
  const probe = facts.resolverProbe;
  const resolved = resolveSolarTermBoundary(probe.civilTime);

  assert.equal(resolved.timezone, item.calculationSettings.timezone);
  assert.equal(resolved.recentTerm.name, facts.solarTerm);
  assert.equal(resolved.currentMonthBasis.termName, probe.expectedCurrentTerm);
  assert.equal(resolved.currentMonthBasis.monthBranch, probe.expectedMonthBranch);

  const publishedMinute = `${facts.publishedLocalDate}T${facts.publishedLocalTime}`;
  assert.equal(facts.publishedPrecision, 'minute');
  assert.equal(resolved.recentTerm.civilTime.slice(0, 16), publishedMinute);
  assert.equal(resolved.currentMonthBasis.termTime.slice(0, 16), publishedMinute);
  assert.equal(probe.scope, 'application-resolver-only');
  assert.equal(
    item.knownDisputes.some((note) => note.includes('16:27:07') && note.includes('分钟')),
    true,
  );
});

test('P5-A2 HKO 农历 2024 正月初一只验证日期映射并保留 calendar evidence', () => {
  const item = publishedCase('bazi-hko-2024-lunar-new-year-date');
  const facts = item.expectedFacts;
  const profile = {
    id: 'hko-lunar-new-year-date-fixture',
    name: 'HKO lunar date fixture',
    relationship: '本人',
    birthDate: facts.lunarDate,
    birthTime: facts.lunarTime,
    birthCity: '北京市',
    timeKnown: true,
    calendar: 'lunar',
    isLeapMonth: false,
    gender: 'male',
    latitude: 39.9042,
    longitude: 116.4074,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  };

  const chart = calculateBaziView(profile, undefined, { generatedAt });
  const conversion = chart.calculationEvidence.calendarConversion;

  assert.equal(chart.calculationEvidence.sourceCalendar, facts.sourceCalendar);
  assert.equal(conversion.sourceCalendar, facts.sourceCalendar);
  assert.equal(conversion.inputDate, facts.lunarDate);
  assert.equal(conversion.inputTime, `${facts.lunarTime}:00`);
  assert.equal(conversion.normalizedSolarDateTime, `${facts.expectedSolarDate}T${facts.expectedSolarTime}`);
  assert.equal(conversion.normalizedSolarDateTime.slice(0, 10), facts.expectedSolarDate);
  assert.equal(conversion.dataSource, item.calculationSettings.calendarResolverDataSource);
  assert.equal(conversion.dataVersion, item.calculationSettings.calendarResolverDataVersion);
  assert.equal(facts.publishedPrecision, 'day');
  assert.equal(chart.calculationEvidence.warnings.some((warning) => warning.includes('农历')), true);
  assert.equal(
    item.knownDisputes.some((note) => note.includes('只验证农历') && note.includes('流派结论')),
    true,
  );
});

test('P5-A2 registry 分类统计更新且紫微/占星/六爻没有 independent-validation', () => {
  const countBy = (key, value) => GOLDEN_CASE_REGISTRY.filter((item) => item[key] === value).length;

  assert.equal(GOLDEN_CASE_REGISTRY.length, 12);
  assert.equal(countBy('validationClass', 'independent-validation'), 4);
  assert.equal(countBy('validationClass', 'regression-only'), 8);
  assert.equal(countBy('validationClass', 'pending-verification'), 0);
  assert.equal(countBy('sourceType', 'independent-library'), 2);
  assert.equal(countBy('sourceType', 'published-reference'), 2);
  for (const module of ['ziwei', 'astrology', 'liuyao']) {
    assert.equal(
      GOLDEN_CASE_REGISTRY.some((item) => item.module === module && item.validationClass === 'independent-validation'),
      false,
      module,
    );
  }
});
