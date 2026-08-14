import type { BaziEvidenceGraph, StrengthAssessment } from '@/domains/bazi/evidence/index';
import type { NormalizedBaziChart } from '@/domains/bazi/model/normalized-chart';
import type { BaziInterpretation, InterpretationResult } from '@/domains/bazi/interpretation/rules';
import type { ChartPayload } from '@/types/charts';

/**
 * The immutable deep-result part of a saved Bazi reading.
 *
 * These fields are copied from the calculation payload at save time. They are
 * deliberately not rebuilt when a history record is opened, so a later rule
 * version cannot silently rewrite an old conclusion.
 */
export interface BaziHistorySnapshot {
  normalizedChart: NormalizedBaziChart;
  evidenceGraph: BaziEvidenceGraph;
  interpretation: BaziInterpretation;
}

export function createBaziHistorySnapshot(payload: ChartPayload): BaziHistorySnapshot | null {
  if (payload.module !== 'bazi' || !payload.normalizedChart || !payload.evidenceGraph || !payload.interpretation) return null;
  return {
    normalizedChart: payload.normalizedChart,
    evidenceGraph: payload.evidenceGraph,
    interpretation: payload.interpretation,
  };
}

export interface InterpretationConclusionDiff {
  resultId: string;
  oldConclusion?: string;
  newConclusion?: string;
  oldConfidence?: InterpretationResult['confidence'];
  newConfidence?: InterpretationResult['confidence'];
}

export interface BaziInterpretationDiff {
  oldInterpretationVersion: string;
  newInterpretationVersion: string;
  ruleVersionChanged: boolean;
  changedConclusions: InterpretationConclusionDiff[];
  addedEvidenceRefs: string[];
  removedEvidenceRefs: string[];
  addedCounterEvidenceRefs: string[];
  removedCounterEvidenceRefs: string[];
  oldStrength?: Pick<StrengthAssessment, 'status' | 'confidence'>;
  newStrength?: Pick<StrengthAssessment, 'status' | 'confidence'>;
  strengthChanged: boolean;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function resultMap(interpretation: BaziInterpretation): Map<string, InterpretationResult> {
  return new Map(interpretation.results.map((result) => [result.id, result]));
}

function allEvidenceRefs(interpretation: BaziInterpretation): string[] {
  return interpretation.results.flatMap((result) => result.evidenceRefs);
}

function allCounterEvidenceRefs(interpretation: BaziInterpretation): string[] {
  return interpretation.results.flatMap((result) => result.counterEvidenceRefs);
}

function difference(next: string[], previous: string[]): string[] {
  const previousSet = new Set(previous);
  return sortedUnique(next.filter((ref) => !previousSet.has(ref)));
}

/**
 * Compare two explicitly requested interpretation runs. This function never
 * calculates a chart and is therefore safe to use for a user-triggered
 * "按当前规则复核" flow.
 */
export function diffBaziInterpretations(
  oldInterpretation: BaziInterpretation,
  newInterpretation: BaziInterpretation,
  oldStrength?: Pick<StrengthAssessment, 'status' | 'confidence'>,
  newStrength?: Pick<StrengthAssessment, 'status' | 'confidence'>,
): BaziInterpretationDiff {
  const oldResults = resultMap(oldInterpretation);
  const newResults = resultMap(newInterpretation);
  const resultIds = sortedUnique([...oldResults.keys(), ...newResults.keys()]);
  const changedConclusions = resultIds.flatMap((resultId) => {
    const oldResult = oldResults.get(resultId);
    const newResult = newResults.get(resultId);
    if (
      oldResult?.conclusion === newResult?.conclusion
      && oldResult?.confidence === newResult?.confidence
    ) return [];
    return [{
      resultId,
      ...(oldResult ? { oldConclusion: oldResult.conclusion, oldConfidence: oldResult.confidence } : {}),
      ...(newResult ? { newConclusion: newResult.conclusion, newConfidence: newResult.confidence } : {}),
    }];
  });

  const oldEvidence = allEvidenceRefs(oldInterpretation);
  const newEvidence = allEvidenceRefs(newInterpretation);
  const oldCounterEvidence = allCounterEvidenceRefs(oldInterpretation);
  const newCounterEvidence = allCounterEvidenceRefs(newInterpretation);
  const strengthChanged = oldStrength?.status !== newStrength?.status
    || oldStrength?.confidence !== newStrength?.confidence;

  return {
    oldInterpretationVersion: oldInterpretation.interpretationVersion,
    newInterpretationVersion: newInterpretation.interpretationVersion,
    ruleVersionChanged: oldInterpretation.interpretationVersion !== newInterpretation.interpretationVersion,
    changedConclusions,
    addedEvidenceRefs: difference(newEvidence, oldEvidence),
    removedEvidenceRefs: difference(oldEvidence, newEvidence),
    addedCounterEvidenceRefs: difference(newCounterEvidence, oldCounterEvidence),
    removedCounterEvidenceRefs: difference(oldCounterEvidence, newCounterEvidence),
    ...(oldStrength ? { oldStrength } : {}),
    ...(newStrength ? { newStrength } : {}),
    strengthChanged,
  };
}
