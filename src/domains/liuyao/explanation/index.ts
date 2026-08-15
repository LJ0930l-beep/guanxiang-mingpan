import { createExplanationSnapshot } from '@/domains/explanation/snapshot';
import { GLOSSARY_VERSION, type ExplanationBlock, type ExplanationConfidence, type ExplanationSnapshot } from '@/domains/explanation/types';
import type { LiuyaoEvidenceGraph } from '@/domains/liuyao/evidence/index';
import type { NormalizedLiuyaoChart } from '@/domains/liuyao/model/normalized-chart';

export const LIUYAO_EXPLANATION_VERSION = 'liuyao-explanation-v1' as const;

const COMMON_CAVEAT = '六爻解释只描述当前问题、取用和盘面结构，不承诺结果或具体时间。';

function refsFor(graph: LiuyaoEvidenceGraph, preferred: string[], min = 2, max = 5): string[] {
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

function idsOf(graph: LiuyaoEvidenceGraph, type: string): string[] {
  return graph.nodes.filter((node) => node.type === type).map((node) => node.id);
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
    id: `liuyao:explanation:${category}`,
    module: 'liuyao',
    category,
    title,
    summary,
    paragraphs,
    evidenceRefs,
    counterEvidenceRefs: [],
    glossaryRefs,
    confidence,
    caveats,
    explanationVersion: LIUYAO_EXPLANATION_VERSION,
  };
}

/** Explain only the question frame and structural evidence; no timing or outcome claims. */
export function buildLiuyaoExplanation({ chart, evidenceGraph, generatedAt }: { chart: NormalizedLiuyaoChart; evidenceGraph: LiuyaoEvidenceGraph; generatedAt: string }): ExplanationSnapshot {
  const question = evidenceGraph.nodes.find((node) => node.type === 'question.frame')?.id;
  const yongShen = evidenceGraph.nodes.find((node) => node.type === 'yongshen.selection')?.id;
  const structure = evidenceGraph.nodes.find((node) => node.type === 'hexagram.structure')?.id;
  const time = evidenceGraph.nodes.find((node) => node.type === 'time.fact')?.id;
  const voidFact = evidenceGraph.nodes.find((node) => node.type === 'void.fact')?.id;
  const shiYing = evidenceGraph.nodes.find((node) => node.type === 'shi-ying')?.id;
  const strength = idsOf(evidenceGraph, 'line.strength');
  const moving = idsOf(evidenceGraph, 'moving-change');
  const blocks: ExplanationBlock[] = [
    makeBlock(
      'question-frame',
      '问题边界',
      `本次围绕“${chart.question}”起卦，先固定问题文本和起卦输入。`,
      [
        '问题文本、起卦种子、日期和业务时区都保存在输入快照中，后续可以按同一条件复盘。',
        '这意味着什么：解释只针对这一次提问，不把盘面泛化为对其他问题的回答。',
      ],
      refsFor(evidenceGraph, [question, yongShen, time].filter((item): item is string => Boolean(item))),
      ['glossary:liuyao:yongshen'],
      'high',
    ),
    makeBlock(
      'yongshen',
      '取用方向',
      `当前用神方向记录为“${chart.yongShenTarget}”，可回到对应六亲和爻位核对。`,
      [
        '用神方向来自起卦时的用户选择，证据层同时保留六亲、纳甲和五行字段。',
        '这意味着什么：取用是观察入口，复盘时仍应检查它是否贴合问题语境。',
      ],
      refsFor(evidenceGraph, [yongShen, ...strength].filter((item): item is string => Boolean(item))),
      ['glossary:liuyao:yongshen', 'glossary:liuyao:strength'],
      'high',
    ),
    makeBlock(
      'shi-ying',
      '世应结构',
      '世爻与应爻作为参照坐标保存，先核对位置再观察其余证据。',
      [
        '世应节点记录爻位关系，和每一爻的旺衰、六亲及纳甲字段相互独立。',
        '这意味着什么：世应提供盘面参照，不单独输出支持或反对某个现实结果的结论。',
      ],
      refsFor(evidenceGraph, [shiYing, ...strength].filter((item): item is string => Boolean(item))),
      ['glossary:liuyao:shi-ying', 'glossary:liuyao:strength'],
    ),
    makeBlock(
      'moving-lines',
      '动变结构',
      moving.length ? `本卦记录${moving.length}个动爻，变卦字段为${chart.changedHexagramName ?? '未返回'}，可逐条核对。` : '本次未记录动爻，变卦字段保持为空。',
      [
        moving.length ? '动爻节点与本卦、变卦结构节点相互引用，便于逐爻核对变化。' : '静卦不会补写动爻或变卦，复盘应回到世应、时间和旺衰字段。',
        '这意味着什么：动变只说明盘面结构如何变化，不对现实结果或具体时间作保证。',
      ],
      refsFor(evidenceGraph, [...moving, structure].filter((item): item is string => Boolean(item))),
      ['glossary:liuyao:moving-line', 'glossary:liuyao:changed-hexagram'],
      moving.length ? 'medium' : 'low',
      moving.length ? [COMMON_CAVEAT] : ['当前为静卦，未发现动变证据。', COMMON_CAVEAT],
    ),
    makeBlock(
      'time-strength',
      '时间与旺衰',
      `本盘保存干支时间和${strength.length}条爻状态证据，供后续复盘核对。`,
      [
        '干支时间、日期、空亡和每爻旺衰证据分开记录，避免把一个标签压缩成总分。',
        '这意味着什么：时间字段用于解释当下结构背景，不在基础版推算具体应验日期。',
      ],
      refsFor(evidenceGraph, [time, voidFact, ...strength].filter((item): item is string => Boolean(item))),
      ['glossary:liuyao:strength', 'glossary:liuyao:void'],
    ),
    makeBlock(
      'changed-hexagram',
      '本卦与变卦',
      chart.changedHexagramName ? `本卦为${chart.hexagramName}，变卦为${chart.changedHexagramName}，两者都保留。` : `本卦为${chart.hexagramName}，当前没有变卦字段。`,
      [
        '卦名、卦宫和五行字段来自引擎结果，和动爻引用放在同一份快照中。',
        '这意味着什么：本卦与变卦用于回看结构变化，不代表一条不可复核的最终判词。',
      ],
      refsFor(evidenceGraph, [structure, ...moving].filter((item): item is string => Boolean(item))),
      ['glossary:liuyao:changed-hexagram', 'glossary:liuyao:moving-line'],
    ),
    makeBlock(
      'summary',
      '本卦小结',
      `先核对问题与用神，再按世应、旺衰和动变逐层复盘当前结构。`,
      [
        '小结只汇总本次输入和已返回的结构证据，不把基础盘面扩写成确定结果。',
        '这意味着什么：保存快照后，反馈记录可以按日期回填，用来检查当时的判断边界。',
      ],
      refsFor(evidenceGraph, [question, yongShen, shiYing, structure, time].filter((item): item is string => Boolean(item))),
      ['glossary:liuyao:yongshen', 'glossary:liuyao:shi-ying', 'glossary:liuyao:strength'],
    ),
  ];
  return createExplanationSnapshot(blocks, {
    explanationVersion: LIUYAO_EXPLANATION_VERSION,
    generatedAt,
    glossaryVersion: GLOSSARY_VERSION,
  });
}
