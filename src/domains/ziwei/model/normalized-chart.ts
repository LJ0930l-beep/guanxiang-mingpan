/**
 * Stable domain data for Ziwei.  UI labels are derived from this model; the
 * explanation layer never needs to inspect iztro's presentation objects.
 */
export const ZIWEI_NORMALIZED_MODEL_VERSION = 'ziwei-normalized-v1' as const;

export type ZiweiStarType = 'major' | 'minor' | 'adjective';

export interface NormalizedZiweiStar {
  id: string;
  name: string;
  type: ZiweiStarType;
  scope?: string;
  brightness?: string;
  mutagen?: string;
  palaceRefId: string;
  order: number;
}

export interface NormalizedZiweiPalace {
  id: string;
  index: number;
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  stemBranch: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  majorStarRefs: string[];
  minorStarRefs: string[];
  adjectiveStarRefs: string[];
  decadalRange?: [number, number];
}

export interface ZiweiMutagenEdge {
  id: string;
  starRefId: string;
  palaceRefId: string;
  starName: string;
  mutagen: string;
}

export interface NormalizedZiweiChart {
  modelVersion: typeof ZIWEI_NORMALIZED_MODEL_VERSION;
  palaces: NormalizedZiweiPalace[];
  stars: NormalizedZiweiStar[];
  lifePalaceRefId?: string;
  bodyPalaceRefId?: string;
  soul: string;
  body: string;
  fiveElement: string;
  lifeMasterStar?: string;
  bodyMasterStar?: string;
  mutagenEdges: ZiweiMutagenEdge[];
  source: {
    engineVersion: string;
    snapshotVersion: number;
  };
}

type RawStar = {
  name?: string;
  type?: string;
  scope?: string;
  brightness?: string;
  mutagen?: string;
};

type RawPalace = {
  name?: string;
  index?: number;
  heavenlyStem?: string;
  earthlyBranch?: string;
  isBodyPalace?: boolean;
  isOriginalPalace?: boolean;
  majorStars?: RawStar[];
  minorStars?: RawStar[];
  adjectiveStars?: RawStar[];
  decadal?: { range?: number[] };
};

type RawAstrolabe = {
  palaces?: RawPalace[];
  earthlyBranchOfBodyPalace?: string;
  earthlyBranchOfSoulPalace?: string;
  soul?: string;
  body?: string;
  fiveElementsClass?: string;
};

function palaceId(index: number, branch: string): string {
  return `ziwei:palace:${index}:${branch || 'unknown'}`;
}

function starId(palace: string, type: ZiweiStarType, order: number, name: string): string {
  const normalizedName = name || 'unknown';
  return `${palace}:star:${type}:${order}:${normalizedName}`;
}

function starType(value: string | undefined, fallback: ZiweiStarType): ZiweiStarType {
  return value === 'major' || value === 'minor' || value === 'adjective' ? value : fallback;
}

function addStars(
  stars: NormalizedZiweiStar[],
  palaceRefId: string,
  values: RawStar[] | undefined,
  fallbackType: ZiweiStarType,
): string[] {
  return (values ?? []).map((raw, order) => {
    const type = starType(raw.type, fallbackType);
    const item: NormalizedZiweiStar = {
      id: starId(palaceRefId, type, order, raw.name ?? ''),
      name: raw.name ?? '未命名星曜',
      type,
      scope: raw.scope,
      brightness: raw.brightness || undefined,
      mutagen: raw.mutagen || undefined,
      palaceRefId,
      order,
    };
    stars.push(item);
    return item.id;
  });
}

/** Convert iztro's mutable objects into a replayable, presentation-neutral model. */
export function normalizeZiweiChart(
  raw: RawAstrolabe,
  source: { engineVersion: string; snapshotVersion: number },
): NormalizedZiweiChart {
  const rawPalaces = raw.palaces ?? [];
  const stars: NormalizedZiweiStar[] = [];
  const palaces = rawPalaces.map((palace, position) => {
    const index = Number.isFinite(palace.index) ? Number(palace.index) : position;
    const branch = palace.earthlyBranch ?? '';
    const id = palaceId(index, branch);
    return {
      id,
      index,
      name: palace.name ?? '未命名宫位',
      heavenlyStem: palace.heavenlyStem ?? '',
      earthlyBranch: branch,
      stemBranch: `${palace.heavenlyStem ?? ''}${branch}`,
      isBodyPalace: Boolean(palace.isBodyPalace),
      isOriginalPalace: Boolean(palace.isOriginalPalace),
      majorStarRefs: addStars(stars, id, palace.majorStars, 'major'),
      minorStarRefs: addStars(stars, id, palace.minorStars, 'minor'),
      adjectiveStarRefs: addStars(stars, id, palace.adjectiveStars, 'adjective'),
      decadalRange: palace.decadal?.range?.length === 2
        ? [Number(palace.decadal.range[0]), Number(palace.decadal.range[1])] as [number, number]
        : undefined,
    } satisfies NormalizedZiweiPalace;
  });
  const mutagenEdges = stars
    .filter((star) => Boolean(star.mutagen))
    .map((star) => ({
      id: `ziwei:mutagen:${star.id}:${star.mutagen}`,
      starRefId: star.id,
      palaceRefId: star.palaceRefId,
      starName: star.name,
      mutagen: star.mutagen!,
    }));
  const lifePalace = palaces.find((palace) => palace.name === '命宫');
  const bodyPalace = palaces.find((palace) => palace.isBodyPalace);
  return {
    modelVersion: ZIWEI_NORMALIZED_MODEL_VERSION,
    palaces,
    stars,
    lifePalaceRefId: lifePalace?.id,
    bodyPalaceRefId: bodyPalace?.id,
    soul: raw.soul ?? '',
    body: raw.body ?? '',
    fiveElement: raw.fiveElementsClass ?? '',
    lifeMasterStar: raw.soul,
    bodyMasterStar: raw.body,
    mutagenEdges,
    source,
  };
}
