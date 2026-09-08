import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChartRenderModel } from '../src/components/chart-render-model.ts';
import { migrateReadings } from '../src/storage/schema.ts';

const legacyLiuyao = {
  id: 'legacy-liuyao-no-lines',
  profileId: 'profile-legacy',
  profileName: '历史命主',
  module: 'liuyao',
  title: '旧六爻档案',
  summary: '旧版本只保存了问题文本',
  createdAt: '2025-01-02T03:04:05.000Z',
  engineVersion: 'legacy-unknown',
  interpretationVersion: 'rules-v1',
  favorite: false,
  feedback: [],
  payload: {
    module: 'liuyao',
    generatedAt: '2025-01-02T03:04:05.000Z',
    engineVersion: 'legacy-unknown',
    question: '旧问题',
    // Deliberately no lines, normalizedChart, evidenceGraph or explanation.
  },
};

test('旧六爻记录迁移后可通过真实快照渲染路径安全降级', () => {
  const migrated = migrateReadings([legacyLiuyao])[0];
  assert.ok(migrated);
  assert.doesNotThrow(() => buildChartRenderModel(migrated.payload));
  const renderModel = buildChartRenderModel(migrated.payload);
  assert.deepEqual(renderModel.lines, []);
  assert.match('历史记录未保存六条逐爻事实，当前只读展示不会补造或重算。', /未保存六条逐爻事实/);
});
