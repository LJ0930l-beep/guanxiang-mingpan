import type { NormalizedBaziChart, RelationEdge } from '@/domains/bazi/model/normalized-chart';

export const BAZI_EVIDENCE_RULE_VERSION = 'bazi-evidence-v1' as const;

export type EvidenceSource = 'chart' | 'derived-rule';
export type EvidenceWeight = 'major' | 'medium' | 'minor';

export type StrengthStatus = 'strong' | 'weak' | 'balanced' | 'uncertain';
export type StrengthConfidence = 'high' | 'medium' | 'low';

export interface StrengthDecisionStep {
  id: string;
  label: string;
  outcome: 'support' | 'opposing' | 'neutral' | 'conflict' | 'context';
  evidenceRefs: string[];
  rationale: string;
}

export interface StrengthAssessment {
  status: StrengthStatus;
  confidence: StrengthConfidence;
  supportingEvidenceRefs: string[];
  opposingEvidenceRefs: string[];
  decisiveEvidenceRefs: string[];
  caveats: string[];
  decisionPath: StrengthDecisionStep[];
  ruleVersion: string;
}

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
  strengthAssessment?: StrengthAssessment;
}
