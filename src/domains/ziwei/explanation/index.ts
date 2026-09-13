import { createExplanationSnapshot } from '@/domains/explanation/snapshot';
import { GLOSSARY_VERSION, type ExplanationBlock, type ExplanationConfidence, type ExplanationSnapshot } from '@/domains/explanation/types';
import type { ZiweiEvidenceGraph } from '@/domains/ziwei/evidence/index';
import type { NormalizedZiweiChart } from '@/domains/ziwei/model/normalized-chart';
import { describeMutagenEdge, palaceTheme, starTrait } from '@/domains/ziwei/interpretation/knowledge';

export const ZIWEI_EXPLANATION_VERSION = 'ziwei-explanation-v3' as const;

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
  const valid = new Set(graph.nodes.map((node) => node.id));
  void min;
  return [...new Set(preferred)].filter((id) => valid.has(id)).slice(0, max);
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

function palacePosition(chart: NormalizedZiweiChart, refId: string | undefined): string {
  const palace = chart.palaces.find((item) => item.id === refId);
  return palace?.stemBranch || '位置未记录';
}

function starNames(chart: NormalizedZiweiChart, refId: string | undefined): string {
  const ids = chart.palaces.find((palace) => palace.id === refId)?.majorStarRefs ?? [];
  const names = ids
    .map((id) => chart.stars.find((star) => star.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  return names.length ? names.join('、') : '未见十四主星坐守';
}

function starDetails(chart: NormalizedZiweiChart, refId: string | undefined): string {
  const ids = chart.palaces.find((palace) => palace.id === refId)?.majorStarRefs ?? [];
  const names = ids
    .map((id) => chart.stars.find((star) => star.id === id))
    .filter((star): star is NonNullable<typeof star> => Boolean(star))
    .map((star) => `${star.name}${star.brightness ? `（${star.brightness}）` : ''}${star.mutagen ? ` · 化${star.mutagen}` : ''}`);
  return names.length ? names.join('、') : '未见十四主星坐守';
}

/** Split the per-edge mutagen readings across at most two paragraphs. */
function mutagenParagraphs(chart: NormalizedZiweiChart): string[] {
  const readings = chart.mutagenEdges.map((edge) => describeMutagenEdge(chart, edge));
  if (!readings.length) {
    return ['没有四化节点时，解释层不会猜测或补造四化。', '这意味着什么：缺少生年四化时，本版不能生成化象主题解读，只能按宫位与星曜事实阅读。'];
  }
  const first = readings.slice(0, 2).join(' ');
  const second = readings.slice(2).join(' ');
  const guide = '以上每句都由星曜特质、化象倾向与宫位主题三段事实拼成；先读化忌落宫（消耗点），再看化禄落宫（资源点），结合宫位主题安排观察重点。';
  return second ? [first, second, guide] : [first, guide];
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
  const lifePosition = palacePosition(chart, chart.lifePalaceRefId);
  const bodyPosition = palacePosition(chart, chart.bodyPalaceRefId);
  const lifeRefs = refsFor(evidenceGraph, palaceEvidence(evidenceGraph, chart.lifePalaceRefId));
  const bodyRefs = refsFor(evidenceGraph, palaceEvidence(evidenceGraph, chart.bodyPalaceRefId));
  const mutagenRefs = refsFor(evidenceGraph, evidenceGraph.nodes.filter((node) => node.type === 'mutagen.edge').map((node) => node.id));
  const threeSquareRefs = refsFor(evidenceGraph, evidenceGraph.nodes.filter((node) => node.type === 'palace.relation').map((node) => node.id));
  const relationRef = evidenceGraph.nodes.find((node) => node.type === 'life-body.relation')?.id;
  const palaceRefs = refsFor(evidenceGraph, evidenceGraph.nodes.filter((node) => node.type === 'palace.position').map((node) => node.id));
  const lifePalaceNode = chart.palaces.find((palace) => palace.id === chart.lifePalaceRefId);
  const opposite = chart.palaces.find((palace) => palace.id === lifePalaceNode?.oppositePalaceRefId)?.name;
  const trines = (lifePalaceNode?.trinePalaceRefIds ?? [])
    .map((id) => chart.palaces.find((palace) => palace.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const lifeStarReadings = (lifePalaceNode?.majorStarRefs ?? [])
    .map((id) => chart.stars.find((star) => star.id === id))
    .filter((star): star is NonNullable<typeof star> => Boolean(star))
    .map((star) => `${star.name}：${starTrait(star.name)}${star.brightness ? `（亮度${star.brightness}）` : ''}。`)
    .join('');
  const mutagenSummary = chart.mutagenEdges.length
    ? `本盘四化：${chart.mutagenEdges.map((edge) => `${edge.starName}化${edge.mutagen}入${palaceName(chart, edge.palaceRefId)}`).join('、')}。`
    : '当前盘面没有返回可核对的四化落宫事实。';
  const blocks: ExplanationBlock[] = [
    makeBlock(
      'overview',
      '先看盘面骨架',
      `本盘命宫坐标为${lifePosition}，身宫坐标为${bodyPosition}，五行局${chart.fiveElement}。`,
      [
        `本次排盘固定记录了${chart.palaces.length}个宫位、${chart.stars.length}颗星曜及其位置。`,
        `命宫与身宫是阅读入口：命宫看性格底色与起点，身宫看后天投入的方向；后续解释会把每个判断回连到具体宫位和星曜事实。`,
      ],
      refsFor(evidenceGraph, [...lifeRefs, ...bodyRefs, ...(relationRef ? [relationRef] : [])]),
      ['glossary:ziwei:palace-position', 'glossary:ziwei:life-palace', 'glossary:ziwei:body-palace'],
      'high',
    ),
    makeBlock(
      'life-palace',
      '命宫位置',
      `命宫定位于${lifePosition}（宫名：${lifePalace}），主星记录为${starNames(chart, chart.lifePalaceRefId)}。`,
      [
        `命宫在结构上关联${palaceTheme(lifePalace)}；本宫主星决定这份主题以什么风格展开。`,
        `命宫的天干地支与星曜清单来自标准化宫位模型，而不是页面临时拼接。`,
        '命宫可以作为继续查看主星、亮度和四化引用的坐标，但不会单独生成现实结论。',
      ],
      lifeRefs,
      ['glossary:ziwei:life-palace', 'glossary:ziwei:main-star'],
    ),
    makeBlock(
      'body-palace',
      '身宫位置',
      `身宫定位于${bodyPosition}（宫名：${bodyPalace}），命主与身主字段一并保留作复盘坐标。`,
      [
        `身宫在结构上提示后天投入与在意的领域，与命宫的先天底色互为对照。`,
        `身宫位置通过稳定宫位 ID 保存，可与命宫位置和星曜引用做复盘对照。`,
      ],
      bodyRefs,
      ['glossary:ziwei:body-palace', 'glossary:ziwei:palace-position'],
    ),
    makeBlock(
      'star-combinations',
      '命宫主星解读',
      `命宫主星组合为${starDetails(chart, chart.lifePalaceRefId)}，按星曜特质展开。`,
      [
        lifeStarReadings || '命宫未记录十四主星；空宫按所选流派是否借对宫星曜阅读，本版不擅自补齐。',
        '同宫多星时倾向互相调和或互相牵制，先读主星再读辅星；亮度影响特质发挥的稳定度。',
        '当前没有把星曜名称自动翻译成职业、婚姻或性格断语，也不会用缺失星曜补齐组合。',
      ],
      refsFor(evidenceGraph, evidenceGraph.nodes
        .filter((node) => node.type === 'star.placement' && chart.lifePalaceRefId && node.subjectRefs.includes(chart.lifePalaceRefId))
        .map((node) => node.id)),
      ['glossary:ziwei:main-star', 'glossary:ziwei:four-transform'],
      'medium',
    ),
    makeBlock(
      'three-square-four-correctness',
      '三方四正',
      `命宫${lifePalace}的对宫为${opposite ?? '未记录'}，三方为${trines.join('、') || '未记录'}。`,
      [
        `阅读${lifePalace}主题时，四个宫位要一起看：本宫给出风格，对宫给出对照面，三方给出配合与压力。`,
        '三方四正节点只记录宫位之间的坐标关系，不把关联自动翻译成吉凶。',
      ],
      threeSquareRefs,
      ['glossary:ziwei:palace-position', 'glossary:ziwei:life-palace'],
      'medium',
    ),
    makeBlock(
      'mutagens',
      '四化落点解读',
      mutagenSummary,
      mutagenParagraphs(chart),
      mutagenRefs,
      ['glossary:ziwei:four-transform', 'glossary:ziwei:palace-position'],
      chart.mutagenEdges.length ? 'medium' : 'low',
      chart.mutagenEdges.length ? [COMMON_CAVEAT] : ['当前引擎没有返回四化落点，暂不作扩展解释。', COMMON_CAVEAT],
    ),
    makeBlock(
      'focus-palaces',
      '十二宫导航',
      `十二宫各有关联主题，点击宫位可查看主题、星曜与四化落点解读。`,
      [
        '宫位卡片先展示位置、主星、辅星和大限字段，解释层只引用同一组标准化证据。',
        '例如财帛宫看资源往来模式，官禄宫看事业方向与做事场景；逐宫复盘时不必接受一条不可检查的总断。',
      ],
      palaceRefs,
      ['glossary:ziwei:palace-position', 'glossary:ziwei:main-star'],
    ),
    makeBlock(
      'summary',
      '本盘小结',
      `先读命宫${lifePalace}（${lifePosition}）主星，再追四化落宫与身宫${bodyPalace}的对照。`,
      [
        `建议阅读顺序：命宫主星定风格 → 四化落点找资源与消耗的集中处 → 身宫${bodyPalace}看后天投入 → 三方四正补结构。`,
        '本版小结只汇总已计算的宫位、星曜和命身关系，不跨出盘面事实作事件承诺。',
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
