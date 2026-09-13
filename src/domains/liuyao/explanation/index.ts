import { createExplanationSnapshot } from '@/domains/explanation/snapshot';
import { GLOSSARY_VERSION, type ExplanationBlock, type ExplanationConfidence, type ExplanationSnapshot } from '@/domains/explanation/types';
import type { LiuyaoEvidenceGraph } from '@/domains/liuyao/evidence/index';
import type { NormalizedLiuyaoChart } from '@/domains/liuyao/model/normalized-chart';

export const LIUYAO_EXPLANATION_VERSION = 'liuyao-explanation-v3' as const;

const COMMON_CAVEAT = '六爻解释只描述当前问题、取用和盘面结构，不承诺结果或具体时间。';

/** Structural reading of the selected yongshen's strength/movement/void state. */
export function yongShenReading(chart: NormalizedLiuyaoChart): string {
  const selected = chart.yongShen?.[0]?.selected;
  if (!selected) return '引擎未返回具体用神爻位，保持待定，不为完整感补造取用结论。';
  const parts = [`用神${selected.liuQin}${selected.position ? `取${selected.position}爻（${selected.naJia}）` : ''}`];
  if (selected.strengthLabel === '旺' || selected.strengthLabel === '相') {
    parts.push(`当前状态为「${selected.strengthLabel}」，结构上属于有力，所问之事的对应面具备支撑。`);
  } else if (selected.strengthLabel === '休' || selected.strengthLabel === '囚' || selected.strengthLabel === '死') {
    parts.push(`当前状态为「${selected.strengthLabel}」，结构上偏弱，对应面缺乏即时支撑，需要等待生扶条件出现。`);
  } else if (selected.strengthLabel) {
    parts.push(`状态标记为「${selected.strengthLabel}」，按当前规则不作进一步强弱推断。`);
  }
  parts.push(selected.movementLabel === '动'
    ? '用神发动，表示对应面已出现变动迹象，走向要结合变爻与本卦结构一起看。'
    : '用神安静，表示对应面暂无明显变动迹象，观察重点放在月日对它的生克上。');
  if (selected.kongWangState) parts.push('用神落空亡：结构上提示对应面暂时落空、反馈迟滞，是后续复盘的首要观察点。');
  return parts.join('');
}

/** Structural reading of the shi/ying axis from saved line facts. */
export function shiYingReading(chart: NormalizedLiuyaoChart): string {
  const shi = chart.lines.find((line) => line.isShiYao);
  const ying = chart.lines.find((line) => line.isYingYao);
  if (!shi || !ying) return '世爻或应爻位置未保存，无法生成对照描述。';
  return `世爻在第${shi.position}爻（${shi.liuQin}·${shi.naJia}，${shi.strength ?? '状态待核'}），应爻在第${ying.position}爻（${ying.liuQin}·${ying.naJia}，${ying.strength ?? '状态待核'}）。世爻通常作求测方参照、应爻作对方或环境参照；两边六亲与旺衰的对比是复盘时的结构参照，不单独给出吉凶。`;
}

function refsFor(graph: LiuyaoEvidenceGraph, preferred: string[], min = 2, max = 5): string[] {
  const valid = new Set(graph.nodes.map((node) => node.id));
  void min;
  return [...new Set(preferred)].filter((id) => valid.has(id)).slice(0, max);
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
  const yongShenDetails = idsOf(evidenceGraph, 'yongshen.detail');
  const timeRecommendations = idsOf(evidenceGraph, 'time.recommendation');
  const selectedGroups = chart.yongShen ?? [];
  const shi = chart.lines.find((line) => line.isShiYao);
  const ying = chart.lines.find((line) => line.isYingYao);
  const selectedText = selectedGroups
    .map((group) => `${group.targetLiuQin}${group.selected.position ? `取${group.selected.position}爻` : '未定具体爻位'}（${group.selectionStatus}，${group.selected.strengthLabel}，${group.selected.movementLabel}）`)
    .join('；');
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
        `当前可核对的取用候选：${selectedText || '引擎未返回具体爻位，保持待定。'}。`,
        yongShenReading(chart),
        '这意味着什么：取用是观察入口，复盘时仍应检查它是否贴合问题语境。',
      ],
      refsFor(evidenceGraph, [yongShen, ...yongShenDetails, ...strength].filter((item): item is string => Boolean(item))),
      ['glossary:liuyao:yongshen', 'glossary:liuyao:strength'],
      'high',
    ),
    makeBlock(
      'shi-ying',
      '世应结构',
      shi ? `世爻在第${shi.position}爻、应爻在第${ying?.position ?? '?'}爻，作为盘面参照坐标保存。` : '世应坐标已保存，先核对位置再观察其余证据。',
      [
        shiYingReading(chart),
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
        moving.length ? `动爻节点与本卦、变卦结构节点相互引用；${chart.lines.filter((line) => line.isChanging).map((line) => `${line.position}爻${line.changed ? `变为${line.changed.naJia}${line.changed.wuXing}` : '的变后事实未保存'}`).join('、')}。` : '静卦不会补写动爻或变卦，复盘应回到世应、时间和旺衰字段。',
        moving.length
          ? `变化走向：${chart.lines.filter((line) => line.isChanging && line.changeAnalysis).map((line) => `${line.position}爻${line.changeAnalysis?.description ?? ''}`).join('；') || '引擎未返回化变类型描述，仅保留变后纳甲与五行事实。'}。动爻是所问之事的变动启动点，变爻给出走向线索，但它仍是结构描述。`
          : '静卦表示本次盘面没有标出变动启动点；观察重点放在用神旺衰与月日生克上。',
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
      `本盘保存干支时间、${strength.length}条爻状态证据和${timeRecommendations.length}条规则参考窗口，供后续复盘核对。`,
      [
        `干支时间、日期、空亡和每爻旺衰证据分开记录；当前选中的取用为${selectedText || '未保存具体取用爻位'}。`,
        timeRecommendations.length ? '引擎返回的参考窗口只来自取用爻的旺衰、动变或空亡事实；它是待观察线索，不是确定日期。' : '当前没有足够的规则参考窗口；不会为了完整感补造日期。',
      ],
      refsFor(evidenceGraph, [time, voidFact, ...timeRecommendations, ...strength].filter((item): item is string => Boolean(item))),
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
        `小结只汇总本次输入和已返回的结构证据；取用状态为${selectedText || '未保存具体取用事实'}。`,
        '这意味着什么：保存快照后，反馈记录可以按日期回填，用来检查当时的判断边界。',
      ],
      refsFor(evidenceGraph, [question, yongShen, ...yongShenDetails, shiYing, structure, time].filter((item): item is string => Boolean(item))),
      ['glossary:liuyao:yongshen', 'glossary:liuyao:shi-ying', 'glossary:liuyao:strength'],
    ),
  ];
  return createExplanationSnapshot(blocks, {
    explanationVersion: LIUYAO_EXPLANATION_VERSION,
    generatedAt,
    glossaryVersion: GLOSSARY_VERSION,
  });
}
