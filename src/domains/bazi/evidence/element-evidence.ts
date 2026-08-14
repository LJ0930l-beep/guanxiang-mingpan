import type { NormalizedBaziChart } from '@/domains/bazi/model/normalized-chart';
import type { EvidenceNode } from '@/domains/bazi/evidence/evidence-types';

const ELEMENT_LABELS = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水', unknown: '未知',
} as const;

const QI_WEIGHT = {
  本气: 'major',
  中气: 'medium',
  余气: 'minor',
} as const;

export function buildElementEvidenceNodes(chart: NormalizedBaziChart): EvidenceNode[] {
  const stemNodes = chart.stems.map((stem) => ({
    id: `evidence:element:stem:${stem.id}`,
    type: 'element.stem',
    subjectRefs: [stem.id],
    label: `${stem.pillarKey}干 ${stem.value} · ${ELEMENT_LABELS[stem.element]}`,
    facts: {
      layer: 'stem',
      position: stem.pillarKey,
      stem: stem.value,
      element: stem.element,
      polarity: stem.polarity,
      tenGod: stem.tenGod,
      exposure: true,
    },
    weight: 'major' as const,
    ruleVersion: 'bazi-element-v1',
    source: 'chart' as const,
  }));
  const branchNodes = chart.branches.map((branch) => ({
    id: `evidence:element:branch:${branch.id}`,
    type: 'element.branch-native',
    subjectRefs: [branch.id],
    label: `${branch.pillarKey}支 ${branch.value}本气 · ${ELEMENT_LABELS[branch.element]}`,
    facts: {
      layer: 'branch-native',
      position: branch.pillarKey,
      branch: branch.value,
      element: branch.element,
      qiType: '本气',
      isMonthCommand: branch.pillarKey === 'month',
    },
    weight: 'major' as const,
    ruleVersion: 'bazi-element-v1',
    source: 'chart' as const,
  }));
  const hiddenNodes = chart.hiddenStems.map((hidden) => ({
    id: `evidence:element:hidden:${hidden.id}`,
    type: 'element.hidden-stem',
    subjectRefs: [hidden.id, hidden.branchRefId],
    label: `${hidden.pillarKey}支藏 ${hidden.value} · ${hidden.qiType}`,
    facts: {
      layer: 'hidden-stem',
      position: hidden.pillarKey,
      stem: hidden.value,
      element: hidden.element,
      qiType: hidden.qiType,
      order: hidden.order,
      branchRefId: hidden.branchRefId,
    },
    weight: QI_WEIGHT[hidden.qiType as keyof typeof QI_WEIGHT] ?? 'minor',
    ruleVersion: 'bazi-element-v1',
    source: 'chart' as const,
  }));
  return [...stemNodes, ...branchNodes, ...hiddenNodes];
}
