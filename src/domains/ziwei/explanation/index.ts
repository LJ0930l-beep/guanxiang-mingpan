import { createExplanationSnapshot } from '@/domains/explanation/snapshot';
import { GLOSSARY_VERSION, type ExplanationBlock, type ExplanationConfidence, type ExplanationSnapshot } from '@/domains/explanation/types';
import type { ZiweiEvidenceGraph } from '@/domains/ziwei/evidence/index';
import type { NormalizedZiweiChart } from '@/domains/ziwei/model/normalized-chart';

export const ZIWEI_EXPLANATION_VERSION = 'ziwei-explanation-v1' as const;

type BuildInput = {
  chart: NormalizedZiweiChart;
  evidenceGraph: ZiweiEvidenceGraph;
  generatedAt: string;
};

const COMMON_CAVEAT = '紫微不同流派在安星与四化规则上可能不同，本版只解释已保存的算法结果。';

function refsFor(
  graph: ZiweiEvidenceGraph,
  preferred: string[],
  min = 2,
  max = 5,
): string[] {
  const ids = new Set<string>();
  for (const id of preferred) {
    if (graph.nodes.some((node) => node.id === id)) ids.add(id);
    if (ids.size >= max) break;
  }
  for (const node of graph.nodes) {
    if (ids.size >= min) break;
    ids.add(node.id);
  }
  return [...ids].slice(0, max);
}

function palaceEvidence(graph: ZiweiEvidenceGraph, palaceRefId: string | undefined): string[] {
  if (!palaceRefId) return [];
  return graph.nodes
    .filter((node) => node.subjectRefs.includes(palaceRefId))
    .map((node) => node.id);
}

function palaceName(chart: NormalizedZiweiChart, refId: string | undefined): string {
  return chart.palaces.find((palace) => palace.id === refId)?.name ?? '未标记宫位';
}

