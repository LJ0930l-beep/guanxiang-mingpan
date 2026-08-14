import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_ARCHIVE_FILTER_STATE,
  compareArchiveReadings,
  filterArchiveReadings,
  groupArchiveReadings,
} from '../src/domains/archive/query.ts';

const now = new Date('2026-08-15T04:00:00.000Z');

function reading(overrides = {}) {
  const module = overrides.module ?? 'bazi';
  const profileId = overrides.profileId ?? 'profile-a';
  const payload = overrides.payload ?? (module === 'liuyao'
    ? {
        module: 'liuyao',
        question: '这周项目能否按时上线',
        seed: 'seed-a',
        date: '2026-08-14',
        seedScope: 'fixed-local',
      }
    : {
        module: 'bazi',
        dayMaster: '甲木',
        focus: ['先看月令'],
        strengthAssessment: { status: 'balanced' },
        interpretation: { interpretationVersion: 'bazi-rules-v2' },
        evidenceGraph: { nodes: [{ id: 'evidence-1' }] },
      });
  return {
    id: overrides.id ?? `reading-${profileId}-${module}-${overrides.createdAt ?? '2026-08-14'}`,
    profileId,
    profileName: overrides.profileName ?? (profileId === 'profile-a' ? '阿宁' : '小岚'),
    module,
    title: overrides.title ?? '本次命盘',
    summary: overrides.summary ?? '记录摘要',
    createdAt: overrides.createdAt ?? '2026-08-14T04:00:00.000Z',
    engineVersion: overrides.engineVersion ?? 'engine@1',
    interpretationVersion: overrides.interpretationVersion ?? 'rules@1',
    snapshotMeta: {
      snapshotVersion: 1,
      generatedAt: overrides.createdAt ?? '2026-08-14T04:00:00.000Z',
      engineVersion: overrides.engineVersion ?? 'engine@1',
      calculationSettings: { timezone: 'Asia/Shanghai' },
      inputSnapshot: { type: 'legacy', timezone: 'Asia/Shanghai', module, reason: 'fixture' },
    },
    inputSnapshot: { type: 'legacy', timezone: 'Asia/Shanghai', module, reason: 'fixture' },
    favorite: overrides.favorite ?? false,
    feedback: overrides.feedback ?? [],
    payload,
  };
}

test('P3-B 搜索、模块、命主、收藏、时间和反馈筛选可以组合', () => {
  const readings = [
    reading({ id: 'recent-bazi', title: '事业复盘', favorite: true, feedback: [{ status: 'confirmed' }] }),
    reading({ id: 'recent-liuyao', module: 'liuyao', title: '上线问题', summary: '项目是否按时上线', createdAt: '2026-08-10T04:00:00.000Z', feedback: [{ status: 'partial' }] }),
    reading({ id: 'old-bazi', profileId: 'profile-b', profileName: '小岚', createdAt: '2026-08-01T04:00:00.000Z' }),
    reading({ id: 'future', createdAt: '2026-08-16T04:00:00.000Z' }),
  ];

  assert.deepEqual(
    filterArchiveReadings(readings, { ...DEFAULT_ARCHIVE_FILTER_STATE, query: '上线' }, now).map((item) => item.id),
    ['recent-liuyao'],
  );
  assert.deepEqual(
    filterArchiveReadings(readings, { ...DEFAULT_ARCHIVE_FILTER_STATE, modules: ['bazi'], profileIds: ['profile-a'], favoritesOnly: true }, now).map((item) => item.id),
    ['recent-bazi'],
  );
  assert.deepEqual(
    filterArchiveReadings(readings, { ...DEFAULT_ARCHIVE_FILTER_STATE, dateRange: '7d' }, now).map((item) => item.id),
    ['recent-bazi', 'recent-liuyao'],
  );
  assert.deepEqual(
    filterArchiveReadings(readings, { ...DEFAULT_ARCHIVE_FILTER_STATE, dateRange: '30d', feedbackStatuses: ['partial'] }, now).map((item) => item.id),
    ['recent-liuyao'],
  );
});

test('P3-B 按命主和日期分组保持输入顺序并给出稳定标签', () => {
  const readings = [
    reading({ id: 'a1', createdAt: '2026-08-14T04:00:00.000Z' }),
    reading({ id: 'b1', profileId: 'profile-b', profileName: '小岚', createdAt: '2026-08-13T04:00:00.000Z' }),
    reading({ id: 'a2', createdAt: '2026-08-13T05:00:00.000Z' }),
  ];
  const byProfile = groupArchiveReadings(readings, 'profile');
  assert.deepEqual(byProfile.map((group) => [group.key, group.label, group.readings.map((item) => item.id)]), [
    ['profile-a', '阿宁', ['a1', 'a2']],
    ['profile-b', '小岚', ['b1']],
  ]);
  const byDate = groupArchiveReadings(readings, 'date');
  assert.deepEqual(byDate.map((group) => [group.key, group.readings.map((item) => item.id)]), [
    ['2026-08-14', ['a1']],
    ['2026-08-13', ['b1', 'a2']],
  ]);
});

test('P3-B 对比只允许同一命主同一模块，且只报告只读字段差异', () => {
  const left = reading({ id: 'left', title: '第一次', payload: { module: 'bazi', dayMaster: '甲木', focus: ['看月令'], strengthAssessment: { status: 'weak' }, interpretation: { interpretationVersion: 'bazi-rules-v1' }, evidenceGraph: { nodes: [{ id: 'one' }] } } });
  const right = reading({ id: 'right', title: '第二次', payload: { module: 'bazi', dayMaster: '乙木', focus: ['看根气'], strengthAssessment: { status: 'strong' }, interpretation: { interpretationVersion: 'bazi-rules-v2' }, evidenceGraph: { nodes: [{ id: 'one' }, { id: 'two' }] } } });
  const comparison = compareArchiveReadings(left, right);
  assert.equal(comparison.allowed, true);
  assert.deepEqual(comparison.fields.map((field) => field.key), ['title', 'dayMaster', 'focus', 'strength', 'interpretation', 'evidenceCount']);
  assert.equal(compareArchiveReadings(left, reading({ id: 'other-profile', profileId: 'profile-b' })).allowed, false);
  assert.equal(compareArchiveReadings(left, reading({ id: 'other-module', module: 'liuyao' })).allowed, false);
});
