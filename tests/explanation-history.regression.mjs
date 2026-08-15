import assert from 'node:assert/strict';
import test from 'node:test';

import { diffExplanationSnapshots } from '../src/domains/explanation/history.ts';
import { calculateBaziView } from '../src/services/chart-engine.ts';

const profile = {
  id: 'p4-h-history',
  name: 'P4-H 历史样例',
  relationship: '本人',
  birthDate: '1988-09-17',
  birthTime: '06:20',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'female',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

test('P4-H 解释历史 Diff 只比较已保存快照，不触发重新计算', () => {
  const payload = calculateBaziView(profile, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  assert.ok(payload.explanation);
  const oldSnapshot = payload.explanation;
  const newSnapshot = {
    ...oldSnapshot,
    explanationVersion: 'bazi-explanation-v2',
    blocks: oldSnapshot.blocks.map((block, index) => index === 0
      ? { ...block, summary: `${block.summary}（修订）`, evidenceRefs: block.evidenceRefs.slice(0, -1) }
      : block),
  };
  const diff = diffExplanationSnapshots(oldSnapshot, newSnapshot);
  assert.equal(diff.versionChanged, true);
  assert.equal(diff.hasChanges, true);
  assert.equal(diff.changedBlocks.some((block) => block.id === oldSnapshot.blocks[0].id && block.summaryChanged), true);
  assert.equal(diff.changedBlocks.some((block) => block.evidenceRemoved.length > 0), true);
  const noChange = diffExplanationSnapshots(oldSnapshot, oldSnapshot);
  assert.equal(noChange.hasChanges, false);
  assert.deepEqual(noChange.changedBlocks, []);
});
