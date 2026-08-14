import type { NormalizedBaziChart, BaziElement } from '@/domains/bazi/model/normalized-chart';
import type { EvidenceNode, StrengthAssessment, StrengthDecisionStep } from '@/domains/bazi/evidence/evidence-types';

export const BAZI_STRENGTH_RULE_VERSION = 'bazi-strength-v1' as const;

type Influence = 'support' | 'opposing' | 'neutral';

const GENERATES: Record<Exclude<BaziElement, 'unknown'>, Exclude<BaziElement, 'unknown'>> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};

const CONTROLS: Record<Exclude<BaziElement, 'unknown'>, Exclude<BaziElement, 'unknown'>> = {
  wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire',
};

function elementInfluence(element: BaziElement, dayMasterElement: BaziElement): Influence {
  if (element === 'unknown' || dayMasterElement === 'unknown') return 'neutral';
  if (element === dayMasterElement || GENERATES[element] === dayMasterElement) return 'support';
  if (CONTROLS[element] === dayMasterElement || GENERATES[dayMasterElement] === element || CONTROLS[dayMasterElement] === element) return 'opposing';
  return 'neutral';
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildStrengthAssessment(
  chart: NormalizedBaziChart,
  nodes: EvidenceNode[],
): StrengthAssessment {
  const season = nodes.find((node) => node.type === 'season.month-command');
  const roots = nodes.filter((node) => node.type === 'root.day-master');
  const exposures = nodes.filter((node) => node.type === 'exposure.stem');
  const relations = nodes.filter((node) => node.type === 'relation.edge');
  const seasonInfluence = season?.facts.influence;
  const seasonRole: Influence = seasonInfluence === 'support' || seasonInfluence === 'same'
    ? 'support'
    : seasonInfluence === 'pressure' || seasonInfluence === 'drain'
      ? 'opposing'
      : 'neutral';
  const supporting = [
    ...(seasonRole === 'support' && season ? [season.id] : []),
    ...roots.map((node) => node.id),
    ...exposures.filter((node) => node.facts.supportsDayMaster === true && node.facts.isDayMaster !== true).map((node) => node.id),
  ];
  const opposing = [
    ...(seasonRole === 'opposing' && season ? [season.id] : []),
    ...exposures
      .filter((node) => elementInfluence(node.facts.element as BaziElement, chart.dayMaster.element) === 'opposing')
      .map((node) => node.id),
  ];
  const hasMajorRoot = roots.some((node) => node.weight === 'major');
  const hasAnyRoot = roots.length > 0;
  const supportExposureRefs = exposures
    .filter((node) => node.facts.supportsDayMaster === true && node.facts.isDayMaster !== true)
    .map((node) => node.id);
  const opposingExposureRefs = exposures
    .filter((node) => elementInfluence(node.facts.element as BaziElement, chart.dayMaster.element) === 'opposing')
    .map((node) => node.id);
  const hasSupport = seasonRole === 'support' || hasAnyRoot || supportExposureRefs.length > 0;
  const hasOpposition = seasonRole === 'opposing' || opposingExposureRefs.length > 0;
  const conflict = hasSupport && hasOpposition;
  const decisionPath: StrengthDecisionStep[] = [
    {
      id: 'strength:season',
      label: '得令 / 月令',
      outcome: seasonRole,
      evidenceRefs: season ? [season.id] : [],
      rationale: seasonRole === 'support'
        ? '月令五行对日主形成同类或生扶关系。'
        : seasonRole === 'opposing'
          ? '月令五行对日主形成克制或消耗关系。'
          : '月令关系暂不形成直接支持或反对结论。',
    },
    {
      id: 'strength:root',
      label: '得地 / 根气',
      outcome: hasAnyRoot ? 'support' : 'neutral',
      evidenceRefs: roots.map((node) => node.id),
      rationale: hasMajorRoot
        ? '日主在地支藏干中找到本气根。'
        : hasAnyRoot
          ? '日主存在中气或余气根，但根气层级需要保留。'
          : '当前证据未找到与日主同元素的藏干根。',
    },
    {
      id: 'strength:support',
      label: '得助 / 透干',
      outcome: supportExposureRefs.length > 0 ? 'support' : 'neutral',
      evidenceRefs: supportExposureRefs,
      rationale: supportExposureRefs.length > 0 ? '天干透出同类或生扶日主的元素。' : '天干暂未形成明确同类或生扶透出。',
    },
    {
      id: 'strength:control-drain',
      label: '克泄耗',
      outcome: opposingExposureRefs.length > 0 ? 'opposing' : 'neutral',
      evidenceRefs: opposingExposureRefs,
      rationale: opposingExposureRefs.length > 0 ? '天干存在对日主形成克制或消耗的元素。' : '天干暂未形成明确克泄耗透出。',
    },
    {
      id: 'strength:relations',
      label: '关系修正',
      outcome: relations.length > 0 ? 'context' : 'neutral',
      evidenceRefs: relations.map((node) => node.id),
      rationale: relations.length > 0 ? '合冲刑害先作为可追踪的上下文证据，不单独决定强弱。' : '当前未发现已支持的柱间关系。',
    },
  ];
  let status: StrengthAssessment['status'] = 'uncertain';
  let confidence: StrengthAssessment['confidence'] = 'low';
  let decisive: string[] = [];
  if (hasSupport && !hasOpposition && seasonRole === 'support' && hasAnyRoot) {
    status = 'strong';
    confidence = hasMajorRoot ? 'high' : 'medium';
    decisive = unique([...(season ? [season.id] : []), ...roots.filter((node) => node.weight === 'major').map((node) => node.id)]);
  } else if (hasOpposition && !hasSupport && seasonRole === 'opposing' && !hasAnyRoot) {
    status = 'weak';
    confidence = opposingExposureRefs.length > 0 ? 'high' : 'medium';
    decisive = unique([...(season ? [season.id] : []), ...opposingExposureRefs]);
  } else if (conflict) {
    status = 'balanced';
    confidence = 'medium';
    decisive = unique([...(season ? [season.id] : []), ...roots.slice(0, 1).map((node) => node.id), ...opposingExposureRefs.slice(0, 1)]);
  }
  const caveats: string[] = [];
  if (!hasAnyRoot) caveats.push('尚未找到与日主同元素的藏干根证据。');
  if (conflict) caveats.push('盘面同时存在支持与反对证据，当前状态保留为平衡，不强行二分。');
  if (seasonRole === 'neutral') caveats.push('月令关系未形成直接支持或反对，结论置信度降低。');
  if (relations.length > 0) caveats.push('合冲刑害已进入关系图谱；本批次只记录修正入口，不单独宣告吉凶。');
  return {
    status,
    confidence,
    supportingEvidenceRefs: unique(supporting),
    opposingEvidenceRefs: unique(opposing),
    decisiveEvidenceRefs: decisive,
    caveats,
    decisionPath,
    ruleVersion: BAZI_STRENGTH_RULE_VERSION,
  };
}
