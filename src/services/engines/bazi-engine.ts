import { calculateBazi } from 'taibu-core/bazi';

import { resolveBaziDayBoundary } from '@/domains/bazi/day-boundary';
import { createBaziCalculationEvidence } from '@/domains/bazi/evidence';
import { resolveBaziCalendar } from '@/domains/bazi/calendar-resolver';
import { resolveBaziHistoricalDst } from '@/domains/bazi/historical-dst';
import { resolveTrueSolarTime } from '@/domains/bazi/true-solar-time';
import { buildBaziTimeLayer } from '@/domains/bazi/dayun';
import { normalizeBaziChart } from '@/domains/bazi/model/normalized-chart';
import { buildBaziEvidenceGraph } from '@/domains/bazi/evidence/index';
import { buildBaziInterpretation } from '@/domains/bazi/interpretation/rules';
import { buildBaziExplanation } from '@/domains/bazi/explanation/index';
import { BAZI_PARTIAL_CHART_ANCHOR, BAZI_PARTIAL_CHART_POLICY, BAZI_PARTIAL_CHART_DECISION } from '@/domains/policy/bazi-partial-chart';
import type { BaziChartView } from '@/types/charts';
import { assertPublicBirthDateRange, baziCalculationSettings, CHART_SNAPSHOT_VERSION, birthInputSnapshot, birthParts, ENGINE_VERSIONS, generatedAt, inputFingerprint, requireGender } from '@/services/chart-engine-shared';
import { withChartEngineErrorBoundary } from '@/services/chart-errors';
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

function assertBaziEngineResult(value: unknown): asserts value is ReturnType<typeof calculateBazi> {
  if (value === null || typeof value !== 'object') throw new Error('八字引擎未返回完整盘面。');
  const candidate = value as {
    fourPillars?: unknown;
    relations?: unknown;
    dayMaster?: unknown;
    kongWang?: unknown;
  };
  const pillars = candidate.fourPillars;
  const isText = (item: unknown): item is string => typeof item === 'string' && item.trim().length > 0;
  const isPillar = (item: unknown): boolean => {
    if (item === null || typeof item !== 'object') return false;
    const pillar = item as Record<string, unknown>;
    return isText(pillar.stem)
      && isText(pillar.branch)
      && Array.isArray(pillar.hiddenStems)
      && pillar.hiddenStems.every((hidden) => {
        if (hidden === null || typeof hidden !== 'object') return false;
        const hiddenStem = hidden as Record<string, unknown>;
        return isText(hiddenStem.stem) && isText(hiddenStem.tenGod);
      })
      && isText(pillar.naYin);
  };
  const isKongWang = (item: unknown): boolean => {
    if (item === null || typeof item !== 'object') return false;
    const kongWang = item as Record<string, unknown>;
    return isText(kongWang.xun)
      && Array.isArray(kongWang.kongZhi)
      && kongWang.kongZhi.every((branch) => isText(branch));
  };
  if (pillars === null || typeof pillars !== 'object'
    || !['year', 'month', 'day', 'hour'].every((key) => {
      const pillar = (pillars as Record<string, unknown>)[key];
      return isPillar(pillar);
    })
    || !Array.isArray(candidate.relations)
    || !candidate.relations.every((relation) => relation !== null
      && typeof relation === 'object'
      && isText((relation as Record<string, unknown>).description))
    || !isText(candidate.dayMaster)
    || !isKongWang(candidate.kongWang)) {
    throw new Error('八字引擎返回的盘面结构不完整。');
  }
}

const PARTIAL_ANCHOR_TIMES = ['00:00', '12:00', '23:59'] as const;
const PARTIAL_PILLAR_ORDER = [
  ['year', '年柱'],
  ['month', '月柱'],
  ['day', '日柱'],
] as const;

/**
 * Unknown-hour chart under bazi-partial-chart-policy.v1.  Three civil anchors
 * run the full correction pipeline (calendar, historical DST, true solar,
 * midnight day boundary); the noon run is the displayed basis and any pillar
 * that moves across anchors is reported as an explicit candidate range.  The
 * hour pillar is never fabricated and the dayun time layer stays unavailable.
 */
