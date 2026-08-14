import { calculateBazi } from 'taibu-core/bazi';

import { resolveBaziDayBoundary } from '@/domains/bazi/day-boundary';
import { createBaziCalculationEvidence } from '@/domains/bazi/evidence';
import type { BaziChartView } from '@/types/charts';
import { baziCalculationSettings, CHART_SNAPSHOT_VERSION, birthInputSnapshot, birthParts, ENGINE_VERSIONS, generatedAt, requireExactBirth, requireGender } from '@/services/chart-engine-shared';
import type { BirthProfile, Gender } from '@/types/domain';
import type { CalculationOptions } from '@/services/chart-engine-shared';

function inputForBoundary(
  profile: BirthProfile,
  parts: ReturnType<typeof birthParts>,
  gender: Gender,
  resolution: ReturnType<typeof resolveBaziDayBoundary>,
) {
  const [effectiveYear, effectiveMonth, effectiveDay] = resolution.effectiveDate.split('-').map(Number);
  return {
    gender,
    birthYear: resolution.shiftedToNextDate ? effectiveYear : parts.year,
    birthMonth: resolution.shiftedToNextDate ? effectiveMonth : parts.month,
    birthDay: resolution.shiftedToNextDate ? effectiveDay : parts.day,
    birthHour: parts.hour,
    birthMinute: parts.minute,
    calendarType: profile.calendar,
    isLeapMonth: resolution.shiftedToNextDate ? resolution.effectiveIsLeapMonth : profile.isLeapMonth,
    birthPlace: profile.birthCity,
  } as const;
}

function calculateWithDayBoundary(
  profile: BirthProfile,
  parts: ReturnType<typeof birthParts>,
  gender: Gender,
  resolution: ReturnType<typeof resolveBaziDayBoundary>,
) {
  const original = calculateBazi({
    ...inputForBoundary(profile, parts, gender, resolution),
    birthYear: parts.year,
    birthMonth: parts.month,
    birthDay: parts.day,
    isLeapMonth: profile.isLeapMonth,
  });
  if (!resolution.shiftedToNextDate) return original;

  const shifted = calculateBazi(inputForBoundary(profile, parts, gender, resolution));
  const yearChanged = original.fourPillars.year.stem !== shifted.fourPillars.year.stem
    || original.fourPillars.year.branch !== shifted.fourPillars.year.branch;
  const monthChanged = original.fourPillars.month.stem !== shifted.fourPillars.month.stem
    || original.fourPillars.month.branch !== shifted.fourPillars.month.branch;
  return {
    ...shifted,
    // A day-boundary shift must not accidentally move the year/month pillar
    // when 23:00 crosses a solar-term or lunar-new-year boundary.
    fourPillars: {
      ...shifted.fourPillars,
      year: yearChanged ? { ...shifted.fourPillars.year, stem: original.fourPillars.year.stem, branch: original.fourPillars.year.branch, naYin: original.fourPillars.year.naYin } : shifted.fourPillars.year,
      month: monthChanged ? { ...shifted.fourPillars.month, stem: original.fourPillars.month.stem, branch: original.fourPillars.month.branch, naYin: original.fourPillars.month.naYin } : shifted.fourPillars.month,
    },
    taiYuan: monthChanged ? original.taiYuan : shifted.taiYuan,
    mingGong: yearChanged || monthChanged ? original.mingGong : shifted.mingGong,
  };
}

export function calculateBaziView(
  profile: BirthProfile,
  genderOverride?: Gender,
  options?: CalculationOptions,
): BaziChartView {
  requireExactBirth(profile);
  const parts = birthParts(profile);
  const gender = requireGender(profile, genderOverride);
  const settings = baziCalculationSettings(options);
  const dayBoundaryResolution = resolveBaziDayBoundary(profile, settings);
  const result = calculateWithDayBoundary(profile, parts, gender, dayBoundaryResolution);
  const order = [
    ['year', '年柱'],
    ['month', '月柱'],
    ['day', '日柱'],
    ['hour', '时柱'],
  ] as const;
  const pillars = order.map(([key, label]) => {
    const pillar = result.fourPillars[key];
    return {
      key,
      label,
      stem: pillar.stem,
      branch: pillar.branch,
      tenGod: pillar.tenGod,
      hiddenStems: pillar.hiddenStems.map((item) => `${item.stem}·${item.tenGod}`),
      naYin: pillar.naYin,
    };
  });
  const relations = result.relations.slice(0, 6).map((item) => item.description);

  return {
    module: 'bazi',
    snapshotVersion: CHART_SNAPSHOT_VERSION,
    generatedAt: generatedAt(options),
    engineVersion: ENGINE_VERSIONS.bazi,
    calculationSettings: settings,
    calculationEvidence: createBaziCalculationEvidence(profile, settings, dayBoundaryResolution),
    inputSnapshot: birthInputSnapshot(profile, gender, settings),
    completeness: 'complete',
    caveats: ['基础版展示结构证据，不直接给出吉凶定论。', 'P1-A～P1-C 已记录并应用日界线、节气、位置数据与历法解析版本；真太阳时仍将在 P1-D 启用。'],
    dayMaster: result.dayMaster,
    pillars,
    kongWang: `${result.kongWang.xun} · 空 ${result.kongWang.kongZhi.join('、')}`,
    relations,
    focus: [
      `日主为「${result.dayMaster}」，基础解读以日柱为观察中心。`,
      relations.length ? `当前可见的柱间关系包括：${relations.slice(0, 2).join('；')}。` : '当前盘面未检出需要优先标注的柱间合冲刑害。',
      '旺衰与取用需要结合月令、根气、透干和组合继续判断，基础版不把单一五行数量当作结论。',
    ],
  };
}
