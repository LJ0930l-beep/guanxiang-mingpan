import type { NormalizedZiweiChart } from '@/domains/ziwei/model/normalized-chart';
import { ZIWEI_EVIDENCE_RULE_VERSION, type ZiweiEvidenceGraph, type ZiweiEvidenceNode } from '@/domains/ziwei/evidence/evidence-types';

export type { ZiweiEvidenceGraph, ZiweiEvidenceNode, ZiweiEvidenceSource } from '@/domains/ziwei/evidence/evidence-types';

/** Build traceable facts from the normalized chart; no user-facing conclusions are produced here. */
export function buildZiweiEvidenceGraph(
  chart: NormalizedZiweiChart,
  source: { engineVersion: string },
): ZiweiEvidenceGraph {
  const palaceNodes: ZiweiEvidenceNode[] = chart.palaces.map((palace) => ({
    id: `${palace.id}:position`,
    type: 'palace.position',
    subjectRefs: [palace.id],
    label: `${palace.name}落${palace.stemBranch}`,
    facts: {
      index: palace.index,
      name: palace.name,
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      isBodyPalace: palace.isBodyPalace,
      isOriginalPalace: palace.isOriginalPalace,
      decadalRange: palace.decadalRange,
    },
    weight: palace.name === '命宫' || palace.isBodyPalace ? 'major' : 'medium',
    ruleVersion: ZIWEI_EVIDENCE_RULE_VERSION,
    source: 'chart',
  }));
  const starNodes: ZiweiEvidenceNode[] = chart.stars.map((star) => ({
    id: `${star.id}:placement`,
    type: 'star.placement',
    subjectRefs: [star.id, star.palaceRefId],
    label: `${star.name}在宫位`,
    facts: {
      name: star.name,
      type: star.type,
      scope: star.scope,
      brightness: star.brightness,
      mutagen: star.mutagen,
      order: star.order,
    },
    weight: star.type === 'major' ? 'major' : 'minor',
    ruleVersion: ZIWEI_EVIDENCE_RULE_VERSION,
    source: 'chart',
  }));
  const mutagenNodes: ZiweiEvidenceNode[] = chart.mutagenEdges.map((edge) => ({
    id: `${edge.id}:evidence`,
    type: 'mutagen.edge',
    subjectRefs: [edge.starRefId, edge.palaceRefId],
    label: `${edge.starName}化${edge.mutagen}`,
    facts: { starName: edge.starName, mutagen: edge.mutagen },
    weight: 'medium',
    ruleVersion: ZIWEI_EVIDENCE_RULE_VERSION,
    source: 'chart',
  }));
  const relationNodes: ZiweiEvidenceNode[] = [];
  if (chart.lifePalaceRefId || chart.bodyPalaceRefId) {
    relationNodes.push({
      id: 'ziwei:relation:life-body',
      type: 'life-body.relation',
      subjectRefs: [chart.lifePalaceRefId, chart.bodyPalaceRefId].filter((value): value is string => Boolean(value)),
      label: '命宫与身宫位置',
      facts: {
        lifePalaceRefId: chart.lifePalaceRefId,
        bodyPalaceRefId: chart.bodyPalaceRefId,
        soul: chart.soul,
        body: chart.body,
      },
      weight: 'major',
      ruleVersion: ZIWEI_EVIDENCE_RULE_VERSION,
      source: 'derived-rule',
    });
  }
  return {
    evidenceVersion: ZIWEI_EVIDENCE_RULE_VERSION,
    source: { modelVersion: chart.modelVersion, engineVersion: source.engineVersion },
    nodes: [...palaceNodes, ...starNodes, ...mutagenNodes, ...relationNodes],
  };
}
