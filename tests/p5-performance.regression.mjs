import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import test from 'node:test';

import {
  P5_D_BENCHMARK_ARCHIVE_SIZE,
  P5_D_BENCHMARK_SAMPLE_COUNT,
  P5_D_PERFORMANCE_BUDGETS,
} from '../src/services/performance-budget.ts';
import { filterArchiveReadings, DEFAULT_ARCHIVE_FILTER_STATE } from '../src/domains/archive/query.ts';
import { calculateAstrologyView, calculateBaziView, calculateLiuyaoView, calculateZiweiView } from '../src/services/chart-engine.ts';
import { migrateReadings } from '../src/storage/schema.ts';
import { createLocalBackupText, parseLocalBackupText } from '../src/storage/backup.ts';

const generatedAt = '2026-09-03T12:00:00.000Z';
const profile = {
  id: 'p5-d-benchmark-profile',
  name: 'P5-D 基准命主',
  relationship: '本人',
  birthDate: '1988-09-17',
  birthTime: '06:20',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'female',
  createdAt: generatedAt,
  updatedAt: generatedAt,
};
const astrologyProfile = {
  ...profile,
  id: 'p5-d-astrology-profile',
  birthCity: '广东省深圳市',
  latitude: 22.5431,
  longitude: 114.0579,
};
const options = { generatedAt, timezone: 'Asia/Shanghai', seed: 'p5-d-seed', date: '2026-09-03T12:00:00+08:00' };

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

async function measure(run) {
  const values = [];
  for (let index = 0; index < P5_D_BENCHMARK_SAMPLE_COUNT + 1; index += 1) {
    const start = performance.now();
    await run();
    const elapsed = performance.now() - start;
    if (index > 0) values.push(elapsed);
  }
  return { median: median(values), samples: values };
}

function assertBudget(key, result) {
  const budget = P5_D_PERFORMANCE_BUDGETS[key];
  assert.equal(Number.isFinite(result.median), true, `${key} median must be finite`);
  console.info(`[P5-D] ${budget.label}: median=${result.median.toFixed(2)}ms budget=${budget.maxMedianMs}ms`);
  assert.ok(result.median <= budget.maxMedianMs, `${budget.label} median ${result.median.toFixed(2)}ms > ${budget.maxMedianMs}ms budget; samples=${result.samples.map((item) => item.toFixed(2)).join(',')}`);
}

let baziPayload;
let archiveReadings;

test('P5-D 四术排盘 benchmark 在固定输入与 Asia/Shanghai 下完成', async () => {
  const bazi = await measure(() => {
    baziPayload = calculateBaziView(profile, undefined, options);
  });
  assertBudget('bazi', bazi);

  const liuyao = await measure(() => calculateLiuyaoView('这次项目能否按计划完成', '父母', options));
  assertBudget('liuyao', liuyao);

  const ziwei = await measure(() => calculateZiweiView(profile, undefined, options));
  assertBudget('ziwei', ziwei);

  const astrology = await measure(() => calculateAstrologyView(astrologyProfile, options));
  assertBudget('astrology', astrology);

  assert.equal(baziPayload.calculationSettings.timezone, 'Asia/Shanghai');
});

