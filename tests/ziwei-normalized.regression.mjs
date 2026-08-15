import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateZiweiView } from '../src/services/chart-engine.ts';

const fixture = {
  id: 'p4-c-ziwei',
  name: 'P4-C 紫微样例',
  relationship: '本人',
  birthDate: '2001-09-08',
  birthTime: '20:30',
  birthCity: '广东省深圳市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 22.5431,
  longitude: 114.0579,
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

test('P4-C 紫微标准模型与证据图具有稳定 ID 和完整引用', () => {
  const result = calculateZiweiView(fixture, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  const chart = result.normalizedChart;
  const graph = result.evidenceGraph;

  assert.equal(chart.modelVersion, 'ziwei-normalized-v1');
  assert.equal(chart.source.engineVersion, result.engineVersion);
  assert.equal(chart.palaces.length, 12);
  assert.equal(chart.palaces[0].id, 'ziwei:palace:0:寅');
  assert.equal(chart.palaces.every((palace) => palace.id.startsWith('ziwei:palace:')), true);
  assert.equal(chart.stars.every((star) => star.id.includes(':star:')), true);
  assert.equal(chart.lifePalaceRefId, chart.palaces.find((palace) => palace.name === '命宫')?.id);
  assert.equal(chart.bodyPalaceRefId, chart.palaces.find((palace) => palace.isBodyPalace)?.id);
  assert.equal(graph.evidenceVersion, 'ziwei-evidence-v1');
  assert.equal(graph.source.modelVersion, chart.modelVersion);
  const ids = new Set(graph.nodes.map((node) => node.id));
  assert.equal(ids.size, graph.nodes.length);
  assert.equal(graph.nodes.some((node) => node.type === 'palace.position'), true);
  assert.equal(graph.nodes.some((node) => node.type === 'star.placement'), true);
  assert.equal(graph.nodes.some((node) => node.type === 'mutagen.edge'), true);
  assert.equal(graph.nodes.some((node) => node.type === 'life-body.relation'), true);
  assert.equal(graph.nodes.every((node) => node.subjectRefs.every((ref) => ref.startsWith('ziwei:'))), true);
});

test('P4-C 紫微标准模型不依赖 UI 拼接文本来保存星曜引用', () => {
  const result = calculateZiweiView(fixture, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  const palace = result.palaces.find((item) => item.name === '命宫');
  const normalized = result.normalizedChart.palaces.find((item) => item.name === '命宫');
  assert.ok(palace && normalized);
  assert.notEqual(normalized.id, palace.name);
  assert.equal(normalized.majorStarRefs.length, palace.stars.length);
  assert.equal(normalized.majorStarRefs.every((ref) => result.normalizedChart.stars.some((star) => star.id === ref)), true);
});
