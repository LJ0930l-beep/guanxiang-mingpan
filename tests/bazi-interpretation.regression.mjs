import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateBaziView } from '../src/services/chart-engine.ts';

const base = {
  id: 'p2-d',
  name: 'P2-D 样例',
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

test('P2-D interpretation is versioned and every conclusion points to graph evidence', () => {
  const result = calculateBaziView({ ...base, birthDate: '1980-01-01' }, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  const interpretation = result.interpretation;
  const evidenceIds = new Set(result.evidenceGraph.nodes.map((node) => node.id));
  assert.equal(interpretation.interpretationVersion, 'bazi-rules-v2');
  assert.deepEqual(interpretation.results.map((item) => item.category), ['strength', 'element', 'relation']);
  assert.equal(interpretation.results.every((item) => item.ruleVersion === 'bazi-rules-v2'), true);
  assert.equal(interpretation.results.every((item) => item.evidenceRefs.every((id) => evidenceIds.has(id))), true);
  assert.equal(interpretation.results.every((item) => item.counterEvidenceRefs.every((id) => evidenceIds.has(id))), true);
});

test('P2-D uncertainty produces a visible structure tag instead of a forced label', () => {
  const result = calculateBaziView({ ...base, birthDate: '1980-01-06' }, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  assert.equal(result.strengthAssessment.status, 'uncertain');
  const tag = result.interpretation.structureTags.find((item) => item.code === 'evidence-sensitive');
  assert.equal(tag?.label, '证据不足或规则敏感');
  assert.equal(tag?.confidence, 'low');
});
