import { Horoscope, Origin } from 'circular-natal-horoscope-js/dist/index.js';

import { resolveCityCoordinates, type CityCoordinate } from '@/data/china-cities';
import { buildAstrologyEvidenceGraph } from '@/domains/astrology/evidence/index';
import { buildAstrologyExplanation } from '@/domains/astrology/explanation/index';
import { normalizeAstrologyChart } from '@/domains/astrology/model/normalized-chart';
import {
  createAstrologyCalculationPolicy,
  type AstrologyCalculationPolicy,
} from '@/domains/astrology/policy';
import type { AstrologyChartView, AstrologyFactorView } from '@/types/charts';
import type { BirthProfile } from '@/types/domain';
import {
  assertGregorianDate,
  assertPublicBirthDateRange,
  aspectLabels,
  birthInputSnapshot,
  birthParts,
  calculationSettings,
  CHART_SNAPSHOT_VERSION,
  bodyLabels,
  ENGINE_VERSIONS,
  explicitBirthCoordinates,
  generatedAt,
} from '@/services/chart-engine-shared';
import { ChartInputError, withChartEngineErrorBoundary } from '@/services/chart-errors';
import type { CalculationOptions } from '@/services/chart-engine-shared';

const STANDARD_BODY_KEYS = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
] as const;

type HoroscopeFactor = {
  key: string;
  label?: string;
  Sign?: { key?: unknown; label?: unknown };
  ChartPosition?: { Ecliptic?: { DecimalDegrees?: unknown } };
  House?: { id?: unknown };
  isRetrograde?: boolean;
};

type AstrologyHoroscope = {
  CelestialBodies: { all: HoroscopeFactor[] };
  Aspects: { all: {
    point1Key: string;
    point1Label?: string;
    point2Key: string;
    point2Label?: string;
    aspectKey: string;
    label?: string;
    orb: number;
  }[] };
  Ascendant: HoroscopeFactor;
  Midheaven: HoroscopeFactor;
};

interface ResolvedAstrologyLocation {
  latitude: number;
  longitude: number;
  source: 'explicit-coordinates' | 'city-dataset';
  locationId?: string;
  locationDatasetVersion?: string;
}

function assertAstrologyEngineResult(value: unknown): asserts value is AstrologyHoroscope {
  if (value === null || typeof value !== 'object') throw new Error('星盘引擎未返回完整盘面。');
  const candidate = value as {
    CelestialBodies?: { all?: unknown };
    Aspects?: { all?: unknown };
    Ascendant?: unknown;
    Midheaven?: unknown;
  };
  const bodies = candidate.CelestialBodies?.all;
  const isBody = (item: unknown): item is HoroscopeFactor => {
    if (item === null || typeof item !== 'object') return false;
    const body = item as HoroscopeFactor;
    if (typeof body.key !== 'string' || body.key.trim().length === 0) return false;
    const ecliptic = body.ChartPosition?.Ecliptic;
    return ecliptic !== null
      && typeof ecliptic === 'object'
      && Number.isFinite(Number(ecliptic?.DecimalDegrees));
  };
  const isAspect = (item: unknown): item is AstrologyHoroscope['Aspects']['all'][number] => {
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
    || !STANDARD_BODY_KEYS.every((key) => bodies.some((body) => body.key === key))
    || candidate.Aspects === null
    || typeof candidate.Aspects !== 'object'
    || !Array.isArray(candidate.Aspects.all)
    || !candidate.Aspects.all.every(isAspect)
    || !isBody(candidate.Ascendant)
    || !isBody(candidate.Midheaven)) {
    throw new Error('星盘引擎返回的盘面结构不完整。');
  }
}

