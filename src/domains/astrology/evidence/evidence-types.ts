import type { NormalizedAstrologyChart } from '@/domains/astrology/model/normalized-chart';

export const ASTROLOGY_EVIDENCE_RULE_VERSION = 'astrology-evidence-v1' as const;

export interface AstrologyEvidenceNode {
  id: string;
  type: string;
  subjectRefs: string[];
  label: string;
  facts: Record<string, unknown>;
  weight?: 'major' | 'medium' | 'minor';
  ruleVersion: string;
  source: 'chart' | 'derived-rule';
}

export interface AstrologyEvidenceGraph {
  evidenceVersion: typeof ASTROLOGY_EVIDENCE_RULE_VERSION;
  source: {
    modelVersion: NormalizedAstrologyChart['modelVersion'];
    engineVersion: string;
  };
  nodes: AstrologyEvidenceNode[];
}
