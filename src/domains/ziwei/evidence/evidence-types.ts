import type { NormalizedZiweiChart } from '@/domains/ziwei/model/normalized-chart';

export const ZIWEI_EVIDENCE_RULE_VERSION = 'ziwei-evidence-v1' as const;

export type ZiweiEvidenceSource = 'chart' | 'derived-rule';

export interface ZiweiEvidenceNode {
  id: string;
  type: string;
  subjectRefs: string[];
  label: string;
  facts: Record<string, unknown>;
  weight?: 'major' | 'medium' | 'minor';
  ruleVersion: string;
  source: ZiweiEvidenceSource;
}

export interface ZiweiEvidenceGraph {
  evidenceVersion: typeof ZIWEI_EVIDENCE_RULE_VERSION;
  source: {
    modelVersion: NormalizedZiweiChart['modelVersion'];
    engineVersion: string;
  };
  nodes: ZiweiEvidenceNode[];
}
