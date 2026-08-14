import type { NormalizedBaziChart } from '@/domains/bazi/model/normalized-chart';
import type { EvidenceNode } from '@/domains/bazi/evidence/evidence-types';

const QI_WEIGHT = {
  本气: 'major',
  中气: 'medium',
  余气: 'minor',
} as const;

export function buildRootEvidenceNodes(chart: NormalizedBaziChart): EvidenceNode[] {
  const dayMasterElement = chart.dayMaster.element;
  const rootNodes = chart.hiddenStems
    .filter((hidden) => hidden.element === dayMasterElement)
    .map((hidden) => ({
      id: `evidence:root:${hidden.id}`,
      type: 'root.day-master',
      subjectRefs: [chart.dayMaster.id, hidden.id, hidden.branchRefId],
      label: `日主 ${chart.dayMaster.value} 在${hidden.pillarKey}支藏干 ${hidden.value} 有根`,
      facts: {
        dayMaster: chart.dayMaster.value,
        element: dayMasterElement,
        rootStem: hidden.value,
        rootPillar: hidden.pillarKey,
        qiType: hidden.qiType,
        rootLevel: QI_WEIGHT[hidden.qiType as keyof typeof QI_WEIGHT] ?? 'minor',
        order: hidden.order,
      },
      weight: QI_WEIGHT[hidden.qiType as keyof typeof QI_WEIGHT] ?? 'minor',
      ruleVersion: 'bazi-root-v1',
      source: 'derived-rule' as const,
    }));
  const exposureNodes = chart.stems.map((stem) => ({
    id: `evidence:exposure:stem:${stem.id}`,
    type: 'exposure.stem',
    subjectRefs: [stem.id],
    label: `${stem.pillarKey}干透出 ${stem.value}`,
    facts: {
      stem: stem.value,
      pillar: stem.pillarKey,
      element: stem.element,
      tenGod: stem.tenGod,
      supportsDayMaster: stem.element === dayMasterElement,
      isDayMaster: stem.pillarKey === 'day',
    },
    weight: stem.element === dayMasterElement ? 'major' as const : 'medium' as const,
    ruleVersion: 'bazi-exposure-v1',
    source: 'derived-rule' as const,
  }));
  return [...rootNodes, ...exposureNodes];
}
