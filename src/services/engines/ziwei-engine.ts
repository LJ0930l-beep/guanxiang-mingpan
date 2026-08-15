import * as iztro from 'iztro/dist/iztro.min.js';

import type { ZiweiChartView } from '@/types/charts';
import { calculationSettings, CHART_SNAPSHOT_VERSION, birthInputSnapshot, birthParts, ENGINE_VERSIONS, generatedAt, requireExactBirth, requireGender } from '@/services/chart-engine-shared';
import type { BirthProfile, Gender } from '@/types/domain';
import type { CalculationOptions } from '@/services/chart-engine-shared';
import { normalizeZiweiChart } from '@/domains/ziwei/model/normalized-chart';
import { buildZiweiEvidenceGraph } from '@/domains/ziwei/evidence/index';
import { buildZiweiExplanation } from '@/domains/ziwei/explanation/index';

export function calculateZiweiView(
  profile: BirthProfile,
  genderOverride?: Gender,
  options?: CalculationOptions,
): ZiweiChartView {
  requireExactBirth(profile);
  const parts = birthParts(profile);
  const gender = requireGender(profile, genderOverride);
  const settings = calculationSettings(options);
  const timeIndex = parts.hour >= 23 ? 12 : parts.hour < 1 ? 0 : Math.floor((parts.hour + 1) / 2);
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const result = profile.calendar === 'lunar'
    ? iztro.astro.byLunar(date, timeIndex, gender, profile.isLeapMonth ?? false, true, 'zh-CN')
    : iztro.astro.bySolar(date, timeIndex, gender, true, 'zh-CN');
  const palaces = result.palaces.map((palace) => ({
    name: palace.name,
    stemBranch: `${palace.heavenlyStem}${palace.earthlyBranch}`,
    isBodyPalace: palace.isBodyPalace,
    stars: palace.majorStars.map((star) => `${star.name}${star.brightness ? `·${star.brightness}` : ''}${star.mutagen ? `·化${star.mutagen}` : ''}`),
    minorStars: palace.minorStars.slice(0, 3).map((star) => star.name),
    decadalRange: palace.decadal?.range ? `${palace.decadal.range[0]}–${palace.decadal.range[1]}岁` : undefined,
  }));
  const lifePalace = palaces.find((palace) => palace.name === '命宫');
  const bodyPalace = palaces.find((palace) => palace.isBodyPalace);
  const mutagens = result.palaces.flatMap((palace) =>
    [...palace.majorStars, ...palace.minorStars]
      .filter((star) => star.mutagen)
      .map((star) => `${star.name}化${star.mutagen}入${palace.name}`),
  );
  const source = { engineVersion: ENGINE_VERSIONS.ziwei, snapshotVersion: CHART_SNAPSHOT_VERSION };
  const normalizedChart = normalizeZiweiChart(result, source);
  const evidenceGraph = buildZiweiEvidenceGraph(normalizedChart, { engineVersion: ENGINE_VERSIONS.ziwei });
  const generated = generatedAt(options);

  return {
    module: 'ziwei',
    snapshotVersion: CHART_SNAPSHOT_VERSION,
    generatedAt: generated,
    engineVersion: ENGINE_VERSIONS.ziwei,
    calculationSettings: settings,
    inputSnapshot: birthInputSnapshot(profile, gender, settings),
    completeness: 'complete',
    caveats: ['不同流派在安星与四化规则上存在差异，本版固定算法版本以便复盘。'],
    solarDate: result.solarDate,
    lunarDate: result.lunarDate,
    soul: result.earthlyBranchOfSoulPalace,
    body: result.earthlyBranchOfBodyPalace,
    fiveElement: result.fiveElementsClass,
    lifeMasterStar: result.soul,
    bodyMasterStar: result.body,
    palaces,
    normalizedChart,
    evidenceGraph,
    explanation: buildZiweiExplanation({ chart: normalizedChart, evidenceGraph, generatedAt: generated }),
    mutagens,
    focus: [
      `命宫落「${lifePalace?.stemBranch ?? result.earthlyBranchOfSoulPalace}」，${lifePalace?.stars.length ? `主星为 ${lifePalace.stars.join('、')}` : '本宫无十四主星坐守'}。`,
      `身宫落在「${bodyPalace?.name ?? result.earthlyBranchOfBodyPalace}」，命主 ${result.soul}，身主 ${result.body}。`,
      mutagens.length ? `生年四化：${mutagens.join('；')}。` : '生年四化资料暂未返回。',
    ],
  };
}
