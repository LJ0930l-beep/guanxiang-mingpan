import { Horoscope, Origin } from 'circular-natal-horoscope-js/dist/index.js';

import { resolveCityCoordinates } from '@/data/china-cities';
import type { AstrologyChartView } from '@/types/charts';
import { assertGregorianDate, assertPublicBirthDateRange, calculationSettings, CHART_SNAPSHOT_VERSION, aspectLabels, bodyLabels, birthInputSnapshot, birthParts, ENGINE_VERSIONS, explicitBirthCoordinates, generatedAt, requireExactBirth, signLabels } from '@/services/chart-engine-shared';
import { withChartEngineErrorBoundary } from '@/services/chart-errors';
import type { BirthProfile } from '@/types/domain';
import type { CalculationOptions } from '@/services/chart-engine-shared';
import { normalizeAstrologyChart } from '@/domains/astrology/model/normalized-chart';
import { buildAstrologyEvidenceGraph } from '@/domains/astrology/evidence/index';
import { buildAstrologyExplanation } from '@/domains/astrology/explanation/index';

function assertAstrologyEngineResult(value: unknown): asserts value is {
  CelestialBodies: { all: unknown[] };
  Aspects: { all: unknown[] };
} {
  if (value === null || typeof value !== 'object') throw new Error('星盘引擎未返回完整盘面。');
  const candidate = value as {
    CelestialBodies?: { all?: unknown };
    Aspects?: { all?: unknown };
  };
  const bodies = candidate.CelestialBodies?.all;
  const isBody = (item: unknown): item is { key: string } => {
    if (item === null || typeof item !== 'object') return false;
    const body = item as { key?: unknown; ChartPosition?: unknown };
    if (typeof body.key !== 'string' || body.key.trim().length === 0) return false;
    if (body.ChartPosition === null || typeof body.ChartPosition !== 'object') return false;
    const ecliptic = (body.ChartPosition as { Ecliptic?: unknown }).Ecliptic;
    return ecliptic !== null
      && typeof ecliptic === 'object'
      && Number.isFinite(Number((ecliptic as { DecimalDegrees?: unknown }).DecimalDegrees));
  };
  const standardBodyKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const isAspect = (item: unknown): boolean => {
    if (item === null || typeof item !== 'object') return false;
    const aspect = item as Record<string, unknown>;
    return typeof aspect.point1Key === 'string'
      && typeof aspect.point2Key === 'string'
      && typeof aspect.aspectKey === 'string'
      && Number.isFinite(Number(aspect.orb));
  };
  if (candidate.CelestialBodies === null
    || typeof candidate.CelestialBodies !== 'object'
    || !Array.isArray(bodies)
    || !bodies.every(isBody)
    || !standardBodyKeys.every((key) => bodies.some((body) => body.key === key))
    || candidate.Aspects === null
    || typeof candidate.Aspects !== 'object'
    || !Array.isArray(candidate.Aspects.all)
    || !candidate.Aspects.all.every(isAspect)) {
    throw new Error('星盘引擎返回的盘面结构不完整。');
  }
}