function calculatePartialBaziView(
  profile: BirthProfile,
  gender: Gender,
  options?: CalculationOptions,
): BaziChartView {
  const settings = baziCalculationSettings({
    ...options,
    bazi: {
      ...options?.bazi,
      // The ziEarly convention cannot be established without an hour.
      dayBoundary: 'midnight',
      partialChartPolicy: BAZI_PARTIAL_CHART_POLICY,
      partialChartAnchor: BAZI_PARTIAL_CHART_ANCHOR,
    },
  });
  return withChartEngineErrorBoundary('bazi', () => {
    assertPublicBirthDateRange(profile.birthDate, profile.calendar);
    const runs = PARTIAL_ANCHOR_TIMES.map((anchorTime) => {
      const anchorProfile: BirthProfile = { ...profile, birthTime: anchorTime };
      const calendarResolution = resolveBaziCalendar(anchorProfile);
      const solarProfile: BirthProfile = {
        ...anchorProfile,
        calendar: 'solar',
        birthDate: calendarResolution.normalizedSolarDate,
        birthTime: calendarResolution.normalizedSolarTime.slice(0, 5),
      };
      const historicalDstResolution = resolveBaziHistoricalDst(
        anchorProfile,
        calendarResolution.conversion.normalizedSolarDateTime,
        settings,
      );
      const historicalDstProfile = historicalDstResolution.applied
        ? {
            ...solarProfile,
            birthDate: historicalDstResolution.effectiveDate,
            birthTime: historicalDstResolution.effectiveTime.slice(0, 5),
          }
        : solarProfile;
      const trueSolarResolution = resolveTrueSolarTime(historicalDstProfile, settings);
      const calculationProfile = trueSolarResolution.applied
        ? {
            ...historicalDstProfile,
            birthDate: trueSolarResolution.effectiveDate,
            birthTime: trueSolarResolution.effectiveTime.slice(0, 5),
          }
        : historicalDstProfile;
      const parts = birthParts(calculationProfile);
      const dayBoundaryResolution = resolveBaziDayBoundary(calculationProfile, settings);
      const raw = calculateWithDayBoundary(calculationProfile, parts, gender, dayBoundaryResolution);
      assertBaziEngineResult(raw);
      return {
        anchorTime,
        raw,
        calculationProfile,
        calendarResolution,
        historicalDstResolution,
        trueSolarResolution,
        dayBoundaryResolution,
      };
    });
    const base = runs[1];
    const result = base.raw;
    const pillars = PARTIAL_PILLAR_ORDER.map(([key, label]) => {
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
    const normalizedChart = normalizeBaziChart(result, {
      engineVersion: ENGINE_VERSIONS.bazi,
      snapshotVersion: CHART_SNAPSHOT_VERSION,
    }, { includePillars: ['year', 'month', 'day'] });
    const evidenceGraph = buildBaziEvidenceGraph(normalizedChart, { engineVersion: ENGINE_VERSIONS.bazi });
    const interpretation = buildBaziInterpretation(normalizedChart, evidenceGraph);
    const generated = generatedAt(options);
    const explanation = buildBaziExplanation({ evidenceGraph, interpretation, generatedAt: generated });
    const inputSnapshot = birthInputSnapshot(profile, gender, settings, base.historicalDstResolution);
    const fingerprint = inputFingerprint({ module: 'bazi', inputSnapshot, calculationSettings: settings });

    const candidates = PARTIAL_PILLAR_ORDER.flatMap(([key, label]) => {
      const seen = new Map<string, string>();
      for (const run of runs) {
        const ganZhi = `${run.raw.fourPillars[key].stem}${run.raw.fourPillars[key].branch}`;
        if (!seen.has(ganZhi)) seen.set(ganZhi, `按民用 ${run.anchorTime} 锚点（已含历法、历史夏令时与真太阳时修正）`);
      }
      if (seen.size <= 1) return [];
      return [{
        pillar: key,
        label,
        options: [...seen].map(([ganZhi, basis]) => ({ ganZhi, basis })),
      }];
    });

    return {
    module: 'bazi',
    snapshotVersion: CHART_SNAPSHOT_VERSION,
    generatedAt: generated,
    engineVersion: ENGINE_VERSIONS.bazi,
    calculationSettings: settings,
    calculationEvidence: createBaziCalculationEvidence(
      { ...profile, birthTime: '12:00' },
      settings,
      base.dayBoundaryResolution,
      base.trueSolarResolution,
      base.calendarResolution,
      base.historicalDstResolution,
    ),
    normalizedChart,
    evidenceGraph,
    strengthAssessment: evidenceGraph.strengthAssessment!,
    interpretation,
    explanation,
    inputSnapshot,
    inputFingerprint: fingerprint,
    completeness: 'partial',
    missingPillars: ['hour'],
    partialChart: {
      policy: BAZI_PARTIAL_CHART_POLICY,
      anchor: BAZI_PARTIAL_CHART_ANCHOR,
      missingPillars: ['hour'],
      candidates,
      basis: BAZI_PARTIAL_CHART_DECISION,
    },
    caveats: [
      '未知时辰部分盘：仅提供年、月、日三柱；时柱不补造，正午仅作计算锚点。',
      '所有旺衰与主题判断仅基于三柱，应按资料不足对待。',
      '大运与流年对照需要准确时辰，本部分盘暂不提供。',
      ...(candidates.length
        ? candidates.map((candidate) => `${candidate.label}在日内存在多种可能：${candidate.options.map((option) => `${option.ganZhi}（${option.basis}）`).join('；')}。`)
        : ['本样例在 00:00/12:00/23:59 三个锚点下年月日柱保持稳定。']),
      '基础版展示结构证据，不直接给出吉凶定论。',
      ...(base.historicalDstResolution.applied ? [base.historicalDstResolution.note] : []),
      ...(base.trueSolarResolution.applied ? [base.trueSolarResolution.note] : []),
    ],
    dayMaster: result.dayMaster,
    pillars,
    kongWang: `${result.kongWang.xun} · 空 ${result.kongWang.kongZhi.join('、')}`,
    relations: normalizedChart.relations.slice(0, 6).map((relation) => relation.description),
    focus: [
      `日主为「${result.dayMaster}」，部分盘以日柱为观察中心；时柱未提供。`,
      candidates.length
        ? '出生日期落在节气或日界线敏感范围内，请查看年月日柱的候选与不确定范围。'
        : '年月日柱在日内锚点变化下保持稳定。',
      '大运与流年对照需要准确时辰，本部分盘暂不提供。',
    ],
    };
  });
}

export function calculateBaziView(
  profile: BirthProfile,
  genderOverride?: Gender,
  options?: CalculationOptions,
): BaziChartView {
  const gender = requireGender(profile, genderOverride);
  // Owner-approved partial-chart policy (bazi-partial-chart-policy.v1):
  // unknown hour no longer blocks the Bazi module; it yields a year/month/day
  // partial chart. Ziwei keeps the blocking policy via requireExactBirth.
  if (!profile.timeKnown || !profile.birthTime) {
    return calculatePartialBaziView(profile, gender, options);
  }
  const settings = baziCalculationSettings(options);
  const calendarResolution = resolveBaziCalendar(profile);
  // The real solar/lunar validator runs first.  The owner policy then applies
  // to the original input date/year, never to a converted lunar solar date.
  assertPublicBirthDateRange(profile.birthDate, profile.calendar);
  const calendarProfile = {
    ...profile,
    calendar: 'solar' as const,
    birthDate: calendarResolution.normalizedSolarDate,
    birthTime: calendarResolution.normalizedSolarTime.slice(0, 5),
  };
  // Resolve historical DST after lunar-to-solar normalization and before
  // true-solar/day-boundary logic.  The original profile remains untouched.
  const historicalDstResolution = resolveBaziHistoricalDst(
    profile,
    calendarResolution.conversion.normalizedSolarDateTime,
    settings,
  );
  const historicalDstProfile = historicalDstResolution.applied
    ? {
        ...calendarProfile,
        birthDate: historicalDstResolution.effectiveDate,
        birthTime: historicalDstResolution.effectiveTime.slice(0, 5),
      }
    : calendarProfile;
  const trueSolarResolution = resolveTrueSolarTime(historicalDstProfile, settings);
  const calculationProfile = trueSolarResolution.applied
    ? {
        ...historicalDstProfile,
        birthDate: trueSolarResolution.effectiveDate,
        birthTime: trueSolarResolution.effectiveTime.slice(0, 5),
      }
    : historicalDstProfile;
  const parts = birthParts(calculationProfile);
  const dayBoundaryResolution = resolveBaziDayBoundary(calculationProfile, settings);
  return withChartEngineErrorBoundary('bazi', () => {
    const result = calculateWithDayBoundary(calculationProfile, parts, gender, dayBoundaryResolution);
    assertBaziEngineResult(result);
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
    // Basic dayun/liunian facts live on the payload (not in the explanation
    // snapshot contract) so the saved record stays replayable without
    // rewriting historical interpretation versions.  Range-edge dates can sit
    // outside the solar-term data table, so the additive layer degrades with
    // an explicit note instead of failing a previously valid chart.
    let timeLayer: ReturnType<typeof buildBaziTimeLayer> | undefined;
    let timeLayerNote: string | undefined;
    try {
      timeLayer = buildBaziTimeLayer({
        gender,
        yearStem: result.fourPillars.year.stem,
        monthStem: result.fourPillars.month.stem,
        monthBranch: result.fourPillars.month.branch,
        dayStem: result.fourPillars.day.stem,
        natalBranches: order.map(([key]) => ({ key, branch: result.fourPillars[key].branch })),
        birthDate: calculationProfile.birthDate,
        effectiveCivilTime: `${calculationProfile.birthDate}T${calculationProfile.birthTime}`,
        ...(settings.liunianYear !== undefined ? { liunianYear: settings.liunianYear } : {}),
      });
    } catch {
      timeLayerNote = '大运对照暂不可用：当前出生日期超出了基础起运计算的数据覆盖范围。';
    }
    const normalizedChart = normalizeBaziChart(result, {
      engineVersion: ENGINE_VERSIONS.bazi,
      snapshotVersion: CHART_SNAPSHOT_VERSION,
    });
    const evidenceGraph = buildBaziEvidenceGraph(normalizedChart, { engineVersion: ENGINE_VERSIONS.bazi });
    const interpretation = buildBaziInterpretation(normalizedChart, evidenceGraph);
    const generated = generatedAt(options);
    const explanation = buildBaziExplanation({ evidenceGraph, interpretation, generatedAt: generated });
    const inputSnapshot = birthInputSnapshot(profile, gender, settings, historicalDstResolution);
    const fingerprint = inputFingerprint({ module: 'bazi', inputSnapshot, calculationSettings: settings });

    return {
    module: 'bazi',
    snapshotVersion: CHART_SNAPSHOT_VERSION,
    generatedAt: generated,
    engineVersion: ENGINE_VERSIONS.bazi,
    calculationSettings: settings,
    calculationEvidence: createBaziCalculationEvidence(
      profile,
      settings,
      dayBoundaryResolution,
      trueSolarResolution,
      calendarResolution,
      historicalDstResolution,
    ),
    normalizedChart,
    evidenceGraph,
    strengthAssessment: evidenceGraph.strengthAssessment!,
    interpretation,
    explanation,
    inputSnapshot,
    inputFingerprint: fingerprint,
    completeness: 'complete',
    caveats: [
      '基础版展示结构证据，不直接给出吉凶定论。',
      'P1-A～P1-D 已记录并应用日界线、节气、位置数据与历法解析版本；流派选择仍待后续批次。',
      ...(timeLayer ? timeLayer.caveats : []),
      ...(timeLayerNote ? [timeLayerNote] : []),
      ...(historicalDstResolution.applied ? [historicalDstResolution.note] : []),
      ...(trueSolarResolution.applied ? [trueSolarResolution.note] : []),
    ],
    dayMaster: result.dayMaster,
    pillars,
    kongWang: `${result.kongWang.xun} · 空 ${result.kongWang.kongZhi.join('、')}`,
    relations,
    timeLayer,
    focus: [
      `日主为「${result.dayMaster}」，基础解读以日柱为观察中心。`,
      relations.length ? `当前可见的柱间关系包括：${relations.slice(0, 2).join('；')}。` : '当前盘面未检出需要优先标注的柱间合冲刑害。',
      '旺衰与取用需要结合月令、根气、透干和组合继续判断，基础版不把单一五行数量当作结论。',
    ],
    };
  });
}