function resolveAstrologyLocation(profile: BirthProfile): ResolvedAstrologyLocation {
  const explicit = explicitBirthCoordinates(profile);
  if (explicit) {
    return {
      ...explicit,
      source: 'explicit-coordinates',
      ...(profile.locationId ? { locationId: profile.locationId } : {}),
      ...(profile.locationDatasetVersion ? { locationDatasetVersion: profile.locationDatasetVersion } : {}),
    };
  }

  if (typeof profile.birthCity !== 'string' || profile.birthCity.trim().length === 0) {
    throw new ChartInputError({ code: 'MISSING_BIRTH_COORDINATES', field: 'birthCity' });
  }
  const city: CityCoordinate | undefined = resolveCityCoordinates(profile.birthCity);
  if (!city) {
    throw new ChartInputError({ code: 'MISSING_BIRTH_COORDINATES', field: 'birthCity' });
  }
  return {
    latitude: city.latitude,
    longitude: city.longitude,
    source: 'city-dataset',
    locationId: city.locationId,
    locationDatasetVersion: city.datasetVersion,
  };
}

function makeHoroscope(
  parts: ReturnType<typeof birthParts>,
  location: ResolvedAstrologyLocation,
  time: { hour: number; minute: number; second: number },
  includeAngles: boolean,
): AstrologyHoroscope {
  const origin = new Origin({
    year: parts.year,
    month: parts.month - 1,
    date: parts.day,
    hour: time.hour,
    minute: time.minute,
    second: time.second,
    latitude: location.latitude,
    longitude: location.longitude,
  });
  const horoscope = new Horoscope({
    origin,
    language: 'en',
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: includeAngles ? ['bodies', 'angles'] : ['bodies'],
    aspectWithPoints: includeAngles ? ['bodies', 'angles'] : ['bodies'],
    aspectTypes: ['major'],
  });
  assertAstrologyEngineResult(horoscope);
  return horoscope;
}

function bodiesOf(horoscope: AstrologyHoroscope): HoroscopeFactor[] {
  const standardBodyKeys = new Set<string>(STANDARD_BODY_KEYS);
  return horoscope.CelestialBodies.all.filter((item) => standardBodyKeys.has(item.key));
}

function bodyOf(horoscope: AstrologyHoroscope, key: string): HoroscopeFactor | undefined {
  return bodiesOf(horoscope).find((item) => item.key === key);
}

function signKeyOf(factor: HoroscopeFactor | undefined): string | undefined {
  return typeof factor?.Sign?.key === 'string' ? factor.Sign.key : undefined;
}

const SIGN_LABELS: Record<string, string> = {
  aries: '白羊座',
  taurus: '金牛座',
  gemini: '双子座',
  cancer: '巨蟹座',
  leo: '狮子座',
  virgo: '处女座',
  libra: '天秤座',
  scorpio: '天蝎座',
  sagittarius: '射手座',
  capricorn: '摩羯座',
  aquarius: '水瓶座',
  pisces: '双鱼座',
};

function signOf(factor: HoroscopeFactor | undefined): string {
  const key = signKeyOf(factor);
  return (key && SIGN_LABELS[key]) ?? (factor?.Sign?.label && typeof factor.Sign.label === 'string' ? factor.Sign.label : '未返回');
}

function degreeOf(factor: HoroscopeFactor): string {
  const decimal = Number(factor.ChartPosition?.Ecliptic?.DecimalDegrees);
  const within = ((decimal % 30) + 30) % 30;
  const degrees = Math.floor(within);
  const minutes = Math.round((within - degrees) * 60);
  return `${degrees}°${String(minutes).padStart(2, '0')}′`;
}

function factorView(
  factor: HoroscopeFactor,
  includeHouse: boolean,
  preserveExactShape = false,
  includeRetrograde = true,
): AstrologyFactorView {
  return {
    key: factor.key,
    label: bodyLabels[factor.key] ?? factor.label ?? factor.key,
    sign: signOf(factor),
    degree: degreeOf(factor),
    longitude: Number(factor.ChartPosition?.Ecliptic?.DecimalDegrees),
    ...(includeHouse
      ? { house: Number(factor.House?.id) }
      : (preserveExactShape ? { house: undefined } : {})),
    ...(includeRetrograde && (factor.isRetrograde !== undefined || preserveExactShape)
      ? { retrograde: factor.isRetrograde }
      : {}),
  };
}