function starNames(chart: NormalizedZiweiChart, refId: string | undefined): string {
  const ids = chart.palaces.find((palace) => palace.id === refId)?.majorStarRefs ?? [];
  const names = ids
    .map((id) => chart.stars.find((star) => star.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join('、') : '未见十四主星坐守';
}

function makeBlock(
  category: string,
  title: string,
  summary: string,
  paragraphs: string[],
  evidenceRefs: string[],
  glossaryRefs: string[],
  confidence: ExplanationConfidence = 'medium',
  caveats: string[] = [COMMON_CAVEAT],
): ExplanationBlock {
  return {
    id: `ziwei:explanation:${category}`,
    module: 'ziwei',
    category,
    title,
    summary,
    paragraphs,
    evidenceRefs,
    counterEvidenceRefs: [],
    glossaryRefs,
    confidence,
    caveats,
    explanationVersion: ZIWEI_EXPLANATION_VERSION,
  };
}

/** Generate human-readable Ziwei blocks from normalized facts and evidence refs only. */
export function buildZiweiExplanation({ chart, evidenceGraph, generatedAt }: BuildInput): ExplanationSnapshot {
  const lifePalace = palaceName(chart, chart.lifePalaceRefId);
  const bodyPalace = palaceName(chart, chart.bodyPalaceRefId);
  const lifeRefs = refsFor(evidenceGraph, palaceEvidence(evidenceGraph, chart.lifePalaceRefId));
  const bodyRefs = refsFor(evidenceGraph, palaceEvidence(evidenceGraph, chart.bodyPalaceRefId));
  const mutagenRefs = refsFor(evidenceGraph, evidenceGraph.nodes.filter((node) => node.type === 'mutagen.edge').map((node) => node.id));
  const relationRef = evidenceGraph.nodes.find((node) => node.type === 'life-body.relation')?.id;
  const palaceRefs = refsFor(evidenceGraph, evidenceGraph.nodes.filter((node) => node.type === 'palace.position').map((node) => node.id));
  const blocks: ExplanationBlock[] = [
    makeBlock(
      'overview',
      '先看盘面骨架',
      `本盘以${lifePalace}为命宫、${bodyPalace}为身宫，先定位十二宫与主星。`,
      [
        `本次排盘固定记录了${chart.palaces.length}个宫位、${chart.stars.length}颗星曜及其位置。`,
        `命宫与身宫是阅读入口，后续解释会把每个判断回连到具体宫位和星曜事实。`,
      ],
      refsFor(evidenceGraph, [...lifeRefs, ...bodyRefs, ...(relationRef ? [relationRef] : [])]),
      ['glossary:ziwei:palace-position', 'glossary:ziwei:life-palace', 'glossary:ziwei:body-palace'],
      'high',
    ),
    makeBlock(
      'life-palace',
      '命宫位置',
      `命宫落在${lifePalace}，主星记录为${starNames(chart, chart.lifePalaceRefId)}，可从此处展开。`,
      [
        `命宫的天干地支与星曜清单来自标准化宫位模型，而不是页面临时拼接。`,
        '这意味着什么：命宫可以作为继续查看主星、亮度和四化引用的坐标，但不会单独生成现实结论。',
      ],
      lifeRefs,
      ['glossary:ziwei:life-palace', 'glossary:ziwei:main-star'],
    ),
    makeBlock(
      'body-palace',
      '身宫位置',
      `身宫落在${bodyPalace}，命主与身主字段一并保留作复盘坐标。`,
      [
        `身宫位置通过稳定宫位 ID 保存，可与命宫位置和星曜引用做复盘对照。`,
        `这意味着什么：身宫是盘面中的另一条观察坐标，需结合命宫与其他证据阅读。`,
      ],
      bodyRefs,
      ['glossary:ziwei:body-palace', 'glossary:ziwei:palace-position'],
    ),
    makeBlock(
      'mutagens',
      '四化落点',
      chart.mutagenEdges.length ? `盘面记录了${chart.mutagenEdges.length}条四化落宫事实，可逐条展开核对。` : '当前盘面没有返回可核对的四化落宫事实。',
      [
        chart.mutagenEdges.length ? '四化解释只描述星曜、化象与落宫之间的记录关系。' : '没有四化节点时，解释层不会猜测或补造四化。',
        '这意味着什么：四化是继续追踪宫位证据的入口，而不是独立的确定性预测。',
      ],
      mutagenRefs,
      ['glossary:ziwei:four-transform', 'glossary:ziwei:palace-position'],
      chart.mutagenEdges.length ? 'medium' : 'low',
      chart.mutagenEdges.length ? [COMMON_CAVEAT] : ['当前引擎没有返回四化落点，暂不作扩展解释。', COMMON_CAVEAT],
    ),
    makeBlock(
      'focus-palaces',
      '十二宫导航',
      `十二宫按固定顺序展开，点击宫位即可回到对应落点和星曜证据。`,
      [
        '宫位卡片先展示位置、主星、辅星和大限字段，解释层只引用同一组标准化证据。',
        '这意味着什么：你可以从命宫、身宫或四化落点出发，逐宫复盘，而不必接受一条不可检查的总断。',
      ],
      palaceRefs,
      ['glossary:ziwei:palace-position', 'glossary:ziwei:main-star'],
    ),
    makeBlock(
      'summary',
      '本盘小结',
      `先确认${lifePalace}与${bodyPalace}，再按四化与星曜落点逐层展开。`,
      [
        `本版小结只汇总已计算的宫位、星曜和命身关系，不跨出盘面事实作事件承诺。`,
        '这意味着什么：保存快照后，可以在未来版本中对照解释版本和证据引用是否发生变化。',
      ],
      refsFor(evidenceGraph, [...lifeRefs, ...bodyRefs, ...(relationRef ? [relationRef] : [])]),
      ['glossary:ziwei:life-palace', 'glossary:ziwei:body-palace', 'glossary:ziwei:four-transform'],
    ),
  ];
  return createExplanationSnapshot(blocks, {
    explanationVersion: ZIWEI_EXPLANATION_VERSION,
    generatedAt,
    glossaryVersion: GLOSSARY_VERSION,
  });
}
