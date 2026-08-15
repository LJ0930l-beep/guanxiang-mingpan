import type { NormalizedLiuyaoChart } from '@/domains/liuyao/model/normalized-chart';

export const LIUYAO_EVIDENCE_RULE_VERSION = 'liuyao-evidence-v1' as const;

export interface LiuyaoEvidenceNode {
  id: string;
  type: string;
  subjectRefs: string[];
  label: string;
  facts: Record<string, unknown>;
  weight?: 'major' | 'medium' | 'minor';
  ruleVersion: string;
  source: 'chart' | 'derived-rule';
}

export interface LiuyaoEvidenceGraph {
  evidenceVersion: typeof LIUYAO_EVIDENCE_RULE_VERSION;
  source: {
    modelVersion: NormalizedLiuyaoChart['modelVersion'];
    engineVersion: string;
  };
  nodes: LiuyaoEvidenceNode[];
}
