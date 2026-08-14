import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateBaziView } from '../src/services/chart-engine.ts';

const base = {
  id: 'p2-c',
  name: 'P2-C 样例',
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

test('P2-C relation graph carries typed edges and relation evidence refs', () => {
  const chart = result('2001-09-08');
  assert.equal(chart.evidenceGraph.relationEdges.length > 0, true);
  assert.equal(chart.evidenceGraph.relationEdges.every((edge) => edge.ruleVersion === 'bazi-relations-v1'), true);
  const relationNodes = chart.evidenceGraph.nodes.filter((node) => node.type === 'relation.edge');
  assert.equal(relationNodes.length, chart.evidenceGraph.relationEdges.length);
  assert.equal(relationNodes.every((node) => node.subjectRefs.length >= 2), true);
  assert.equal(chart.strengthAssessment.decisiveEvidenceRefs.every((id) =>
    chart.strengthAssessment.supportingEvidenceRefs.includes(id)
    || chart.strengthAssessment.opposingEvidenceRefs.includes(id)), true);
});

test('P2-C four strength classes remain explainable and do not collapse into a score', () => {
  const cases = [
    ['1980-01-16', 'strong'],
    ['1980-05-11', 'weak'],
    ['1980-01-01', 'balanced'],
    ['1980-01-06', 'uncertain'],
  ];
  for (const [birthDate, expectedStatus] of cases) {
    const assessment = result(birthDate).strengthAssessment;
    assert.equal(assessment.status, expectedStatus, birthDate);
    assert.equal(['high', 'medium', 'low'].includes(assessment.confidence), true, birthDate);
    assert.deepEqual(assessment.decisionPath.map((step) => step.id), [
      'strength:season',
      'strength:root',
      'strength:support',
      'strength:control-drain',
      'strength:relations',
    ], birthDate);
    assert.equal(assessment.ruleVersion, 'bazi-strength-v1', birthDate);
    assert.equal(assessment.decisionPath.every((step) => Array.isArray(step.evidenceRefs)), true, birthDate);
  }
});
