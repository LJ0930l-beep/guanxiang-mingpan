import type { NormalizedBaziChart } from '@/domains/bazi/model/normalized-chart';
import type { BaziEvidenceGraph, EvidenceNode, StrengthAssessment } from '@/domains/bazi/evidence/index';
import { BAZI_INTERPRETATION_VERSION } from '@/domains/bazi/interpretation/version';

export type InterpretationCategory = 'strength' | 'element' | 'relation' | 'structure';

export interface InterpretationResult {
  id: string;
  category: InterpretationCategory;
  title: string;
  conclusion: string;
  confidence: 'high' | 'medium' | 'low';
  evidenceRefs: string[];
  counterEvidenceRefs: string[];
  caveats: string[];
  ruleVersion: typeof BAZI_INTERPRETATION_VERSION;
}

export interface StructureTag {
  id: string;
  code: string;
  label: string;
  confidence: 'high' | 'medium' | 'low';
  evidenceRefs: string[];
  caveats: string[];
  ruleVersion: typeof BAZI_INTERPRETATION_VERSION;
}

export interface BaziInterpretation {
  interpretationVersion: typeof BAZI_INTERPRETATION_VERSION;
  results: InterpretationResult[];
  structureTags: StructureTag[];
}

function nodesById(graph: BaziEvidenceGraph): Map<string, EvidenceNode> {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

function strengthConclusion(assessment: StrengthAssessment): string {
  if (assessment.status === 'strong') return '依据当前月令、根气与支持证据，日主一侧的证据更占优势。';
  if (assessment.status === 'weak') return '依据当前月令与克泄耗证据，日主一侧的支持不足。';
  if (assessment.status === 'balanced') return '当前盘面同时存在支持与反对证据，暂以接近平衡呈现。';
  return '当前证据不足或存在规则敏感点，暂不强行归入身强或身弱。';
}

function buildStrengthResult(assessment: StrengthAssessment): InterpretationResult {
  return {
    id: 'interpretation:strength',
    category: 'strength',
    title: '日主状态',
    conclusion: strengthConclusion(assessment),
    confidence: assessment.confidence,
    evidenceRefs: assessment.supportingEvidenceRefs,
    counterEvidenceRefs: assessment.opposingEvidenceRefs,
    caveats: assessment.caveats,
    ruleVersion: BAZI_INTERPRETATION_VERSION,
  };
}

function buildElementResult(graph: BaziEvidenceGraph): InterpretationResult {
  const elementRefs = graph.nodes
    .filter((node) => node.type === 'element.stem' || node.type === 'element.branch-native' || node.type === 'element.hidden-stem')
    .map((node) => node.id);
  const stemCount = graph.nodes.filter((node) => node.type === 'element.stem').length;
  const branchCount = graph.nodes.filter((node) => node.type === 'element.branch-native').length;
  const hiddenCount = graph.nodes.filter((node) => node.type === 'element.hidden-stem').length;
  return {
    id: 'interpretation:element-structure',
    category: 'element',
    title: '五行结构',
    conclusion: `本盘的五行事实由 ${stemCount} 个天干、${branchCount} 个地支本气和 ${hiddenCount} 个藏干节点组成；月令单独保留为主导证据。`,
    confidence: 'high',
    evidenceRefs: elementRefs,
    counterEvidenceRefs: [],
    caveats: ['这是盘面事实层汇总，不等同于简单五行数量，也不直接推出吉凶。'],
    ruleVersion: BAZI_INTERPRETATION_VERSION,
  };
}

function buildRelationResult(graph: BaziEvidenceGraph): InterpretationResult {
  const relationRefs = graph.nodes.filter((node) => node.type === 'relation.edge').map((node) => node.id);
  return {
    id: 'interpretation:relations',
    category: 'relation',
    title: '关系图谱',
    conclusion: relationRefs.length > 0
      ? `当前识别到 ${relationRefs.length} 条柱间关系事实，后续判断应回到具体关系节点查看。`
      : '当前未识别到已支持的柱间关系事实。',
    confidence: relationRefs.length > 0 ? 'medium' : 'low',
    evidenceRefs: relationRefs,
    counterEvidenceRefs: [],
    caveats: ['合冲刑害在本阶段只作为可追踪事实，不单独宣告吉凶。'],
    ruleVersion: BAZI_INTERPRETATION_VERSION,
  };
}

export function buildBaziInterpretation(
  chart: NormalizedBaziChart,
  graph: BaziEvidenceGraph,
): BaziInterpretation {
  const assessment = graph.strengthAssessment;
  if (!assessment) throw new Error('八字解释需要先完成强弱证据链。');
  const nodeMap = nodesById(graph);
  const allResults = [buildStrengthResult(assessment), buildElementResult(graph), buildRelationResult(graph)];
  const filteredResults = allResults.map((result) => ({
    ...result,
    evidenceRefs: result.evidenceRefs.filter((id) => nodeMap.has(id)),
    counterEvidenceRefs: result.counterEvidenceRefs.filter((id) => nodeMap.has(id)),
  }));
  const structureTags: StructureTag[] = [];
  const season = graph.nodes.find((node) => node.type === 'season.month-command');
  const majorRoot = graph.nodes.find((node) => node.type === 'root.day-master' && node.weight === 'major');
  if (season?.facts.influence === 'support' || season?.facts.influence === 'same') {
    structureTags.push({
      id: 'structure:month-command-support',
      code: 'month-command-support',
      label: '月令形成生扶或同类关系',
      confidence: 'high',
      evidenceRefs: [season.id],
      caveats: ['月令是重要证据，但不能单独替代根气和透干判断。'],
      ruleVersion: BAZI_INTERPRETATION_VERSION,
    });
  }
  if (majorRoot) {
    structureTags.push({
      id: 'structure:rooted-day-master',
      code: 'rooted-day-master',
      label: '日主在地支本气中有根',
      confidence: 'high',
      evidenceRefs: [majorRoot.id],
      caveats: ['根气仍需结合受冲合状态与全盘支持/反对证据。'],
      ruleVersion: BAZI_INTERPRETATION_VERSION,
    });
  }
  if (assessment.status === 'balanced' || assessment.status === 'uncertain') {
    structureTags.push({
      id: 'structure:evidence-sensitive',
      code: 'evidence-sensitive',
      label: assessment.status === 'balanced' ? '支持与反对证据并列' : '证据不足或规则敏感',
      confidence: assessment.confidence,
      evidenceRefs: [...assessment.supportingEvidenceRefs, ...assessment.opposingEvidenceRefs],
      caveats: assessment.caveats,
      ruleVersion: BAZI_INTERPRETATION_VERSION,
    });
  }
  return {
    interpretationVersion: BAZI_INTERPRETATION_VERSION,
    results: filteredResults,
    structureTags,
  };
}
