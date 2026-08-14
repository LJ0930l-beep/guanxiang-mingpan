import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { __storage } from '../scripts/test-shims/async-storage.mjs';
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
