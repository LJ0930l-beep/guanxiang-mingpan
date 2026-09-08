import assert from 'node:assert/strict';
import test from 'node:test';

import {
  castThreeCoins,
  lineFactsFromCoinValue,
  LIUYAO_CASTING_RULE_VERSION,
  threeCoinThrowFromFaces,
} from '../src/domains/liuyao/casting.ts';
import { calculateLiuyaoView } from '../src/services/chart-engine.ts';

test('六爻三枚铜钱法穷举八种组合，概率结构是 1:3:3:1', () => {
  const cases = [
    [[2, 2, 2], 6, '阴', true],
    [[2, 2, 3], 7, '阳', false],
    [[2, 3, 2], 7, '阳', false],
    [[3, 2, 2], 7, '阳', false],
    [[2, 3, 3], 8, '阴', false],
    [[3, 2, 3], 8, '阴', false],
    [[3, 3, 2], 8, '阴', false],
    [[3, 3, 3], 9, '阳', true],
  ];
  for (const [faces, value, yinYang, isChanging] of cases) {
    const result = threeCoinThrowFromFaces(faces);
    assert.equal(result.value, value);
    assert.equal(result.yinYang, yinYang);
    assert.equal(result.isChanging, isChanging);
  }
  assert.deepEqual(cases.map((item) => item[1]), [6, 7, 7, 7, 8, 8, 8, 9]);
});

test('交互采样每一爻只消费三次随机源，手工映射使用同一事实规则', () => {
  const samples = [0, 0, 0, 0, 0.9, 0, 0.9, 0.9, 0.9];
  let index = 0;
  const first = castThreeCoins(() => samples[index++]);
  const second = castThreeCoins(() => samples[index++]);
  const third = castThreeCoins(() => samples[index++]);
  assert.equal(index, 9);
  assert.equal(first.value, 6);
  assert.equal(second.value, 7);
  assert.equal(third.value, 9);
  for (const value of [6, 7, 8, 9]) {
    const facts = lineFactsFromCoinValue(value);
    const direct = threeCoinThrowFromFaces(value === 6 ? [2, 2, 2] : value === 7 ? [2, 2, 3] : value === 8 ? [2, 3, 3] : [3, 3, 3]);
    assert.deepEqual(facts, { value: direct.value, yinYang: direct.yinYang, isChanging: direct.isChanging });
  }
});

test('六爻快照记录固定业务时区、采样规则和变爻事实', async () => {
  const result = await calculateLiuyaoView('三枚铜钱事实是否完整记录？', '官鬼', {
    seed: 'casting-facts-seed',
    date: '2026-09-08T12:00:00',
    generatedAt: '2026-09-08T04:00:00.000Z',
    timezone: 'Asia/Shanghai',
    liuyao: {
      method: 'interactive',
      manualYaos: [
        { position: 1, yinYang: '阴', isChanging: true, value: 6 },
        { position: 2, yinYang: '阳', isChanging: false, value: 7 },
        { position: 3, yinYang: '阴', isChanging: false, value: 8 },
        { position: 4, yinYang: '阳', isChanging: true, value: 9 },
        { position: 5, yinYang: '阳', isChanging: false, value: 7 },
        { position: 6, yinYang: '阴', isChanging: false, value: 8 },
      ],
    },
  });
  assert.equal(result.calculationSettings.timezone, 'Asia/Shanghai');
  assert.equal(result.calculationSettings.liuyaoCastingRuleVersion, LIUYAO_CASTING_RULE_VERSION);
  assert.equal(result.inputSnapshot.castingRuleVersion, LIUYAO_CASTING_RULE_VERSION);
  assert.deepEqual(result.castingFacts.lineValues, [
    { position: 1, value: 6 }, { position: 2, value: 7 }, { position: 3, value: 8 },
    { position: 4, value: 9 }, { position: 5, value: 7 }, { position: 6, value: 8 },
  ]);
  assert.equal(result.lines.filter((line) => line.isChanging).length, 2);
  assert.equal(result.lines.find((line) => line.position === 1)?.changed?.naJia !== undefined, true);
});
