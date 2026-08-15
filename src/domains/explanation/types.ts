import type { DivinationModule } from '@/types/domain';

export const EXPLANATION_SNAPSHOT_VERSION = 1 as const;
export const EXPLANATION_PROTOCOL_VERSION = 'explanation-protocol-v1' as const;
export const GLOSSARY_VERSION = 'glossary-v1' as const;

export type ExplanationConfidence = 'high' | 'medium' | 'low';

export interface ExplanationBlock {
  id: string;
  module: DivinationModule;
  category: string;
  title: string;
  summary: string;
  paragraphs: string[];
  evidenceRefs: string[];
  counterEvidenceRefs: string[];
  glossaryRefs: string[];
  confidence: ExplanationConfidence;
  caveats: string[];
  explanationVersion: string;
}

export interface ExplanationSnapshot {
  snapshotVersion: typeof EXPLANATION_SNAPSHOT_VERSION;
  explanationVersion: string;
  generatedAt: string;
  blocks: ExplanationBlock[];
  glossaryVersion: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  shortDefinition: string;
  detail?: string;
  module: DivinationModule | 'shared';
  caution?: string;
  version: string;
}
