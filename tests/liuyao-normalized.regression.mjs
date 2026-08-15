import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateLiuyaoView } from '../src/services/chart-engine.ts';

const options = {
  seed: 'p4-f-fixed-seed',
  date: '2026-08-15T12:34:56',
  timezone: 'Asia/Shanghai',
  generatedAt: '2026-08-15T00:00:00.000Z',
};

test('P4-F 六爻标准模型保存复盘输入和稳定爻位引用', async () => {
  const result = await calculateLiuyaoView('这个版本的证据链是否清晰？', '官鬼', options);
  const chart = result.normalizedChart;
  assert.equal(chart.modelVersion, 'liuyao-normalized-v1');
  assert.equal(chart.source.engineVersion, result.engineVersion);
  assert.equal(chart.question, result.question);
  assert.equal(chart.yongShenTarget, '官鬼');
  assert.equal(chart.seed, options.seed);
  assert.equal(chart.date, '2026-08-15T12:34:56');
  assert.deepEqual(chart.lines.map((line) => line.id), ['liuyao:line:6', 'liuyao:line:5', 'liuyao:line:4', 'liuyao:line:3', 'liuyao:line:2', 'liuyao:line:1']);
  assert.deepEqual(chart.lines.map((line) => line.isChanging), result.lines.map((line) => line.isChanging));
});

test('P4-F 六爻证据图覆盖用神、旺衰、世应、动变与空亡', async () => {
  const result = await calculateLiuyaoView('这个版本的证据链是否清晰？', '官鬼', options);
  const graph = result.evidenceGraph;
  assert.equal(graph.evidenceVersion, 'liuyao-evidence-v1');
  const types = new Set(graph.nodes.map((node) => node.type));
  for (const required of ['question.frame', 'yongshen.selection', 'line.strength', 'shi-ying', 'moving-change', 'void.fact', 'hexagram.structure', 'time.fact']) {
    assert.equal(types.has(required), true, required);
  }
  const ids = new Set(graph.nodes.map((node) => node.id));
  assert.equal(ids.size, graph.nodes.length);
  assert.equal(graph.nodes.filter((node) => node.type === 'line.strength').every((node) => node.subjectRefs[0]?.startsWith('liuyao:line:')), true);
});
