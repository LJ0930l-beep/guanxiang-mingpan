import type { NormalizedBaziChart, RelationEdge } from '@/domains/bazi/model/normalized-chart';

export const BAZI_EVIDENCE_RULE_VERSION = 'bazi-evidence-v1' as const;

export type EvidenceSource = 'chart' | 'derived-rule';
export type EvidenceWeight = 'major' | 'medium' | 'minor';

export interface EvidenceNode {
  id: string;
  type: string;
  subjectRefs: string[];
  label: string;
  facts: Record<string, unknown>;
  weight?: EvidenceWeight;
  ruleVersion: string;
  source: EvidenceSource;
}

export interface BaziEvidenceGraph {
  evidenceVersion: typeof BAZI_EVIDENCE_RULE_VERSION;
  source: {
    modelVersion: NormalizedBaziChart['modelVersion'];
    engineVersion: string;
  };
  nodes: EvidenceNode[];
  relationEdges: RelationEdge[];
}