function aspectView(horoscope: AstrologyHoroscope, includeAngles: boolean): AstrologyChartView['aspects'] {
  const allowed = new Set<string>([
    ...STANDARD_BODY_KEYS,
    ...(includeAngles ? ['ascendant', 'midheaven'] : []),
  ]);
  return horoscope.Aspects.all
    .filter((aspect) => allowed.has(aspect.point1Key) && allowed.has(aspect.point2Key))
    .slice(0, 12)
    .map((aspect) => ({
      label: aspectLabels[aspect.aspectKey] ?? aspect.label ?? aspect.aspectKey,
      from: bodyLabels[aspect.point1Key] ?? aspect.point1Label ?? aspect.point1Key,
      to: bodyLabels[aspect.point2Key] ?? aspect.point2Label ?? aspect.point2Key,
      orb: `${Number(aspect.orb).toFixed(2)}°`,
    }));
}

function sameSignAtAllTimes(
  key: string,
  dayStart: AstrologyHoroscope,
  anchor: AstrologyHoroscope,
  dayEnd: AstrologyHoroscope,
): boolean {
  const signs = [dayStart, anchor, dayEnd].map((horoscope) => signKeyOf(bodyOf(horoscope, key)));
  return signs.every((sign) => sign !== undefined && sign === signs[0]);
}

function createPolicy(location: ResolvedAstrologyLocation, precision: 'exact' | 'date-level-approximate'): AstrologyCalculationPolicy {
  return createAstrologyCalculationPolicy({
    precision,
    locationSource: location.source,
    locationId: location.locationId,
    locationDatasetVersion: location.locationDatasetVersion,
  });
}

