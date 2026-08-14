import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSnapshotViewerModel } from '../src/domains/archive/types.ts';

function reading(overrides = {}) {
  return {
    id: 'reading-archive-1',
    profileId: 'profile-1',
    profileName: '旧命主名',
    module: 'bazi',
    title: '旧档案',
    summary: '保存时摘要',
    createdAt: '2026-08-15T00:00:00.000Z',
    engineVersion: 'taibu-core@3.4.0/bazi',
    interpretationVersion: 'bazi-rules-v2',
    snapshotMeta: {
      snapshotVersion: 1,
      generatedAt: '2026-08-15T00:00:00.000Z',
      engineVersion: 'taibu-core@3.4.0/bazi',
      calculationSettings: { timezone: 'Asia/Shanghai' },
      inputSnapshot: {
        type: 'birth',
        timezone: 'Asia/Shanghai',
        profileId: 'profile-1',
        birthDate: '1990-01-02',
        birthTime: '08:30',
        timeKnown: true,
        birthCity: '北京市',
        calendar: 'solar',
      },
    },
    inputSnapshot: {
      type: 'birth',
      timezone: 'Asia/Shanghai',
      profileId: 'profile-1',
      birthDate: '1990-01-02',
      birthTime: '08:30',
      timeKnown: true,
      birthCity: '北京市',
      calendar: 'solar',
    },
    profileSnapshot: {
      id: 'profile-1',
      name: '旧命主名',
      relationship: '本人',
      birthDate: '1990-01-02',
      birthTime: '08:30',
      birthCity: '北京市',
      timeKnown: true,
      calendar: 'solar',
      gender: 'male',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    },
    favorite: true,
    feedback: [{ id: 'feedback-1', status: 'confirmed', observedAt: '2026-08-20', note: '事实记录', createdAt: '2026-08-20T00:00:00.000Z' }],
    payload: {
      module: 'bazi',
      snapshotVersion: 1,
      generatedAt: '2026-08-15T00:00:00.000Z',
      engineVersion: 'taibu-core@3.4.0/bazi',
      calculationSettings: { timezone: 'Asia/Shanghai' },
      inputSnapshot: {
        type: 'birth',
        timezone: 'Asia/Shanghai',
        profileId: 'profile-1',
        birthDate: '1990-01-02',
        birthTime: '08:30',
        timeKnown: true,
        birthCity: '北京市',
        calendar: 'solar',
      },
      focus: ['保存时观察'],
    },
    ...overrides,
  };
}

test('P3-A Snapshot Viewer 只读取保存快照，不接受当前命主资料覆盖', () => {
  const model = buildSnapshotViewerModel(reading());
  const editedProfile = {
    birthDate: '2001-09-09',
    birthCity: '上海市',
    name: '后来改名',
  };

  assert.equal(model.inputSnapshot.birthDate, '1990-01-02');
  assert.equal(model.inputSnapshot.birthCity, '北京市');
  assert.equal(model.archive.profileSnapshot?.birthDate, '1990-01-02');
  assert.equal(model.archive.profileSnapshot?.name, '旧命主名');
  assert.notEqual(model.inputSnapshot.birthDate, editedProfile.birthDate);
  assert.equal(model.calculationSnapshot.calculationSettings.timezone, 'Asia/Shanghai');
  assert.equal(model.feedback[0].note, '事实记录');
});

test('P3-A 缺少 Phase 2 深度快照时明确标记，不补造解释层', () => {
  const model = buildSnapshotViewerModel(reading({
    normalizedChartSnapshot: undefined,
    evidenceGraphSnapshot: undefined,
    interpretationSnapshot: undefined,
  }));

  assert.equal(model.hasDeepSnapshot, false);
  assert.equal(model.archive.deepSnapshot, undefined);
  assert.equal(model.payload.module, 'bazi');
});
