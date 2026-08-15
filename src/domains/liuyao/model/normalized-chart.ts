/** Stable, replayable Liuyao chart model. It contains facts, not conclusions. */
export const LIUYAO_NORMALIZED_MODEL_VERSION = 'liuyao-normalized-v1' as const;

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
