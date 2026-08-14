import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateBaziView } from '../src/services/chart-engine.ts';

const fixture = {
  id: 'p2-b-lunar',
  name: 'P2-B 样例',
  relationship: '本人',
  birthDate: '2024-01-01',
  birthTime: '12:00',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'lunar',
  isLeapMonth: false,
  gender: 'female',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

test('P2-B evidence graph separates element facts, month command, roots and exposures', () => {
  const result = calculateBaziView(fixture, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  const graph = result.evidenceGraph;
  assert.equal(graph.evidenceVersion, 'bazi-evidence-v1');
  assert.equal(graph.source.modelVersion, 'bazi-normalized-v1');
  assert.equal(graph.relationEdges.length, result.normalizedChart.relations.length);

  const types = new Set(graph.nodes.map((node) => node.type));
  assert.equal(types.has('element.stem'), true);
  assert.equal(types.has('element.branch-native'), true);
  assert.equal(types.has('element.hidden-stem'), true);
  assert.equal(types.has('season.month-command'), true);
  assert.equal(types.has('exposure.stem'), true);
  assert.equal(types.has('root.day-master'), true);

  const season = graph.nodes.find((node) => node.type === 'season.month-command');
  assert.equal(season?.facts.isMonthCommand, true);
  assert.equal(season?.facts.weight, 'major');
  assert.equal(season?.facts.monthBranch, result.normalizedChart.monthBranch.value);

  const root = graph.nodes.find((node) => node.type === 'root.day-master' && node.facts.rootLevel === 'major');
  assert.equal(root?.facts.rootLevel, 'major');
  assert.equal(root?.subjectRefs.includes(result.normalizedChart.dayMaster.id), true);
});

test('P2-B element nodes retain source layer and hidden-stem order', () => {
  const result = calculateBaziView({ ...fixture, calendar: 'solar', birthDate: '2024-02-10' }, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  const hiddenNodes = result.evidenceGraph.nodes.filter((node) => node.type === 'element.hidden-stem');
  assert.equal(hiddenNodes.every((node) => node.facts.layer === 'hidden-stem'), true);
  assert.equal(hiddenNodes.every((node) => typeof node.facts.order === 'number'), true);
  assert.equal(hiddenNodes.some((node) => node.facts.qiType === '本气'), true);
});