export function calculateAstrologyView(profile: BirthProfile, options?: CalculationOptions): AstrologyChartView {
  if (profile.calendar === 'solar') assertGregorianDate(profile.birthDate);
  assertPublicBirthDateRange(profile.birthDate, profile.calendar);
  const parts = birthParts(profile);
  const location = resolveAstrologyLocation(profile);
  const timeKnown = profile.timeKnown === true && Boolean(profile.birthTime);
  const precision = timeKnown ? 'exact' : 'date-level-approximate';
  const astrologyPolicy = createPolicy(location, precision);
  const settings = {
    ...calculationSettings(options, true),
    astrologyPolicy,
  };

  return withChartEngineErrorBoundary('astrology', () => {
    if (timeKnown) {
      const horoscope = makeHoroscope(parts, location, {
        hour: parts.hour,
        minute: parts.minute,
        second: 0,
      }, true);
      const bodies = bodiesOf(horoscope);
      const factors = [
        ...bodies.map((factor) => factorView(factor, true, true)),
        factorView(horoscope.Ascendant, false, true),
        factorView(horoscope.Midheaven, false, true),
      ];
      const aspects = aspectView(horoscope, true);
      const sun = bodyOf(horoscope, 'sun');
      const moon = bodyOf(horoscope, 'moon');
      const sunSign = signOf(sun);
      const normalizedChart = normalizeAstrologyChart({
        calculationMode: 'exact',
        factors,
        aspects,
      }, { engineVersion: ENGINE_VERSIONS.astrology, snapshotVersion: CHART_SNAPSHOT_VERSION });
      const evidenceGraph = buildAstrologyEvidenceGraph(normalizedChart, { engineVersion: ENGINE_VERSIONS.astrology });
      const generated = generatedAt(options);
      return {
        module: 'astrology',
        snapshotVersion: CHART_SNAPSHOT_VERSION,
        generatedAt: generated,
        engineVersion: ENGINE_VERSIONS.astrology,
        calculationSettings: settings,
        inputSnapshot: birthInputSnapshot(profile, undefined, settings),
        completeness: 'complete',
        caveats: ['基础版只解释核心落座与主要相位，不输出确定性事件预测。'],
        calculationMode: 'exact',
        precision: astrologyPolicy.precision,
        sunSign,
        moonSign: moon ? signOf(moon) : undefined,
        ascendant: signOf(horoscope.Ascendant),
        midheaven: signOf(horoscope.Midheaven),
        factors,
        aspects,
        normalizedChart,
        evidenceGraph,
        explanation: buildAstrologyExplanation({ chart: normalizedChart, evidenceGraph, generatedAt: generated }),
        focus: [
          `太阳落在「${sunSign}」${moon ? `，月亮落在「${signOf(moon)}」` : ''}。`,
          `上升为「${signOf(horoscope.Ascendant)}」，天顶为「${signOf(horoscope.Midheaven)}」。`,
          `盘面检出 ${horoscope.Aspects.all.length} 组主要相位；基础版优先展示容许度较小的结构。`,
        ],
      };
    }

    const dayStart = makeHoroscope(parts, location, { hour: 0, minute: 0, second: 0 }, false);
    const anchor = makeHoroscope(parts, location, { hour: 12, minute: 0, second: 0 }, false);
    const dayEnd = makeHoroscope(parts, location, { hour: 23, minute: 59, second: 59 }, false);
    const stableBodyKeys = STANDARD_BODY_KEYS.filter((key) => sameSignAtAllTimes(key, dayStart, anchor, dayEnd));
    const stableBodyKeySet = new Set<string>(stableBodyKeys);
    const factors = bodiesOf(anchor)
      .filter((factor) => stableBodyKeySet.has(factor.key))
      // A retrograde flag is an instant observation; omit it from a date-level
      // result unless a separate all-day station check is introduced.
      .map((factor) => factorView(factor, false, false, false));
    const stableSun = stableBodyKeySet.has('sun') ? bodyOf(anchor, 'sun') : undefined;
    const stableMoon = stableBodyKeySet.has('moon') ? bodyOf(anchor, 'moon') : undefined;
    const sunSign = stableSun ? signOf(stableSun) : '全天跨越星座，未显示';
    const aspects: AstrologyChartView['aspects'] = [];
    const normalizedChart = normalizeAstrologyChart({
      calculationMode: 'approximate',
      factors,
      aspects,
    }, { engineVersion: ENGINE_VERSIONS.astrology, snapshotVersion: CHART_SNAPSHOT_VERSION });
    const evidenceGraph = buildAstrologyEvidenceGraph(normalizedChart, {
      engineVersion: ENGINE_VERSIONS.astrology,
      astrologyPolicy,
    });
    const generated = generatedAt(options);
    const caveats = [
      '出生时辰未知，采用 Asia/Shanghai 当地正午 12:00:00 作为内部锚点；度数仅为日期级近似。',
      '已用当日日首 00:00:00 与日末 23:59:59 检查全天星座稳定性；可能跨星座的快速天体不展示。',
      '日级近似不计算上升、天顶、十二宫位、角点和主要相位。',
      '基础版只解释核心落座与主要相位，不输出确定性事件预测。',
    ];
    return {
      module: 'astrology',
      snapshotVersion: CHART_SNAPSHOT_VERSION,
      generatedAt: generated,
      engineVersion: ENGINE_VERSIONS.astrology,
      calculationSettings: settings,
      inputSnapshot: birthInputSnapshot(profile, undefined, settings),
      completeness: 'partial',
      caveats,
      calculationMode: 'approximate',
      precision: astrologyPolicy.precision,
      sunSign,
      moonSign: stableMoon ? signOf(stableMoon) : undefined,
      factors,
      aspects,
      normalizedChart,
      evidenceGraph,
      explanation: buildAstrologyExplanation({
        chart: normalizedChart,
        evidenceGraph,
        generatedAt: generated,
        astrologyPolicy,
      }),
      focus: [
        `太阳${stableSun ? `落在「${sunSign}」` : '在日期内跨越星座，未显示'}；${stableMoon ? `月亮落在「${signOf(stableMoon)}」` : '月亮可能跨越星座，未显示'}。`,
        '当前缺少准确出生时辰，因此不显示上升、天顶、宫位、角点与相位。',
        `日级近似已比较当天首尾，${STANDARD_BODY_KEYS.length - stableBodyKeys.length} 个时间敏感天体未显示。`,
      ],
    };
  });
}
