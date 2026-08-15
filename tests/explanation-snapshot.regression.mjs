import assert from 'node:assert/strict';
import test from 'node:test';

import { createExplanationSnapshot, isExplanationSnapshot, migrateExplanationSnapshot } from '../src/domains/explanation/snapshot.ts';
import { createLocalBackupText, parseLocalBackupText, BackupFormatError } from '../src/storage/backup.ts';
import { decodeStorageValue, migrateReadings, STORAGE_SCHEMA_VERSION } from '../src/storage/schema.ts';

const explanation = createExplanationSnapshot([
  {
    id: 'explanation:bazi:overview',
    module: 'bazi',
    category: 'overview',
    title: '命盘总览',
    summary: '当前盘面有可追溯的支持与限制证据。',
    paragraphs: ['先看结构，再回到证据。', '这不是确定性人生结论。'],
    evidenceRefs: ['evidence:season:month-command'],
    counterEvidenceRefs: ['evidence:root:bazi:hidden:day:0'],
    glossaryRefs: ['glossary:bazi:month-command'],
    confidence: 'medium',
    caveats: ['当前解释使用本地规则。'],
    explanationVersion: 'bazi-explanation-v1',
  },
], {
  explanationVersion: 'bazi-explanation-v1',
  generatedAt: '2026-08-15T00:00:00.000Z',
  glossaryVersion: 'glossary-v1',
});

function profile() {
  return {
    id: 'profile-1',
    name: '解释测试命主',
    relationship: '本人',
    birthDate: '1990-01-01',
    birthTime: '12:00',
    birthCity: '北京市',
    timeKnown: true,
    calendar: 'solar',
    gender: 'female',
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
  };
}

function reading() {
  return {
    id: 'reading-1',
    profileId: 'profile-1',
    profileName: '解释测试命主',
    module: 'bazi',
    title: '解释快照测试',
    summary: '保存时解释',
    createdAt: '2026-08-15T00:00:00.000Z',
    engineVersion: 'taibu-core@3.4.0/bazi',
    interpretationVersion: 'bazi-rules-v2',
    snapshotMeta: { snapshotVersion: 1, calculationSettings: { timezone: 'Asia/Shanghai' } },
    inputSnapshot: { type: 'legacy', timezone: 'Asia/Shanghai', module: 'bazi', reason: 'fixture' },
    explanationSnapshot: explanation,
    favorite: false,
    feedback: [],
    payload: { module: 'bazi', explanation, calculationSettings: { timezone: 'Asia/Shanghai' } },
  };
}

test('P4-A ExplanationSnapshot 有版本、块结构和 Glossary 版本，并拒绝缺失必填字段', () => {
  assert.equal(isExplanationSnapshot(explanation), true);
  assert.deepEqual(migrateExplanationSnapshot(explanation), explanation);
  assert.equal(migrateExplanationSnapshot(undefined), undefined);
  assert.equal(migrateExplanationSnapshot({ ...explanation, blocks: [{ id: 'broken' }] }), undefined);
  assert.throws(() => createExplanationSnapshot([], {
    explanationVersion: '',
    generatedAt: explanation.generatedAt,
    glossaryVersion: explanation.glossaryVersion,
  }), /解释快照格式无效/);
});

test('P4-A 普通备份往返保留 ExplanationSnapshot，旧记录不静默补写', () => {
  const data = { user: null, profiles: [profile()], selectedProfileId: 'profile-1', readings: [reading()] };
  const parsed = parseLocalBackupText(createLocalBackupText(data, '2026-08-15T00:00:00.000Z'));
  assert.deepEqual(parsed.data.readings[0].explanationSnapshot, explanation);
  assert.deepEqual(parsed.data.readings[0].payload.explanation, explanation);

  const legacy = {
    ...reading(),
    explanationSnapshot: undefined,
    payload: { module: 'bazi', calculationSettings: { timezone: 'Asia/Shanghai' } },
  };
  const decoded = decodeStorageValue(JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION, value: [legacy] }), [], migrateReadings);
  assert.equal(decoded.value[0].explanationSnapshot, undefined);
  assert.equal(decoded.value[0].payload.explanation, undefined);
});

test('P4-A 备份拒绝结构损坏的 ExplanationSnapshot', () => {
  const data = { user: null, profiles: [profile()], selectedProfileId: 'profile-1', readings: [reading()] };
  const raw = JSON.parse(createLocalBackupText(data));
  raw.data.readings[0].explanationSnapshot = { ...explanation, glossaryVersion: '' };
  assert.throws(() => parseLocalBackupText(JSON.stringify(raw)), BackupFormatError);
});
