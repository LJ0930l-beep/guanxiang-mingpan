import { createExplanationSnapshot } from '@/domains/explanation/snapshot';
import { GLOSSARY_VERSION, type ExplanationBlock, type ExplanationConfidence, type ExplanationSnapshot } from '@/domains/explanation/types';
import type { AstrologyEvidenceGraph } from '@/domains/astrology/evidence/index';
import type { NormalizedAstrologyChart } from '@/domains/astrology/model/normalized-chart';

export const ASTROLOGY_EXPLANATION_VERSION = 'astrology-explanation-v1' as const;

const COMMON_CAVEAT = '占星解释只描述盘面位置与结构，不把星象翻译成确定事件或现实决策。';

function refsFor(graph: AstrologyEvidenceGraph, preferred: string[], min = 2, max = 5): string[] {
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

function nodes(graph: AstrologyEvidenceGraph, type: string): string[] {
  return graph.nodes.filter((node) => node.type === type).map((node) => node.id);
}

function point(chart: NormalizedAstrologyChart, key: string) {
  return chart.points.find((item) => item.key === key);
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
    id: `astrology:explanation:${category}`,
    module: 'astrology',
    category,
    title,
    summary,
    paragraphs,
    evidenceRefs,
    counterEvidenceRefs: [],
    glossaryRefs,
    confidence,
    caveats,
    explanationVersion: ASTROLOGY_EXPLANATION_VERSION,
  };
}

