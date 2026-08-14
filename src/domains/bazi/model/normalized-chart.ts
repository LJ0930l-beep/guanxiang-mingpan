import type { BaziOutput } from 'taibu-core/bazi';

export const BAZI_NORMALIZED_MODEL_VERSION = 'bazi-normalized-v1' as const;
export const BAZI_RELATION_RULE_VERSION = 'bazi-relations-v1' as const;

export type BaziPillarKey = 'year' | 'month' | 'day' | 'hour';
export type BaziElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water' | 'unknown';
export type StemPolarity = 'yin' | 'yang';

export interface StemRef {
  id: string;
  value: string;
  element: BaziElement;
  polarity: StemPolarity;
  pillarKey: BaziPillarKey;
  tenGod?: string;
}

export interface BranchRef {
  id: string;
  value: string;
  element: BaziElement;
  pillarKey: BaziPillarKey;
}

export interface HiddenStemRef {
  id: string;
  value: string;
  element: BaziElement;
  qiType: string;
  tenGod?: string;
  pillarKey: BaziPillarKey;
  branchRefId: string;
  order: number;
}

export interface NormalizedPillar {
  id: string;
  key: BaziPillarKey;
  label: string;
  stemRefId: string;
  branchRefId: string;
  hiddenStemRefIds: string[];
}

export type RelationType = 'combine' | 'half-combine' | 'clash' | 'punishment' | 'harm' | 'break' | 'other';

export interface RelationEdge {
  id: string;
  type: RelationType;
  sourceRefs: string[];
  targetRefs: string[];
  pillarRefs: string[];
  description: string;
  affectedElement?: BaziElement;
  ruleVersion: typeof BAZI_RELATION_RULE_VERSION;
}

export interface NormalizedBaziChart {
  modelVersion: typeof BAZI_NORMALIZED_MODEL_VERSION;
  pillars: NormalizedPillar[];
  dayMaster: StemRef;
  monthBranch: BranchRef;
  stems: StemRef[];
  branches: BranchRef[];
  hiddenStems: HiddenStemRef[];
  relations: RelationEdge[];
  source: {
    engineVersion: string;
    snapshotVersion: number;
  };
}

const PILLARS: readonly { key: BaziPillarKey; label: string }[] = [
  { key: 'year', label: '年柱' },
  { key: 'month', label: '月柱' },
  { key: 'day', label: '日柱' },
  { key: 'hour', label: '时柱' },
];

const STEM_ELEMENTS: Record<string, BaziElement> = {
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
};

const STEM_POLARITY: Record<string, StemPolarity> = {
  甲: 'yang', 乙: 'yin',
  丙: 'yang', 丁: 'yin',
  戊: 'yang', 己: 'yin',
  庚: 'yang', 辛: 'yin',
  壬: 'yang', 癸: 'yin',
};

const BRANCH_ELEMENTS: Record<string, BaziElement> = {
  子: 'water', 丑: 'earth', 寅: 'wood', 卯: 'wood',
  辰: 'earth', 巳: 'fire', 午: 'fire', 未: 'earth',
  申: 'metal', 酉: 'metal', 戌: 'earth', 亥: 'water',
};

const PILLAR_LABEL_TO_KEY: Record<string, BaziPillarKey> = {
  年支: 'year', 月支: 'month', 日支: 'day', 时支: 'hour',
  年柱: 'year', 月柱: 'month', 日柱: 'day', 时柱: 'hour',
  年: 'year', 月: 'month', 日: 'day', 时: 'hour',
};

const ELEMENT_LABELS: readonly [string, BaziElement][] = [
  ['木', 'wood'], ['火', 'fire'], ['土', 'earth'], ['金', 'metal'], ['水', 'water'],
];

function elementOfStem(stem: string): BaziElement {
  return STEM_ELEMENTS[stem] ?? 'unknown';
}

function elementOfBranch(branch: string): BaziElement {
  return BRANCH_ELEMENTS[branch] ?? 'unknown';
}