export function calculateAstrologyView(profile: BirthProfile, options?: CalculationOptions): AstrologyChartView {
  requireExactBirth(profile);
  if (profile.calendar === 'solar') assertGregorianDate(profile.birthDate);
  assertPublicBirthDateRange(profile.birthDate, profile.calendar);
  const parts = birthParts(profile);
  const settings = calculationSettings(options, true);
  const city = explicitBirthCoordinates(profile) ?? resolveCityCoordinates(profile.birthCity);
  return withChartEngineErrorBoundary('astrology', () => {
    const origin = new Origin({
    year: parts.year,
    month: parts.month - 1,
    date: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    latitude: city?.latitude ?? 0,
    longitude: city?.longitude ?? 0,
    });
    const horoscope = new Horoscope({
    origin,
    language: 'en',
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: city ? ['bodies', 'angles'] : ['bodies'],
    aspectWithPoints: city ? ['bodies', 'angles'] : ['bodies'],
    aspectTypes: ['major'],
    });
    assertAstrologyEngineResult(horoscope);
    const standardBodyKeys = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']);
    const bodies = (horoscope.CelestialBodies.all as any[]).filter((item) => standardBodyKeys.has(item.key));
    const angles = city ? [horoscope.Ascendant, horoscope.Midheaven] as any[] : [];
    const body = (key: string) => bodies.find((item) => item.key === key);
    const moon = body('moon');
    const ascendant = city ? horoscope.Ascendant : undefined;
    const midheaven = city ? horoscope.Midheaven : undefined;
    const signOf = (factor: any) => signLabels[factor?.Sign?.key] ?? factor?.Sign?.label ?? '未返回';
    const degreeOf = (factor: any) => {
    const decimal = Number(factor.ChartPosition.Ecliptic.DecimalDegrees);
    const within = ((decimal % 30) + 30) % 30;
    const degrees = Math.floor(within);
    const minutes = Math.round((within - degrees) * 60);
    return `${degrees}°${String(minutes).padStart(2, '0')}′`;
    };
    const factors = [...bodies, ...angles].map((factor) => ({
    key: factor.key,
    label: bodyLabels[factor.key] ?? factor.label,
    sign: signOf(factor),
    degree: degreeOf(factor),
    longitude: Number(factor.ChartPosition.Ecliptic.DecimalDegrees),
    house: city ? factor.House?.id : undefined,
    retrograde: factor.isRetrograde,
    }));
    const aspects = (horoscope.Aspects.all as any[])
      .filter((aspect) => {
        const allowed = new Set([...standardBodyKeys, ...(city ? ['ascendant', 'midheaven'] : [])]);
        return allowed.has(aspect.point1Key) && allowed.has(aspect.point2Key);
      });
    const sun = body('sun');
    const sunSign = signOf(sun);
    const caveats = ['基础版只解释核心落座与主要相位，不输出确定性事件预测。'];
    if (!city) caveats.unshift('未识别出生城市坐标，当前为近似盘：不计算上升、天顶与十二宫位。');

    const generated = generatedAt(options);
    const normalizedChart = normalizeAstrologyChart({ calculationMode: city ? 'exact' : 'approximate', factors, aspects: aspects.slice(0, 12).map((aspect) => ({
    label: aspectLabels[aspect.aspectKey] ?? aspect.label,
    from: bodyLabels[aspect.point1Key] ?? aspect.point1Label,
    to: bodyLabels[aspect.point2Key] ?? aspect.point2Label,
    orb: `${Number(aspect.orb).toFixed(2)}°`,
    })) }, { engineVersion: ENGINE_VERSIONS.astrology, snapshotVersion: CHART_SNAPSHOT_VERSION });
    const evidenceGraph = buildAstrologyEvidenceGraph(normalizedChart, { engineVersion: ENGINE_VERSIONS.astrology });
    return {
    module: 'astrology',
    snapshotVersion: CHART_SNAPSHOT_VERSION,
    generatedAt: generated,
    engineVersion: ENGINE_VERSIONS.astrology,
    calculationSettings: settings,
    inputSnapshot: birthInputSnapshot(profile, undefined, settings),
    completeness: city ? 'complete' : 'partial',
    caveats,
    calculationMode: city ? 'exact' : 'approximate',
    sunSign,
    moonSign: moon ? signOf(moon) : undefined,
    ascendant: ascendant ? signOf(ascendant) : undefined,
    midheaven: midheaven ? signOf(midheaven) : undefined,
    factors,
    aspects: aspects.slice(0, 12).map((aspect) => ({
      label: aspectLabels[aspect.aspectKey] ?? aspect.label,
      from: bodyLabels[aspect.point1Key] ?? aspect.point1Label,
      to: bodyLabels[aspect.point2Key] ?? aspect.point2Label,
      orb: `${Number(aspect.orb).toFixed(2)}°`,
    })),
    normalizedChart,
    evidenceGraph,
    explanation: buildAstrologyExplanation({ chart: normalizedChart, evidenceGraph, generatedAt: generated }),
    focus: [
      `太阳落在「${sunSign}」${moon ? `，月亮落在「${signOf(moon)}」` : ''}。`,
      ascendant ? `上升为「${signOf(ascendant)}」，天顶为「${signOf(midheaven)}」。` : '当前缺少可识别坐标，因此不显示上升、天顶与宫位。',
      `盘面检出 ${aspects.length} 组主要相位；基础版优先展示容许度较小的结构。`,
    ],
    };
  });
}
