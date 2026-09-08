import type { ExplanationBlock } from '@/domains/explanation/types';
import type { ChartPayload } from '@/types/charts';
import type { ReadingFeedback, SavedReading } from '@/types/domain';

export interface FeedbackEvidenceOption {
  id: string;
  label: string;
}

export interface FeedbackInterpretationOption {
  id: string;
  title: string;
  summary: string;
  evidence: FeedbackEvidenceOption[];
}

export interface FeedbackLinkSelection {
  interpretationId?: string;
  evidenceIds: string[];
  unresolvedInterpretationIds: string[];
  unresolvedEvidenceIds: string[];
}

function explanationBlocks(reading: SavedReading): ExplanationBlock[] {
  return reading.explanationSnapshot?.blocks ?? [];
}

function evidenceLabelMap(payload: ChartPayload): Map<string, string> {
  const graph = (payload as ChartPayload & { evidenceGraph?: { nodes?: { id?: unknown; label?: unknown }[] } }).evidenceGraph;
  const nodes = (Array.isArray(graph?.nodes) ? graph.nodes : []) as { id?: unknown; label?: unknown }[];
  return new Map(nodes.flatMap((node) => typeof node.id === 'string'
    ? [[node.id, typeof node.label === 'string' ? node.label : node.id] as const]
    : []));
}

/** Only expose evidence that the selected explanation block itself cites. */
export function listFeedbackLinkOptions(reading: SavedReading): FeedbackInterpretationOption[] {
  const labels = evidenceLabelMap(reading.payload);
  return explanationBlocks(reading).map((block) => ({
    id: block.id,
    title: block.title,
    summary: block.summary,
    evidence: block.evidenceRefs
      .filter((id) => labels.has(id))
      .map((id) => ({ id, label: labels.get(id) ?? id })),
  }));
}

export function resolveFeedbackLinkSelection(reading: SavedReading, feedback: ReadingFeedback): FeedbackLinkSelection {
  const options = listFeedbackLinkOptions(reading);
  const interpretationIds = new Set(options.map((option) => option.id));
  const rawInterpretations = feedback.linkedInterpretationIds ?? [];
  const interpretationId = rawInterpretations.find((id) => interpretationIds.has(id));
  const unresolvedInterpretationIds = rawInterpretations.filter((id) => !interpretationIds.has(id));
  const allowedEvidence = new Set(options.find((option) => option.id === interpretationId)?.evidence.map((item) => item.id) ?? []);
  const rawEvidence = feedback.linkedEvidenceIds ?? [];
  return {
    ...(interpretationId ? { interpretationId } : {}),
    evidenceIds: rawEvidence.filter((id) => allowedEvidence.has(id)),
    unresolvedInterpretationIds,
    unresolvedEvidenceIds: rawEvidence.filter((id) => !allowedEvidence.has(id)),
  };
}

/** Serialize only semantically related selected links, while preserving unknown legacy IDs until detach. */
export function serializeFeedbackLinkSelection(selection: FeedbackLinkSelection): Pick<ReadingFeedback, 'linkedInterpretationIds' | 'linkedEvidenceIds'> {
  const interpretationIds = [
    ...(selection.interpretationId ? [selection.interpretationId] : []),
    ...selection.unresolvedInterpretationIds,
  ];
  const evidenceIds = [...selection.evidenceIds, ...selection.unresolvedEvidenceIds];
  return {
    ...(interpretationIds.length ? { linkedInterpretationIds: [...new Set(interpretationIds)] } : {}),
    ...(evidenceIds.length ? { linkedEvidenceIds: [...new Set(evidenceIds)] } : {}),
  };
}

export function feedbackLinkSummary(reading: SavedReading, feedback: ReadingFeedback): string[] {
  const options = listFeedbackLinkOptions(reading);
  const selection = resolveFeedbackLinkSelection(reading, feedback);
  const selected = options.find((option) => option.id === selection.interpretationId);
  const rows: string[] = [];
  if (selected) rows.push(`解读：${selected.title}`);
  if (selection.evidenceIds.length) {
    const labels = new Map(selected?.evidence.map((item) => [item.id, item.label]) ?? []);
    rows.push(`依据：${selection.evidenceIds.map((id) => labels.get(id) ?? '已保存依据').join('、')}`);
  }
  if (selection.unresolvedInterpretationIds.length || selection.unresolvedEvidenceIds.length) {
    rows.push('部分历史关联来自旧版本，当前无法解析；原始关联仍被保留。');
  }
  return rows.length ? rows : ['未关联解读或依据'];
}
