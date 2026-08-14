import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORAGE_SCHEMA_VERSION,
  decodeStorageValue,
  encodeStorageValue,
  migrateReadings,
} from '../src/storage/schema.ts';

test('本地存储写入统一 schema version，并能读取当前版本', () => {
  const value = [{ id: 'profile-1' }];
  const raw = encodeStorageValue(value);
  const decoded = decodeStorageValue(raw, [], (input) => input);

  assert.equal(STORAGE_SCHEMA_VERSION, 1);
  assert.deepEqual(decoded.value, value);
  assert.equal(decoded.needsRewrite, false);
  assert.equal(decoded.blocked, false);
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
});

test('未来 schema 不会被当前版本覆盖', () => {
  const future = JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION + 1, value: { preserved: true } });
  const decoded = decodeStorageValue(future, { fallback: true }, (input) => input);

  assert.deepEqual(decoded.value, { fallback: true });
  assert.equal(decoded.needsRewrite, false);
  assert.equal(decoded.blocked, true);
});
