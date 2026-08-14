import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { __storage } from '../scripts/test-shims/async-storage.mjs';
import { calculateBaziView } from '../src/services/chart-engine.ts';
import { AppProvider, useApp } from '../src/state/app-context.tsx';
import { STORAGE_SCHEMA_VERSION } from '../src/storage/schema.ts';

const PROFILE_KEY = '@guanxiang/profiles';
const SELECTED_PROFILE_KEY = '@guanxiang/selected-profile';
const READINGS_KEY = '@guanxiang/readings';

async function mountApp() {
  let app;
  function Probe() {
    app = useApp();
    return null;
  }

  let renderer;
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(AppProvider, null, React.createElement(Probe)));
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
  });
  return { app, renderer };
}

const validProfileInput = {
  name: '测试命主',
  relationship: '本人',
  birthDate: '1995-05-20',
  birthTime: '08:30',
  birthCity: '北京',
  calendar: 'solar',
  gender: 'female',
};

const validReadingInput = {
  profile: { id: 'profile-1', name: '测试命主' },
  title: '测试记录',
  summary: '测试摘要',
  payload: { module: 'bazi' },
};

const validReadingForPersistence = {
  profile: { id: 'profile-1', name: '测试命主' },
  title: '可复盘记录',
  summary: '保存收藏和反馈',
  payload: {
    module: 'bazi',
    generatedAt: '2026-01-02T00:00:00.000Z',
    engineVersion: 'bazi-engine@1.0.0',
    snapshotVersion: 1,
    calculationSettings: { timezone: 'Asia/Shanghai' },
    inputSnapshot: {
      type: 'birth',
      timezone: 'Asia/Shanghai',
      birthDate: '1995-05-20',
      birthTime: '08:30',
      birthCity: '北京',
      calendar: 'solar',
      gender: 'female',
    },
    focus: ['事业'],
  },
};

test('读取 future schema 后，真实 add/select/save 操作拒绝写入且原始值完全不变', async () => {
  const cases = [
    [PROFILE_KEY, [{ id: 'future-profile' }], (app) => app.addProfile(validProfileInput)],
    [SELECTED_PROFILE_KEY, 'future-profile', (app) => app.selectProfile('new-profile')],
    [READINGS_KEY, [{ id: 'future-reading' }], (app) => app.saveReading(validReadingInput)],
  ];

  for (const [key, futureValue, operation] of cases) {
    __storage.clear();
    const original = JSON.stringify({ schemaVersion: STORAGE_SCHEMA_VERSION + 1, value: futureValue });
    __storage.set(key, original);
    const { app, renderer } = await mountApp();

    await assert.rejects(() => operation(app), /read-only/);
    assert.equal(__storage.get(key), original, `${key} 的 future schema 原始值被覆盖`);
    assert.ok(app.storageBlockedKeys.includes(key));
    await act(async () => {
      renderer.unmount();
    });
  }
});

test('排盘记录支持收藏、事实反馈，并持久化到同一条记录', async () => {
  __storage.clear();
  let app;
  let renderer;
  ({ app, renderer } = await mountApp());
  let saved;

  await act(async () => {
    saved = await app.saveReading(validReadingForPersistence);
  });
  await act(async () => {
    renderer.unmount();
  });
  ({ app, renderer } = await mountApp());
  await act(async () => {
    assert.equal(await app.toggleFavorite(saved.id), true);
  });

  let feedback;
  await act(async () => {
    feedback = await app.addFeedback(saved.id, {
      status: 'partial',
      observedAt: '2026-01-05',
      note: '部分事实已经发生',
    });
  });

  const afterAdd = JSON.parse(__storage.get(READINGS_KEY));
  assert.equal(afterAdd.schemaVersion, STORAGE_SCHEMA_VERSION);
  assert.equal(afterAdd.value[0].favorite, true);
  assert.deepEqual(afterAdd.value[0].feedback, [{
    id: feedback.id,
    status: 'partial',
    observedAt: '2026-01-05',
    note: '部分事实已经发生',
    createdAt: feedback.createdAt,
  }]);

  await act(async () => {
    await app.deleteFeedback(saved.id, feedback.id);
  });
  const afterDelete = JSON.parse(__storage.get(READINGS_KEY));
  assert.equal(afterDelete.value[0].favorite, true);
  assert.deepEqual(afterDelete.value[0].feedback, []);

  await act(async () => {
    renderer.unmount();
  });
});

