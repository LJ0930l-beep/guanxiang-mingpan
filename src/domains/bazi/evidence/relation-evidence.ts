import type { NormalizedBaziChart } from '@/domains/bazi/model/normalized-chart';
import type { EvidenceNode } from '@/domains/bazi/evidence/evidence-types';

export function buildRelationEvidenceNodes(chart: NormalizedBaziChart): EvidenceNode[] {
  return chart.relations.map((relation) => ({
    id: `evidence:relation:${relation.id}`,
    type: 'relation.edge',
    subjectRefs: relation.pillarRefs,
    label: relation.description,
    facts: {
      relationId: relation.id,
      relationType: relation.type,
      sourceRefs: relation.sourceRefs,
      targetRefs: relation.targetRefs,
      affectedElement: relation.affectedElement,
    },
    weight: 'medium' as const,
    ruleVersion: relation.ruleVersion,
    source: 'chart' as const,
  }));
}
