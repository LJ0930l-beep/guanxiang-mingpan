import type { NormalizedBaziChart } from '@/domains/bazi/model/normalized-chart';
import { buildElementEvidenceNodes } from '@/domains/bazi/evidence/element-evidence';
import type { BaziEvidenceGraph } from '@/domains/bazi/evidence/evidence-types';
import { BAZI_EVIDENCE_RULE_VERSION } from '@/domains/bazi/evidence/evidence-types';
import { buildRootEvidenceNodes } from '@/domains/bazi/evidence/root-evidence';
import { buildSeasonEvidenceNodes } from '@/domains/bazi/evidence/season-evidence';

export type { BaziEvidenceGraph, EvidenceNode, EvidenceSource, EvidenceWeight } from '@/domains/bazi/evidence/evidence-types';

export function buildBaziEvidenceGraph(
  chart: NormalizedBaziChart,
  source: { engineVersion: string },
): BaziEvidenceGraph {
  return {
    evidenceVersion: BAZI_EVIDENCE_RULE_VERSION,
    source: {
      modelVersion: chart.modelVersion,
      engineVersion: source.engineVersion,
    },
    nodes: [
      ...buildElementEvidenceNodes(chart),
      ...buildSeasonEvidenceNodes(chart),
      ...buildRootEvidenceNodes(chart),
    ],
    relationEdges: [],
  };
}
