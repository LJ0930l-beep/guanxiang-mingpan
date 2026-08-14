import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BackupFormatError,
  createLocalBackupText,
  parseLocalBackupText,
} from '../src/storage/backup.ts';
import { STORAGE_SCHEMA_VERSION } from '../src/storage/schema.ts';

const profile = {
  id: 'profile-1',
  name: '测试命主',
  relationship: '本人',
  birthDate: '1995-05-20',
  birthTime: '08:30',
  birthCity: '北京',
  timeKnown: true,
  calendar: 'solar',
  gender: 'female',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const reading = {
  id: 'reading-1',
  profileId: profile.id,
  profileName: profile.name,
  module: 'liuyao',
  title: '测试记录',
  summary: '测试摘要',
  createdAt: '2026-01-02T00:00:00.000Z',
  engineVersion: 'taibu-core@3.4.0',
  interpretationVersion: 'rules-v1',
  snapshotMeta: { snapshotVersion: 1, calculationSettings: { timezone: 'Asia/Shanghai' } },
  inputSnapshot: { type: 'liuyao', timezone: 'Asia/Shanghai' },
  payload: { module: 'liuyao', calculationSettings: { timezone: 'Asia/Shanghai' } },
  favorite: true,
  feedback: [{
    id: 'feedback-1',
    status: 'confirmed',
    observedAt: '2026-01-03',
    note: '事实已发生',
    createdAt: '2026-01-03T00:00:00.000Z',
  }],
};

test('本机备份带版本和完整本地数据，并能无损解析', () => {
  const data = {
    user: { id: 'phone_13800000000', displayName: '138****0000', provider: 'phone' },
    profiles: [profile],
    selectedProfileId: profile.id,
    readings: [reading],
  };
  const raw = createLocalBackupText(data, '2026-01-03T00:00:00.000Z');
  const parsed = parseLocalBackupText(raw);

  assert.equal(parsed.format, 'guanxiang-local-backup');
  assert.equal(parsed.backupVersion, 1);
  assert.equal(parsed.storageSchemaVersion, STORAGE_SCHEMA_VERSION);
  assert.equal(parsed.exportedAt, '2026-01-03T00:00:00.000Z');
  assert.deepEqual(parsed.data, data);
});

test('旧版本机备份缺少收藏与反馈字段时会安全补默认值', () => {
  const legacyReading = { ...reading };
  delete legacyReading.favorite;
  delete legacyReading.feedback;
  const legacyDocument = JSON.parse(createLocalBackupText({ user: null, profiles: [profile], selectedProfileId: profile.id, readings: [legacyReading] }));
  legacyDocument.storageSchemaVersion = 1;
  const raw = JSON.stringify(legacyDocument);
  const parsed = parseLocalBackupText(raw);

  assert.equal(parsed.storageSchemaVersion, STORAGE_SCHEMA_VERSION);
  assert.equal(parsed.data.readings[0].favorite, false);
  assert.deepEqual(parsed.data.readings[0].feedback, []);
});

test('本机备份拒绝未来版本、非法 JSON 和不一致选择', () => {
  const base = JSON.parse(createLocalBackupText({ user: null, profiles: [], selectedProfileId: null, readings: [] }));

  assert.throws(() => parseLocalBackupText('{broken'), BackupFormatError);
  assert.throws(() => parseLocalBackupText(JSON.stringify({ ...base, backupVersion: 2 })), /版本不兼容/);
  assert.throws(() => parseLocalBackupText(JSON.stringify({ ...base, data: { ...base.data, selectedProfileId: 'missing' } })), /当前命主不存在/);
});

test('本机备份拒绝重复 ID，避免恢复后覆盖数据', () => {
  const duplicate = { ...profile, id: 'profile-1' };
  const raw = createLocalBackupText({ user: null, profiles: [profile, duplicate], selectedProfileId: profile.id, readings: [] });

  assert.throws(() => parseLocalBackupText(raw), /重复的命主 ID/);
});

test('本机备份拒绝同一记录下重复的反馈 ID', () => {
  const duplicateFeedback = { ...reading, feedback: [reading.feedback[0], reading.feedback[0]] };
  const raw = createLocalBackupText({ user: null, profiles: [profile], selectedProfileId: profile.id, readings: [duplicateFeedback] });

  assert.throws(() => parseLocalBackupText(raw), /重复的反馈 ID/);
});
