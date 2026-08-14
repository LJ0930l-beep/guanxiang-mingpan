import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORAGE_SCHEMA_VERSION,
  decodeStorageValue,
  encodeStorageValue,
  migrateReadings,
  writeStorageValue,
} from '../src/storage/schema.ts';

test('本地存储写入统一 schema version，并能读取当前版本', () => {
  const value = [{ id: 'profile-1' }];
  const raw = encodeStorageValue(value);
  const decoded = decodeStorageValue(raw, [], (input) => input);

  assert.equal(STORAGE_SCHEMA_VERSION, 2);
  assert.deepEqual(decoded.value, value);
  assert.equal(decoded.needsRewrite, false);
  assert.equal(decoded.blocked, false);
});

test('读取 future schema 后，用户写操作被拒绝且原始值保持不变', async () => {
  const cases = [
    ['@guanxiang/profiles', [{ id: 'future-profile' }], [{ id: 'new-profile' }]],
    ['@guanxiang/selected-profile', 'future-profile', 'new-profile'],
    ['@guanxiang/readings', [{ id: 'future-reading' }], [{ id: 'new-reading' }]],
  ];

  for (const [key, futureValue, replacementValue] of cases) {
    const original = JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION + 1, value: futureValue });
    const storage = new Map([[key, original]]);
    const decoded = decodeStorageValue(storage.get(key), null, (input) => input);
    const blockedKeys = new Set(decoded.blocked ? [key] : []);

    assert.throws(
      () => writeStorageValue(key, replacementValue, blockedKeys, async (storageKey, value) => {
        storage.set(storageKey, value);
      }),
      /read-only/,
    );
    assert.equal(storage.get(key), original);
  }
});

test('旧版未版本化命盘记录会迁移出 inputSnapshot 与 snapshotMeta', () => {
  const legacyReading = {
    id: 'reading-legacy',
    profileId: 'profile-1',
    profileName: '旧命主',
    module: 'liuyao',
    title: '旧六爻记录',
    summary: '旧记录',
    createdAt: '2026-01-01T00:00:00.000Z',
    engineVersion: 'taibu-core@3.4.0',
    interpretationVersion: 'rules-v1',
    payload: {
      module: 'liuyao',
      generatedAt: '2026-01-01T00:00:00.000Z',
      engineVersion: 'taibu-core@3.4.0',
      question: '旧问题',
    },
  };
  const decoded = decodeStorageValue(JSON.stringify([legacyReading]), [], migrateReadings);
  const [reading] = decoded.value;

  assert.equal(decoded.needsRewrite, true);
  assert.equal(decoded.blocked, false);
  assert.equal(reading.inputSnapshot.type, 'liuyao');
  assert.equal(reading.inputSnapshot.seed, 'legacy-unknown');
  assert.equal(reading.inputSnapshot.seedScope, 'legacy');
  assert.equal(reading.snapshotMeta.inputSnapshot.type, 'liuyao');
  assert.equal(reading.payload.seed, 'legacy-unknown');
  assert.equal(reading.payload.seedScope, 'legacy');
  assert.equal(reading.seed, 'legacy-unknown');
  assert.equal(reading.date, '2026-01-01T00:00:00.000Z');
  assert.equal(reading.seedScope, 'legacy');
  assert.deepEqual(reading.snapshotMeta.calculationSettings, { timezone: 'Asia/Shanghai' });
  assert.equal(reading.inputSnapshot.timezone, 'Asia/Shanghai');
  assert.equal(reading.favorite, false);
  assert.deepEqual(reading.feedback, []);
});

test('当前 schema 读取旧版字段时会保留有效反馈并补齐收藏默认值', () => {
  const raw = JSON.stringify({
    schemaVersion: 1,
    value: [{
      id: 'reading-v1',
      profileId: 'profile-1',
      profileName: '旧命主',
      module: 'bazi',
      title: '旧版记录',
      summary: '旧版摘要',
      createdAt: '2026-01-01T00:00:00.000Z',
      engineVersion: 'bazi-engine@1.0.0',
      payload: {
        module: 'bazi',
        generatedAt: '2026-01-01T00:00:00.000Z',
        engineVersion: 'bazi-engine@1.0.0',
        snapshotVersion: 1,
        calculationSettings: { timezone: 'Asia/Shanghai' },
        inputSnapshot: { type: 'birth', timezone: 'Asia/Shanghai' },
      },
      feedback: [{
        id: 'feedback-1',
        status: 'confirmed',
        observedAt: '2026-01-02',
        note: '事实已发生',
        createdAt: '2026-01-02T00:00:00.000Z',
      }],
    }],
  });
  const decoded = decodeStorageValue(raw, [], migrateReadings);
  const [reading] = decoded.value;

  assert.equal(decoded.needsRewrite, true);
  assert.equal(reading.favorite, false);
  assert.deepEqual(reading.feedback, [{
    id: 'feedback-1',
    status: 'confirmed',
    observedAt: '2026-01-02',
    note: '事实已发生',
    createdAt: '2026-01-02T00:00:00.000Z',
  }]);
});

test('未来 schema 不会被当前版本覆盖', () => {
  const future = JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION + 1, value: { preserved: true } });
  const decoded = decodeStorageValue(future, { fallback: true }, (input) => input);

  assert.deepEqual(decoded.value, { fallback: true });
  assert.equal(decoded.needsRewrite, false);
  assert.equal(decoded.blocked, true);
});
