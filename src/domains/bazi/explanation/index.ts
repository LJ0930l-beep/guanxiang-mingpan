import { createExplanationSnapshot } from '@/domains/explanation/snapshot';
import { GLOSSARY_VERSION, type ExplanationBlock, type ExplanationConfidence, type ExplanationSnapshot } from '@/domains/explanation/types';
import type { BaziEvidenceGraph, EvidenceNode, StrengthAssessment } from '@/domains/bazi/evidence/evidence-types';
import type { BaziInterpretation, InterpretationResult } from '@/domains/bazi/interpretation/rules';

export const BAZI_EXPLANATION_VERSION = 'bazi-explanation-v1' as const;

const ELEMENT_LABELS: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
  unknown: '未知',
};

const STATUS_LABELS: Record<StrengthAssessment['status'], string> = {
  strong: '偏强',
  weak: '偏弱',
  balanced: '接近平衡',
  uncertain: '待定',
};

const INFLUENCE_LABELS: Record<string, string> = {
  same: '同类',
  support: '生扶',
  pressure: '压力',
  drain: '泄耗',
  control: '制约',
  neutral: '中性',
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function refsAtLeast(nodes: EvidenceNode[], preferred: string[], fallback: string[], min = 2, max = 5): string[] {
  const valid = new Set(nodes.map((node) => node.id));
  const selected = unique([...preferred, ...fallback]).filter((id) => valid.has(id));
  return selected.slice(0, Math.max(min, Math.min(max, selected.length)));
}

function nodeLabels(nodes: EvidenceNode[], refs: string[], empty = '当前没有额外的独立证据节点。'): string {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const labels = refs.map((ref) => byId.get(ref)?.label).filter((label): label is string => Boolean(label));
  return labels.length > 0 ? labels.join('；') : empty;
}

function resultById(interpretation: BaziInterpretation, id: string): InterpretationResult | undefined {
  return interpretation.results.find((result) => result.id === id);
}

function confidenceOf(result: InterpretationResult | undefined, fallback: ExplanationConfidence = 'medium'): ExplanationConfidence {
  return result?.confidence ?? fallback;
}

function caveatsOf(result: InterpretationResult | undefined, assessment: StrengthAssessment, extra: string[] = []): string[] {
  const caveats = unique([...(result?.caveats ?? []), ...assessment.caveats, ...extra]);
  if (result?.confidence === 'low' || assessment.confidence === 'low') {
    caveats.push('当前置信度较低或规则敏感，不能据此给出更确定的现实结论。');
  }
  return unique(caveats);
}

function block(
  category: string,
  title: string,
  summary: string,
  paragraphs: string[],
  evidenceRefs: string[],
  counterEvidenceRefs: string[],
  glossaryRefs: string[],
  confidence: ExplanationConfidence,
  caveats: string[],
): ExplanationBlock {
  return {
    id: `explanation:bazi:${category}`,
    module: 'bazi',
    category,
    title,
    summary,
    paragraphs,
    evidenceRefs,
    counterEvidenceRefs,
    glossaryRefs,
    confidence,
    caveats,
    explanationVersion: BAZI_EXPLANATION_VERSION,
  };
}

export function buildBaziExplanation(input: {
  evidenceGraph: BaziEvidenceGraph;
  interpretation: BaziInterpretation;
  generatedAt: string;
}): ExplanationSnapshot {
  const { evidenceGraph, interpretation, generatedAt } = input;
  const nodes = evidenceGraph.nodes;
  const assessment = evidenceGraph.strengthAssessment;
  if (!assessment) throw new Error('八字解释需要先完成强弱证据链。');

  const strengthResult = resultById(interpretation, 'interpretation:strength');
  const elementResult = resultById(interpretation, 'interpretation:element-structure');
  const relationResult = resultById(interpretation, 'interpretation:relations');
  const seasonNode = nodes.find((node) => node.type === 'season.month-command');
  const rootNodes = nodes.filter((node) => node.type === 'root.day-master');
  const exposureNodes = nodes.filter((node) => node.type === 'exposure.stem');
  const elementNodes = nodes.filter((node) => node.type.startsWith('element.'));
  const relationNodes = nodes.filter((node) => node.type === 'relation.edge');
  const fallbackRefs = nodes.slice(0, 5).map((node) => node.id);
  const strengthRefs = refsAtLeast(nodes, strengthResult?.evidenceRefs ?? assessment.supportingEvidenceRefs, fallbackRefs);
  const strengthCounterRefs = unique(assessment.opposingEvidenceRefs).slice(0, 5);
  const seasonRefs = refsAtLeast(nodes, seasonNode ? [seasonNode.id] : [], [...assessment.supportingEvidenceRefs, ...fallbackRefs]);
  const rootRefs = refsAtLeast(nodes, rootNodes.map((node) => node.id), [...exposureNodes.map((node) => node.id), ...fallbackRefs]);
  const elementRefs = refsAtLeast(nodes, elementNodes.map((node) => node.id), fallbackRefs);
  const tenGodRefs = refsAtLeast(nodes, exposureNodes.map((node) => node.id), [...elementRefs, ...fallbackRefs]);
  const relationRefs = refsAtLeast(nodes, relationNodes.map((node) => node.id), [...elementRefs, ...fallbackRefs]);
  const summaryRefs = refsAtLeast(nodes, [...assessment.supportingEvidenceRefs, ...assessment.opposingEvidenceRefs], [...seasonRefs, ...relationRefs]);
  const summaryCounterRefs = unique(assessment.opposingEvidenceRefs).slice(0, 5);
  const status = STATUS_LABELS[assessment.status];
  const seasonInfluence = String(seasonNode?.facts.influence ?? 'neutral');
  const seasonLabel = INFLUENCE_LABELS[seasonInfluence] ?? '中性';
  const elementCounts = Object.entries(elementNodes.reduce<Record<string, number>>((counts, node) => {
    const element = String(node.facts.element ?? 'unknown');
    counts[element] = (counts[element] ?? 0) + 1;
    return counts;
  }, {})).map(([element, count]) => `${ELEMENT_LABELS[element] ?? element}${count}`).join('、');
  const tenGodLabels = exposureNodes
    .map((node) => String(node.facts.tenGod ?? '未标注十神'))
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 5)
    .join('、');
  const supportingText = nodeLabels(nodes, assessment.supportingEvidenceRefs, '当前没有独立支持节点。');
  const opposingText = nodeLabels(nodes, assessment.opposingEvidenceRefs, '当前没有独立反向节点。');

  const blocks = [
    block(
      'overview',
      '命盘总览',
      `当前结构以${status}为主线，解释同时保留支持与限制证据。`,
      [
        `这张盘先从日主状态开始阅读：当前规则判断为${status}，不是由单一五行数量直接决定。`,
        `本次解释会把月令、根气、透干、五行层次和柱间关系分开说明，再把它们放回同一张证据图。`,
        '这意味着什么：你可以先理解结构倾向，再回到具体证据和现实反馈中复核，不把它当作确定性人生结论。',
      ],
      summaryRefs,
      summaryCounterRefs,
      ['glossary:bazi:day-master', 'glossary:bazi:month-command', 'glossary:bazi:root'],
      confidenceOf(strengthResult, assessment.confidence),
      caveatsOf(strengthResult, assessment),
    ),
    block(
      'strength',
      '日主状态',
      `当前判断偏向${status}，依据来自月令、根气与全盘支持/反向证据。`,
      [
        `为什么这样看：${strengthResult?.conclusion ?? `当前结构显示日主${status}。`}`,
        `支持侧主要包括：${supportingText}`,
        `限制与反向检查包括：${opposingText}`,
        `这意味着什么：${assessment.status === 'uncertain' ? '目前更适合保留待定标签，先观察哪些证据会改变判断。' : '当前状态可作为后续阅读的入口，但仍要连同其他模块证据一起理解。'}`,
      ],
      strengthRefs,
      strengthCounterRefs,
      ['glossary:bazi:day-master', 'glossary:bazi:month-command', 'glossary:bazi:root'],
      confidenceOf(strengthResult, assessment.confidence),
      caveatsOf(strengthResult, assessment),
    ),
    block(
      'season',
      '月令与季节',
      `出生月令提供季节背景，当前证据显示它对日主形成${seasonLabel}关系。`,
      [
        `盘面事实：${nodeLabels(nodes, seasonNode ? [seasonNode.id] : [], '月令证据尚未保存。')}`,
        `规则解释：月令对日主的当前分类为“${seasonLabel}”，它是重要背景，不会单独替代根气与透干。`,
        '这意味着什么：阅读其他证据时，要把它当作季节起点，而不是把月令直接翻译成好坏。',
      ],
      seasonRefs,
      seasonInfluence === 'pressure' || seasonInfluence === 'control' || seasonInfluence === 'drain' ? strengthCounterRefs : [],
      ['glossary:bazi:month-command', 'glossary:shared:five-elements'],
      'high',
      caveatsOf(undefined, assessment, ['月令是重要背景，但不能单独决定强弱。']),
    ),
    block(
      'roots',
      '根气与透干',
      '日主根气与天干透出共同说明可见和隐藏的支持层次。',
      [
        `根气事实：${nodeLabels(nodes, rootNodes.map((node) => node.id), '当前未找到同类藏干根气节点。')}`,
        `透干事实：${nodeLabels(nodes, exposureNodes.map((node) => node.id), '当前未保存透干节点。')}`,
        '这意味着什么：根气代表地支藏干中的对应层次，透干代表天干层的可见信息，两者需要分开阅读。',
      ],
      rootRefs,
      strengthCounterRefs,
      ['glossary:bazi:root', 'glossary:bazi:exposure'],
      rootNodes.length > 0 ? 'high' : 'medium',
      caveatsOf(undefined, assessment, ['有根或透出只描述盘面事实，不自动等于偏强。']),
    ),
    block(
      'elements',
      '五行结构',
      `五行信息分布在天干、地支本气和藏干层，当前记录到${elementCounts || '多层'}类事实。`,
      [
        `证据分层：当前节点按天干、地支本气和藏干保存，数量概览为${elementCounts || '未记录'}。`,
        `解释提醒：${elementResult?.conclusion ?? '五行层次应回到具体节点阅读，而不是简单相加。'}`,
        '这意味着什么：先确认某种力量出现在哪一层、处于什么位置，再讨论它与日主的关系。',
      ],
      elementRefs,
      strengthCounterRefs,
      ['glossary:shared:five-elements', 'glossary:bazi:day-master'],
      confidenceOf(elementResult, 'high'),
      caveatsOf(elementResult, assessment, ['五行数量只是索引，不是独立结论。']),
    ),
    block(
      'ten-gods',
      '十神结构',
      `十神把天干与日主的关系标成不同角色，需连同位置和层级理解。`,
      [
        `当前可见天干的十神标签包括：${tenGodLabels || '未标注'}。`,
        '十神是相对于日主的关系分类；同一标签出现在不同柱位，阅读重点也会不同。',
        '这意味着什么：术语只负责帮助定位关系，不直接替代现实中的人格、职业或事件判断。',
      ],
      tenGodRefs,
      strengthCounterRefs,
      ['glossary:bazi:ten-gods', 'glossary:bazi:day-master'],
      'medium',
      caveatsOf(undefined, assessment, ['当前 V1 先解释已保存的十神标签，不扩写流派之外的语义。']),
    ),
    block(
      'relations',
      '合冲刑害',
      `柱间合冲刑害是关系事实，是否重要要回到涉及的证据节点。`,
      [
        `当前关系事实：${nodeLabels(nodes, relationNodes.map((node) => node.id), '未检出已支持的柱间关系。')}`,
        `规则解释：${relationResult?.conclusion ?? '关系节点只说明盘面连接，不单独宣告吉凶。'}`,
        '这意味着什么：关系更像一条需要回看的连接线，只有与前述支持、限制证据合看时才有解释价值。',
      ],
      relationRefs,
      relationNodes.length > 0 ? strengthCounterRefs : [],
      ['glossary:bazi:relations'],
      confidenceOf(relationResult, relationNodes.length > 0 ? 'medium' : 'low'),
      caveatsOf(relationResult, assessment, ['关系事实不脱离其他证据单独下结论。']),
    ),
    block(
      'summary',
      '综合观察',
      '综合观察先保留当前结构倾向，并把证据边界和不能确定的部分说清。',
      [
        `当前综合方向：日主状态先按${status}阅读，月令分类为${seasonLabel}，再结合根气、透干和关系节点复核。`,
        `支持因素：${supportingText}`,
        `限制因素：${opposingText}`,
        '这意味着什么：这是一份可回查的结构说明，不替用户决定婚姻、职业、医疗、法律或投资等现实行动。',
      ],
      summaryRefs,
      summaryCounterRefs,
      ['glossary:bazi:day-master', 'glossary:shared:five-elements', 'glossary:bazi:relations'],
      assessment.confidence,
      caveatsOf(undefined, assessment),
    ),
  ];

  return createExplanationSnapshot(blocks, {
    explanationVersion: BAZI_EXPLANATION_VERSION,
    generatedAt,
    glossaryVersion: GLOSSARY_VERSION,
  });
}
