/** Stable, replayable Liuyao chart model. It contains facts, not conclusions. */
export const LIUYAO_NORMALIZED_MODEL_VERSION = 'liuyao-normalized-v1' as const;

export interface LiuyaoChangedFact {
  naJia: string;
  wuXing: string;
  liuQin: string;
  relation: string;
}

export interface NormalizedLiuyaoLine {
  id: string;
  position: number;
  yinYang: '阴' | '阳';
  liuQin: string;
  liuShen: string;
  naJia: string;
  wuXing: string;
  isChanging: boolean;
  isShiYao: boolean;
  isYingYao: boolean;
  strength?: string;
  evidence: string[];
  changed?: LiuyaoChangedFact;
  changeAnalysis?: { huaType: string; description: string; originalNaJia: string; changedNaJia: string };
}

export interface LiuyaoYongShenCandidate {
  liuQin: string;
  position?: number;
  naJia?: string;
  changedNaJia?: string;
  element: string;
  source: string;
  strength: string;
  strengthLabel: string;
  movementState: string;
  movementLabel: string;
  isShiYao: boolean;
  isYingYao: boolean;
  kongWangState?: string;
  evidence: string[];
}

export interface LiuyaoYongShenGroup {
  targetLiuQin: string;
  selectionStatus: string;
  selectionNote: string;
  selected: LiuyaoYongShenCandidate;
  candidates: LiuyaoYongShenCandidate[];
}

export interface LiuyaoTimeRecommendation {
  targetLiuQin: string;
  type: 'favorable' | 'unfavorable' | 'critical';
  earthlyBranch?: string;
  trigger: string;
  basis: string[];
  description: string;
}

export interface LiuyaoCastingFacts {
  ruleVersion: string;
  method: 'auto' | 'interactive' | 'manual' | 'time' | 'number';
  timezone: string;
  lineValues?: { position: number; value: 6 | 7 | 8 | 9 }[];
}

export interface NormalizedLiuyaoChart {
  modelVersion: typeof LIUYAO_NORMALIZED_MODEL_VERSION;
  question: string;
  yongShenTarget: string;
  seed: string;
  date: string;
  seedScope: string;
  hexagramName: string;
  changedHexagramName?: string;
  hexagramGong: string;
  ganZhiTime: string;
  kongWang: string;
  lines: NormalizedLiuyaoLine[];
  yongShen?: LiuyaoYongShenGroup[];
  timeRecommendations?: LiuyaoTimeRecommendation[];
  castingFacts?: LiuyaoCastingFacts;
  source: {
    engineVersion: string;
    snapshotVersion: number;
  };
}

type Line = Omit<NormalizedLiuyaoLine, 'id'>;

export function normalizeLiuyaoChart(
  input: Omit<NormalizedLiuyaoChart, 'modelVersion' | 'lines' | 'source'> & { lines: Line[] },
  source: { engineVersion: string; snapshotVersion: number },
): NormalizedLiuyaoChart {
  return {
    modelVersion: LIUYAO_NORMALIZED_MODEL_VERSION,
    ...input,
    lines: input.lines.map((line) => ({ ...line, id: `liuyao:line:${line.position}` })),
    source,
  };
}
