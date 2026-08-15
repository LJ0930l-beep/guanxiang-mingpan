import assert from 'node:assert/strict';
import test from 'node:test';

import { getGlossaryTerm } from '../src/domains/explanation/glossary.ts';
import { ZIWEI_EXPLANATION_VERSION } from '../src/domains/ziwei/explanation/index.ts';
import { calculateZiweiView } from '../src/services/chart-engine.ts';

const fixture = {
  id: 'p4-d-ziwei',
  name: 'P4-D 紫微样例',
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

test('P4-D 紫微 Explanation V1 只引用标准化证据', () => {
  const result = calculateZiweiView(fixture, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  const snapshot = result.explanation;
  assert.ok(snapshot);
  assert.equal(snapshot.explanationVersion, ZIWEI_EXPLANATION_VERSION);
  assert.deepEqual(snapshot.blocks.map((block) => block.category), ['overview', 'life-palace', 'body-palace', 'mutagens', 'focus-palaces', 'summary']);
  const evidenceIds = new Set(result.evidenceGraph.nodes.map((node) => node.id));
  for (const block of snapshot.blocks) {
    assert.ok(block.summary.length >= 20 && block.summary.length <= 80, `${block.category} summary length`);
    assert.ok(block.paragraphs.length >= 2 && block.paragraphs.length <= 4, `${block.category} paragraph count`);
    assert.ok(block.evidenceRefs.length >= 2 && block.evidenceRefs.length <= 5, `${block.category} evidence count`);
    assert.equal(block.evidenceRefs.every((ref) => evidenceIds.has(ref)), true);
    assert.equal(block.glossaryRefs.every((ref) => Boolean(getGlossaryTerm(ref))), true);
    assert.equal(block.paragraphs.join(' ').match(/一定|必然|注定|必有|疾病|死亡|投资收益|成功|失败/) ?? null, null);
  }
});

test('P4-D 四化缺失时明确标记低置信度而不补造事实', () => {
  const result = calculateZiweiView(fixture, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  const altered = { ...result, normalizedChart: { ...result.normalizedChart, mutagenEdges: [] }, evidenceGraph: { ...result.evidenceGraph, nodes: result.evidenceGraph.nodes.filter((node) => node.type !== 'mutagen.edge') } };
  // The builder is pure and can be tested against a chart with no mutagen nodes.
  return import('../src/domains/ziwei/explanation/index.ts').then(({ buildZiweiExplanation }) => {
    const snapshot = buildZiweiExplanation({ chart: altered.normalizedChart, evidenceGraph: altered.evidenceGraph, generatedAt: result.generatedAt });
    const block = snapshot.blocks.find((item) => item.category === 'mutagens');
    assert.equal(block?.confidence, 'low');
    assert.equal(block?.caveats.some((caveat) => caveat.includes('没有返回四化')), true);
  });
});
