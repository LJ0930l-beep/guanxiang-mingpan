import { calculateBazi } from 'taibu-core/bazi';

import type { BaziChartView } from '@/types/charts';
import { calculationSettings, CHART_SNAPSHOT_VERSION, birthInputSnapshot, birthParts, ENGINE_VERSIONS, generatedAt, requireExactBirth, requireGender } from '@/services/chart-engine-shared';
import type { BirthProfile, Gender } from '@/types/domain';
import type { CalculationOptions } from '@/services/chart-engine-shared';

export function calculateBaziView(
  profile: BirthProfile,
  genderOverride?: Gender,
  options?: CalculationOptions,
): BaziChartView {
  requireExactBirth(profile);
  const parts = birthParts(profile);
  const gender = requireGender(profile, genderOverride);
  const settings = calculationSettings(options);
  const result = calculateBazi({
    gender,
    birthYear: parts.year,
    birthMonth: parts.month,
    birthDay: parts.day,
    birthHour: parts.hour,
    birthMinute: parts.minute,
    calendarType: profile.calendar,
    birthPlace: profile.birthCity,
    longitude: profile.longitude,
  });
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
    inputSnapshot: birthInputSnapshot(profile, gender, settings),
    completeness: 'complete',
    caveats: ['基础版展示结构证据，不直接给出吉凶定论。', '子初换日与真太阳时设置将在专业设置中开放。'],
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