test('P5-D 历史筛选、迁移和普通备份往返 benchmark 覆盖 250 条记录', async () => {
  if (!baziPayload) baziPayload = calculateBaziView(profile, undefined, options);
  archiveReadings = Array.from({ length: P5_D_BENCHMARK_ARCHIVE_SIZE }, (_, index) => ({
    id: `p5-d-reading-${index}`,
    profileId: profile.id,
    profileName: profile.name,
    module: 'bazi',
    title: index % 2 === 0 ? '事业复盘' : '日常观察',
    summary: index % 2 === 0 ? '记录项目推进' : '记录日常状态',
    createdAt: `2026-09-${String((index % 9) + 1).padStart(2, '0')}T12:00:00.000Z`,
    engineVersion: baziPayload.engineVersion,
    interpretationVersion: baziPayload.interpretation.interpretationVersion,
    snapshotMeta: {
      snapshotVersion: baziPayload.snapshotVersion,
      generatedAt: baziPayload.generatedAt,
      engineVersion: baziPayload.engineVersion,
      calculationSettings: baziPayload.calculationSettings,
      calculationSettingsOrigin: 'current',
      inputSnapshot: baziPayload.inputSnapshot,
    },
    inputSnapshot: baziPayload.inputSnapshot,
    profileSnapshot: profile,
    normalizedChartSnapshot: baziPayload.normalizedChart,
    evidenceGraphSnapshot: baziPayload.evidenceGraph,
    interpretationSnapshot: baziPayload.interpretation,
    explanationSnapshot: baziPayload.explanation,
    favorite: index % 5 === 0,
    feedback: [],
    payload: baziPayload,
  }));

  const filter = await measure(() => filterArchiveReadings(archiveReadings, {
    ...DEFAULT_ARCHIVE_FILTER_STATE,
    query: '事业',
    favoritesOnly: true,
    dateRange: '30d',
  }, new Date('2026-09-03T12:00:00.000Z')));
  assertBudget('archiveFilter', filter);

  const migration = await measure(() => migrateReadings(archiveReadings));
  assertBudget('archiveMigration', migration);

  const backupReadings = archiveReadings.map((reading, index) => ({
    ...reading,
    id: `p5-d-backup-reading-${index}`,
    // Keep the backup benchmark focused on archive plumbing rather than
    // serializing the intentionally large explanation/evidence graph 250x.
    module: 'liuyao',
    title: '六爻归档基准',
    summary: '基准记录',
    engineVersion: 'taibu-core@3.4.0/liuyao+guanxiang-rng-v1',
    interpretationVersion: 'rules-v1',
    snapshotMeta: {
      snapshotVersion: 1,
      generatedAt,
      engineVersion: 'taibu-core@3.4.0/liuyao+guanxiang-rng-v1',
      calculationSettings: { timezone: 'Asia/Shanghai' },
      inputSnapshot: { type: 'liuyao', timezone: 'Asia/Shanghai', question: '基准问题', target: '父母', seed: `seed-${index}`, date: '2026-09-03T12:00:00', seedScope: 'guanxiang-local-v1' },
    },
    inputSnapshot: { type: 'liuyao', timezone: 'Asia/Shanghai', question: '基准问题', target: '父母', seed: `seed-${index}`, date: '2026-09-03T12:00:00', seedScope: 'guanxiang-local-v1' },
    payload: { module: 'liuyao', snapshotVersion: 1, generatedAt, engineVersion: 'taibu-core@3.4.0/liuyao+guanxiang-rng-v1', calculationSettings: { timezone: 'Asia/Shanghai' }, inputSnapshot: { type: 'liuyao', timezone: 'Asia/Shanghai', question: '基准问题', target: '父母', seed: `seed-${index}`, date: '2026-09-03T12:00:00', seedScope: 'guanxiang-local-v1' }, question: '基准问题', target: '父母', seed: `seed-${index}`, date: '2026-09-03T12:00:00', seedScope: 'guanxiang-local-v1' },
    normalizedChartSnapshot: undefined,
    evidenceGraphSnapshot: undefined,
    interpretationSnapshot: undefined,
    explanationSnapshot: undefined,
  }));
  const roundtrip = await measure(() => {
    const raw = createLocalBackupText({ user: null, profiles: [profile], selectedProfileId: profile.id, readings: backupReadings }, generatedAt);
    const parsed = parseLocalBackupText(raw);
    assert.equal(parsed.data.readings.length, P5_D_BENCHMARK_ARCHIVE_SIZE);
  });
  assertBudget('backupRoundtrip', roundtrip);
});

test('P5-D 输入错误和离线未知地点 fail-fast，不进入第三方引擎', async () => {
  const result = await measure(() => {
    assert.throws(() => calculateBaziView({ ...profile, birthDate: '1988-02-30' }), /日期|日期范围/);
    assert.throws(() => calculateAstrologyView({ ...astrologyProfile, birthCity: '未收录城市', latitude: undefined, longitude: undefined }), /无法识别出生城市/);
  });
  assertBudget('inputFailure', result);
});
