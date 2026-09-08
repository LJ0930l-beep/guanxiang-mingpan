import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateBaziView, calculateLiuyaoView, calculateZiweiView } from '../src/services/chart-engine.ts';
import { inputFingerprint } from '../src/services/chart-engine-shared.ts';

const profile = {
  id: 'closure-profile',
  name: '闭环样例',
  relationship: '本人',
  birthDate: '2001-09-08',
  birthTime: '20:30',
  birthCity: '广东省深圳市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 22.5431,
  longitude: 114.0579,
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

test('R03 四术结果都保存稳定输入指纹并保留业务时区', async () => {
  const bazi = calculateBaziView(profile, undefined, { generatedAt: '2026-09-08T00:00:00.000Z' });
  const liuyao = await calculateLiuyaoView('本周项目沟通是否适合推进', '官鬼', {
    seed: 'closure-seed',
    date: '2026-09-08T12:00:00.000Z',
    generatedAt: '2026-09-08T00:00:00.000Z',
  });
  const ziwei = calculateZiweiView(profile, undefined, { generatedAt: '2026-09-08T00:00:00.000Z' });
  for (const chart of [bazi, liuyao, ziwei]) {
    assert.match(chart.inputFingerprint, /^fnv1a-[0-9a-f]{8}$/);
    assert.equal(chart.calculationSettings.timezone, 'Asia/Shanghai');
    assert.equal(chart.inputSnapshot.timezone, 'Asia/Shanghai');
    assert.equal(chart.inputFingerprint, inputFingerprint({ module: chart.module, inputSnapshot: chart.inputSnapshot, calculationSettings: chart.calculationSettings }));
  }
});

test('R05 六爻手工六爻保留每条阴阳、动静事实且不会重新随机', async () => {
  const manualYaos = [
    { position: 1, yinYang: '阳', isChanging: false, value: 7 },
    { position: 2, yinYang: '阴', isChanging: true, value: 6 },
    { position: 3, yinYang: '阳', isChanging: false, value: 7 },
    { position: 4, yinYang: '阴', isChanging: false, value: 8 },
    { position: 5, yinYang: '阳', isChanging: true, value: 9 },
    { position: 6, yinYang: '阴', isChanging: false, value: 8 },
  ];
  const options = {
    generatedAt: '2026-09-08T00:00:00.000Z',
    seed: 'manual-seed',
    date: '2026-09-08T12:00:00.000Z',
    liuyao: { method: 'manual', manualYaos },
  };
  const first = await calculateLiuyaoView('手工记录的原卦问题', '官鬼', options);
  const second = await calculateLiuyaoView('手工记录的原卦问题', '官鬼', options);
  assert.deepEqual(second, first);
  assert.equal(first.castingMethod, 'manual');
  assert.deepEqual(first.inputSnapshot.manualYaos, manualYaos);
  assert.equal(first.lines.length, 6);
  assert.deepEqual(first.lines.map((line) => ({ position: line.position, yinYang: line.yinYang, isChanging: line.isChanging, value: line.value })), [...manualYaos].sort((a, b) => b.position - a.position));
  assert.match(first.explanation.blocks.find((block) => block.category === 'moving-lines').summary, /2个动爻/);
});

test('R06 紫微三方四正事实和命宫文案可回查', () => {
  const result = calculateZiweiView(profile, undefined, { generatedAt: '2026-09-08T00:00:00.000Z' });
  assert.equal(result.normalizedChart.palaces.length, 12);
  assert.equal(result.normalizedChart.palaces.every((palace) => palace.oppositePalaceRefId && palace.trinePalaceRefIds.length === 2), true);
  assert.equal(result.evidenceGraph.nodes.filter((node) => node.type === 'palace.relation').length, 12);
  assert.match(result.focus[0], /命宫定位/);
  assert.equal(result.explanation.blocks.some((block) => block.category === 'three-square-four-correctness'), true);
});
