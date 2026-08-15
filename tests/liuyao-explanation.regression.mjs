import assert from 'node:assert/strict';
import test from 'node:test';

import { getGlossaryTerm } from '../src/domains/explanation/glossary.ts';
import { LIUYAO_EXPLANATION_VERSION } from '../src/domains/liuyao/explanation/index.ts';
import { calculateLiuyaoView } from '../src/services/chart-engine.ts';

const options = {
  seed: 'p4-g-fixed-seed',
  date: '2026-08-15T12:34:56',
  timezone: 'Asia/Shanghai',
  generatedAt: '2026-08-15T00:00:00.000Z',
};

test('P4-G 六爻解释覆盖问题、取用、世应、动变和时间边界', async () => {
  const result = await calculateLiuyaoView('这个版本的证据链是否清晰？', '官鬼', options);
  const snapshot = result.explanation;
  assert.ok(snapshot);
  assert.equal(snapshot.explanationVersion, LIUYAO_EXPLANATION_VERSION);
  assert.deepEqual(snapshot.blocks.map((block) => block.category), ['question-frame', 'yongshen', 'shi-ying', 'moving-lines', 'time-strength', 'changed-hexagram', 'summary']);
  const evidenceIds = new Set(result.evidenceGraph.nodes.map((node) => node.id));
  for (const block of snapshot.blocks) {
    assert.ok(block.summary.length >= 20 && block.summary.length <= 90, block.category);
    assert.ok(block.paragraphs.length >= 2 && block.paragraphs.length <= 4, block.category);
    assert.ok(block.evidenceRefs.length >= 2 && block.evidenceRefs.length <= 5, block.category);
    assert.equal(block.evidenceRefs.every((ref) => evidenceIds.has(ref)), true);
    assert.equal(block.glossaryRefs.every((ref) => Boolean(getGlossaryTerm(ref))), true);
    assert.equal(block.paragraphs.join(' ').match(/一定|必然|注定|必有|疾病|死亡|投资收益|成功|失败|何时|应期/) ?? null, null);
  }
});

test('P4-G 六爻解释不把空亡或动爻转换成时间承诺', async () => {
  const result = await calculateLiuyaoView('这个版本的证据链是否清晰？', '官鬼', options);
  const text = result.explanation?.blocks.flatMap((block) => [block.summary, ...block.paragraphs, ...block.caveats]).join(' ') ?? '';
  assert.equal(text.match(/何时|应期|一定成功|必然失败/) ?? null, null);
  assert.equal(result.explanation?.blocks.find((block) => block.category === 'time-strength')?.glossaryRefs.includes('glossary:liuyao:void'), true);
});