function relationType(type: string, description: string): RelationType {
  if (type === '合') return description.includes('半合') ? 'half-combine' : 'combine';
  if (type === '冲') return 'clash';
  if (type === '刑') return 'punishment';
  if (type === '害') return 'harm';
  if (type === '破') return 'break';
  return 'other';
}

function affectedElement(description: string): BaziElement | undefined {
  const pair = [...ELEMENT_LABELS].reverse().find(([label]) => description.includes(label));
  return pair?.[1];
}

function stableStemId(key: BaziPillarKey): string {
  return `bazi:stem:${key}`;
}

function stableBranchId(key: BaziPillarKey): string {
  return `bazi:branch:${key}`;
}

function stablePillarId(key: BaziPillarKey): string {
  return `bazi:pillar:${key}`;
}

function relationPillarKeys(relation: { pillars?: string[] }): BaziPillarKey[] {
  return (relation.pillars ?? []).flatMap((label) => {
    const key = PILLAR_LABEL_TO_KEY[label];
    return key ? [key] : [];
  });
}

/**
 * Convert the raw adapter result into Guanxiang's stable domain model.
 * The function deliberately does not produce strength or life conclusions.
 */
export function normalizeBaziChart(
  raw: BaziOutput,
  source: { engineVersion: string; snapshotVersion: number },
): NormalizedBaziChart {
  const dayMaster = raw.dayMaster;
  const stems: StemRef[] = PILLARS.map(({ key }) => {
    const pillar = raw.fourPillars[key];
    return {
      id: stableStemId(key),
      value: pillar.stem,
      element: elementOfStem(pillar.stem),
      polarity: STEM_POLARITY[pillar.stem] ?? 'yang',
      pillarKey: key,
      tenGod: pillar.tenGod,
    };
  });
  const branches: BranchRef[] = PILLARS.map(({ key }) => {
    const pillar = raw.fourPillars[key];
    return {
      id: stableBranchId(key),
      value: pillar.branch,
      element: elementOfBranch(pillar.branch),
      pillarKey: key,
    };
  });
  const hiddenStems: HiddenStemRef[] = PILLARS.flatMap(({ key }) => {
    const branchRefId = stableBranchId(key);
    return raw.fourPillars[key].hiddenStems.map((hidden, order) => ({
      id: `bazi:hidden:${key}:${order}`,
      value: hidden.stem,
      element: elementOfStem(hidden.stem),
      qiType: hidden.qiType,
      tenGod: hidden.tenGod,
      pillarKey: key,
      branchRefId,
      order,
    }));
  });
  const pillars: NormalizedPillar[] = PILLARS.map(({ key, label }) => ({
    id: stablePillarId(key),
    key,
    label,
    stemRefId: stableStemId(key),
    branchRefId: stableBranchId(key),
    hiddenStemRefIds: hiddenStems.filter((hidden) => hidden.pillarKey === key).map((hidden) => hidden.id),
  }));
  const relations: RelationEdge[] = (raw.relations ?? []).flatMap((rawRelation) => {
    const pillarKeys = relationPillarKeys(rawRelation);
    const pillarRefs = pillarKeys.map(stableBranchId);
    if (pillarRefs.length < 2) return [];
    const type = relationType(rawRelation.type, rawRelation.description);
    return [{
      id: `bazi:relation:${type}:${pillarRefs.join('+')}`,
      type,
      sourceRefs: pillarRefs.slice(0, 1),
      targetRefs: pillarRefs.slice(1),
      pillarRefs,
      description: rawRelation.description,
      affectedElement: affectedElement(rawRelation.description),
      ruleVersion: BAZI_RELATION_RULE_VERSION,
    }];
  });
  const dayMasterRef = stems.find((stem) => stem.pillarKey === 'day')!;
  if (dayMasterRef.value !== dayMaster) {
    throw new Error(`八字归一化失败：日主 ${dayMaster} 与日柱天干 ${dayMasterRef.value} 不一致。`);
  }
  return {
    modelVersion: BAZI_NORMALIZED_MODEL_VERSION,
    pillars,
    dayMaster: dayMasterRef,
    monthBranch: branches.find((branch) => branch.pillarKey === 'month')!,
    stems,
    branches,
    hiddenStems,
    relations,
    source,
  };
}
