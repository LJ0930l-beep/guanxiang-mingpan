import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateBaziView } from '../src/services/chart-engine.ts';
import {
  createBaziHistorySnapshot,
  diffBaziInterpretations,
} from '../src/domains/bazi/interpretation/history.ts';
import { BAZI_INTERPRETATION_GOLDEN_CASES } from '../src/domains/bazi/interpretation/golden-cases.ts';

const base = {
  id: 'p2-f',
  name: 'P2-F 样例',
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

function result(birthDate) {
  return calculateBaziView({ ...base, birthDate }, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
}

test('P2-F 保存完整的归一化盘、证据图和解释快照', () => {
  const chart = result('1980-01-01');
  const snapshot = createBaziHistorySnapshot(chart);

  assert.ok(snapshot);
  assert.equal(snapshot.normalizedChart.modelVersion, 'bazi-normalized-v1');
  assert.equal(snapshot.evidenceGraph.evidenceVersion, 'bazi-evidence-v1');
  assert.equal(snapshot.interpretation.interpretationVersion, 'bazi-rules-v2');
  assert.strictEqual(snapshot.normalizedChart, chart.normalizedChart);
  assert.strictEqual(snapshot.evidenceGraph, chart.evidenceGraph);
  assert.strictEqual(snapshot.interpretation, chart.interpretation);
});

test('P2-F Diff 只比较用户主动提供的新旧解释，不会触发计算', () => {
  const oldInterpretation = result('1980-01-01').interpretation;
  const newInterpretation = {
    ...oldInterpretation,
    interpretationVersion: 'bazi-rules-v3',
    results: oldInterpretation.results.map((item) => item.id === 'interpretation:strength'
      ? {
          ...item,
          conclusion: `${item.conclusion}（新规则复核）`,
          confidence: 'low',
          evidenceRefs: [...item.evidenceRefs, 'evidence:new-rule'],
          counterEvidenceRefs: item.counterEvidenceRefs.slice(1),
        }
      : item),
  };
  const diff = diffBaziInterpretations(oldInterpretation, newInterpretation, { status: 'balanced', confidence: 'medium' }, { status: 'strong', confidence: 'low' });

  assert.equal(diff.ruleVersionChanged, true);
  assert.equal(diff.changedConclusions.some((item) => item.resultId === 'interpretation:strength'), true);
  assert.deepEqual(diff.addedEvidenceRefs, ['evidence:new-rule']);
  assert.equal(diff.removedCounterEvidenceRefs.length, 1);
  assert.equal(diff.strengthChanged, true);
});

test('P2-F Interpretation Golden 覆盖四类强弱和关系回归，并断言证据引用', () => {
  for (const fixture of BAZI_INTERPRETATION_GOLDEN_CASES) {
    const chart = result(fixture.birthDate);
    const strengthResult = chart.interpretation.results.find((item) => item.category === 'strength');
    assert.ok(strengthResult, fixture.id);
    assert.equal(strengthResult.evidenceRefs.length + strengthResult.counterEvidenceRefs.length > 0, true, fixture.id);
    if (fixture.expectedStatus) assert.equal(chart.strengthAssessment.status, fixture.expectedStatus, fixture.id);
    if (fixture.expectedConfidence) assert.equal(chart.strengthAssessment.confidence, fixture.expectedConfidence, fixture.id);
    if (fixture.expectedRelationTypes) {
      const relationTypes = new Set(chart.normalizedChart.relations.map((relation) => relation.type));
      for (const relationType of fixture.expectedRelationTypes) assert.equal(relationTypes.has(relationType), true, `${fixture.id}:${relationType}`);
      const relationResult = chart.interpretation.results.find((item) => item.category === 'relation');
      assert.ok(relationResult);
      assert.equal(relationResult.evidenceRefs.length > 0, true, fixture.id);
    }
  }
});
