import { Horoscope, Origin } from 'circular-natal-horoscope-js/dist/index.js';

import { resolveCityCoordinates } from '@/data/china-cities';
import type { AstrologyChartView } from '@/types/charts';
import { calculationSettings, CHART_SNAPSHOT_VERSION, aspectLabels, bodyLabels, birthInputSnapshot, birthParts, ENGINE_VERSIONS, generatedAt, requireExactBirth, signLabels } from '@/services/chart-engine-shared';
import type { BirthProfile } from '@/types/domain';
import type { CalculationOptions } from '@/services/chart-engine-shared';

export function calculateAstrologyView(profile: BirthProfile, options?: CalculationOptions): AstrologyChartView {
  requireExactBirth(profile);
  const parts = birthParts(profile);
  const settings = calculationSettings(options);
  const city = profile.latitude != null && profile.longitude != null
    ? { latitude: profile.latitude, longitude: profile.longitude }
    : resolveCityCoordinates(profile.birthCity);
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

  return {
    module: 'astrology',
    snapshotVersion: CHART_SNAPSHOT_VERSION,
    generatedAt: generatedAt(options),
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
    focus: [
      `太阳落在「${sunSign}」${moon ? `，月亮落在「${signOf(moon)}」` : ''}。`,
      ascendant ? `上升为「${signOf(ascendant)}」，天顶为「${signOf(midheaven)}」。` : '当前缺少可识别坐标，因此不显示上升、天顶与宫位。',
      `盘面检出 ${aspects.length} 组主要相位；基础版优先展示容许度较小的结构。`,
    ],
  };
}