test('P3-C 反馈时间线支持按日事实、user-linked 关联和独立更新时间戳', async () => {
  __storage.clear();
  const { app, renderer } = await mountApp();
  let saved;
  await act(async () => {
    saved = await app.saveReading(validReadingForPersistence);
  });
  const originalReadingCreatedAt = saved.createdAt;
  let feedback;
  await act(async () => {
    feedback = await app.addFeedback(saved.id, {
      status: 'confirmed',
      observedAt: '2026-01-06',
      note: '事实发生，但不自动归因',
      linkedInterpretationIds: ['interpretation:strength'],
      linkedEvidenceIds: ['evidence:month-command'],
    });
  });
  assert.deepEqual(feedback.linkedInterpretationIds, ['interpretation:strength']);
  assert.deepEqual(feedback.linkedEvidenceIds, ['evidence:month-command']);
  assert.equal(feedback.observedAt, '2026-01-06');
  await new Promise((resolve) => setImmediate(resolve));

  let updated;
  await act(async () => {
    updated = await app.updateFeedback(saved.id, feedback.id, {
      status: 'partial',
      observedAt: '2026-01-07',
      note: '补充核对后的现实事实',
      linkedInterpretationIds: ['interpretation:element'],
      linkedEvidenceIds: [],
    });
  });
  assert.equal(updated.createdAt, feedback.createdAt);
  assert.ok(updated.updatedAt);
  assert.deepEqual(updated.linkedInterpretationIds, ['interpretation:element']);
  assert.equal(updated.linkedEvidenceIds, undefined);
  const persisted = JSON.parse(__storage.get(READINGS_KEY)).value[0];
  assert.equal(persisted.createdAt, originalReadingCreatedAt);
  assert.equal(persisted.feedback[0].observedAt, '2026-01-07');
  assert.equal(persisted.feedback[0].note, '补充核对后的现实事实');
  assert.ok(persisted.feedback[0].updatedAt);
  assert.deepEqual(persisted.feedback[0].linkedInterpretationIds, ['interpretation:element']);
  assert.equal(persisted.feedback[0].linkedEvidenceIds, undefined);

  await act(async () => {
    renderer.unmount();
  });
});

test('新八字记录显式保存 Phase 2 深度快照而不是只保存展示摘要', async () => {
  __storage.clear();
  const { app, renderer } = await mountApp();
  const profile = {
    id: 'profile-p2-f',
    name: 'Phase 2 命主',
    relationship: '本人',
    birthDate: '1980-01-01',
    birthTime: '12:00',
    birthCity: '北京市',
    timeKnown: true,
    calendar: 'solar',
    gender: 'male',
    latitude: 39.9042,
    longitude: 116.4074,
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
  };
  const payload = calculateBaziView(profile, undefined, { generatedAt: '2026-08-15T00:00:00.000Z' });
  let saved;
  await act(async () => {
    saved = await app.saveReading({ profile, title: '深度快照', summary: payload.focus[0], payload });
  });

  assert.equal(saved.interpretationVersion, 'bazi-rules-v2');
  assert.equal(saved.profileSnapshot.birthDate, '1980-01-01');
  assert.deepEqual(saved.normalizedChartSnapshot, payload.normalizedChart);
  assert.deepEqual(saved.evidenceGraphSnapshot, payload.evidenceGraph);
  assert.deepEqual(saved.interpretationSnapshot, payload.interpretation);
  const persisted = JSON.parse(__storage.get(READINGS_KEY)).value[0];
  assert.equal(persisted.interpretationSnapshot.interpretationVersion, 'bazi-rules-v2');
  assert.equal(persisted.evidenceGraphSnapshot.evidenceVersion, 'bazi-evidence-v1');
  assert.equal(persisted.profileSnapshot.birthCity, '北京市');

  await act(async () => {
    renderer.unmount();
  });
});
