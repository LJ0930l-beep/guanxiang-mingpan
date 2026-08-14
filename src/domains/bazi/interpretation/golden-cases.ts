export type BaziInterpretationCaseType = 'golden-interpretation' | 'regression-only';

export interface BaziInterpretationGoldenCase {
  id: string;
  caseType: BaziInterpretationCaseType;
  birthDate: string;
  expectedStatus?: 'strong' | 'weak' | 'balanced' | 'uncertain';
  expectedConfidence?: 'high' | 'medium' | 'low';
  expectedRelationTypes?: string[];
}

/**
 * Stable fixtures for the explanation layer. Calculation Golden Cases live in
 * the Phase 1 suite; these cases assert that known evidence combinations remain
 * explainable after rule refactors.
 */
export const BAZI_INTERPRETATION_GOLDEN_CASES: readonly BaziInterpretationGoldenCase[] = [
  {
    id: 'interpretation-strong-rooted',
    caseType: 'golden-interpretation',
    birthDate: '1980-01-16',
    expectedStatus: 'strong',
    expectedConfidence: 'high',
  },
  {
    id: 'interpretation-weak-pressured',
    caseType: 'golden-interpretation',
    birthDate: '1980-05-11',
    expectedStatus: 'weak',
    expectedConfidence: 'high',
  },
  {
    id: 'interpretation-balanced-conflict',
    caseType: 'golden-interpretation',
    birthDate: '1980-01-01',
    expectedStatus: 'balanced',
    expectedConfidence: 'medium',
  },
  {
    id: 'interpretation-uncertain-sensitive',
    caseType: 'golden-interpretation',
    birthDate: '1980-01-06',
    expectedStatus: 'uncertain',
    expectedConfidence: 'low',
  },
  {
    id: 'interpretation-relations-half-combine-harm',
    caseType: 'regression-only',
    birthDate: '2001-09-08',
    expectedRelationTypes: ['half-combine', 'harm'],
  },
];
