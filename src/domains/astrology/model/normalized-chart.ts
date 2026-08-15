/** Stable, UI-independent astrology chart model. */
export const ASTROLOGY_NORMALIZED_MODEL_VERSION = 'astrology-normalized-v1' as const;

export type AstrologyPointKind = 'body' | 'angle';

export interface NormalizedAstrologyPoint {
  id: string;
  key: string;
  label: string;
  kind: AstrologyPointKind;
  sign: string;
  longitude: number;
  house?: number;
  retrograde?: boolean;
}

export interface NormalizedAstrologyAspect {
  id: string;
  fromRefId: string;
  toRefId: string;
  label: string;
  orb: number;
  sourceIndex: number;
}

export interface NormalizedAstrologyChart {
  modelVersion: typeof ASTROLOGY_NORMALIZED_MODEL_VERSION;
  calculationMode: 'exact' | 'approximate';
  points: NormalizedAstrologyPoint[];
  aspects: NormalizedAstrologyAspect[];
  source: {
    engineVersion: string;
    snapshotVersion: number;
  };
}

type Factor = {
  key: string;
  label: string;
  sign: string;
  longitude: number;
  house?: number;
  retrograde?: boolean;
};

type Aspect = {
  label: string;
  from: string;
  to: string;
  orb: string;
};

function pointId(key: string): string {
  return `astrology:point:${key}`;
}

function parseOrb(value: string): number {
  const match = /-?\d+(?:\.\d+)?/.exec(value);
  return match ? Number(match[0]) : Number.NaN;
}

function resolvePointId(points: NormalizedAstrologyPoint[], label: string): string {
  const match = points.find((point) => point.label === label);
  return match?.id ?? `astrology:point:label:${label || 'unknown'}`;
}

export function normalizeAstrologyChart(
  input: {
    calculationMode: 'exact' | 'approximate';
    factors: Factor[];
    aspects: Aspect[];
  },
  source: { engineVersion: string; snapshotVersion: number },
): NormalizedAstrologyChart {
  const points = input.factors.map((factor) => ({
    id: pointId(factor.key),
    key: factor.key,
    label: factor.label,
    kind: factor.key === 'ascendant' || factor.key === 'midheaven' ? 'angle' as const : 'body' as const,
    sign: factor.sign,
    longitude: factor.longitude,
    house: factor.house,
    retrograde: factor.retrograde,
  }));
  const aspects = input.aspects.map((aspect, sourceIndex) => {
    const fromRefId = resolvePointId(points, aspect.from);
    const toRefId = resolvePointId(points, aspect.to);
    return {
      id: `astrology:aspect:${fromRefId}:${toRefId}:${sourceIndex}`,
      fromRefId,
      toRefId,
      label: aspect.label,
      orb: parseOrb(aspect.orb),
      sourceIndex,
    };
  });
  return {
    modelVersion: ASTROLOGY_NORMALIZED_MODEL_VERSION,
    calculationMode: input.calculationMode,
    points,
    aspects,
    source,
  };
}
