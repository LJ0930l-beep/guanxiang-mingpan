import assert from 'node:assert/strict';
import test from 'node:test';

import { getGlossaryTerm } from '../src/domains/explanation/glossary.ts';
import { BAZI_EXPLANATION_VERSION } from '../src/domains/bazi/explanation/index.ts';
import { BAZI_INTERPRETATION_GOLDEN_CASES } from '../src/domains/bazi/interpretation/golden-cases.ts';
import { calculateBaziView } from '../src/services/chart-engine.ts';

const base = {
  id: 'p4-b',
  name: 'P4-B 样例',
  relationship: '本人',
  birthTime: '12:00',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

test('P4-B 八字 Explanation V1 生成 8 类可追溯解释块', () => {
  const result = calculateBaziView({ ...base, birthDate: '1980-01-01' }, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  const snapshot = result.explanation;
  assert.ok(snapshot);
  assert.equal(snapshot.explanationVersion, BAZI_EXPLANATION_VERSION);
  assert.equal(snapshot.blocks.length, 8);
  assert.deepEqual(snapshot.blocks.map((block) => block.category), ['overview', 'strength', 'season', 'roots', 'elements', 'ten-gods', 'relations', 'summary']);

  const evidenceIds = new Set(result.evidenceGraph.nodes.map((node) => node.id));
  for (const block of snapshot.blocks) {
    assert.ok(block.summary.length >= 20 && block.summary.length <= 60, `${block.category} summary length`);
    assert.ok(block.paragraphs.length >= 2 && block.paragraphs.length <= 4, `${block.category} paragraph count`);
    assert.ok(block.evidenceRefs.length >= 2 && block.evidenceRefs.length <= 5, `${block.category} evidence count`);
    assert.equal(block.evidenceRefs.every((ref) => evidenceIds.has(ref)), true);
    assert.equal(block.counterEvidenceRefs.every((ref) => evidenceIds.has(ref)), true);
    assert.equal(block.glossaryRefs.every((ref) => Boolean(getGlossaryTerm(ref))), true);
    assert.equal(block.paragraphs.join(' ').match(/一定|必然|注定|必有|疾病|死亡|投资收益/) ?? null, null);
  }
});

test('P4-B 八字解释 Golden 覆盖强/弱/平衡/待定，并保留低置信边界', () => {
  for (const golden of BAZI_INTERPRETATION_GOLDEN_CASES.filter((item) => item.caseType === 'golden-interpretation')) {
    const result = calculateBaziView({ ...base, birthDate: golden.birthDate }, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
    assert.equal(result.strengthAssessment.status, golden.expectedStatus, golden.id);
    assert.equal(result.strengthAssessment.confidence, golden.expectedConfidence, golden.id);
    assert.equal(result.explanation?.blocks.length, 8, golden.id);
    if (golden.expectedConfidence === 'low') {
      assert.equal(result.explanation?.blocks.some((block) => block.caveats.some((caveat) => caveat.includes('置信度较低'))), true, golden.id);
    }
  }
});
