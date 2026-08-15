import assert from 'node:assert/strict';
import test from 'node:test';

import { getGlossaryTerm } from '../src/domains/explanation/glossary.ts';
import { ASTROLOGY_EXPLANATION_VERSION } from '../src/domains/astrology/explanation/index.ts';
import { calculateAstrologyView } from '../src/services/chart-engine.ts';

const exact = {
  id: 'p4-e-exact',
  name: 'P4-E 精确星盘',
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

const approximate = { ...exact, id: 'p4-e-approx', birthCity: '未知城市', latitude: undefined, longitude: undefined };

test('P4-E 精确星盘生成标准化点位、证据和解释', () => {
  const result = calculateAstrologyView(exact, { generatedAt: '2026-08-15T00:00:00.000Z' });
  assert.equal(result.calculationMode, 'exact');
  assert.equal(result.normalizedChart.modelVersion, 'astrology-normalized-v1');
  assert.equal(result.evidenceGraph.evidenceVersion, 'astrology-evidence-v1');
  assert.equal(result.normalizedChart.points.find((point) => point.key === 'sun')?.id, 'astrology:point:sun');
  assert.equal(result.evidenceGraph.nodes.some((node) => node.type === 'angle.position'), true);
  assert.equal(result.evidenceGraph.nodes.some((node) => node.type === 'house.placement'), true);
  assert.equal(result.evidenceGraph.nodes.some((node) => node.type === 'aspect.structure'), true);
  assert.equal(result.explanation?.explanationVersion, ASTROLOGY_EXPLANATION_VERSION);
  const ids = new Set(result.evidenceGraph.nodes.map((node) => node.id));
  for (const block of result.explanation?.blocks ?? []) {
    assert.ok(block.summary.length >= 20 && block.summary.length <= 90, block.category);
    assert.ok(block.paragraphs.length >= 2 && block.paragraphs.length <= 4, block.category);
    assert.ok(block.evidenceRefs.length >= 2 && block.evidenceRefs.length <= 5, block.category);
    assert.equal(block.evidenceRefs.every((ref) => ids.has(ref)), true);
    assert.equal(block.glossaryRefs.every((ref) => Boolean(getGlossaryTerm(ref))), true);
    assert.equal(block.paragraphs.join(' ').match(/一定|必然|注定|必有|疾病|死亡|投资收益|成功|失败/) ?? null, null);
  }
});

test('P4-E 近似星盘明确隐藏角点与宫位解释', () => {
  const result = calculateAstrologyView(approximate, { generatedAt: '2026-08-15T00:00:00.000Z' });
  assert.equal(result.calculationMode, 'approximate');
  assert.equal(result.ascendant, undefined);
  assert.equal(result.midheaven, undefined);
  assert.equal(result.normalizedChart.points.some((point) => point.kind === 'angle'), false);
  assert.equal(result.evidenceGraph.nodes.some((node) => node.type === 'angle.position'), false);
  assert.equal(result.evidenceGraph.nodes.some((node) => node.type === 'house.placement'), false);
  assert.equal(result.explanation?.blocks.find((block) => block.category === 'angles')?.confidence, 'low');
  assert.equal(result.explanation?.blocks.find((block) => block.category === 'houses')?.confidence, 'low');
  assert.equal(result.explanation?.blocks.find((block) => block.category === 'precision')?.caveats.some((item) => item.includes('近似')), true);
});
