import assert from 'node:assert/strict';
import test from 'node:test';

import { applyImportPlan, buildImportPreview, summarizeArchive } from '../src/storage/import-plan.ts';
import { transactionalReplace } from '../src/storage/transaction.ts';

function profile(id, name = id) {
  return {
    id,
    name,
    relationship: '本人',
    birthDate: '1990-01-01',
    birthCity: '北京',
    timeKnown: false,
    calendar: 'solar',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

function reading(id, profileId, summary, feedback = []) {
  return {
    id,
    profileId,
    profileName: profileId,
    module: 'bazi',
    title: id,
    summary,
    createdAt: '2026-08-01T00:00:00.000Z',
    engineVersion: 'engine@1',
    interpretationVersion: 'rules@1',
    snapshotMeta: { snapshotVersion: 1, calculationSettings: { timezone: 'Asia/Shanghai' }, inputSnapshot: { type: 'legacy', timezone: 'Asia/Shanghai', module: 'bazi', reason: 'fixture' } },
    inputSnapshot: { type: 'legacy', timezone: 'Asia/Shanghai', module: 'bazi', reason: 'fixture' },
    favorite: false,
    feedback,
    payload: { module: 'bazi' },
  };
}

function archiveData() {
  return {
    user: { id: 'user-1', displayName: '本机', provider: 'phone' },
    profiles: [profile('profile-1', '本机命主')],
    selectedProfileId: 'profile-1',
    readings: [reading('reading-1', 'profile-1', '本机版本', [{ id: 'feedback-1', status: 'confirmed', observedAt: '2026-08-01', note: '本机事实', createdAt: '2026-08-01T00:00:00.000Z' }])],
  };
}

test('P3-E 导入预览分类重复 ID，并确定 merge/replace 操作', () => {
  const current = archiveData();
  const incoming = {
    user: { id: 'user-2', displayName: '文件', provider: 'phone' },
    profiles: [profile('profile-1', '文件命主'), profile('profile-2', '新增命主')],
    selectedProfileId: 'profile-2',
    readings: [reading('reading-1', 'profile-1', '文件版本'), reading('reading-2', 'profile-2', '新增记录')],
  };
  assert.deepEqual(summarizeArchive(current), { profileCount: 1, readingCount: 1, feedbackCount: 1, favoriteCount: 0, baziDeepSnapshotCount: 0 });
  const mergePreview = buildImportPreview(current, incoming, 'merge');
  assert.equal(mergePreview.canApply, true);
  assert.deepEqual(mergePreview.conflicts.map((conflict) => [conflict.entity, conflict.id, conflict.kind, conflict.resolution]), [
    ['profile', 'profile-1', 'duplicate-different', 'keep-current'],
    ['reading', 'reading-1', 'duplicate-different', 'keep-current'],
  ]);
  assert.equal(mergePreview.operations.find((operation) => operation.id === 'profile-2').action, 'add');
  const merged = applyImportPlan(current, incoming, 'merge');
  assert.equal(merged.user.id, 'user-2');
  assert.equal(merged.profiles.find((item) => item.id === 'profile-1').name, '本机命主');
  assert.equal(merged.readings.find((item) => item.id === 'reading-1').summary, '本机版本');
  assert.ok(merged.readings.some((item) => item.id === 'reading-2'));

  const replacePreview = buildImportPreview(current, incoming, 'replace');
  assert.equal(replacePreview.conflicts.every((conflict) => conflict.resolution === 'use-incoming'), true);
  const replaced = applyImportPlan(current, incoming, 'replace');
  assert.deepEqual(replaced, incoming);
  assert.notEqual(replaced, incoming);
});

test('P3-E transactional restore 写入失败后恢复全部旧值', async () => {
  const store = new Map([
    ['user', 'old-user'],
    ['profiles', 'old-profiles'],
    ['readings', 'old-readings'],
  ]);
  let shouldFail = true;
  const adapter = {
    getItem: async (key) => store.get(key) ?? null,
    setItem: async (key, value) => {
      if (key === 'readings' && shouldFail) {
        shouldFail = false;
        throw new Error('injected restore failure');
      }
      store.set(key, value);
    },
    removeItem: async (key) => { store.delete(key); },
  };
  await assert.rejects(() => transactionalReplace([
    ['user', 'new-user'],
    ['profiles', 'new-profiles'],
    ['readings', 'new-readings'],
  ], adapter), /injected restore failure/);
  assert.deepEqual(Object.fromEntries(store), { user: 'old-user', profiles: 'old-profiles', readings: 'old-readings' });
});