export function buildAstrologyExplanation({ chart, evidenceGraph, generatedAt }: { chart: NormalizedAstrologyChart; evidenceGraph: AstrologyEvidenceGraph; generatedAt: string }): ExplanationSnapshot {
  const sun = point(chart, 'sun');
  const moon = point(chart, 'moon');
  const mode = chart.calculationMode;
  const precision = nodes(evidenceGraph, 'precision.caveat');
  const bodyPlacements = nodes(evidenceGraph, 'point.placement');
  const anglePositions = nodes(evidenceGraph, 'angle.position');
  const housePlacements = nodes(evidenceGraph, 'house.placement');
  const aspects = nodes(evidenceGraph, 'aspect.structure');
  const retrogrades = nodes(evidenceGraph, 'retrograde.fact');
  const blocks: ExplanationBlock[] = [
    makeBlock(
      'overview',
      '先看三层坐标',
      `本盘为${mode === 'exact' ? '精确' : '近似'}模式，先看太阳${sun?.sign ?? '未返回'}与月亮${moon?.sign ?? '未返回'}。`,
      [
        `标准化模型保存了${chart.points.length}个天体/角点与${chart.aspects.length}组主要相位。`,
        '这意味着什么：先区分落座、角点和相位三类证据，再决定是否展开宫位字段。',
      ],
      refsFor(evidenceGraph, [...bodyPlacements.slice(0, 3), ...precision]),
      ['glossary:astrology:sun', 'glossary:astrology:moon', 'glossary:astrology:precision'],
      'high',
    ),
    makeBlock(
      'core-triad',
      '太阳与月亮',
      `太阳落${sun?.sign ?? '未返回'}，月亮落${moon?.sign ?? '未返回'}，只先描述两条落座事实。`,
      [
        '太阳与月亮是本命盘中的核心天体字段，解释层直接引用落座和经度节点。',
        '这意味着什么：它们可以帮助你理解盘面的两条观察坐标，但不替代完整相位与宫位核对。',
      ],
      refsFor(evidenceGraph, bodyPlacements.filter((id) => id.includes(':sun') || id.includes(':moon'))),
      ['glossary:astrology:sun', 'glossary:astrology:moon'],
    ),
    makeBlock(
      'angles',
      mode === 'exact' ? '角点位置' : '角点数据边界',
      mode === 'exact' ? `上升与天顶已作为角点保存，可展开查看落座和经度。` : '未匹配城市坐标，不计算上升、天顶与宫位。',
      mode === 'exact'
        ? ['上升和天顶属于角点证据，和行星落座分开保存。', '这意味着什么：角点可以作为盘面入口，但仍需和其他结构一起复盘。']
        : ['当前只保留不依赖坐标的天体落座字段。', '这意味着什么：补充可识别城市后才能重新计算角点与宫位。'],
      refsFor(evidenceGraph, [...anglePositions, ...precision]),
      ['glossary:astrology:ascendant', 'glossary:astrology:precision'],
      mode === 'exact' ? 'medium' : 'low',
      mode === 'exact' ? [COMMON_CAVEAT] : ['近似盘不对角点和宫位做解释。', COMMON_CAVEAT],
    ),
    makeBlock(
      'houses',
      mode === 'exact' ? '宫位字段' : '宫位数据边界',
      mode === 'exact' ? `已记录${housePlacements.length}条宫位落点，可逐条回看和核对。` : '近似盘没有宫位字段，不进行宫位解释。',
      mode === 'exact'
        ? ['宫位节点保留天体与宫号的关系，和落座节点分开。', '这意味着什么：宫位解释必须以已记录的宫号为准，不用页面猜测补齐。']
        : ['未知坐标时不会把天体随意分配到十二宫。', '这意味着什么：当前结果可用于落座复盘，不能替代完整星盘。'],
      refsFor(evidenceGraph, [...housePlacements, ...precision]),
      ['glossary:astrology:house', 'glossary:astrology:precision'],
      mode === 'exact' ? 'medium' : 'low',
      mode === 'exact' ? [COMMON_CAVEAT] : ['近似盘不对宫位做解释。', COMMON_CAVEAT],
    ),
    makeBlock(
      'aspects',
      '主要相位',
      `当前记录${aspects.length}组主要相位，优先显示容许度较小的结构。`,
      [
        '相位节点保存参与天体、相位类型和容许度，便于从结构回到原始盘面。',
        '这意味着什么：容许度只是结构的接近程度，不是现实事件强度或发生保证。',
      ],
      refsFor(evidenceGraph, aspects),
      ['glossary:astrology:aspect', 'glossary:astrology:orb'],
    ),
    makeBlock(
      'retrograde',
      '逆行字段',
      retrogrades.length ? `盘面记录了${retrogrades.length}个逆行字段，可回到对应天体核对。` : '当前盘面没有标记逆行字段。',
      [
        retrogrades.length ? '逆行节点只表示引擎返回的布尔字段，不扩写成性格或事件结论。' : '没有逆行节点时，解释层不会根据星体名称推测逆行。',
        '这意味着什么：逆行字段需要和落座、宫位及相位一起阅读。',
      ],
      refsFor(evidenceGraph, [...retrogrades, ...bodyPlacements]),
      ['glossary:astrology:retrograde', 'glossary:astrology:precision'],
      retrogrades.length ? 'medium' : 'low',
    ),
    makeBlock(
      'precision',
      '精度与边界',
      mode === 'exact' ? '城市坐标已匹配，本盘可展开角点与宫位字段。' : '城市坐标未匹配，本盘明确标记为近似模式。',
      [
        mode === 'exact' ? '精确模式保留城市坐标来源和完整角点/宫位证据。' : '近似模式保留天体落座和相位，但不猜测角点、天顶或宫位。',
        '这意味着什么：补充或修正城市后，应重新生成并保存一份新的解释快照。',
      ],
      refsFor(evidenceGraph, precision),
      ['glossary:astrology:precision'],
      mode === 'exact' ? 'high' : 'low',
      mode === 'exact' ? [COMMON_CAVEAT] : ['当前近似结果只能作为基础落座参考，数据精度有限。', COMMON_CAVEAT],
    ),
    makeBlock(
      'summary',
      '本盘小结',
      `先核对太阳、月亮与精度模式，再按相位和${mode === 'exact' ? '宫位' : '落座'}继续复盘。`,
      [
        '解释层只汇总当前版本明确返回的事实，不代替用户对现实情况的判断。',
        '这意味着什么：保存后可对比未来解释版本、证据节点和精度边界是否变化。',
      ],
      refsFor(evidenceGraph, [...bodyPlacements.slice(0, 2), ...aspects.slice(0, 2), ...precision]),
      ['glossary:astrology:sun', 'glossary:astrology:aspect', 'glossary:astrology:precision'],
    ),
  ];
  return createExplanationSnapshot(blocks, {
    explanationVersion: ASTROLOGY_EXPLANATION_VERSION,
    generatedAt,
    glossaryVersion: GLOSSARY_VERSION,
  });
}
