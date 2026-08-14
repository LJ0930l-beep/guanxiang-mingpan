import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateAstrologyView,
  calculateBaziView,
  calculateLiuyaoView,
  calculateZiweiView,
} from '../src/services/chart-engine.ts';

const generatedAt = '2026-01-01T00:00:00.000Z';
const fixedCalculation = {
  generatedAt,
  seed: 'fixture-liuyao-seed-v1',
  date: '2026-01-01T12:00:00.000Z',
};

const fixtureProfile = {
  id: 'fixture-2001-shenzhen',
  name: '样例命主',
  relationship: '本人',
  birthDate: '2001-09-08',
  birthTime: '20:30',
  birthCity: '广东省深圳市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 22.5431,
  longitude: 114.0579,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

test('八字固定样例保持四柱与关系证据稳定', () => {
  const result = calculateBaziView(fixtureProfile, undefined, fixedCalculation);

  assert.equal(result.generatedAt, generatedAt);
  assert.equal(result.engineVersion, 'taibu-core@3.4.0/bazi');
  assert.equal(result.snapshotVersion, 1);
  assert.deepEqual(result.inputSnapshot, {
    type: 'birth',
    profileId: 'fixture-2001-shenzhen',
    birthDate: '2001-09-08',
    birthTime: '20:30',
    timeKnown: true,
    birthCity: '广东省深圳市',
    calendar: 'solar',
    gender: 'male',
    latitude: 22.5431,
    longitude: 114.0579,
  });
  assert.equal(result.dayMaster, '甲');
  assert.deepEqual(
    result.pillars.map(({ key, stem, branch, tenGod, hiddenStems, naYin }) => ({
      key,
      stem,
      branch,
      tenGod,
      hiddenStems,
      naYin,
    })),
    [
      { key: 'year', stem: '辛', branch: '巳', tenGod: '正官', hiddenStems: ['丙·食神', '庚·七杀', '戊·偏财'], naYin: '白蜡金' },
      { key: 'month', stem: '丁', branch: '酉', tenGod: '伤官', hiddenStems: ['辛·正官'], naYin: '山下火' },
      { key: 'day', stem: '甲', branch: '戌', tenGod: undefined, hiddenStems: ['戊·偏财', '辛·正官', '丁·伤官'], naYin: '山头火' },
      { key: 'hour', stem: '甲', branch: '戌', tenGod: '比肩', hiddenStems: ['戊·偏财', '辛·正官', '丁·伤官'], naYin: '山头火' },
    ],
  );
  assert.equal(result.kongWang, '甲戌旬 · 空 申、酉');
  assert.deepEqual(result.relations, ['巳酉半合金局', '酉戌相害', '酉戌相害', '恃势之刑']);
});

test('紫微固定样例保持十二宫、命身主与四化稳定', () => {
  const result = calculateZiweiView(fixtureProfile, undefined, fixedCalculation);
  const lifePalace = result.palaces.find((palace) => palace.name === '命宫');

  assert.equal(result.generatedAt, generatedAt);
  assert.equal(result.engineVersion, 'iztro@2.5.8');
  assert.equal(result.solarDate, '2001-9-8');
  assert.equal(result.lunarDate, '二〇〇一年七月廿一');
  assert.equal(result.soul, '戌');
  assert.equal(result.body, '午');
  assert.equal(result.fiveElement, '木三局');
  assert.equal(result.lifeMasterStar, '禄存');
  assert.equal(result.bodyMasterStar, '天机');
  assert.equal(result.palaces.length, 12);
  assert.deepEqual(lifePalace, {
    name: '命宫',
    stemBranch: '戊戌',
    isBodyPalace: false,
    stars: ['贪狼·庙'],
    minorStars: ['左辅', '擎羊'],
    decadalRange: '3–12岁',
  });
  assert.deepEqual(result.mutagens, ['文曲化科入官禄', '太阳化权入疾厄', '巨门化禄入父母', '文昌化忌入福德']);
});

test('西方星盘固定样例保持精确模式、角点和标准十星', () => {
  const result = calculateAstrologyView(fixtureProfile, fixedCalculation);

  assert.equal(result.generatedAt, generatedAt);
  assert.equal(result.engineVersion, 'circular-natal-horoscope-js@1.1.0');
  assert.equal(result.calculationMode, 'exact');
  assert.equal(result.sunSign, '处女座');
  assert.equal(result.moonSign, '金牛座');
  assert.equal(result.ascendant, '白羊座');
  assert.equal(result.midheaven, '摩羯座');
  assert.deepEqual(result.factors.map(({ key, sign, degree, house }) => ({ key, sign, degree, house })), [
    { key: 'sun', sign: '处女座', degree: '15°55′', house: 5 },
    { key: 'moon', sign: '金牛座', degree: '18°46′', house: 1 },
    { key: 'mercury', sign: '天秤座', degree: '10°28′', house: 6 },
    { key: 'venus', sign: '狮子座', degree: '14°46′', house: 5 },
    { key: 'mars', sign: '射手座', degree: '29°53′', house: 9 },
    { key: 'jupiter', sign: '巨蟹座', degree: '11°08′', house: 3 },
    { key: 'saturn', sign: '双子座', degree: '14°40′', house: 2 },
    { key: 'uranus', sign: '水瓶座', degree: '21°57′', house: 11 },
    { key: 'neptune', sign: '水瓶座', degree: '6°24′', house: 10 },
    { key: 'pluto', sign: '射手座', degree: '12°37′', house: 8 },
    { key: 'ascendant', sign: '白羊座', degree: '25°07′', house: undefined },
    { key: 'midheaven', sign: '摩羯座', degree: '17°43′', house: undefined },
  ]);
  assert.equal(result.aspects.length, 12);
  assert.deepEqual(result.aspects.slice(0, 3), [
    { label: '拱相', from: '太阳', to: '月亮', orb: '2.85°' },
    { label: '拱相', from: '太阳', to: '天顶', orb: '1.80°' },
    { label: '刑相', from: '太阳', to: '土星', orb: '1.26°' },
  ]);
});

test('六爻固定种子保持卦名、干支时间和六爻证据稳定', async () => {
  const question = '这个版本能否顺利完成并上线？';
  const target = '官鬼';
  const result = await calculateLiuyaoView(question, target, fixedCalculation);
  const repeated = await calculateLiuyaoView(question, target, fixedCalculation);

  assert.deepEqual(repeated, result);
  assert.equal(result.generatedAt, generatedAt);
  assert.equal(result.engineVersion, 'taibu-core@3.4.0/liuyao+guanxiang-rng-v1');
  assert.equal(result.snapshotVersion, 1);
  assert.equal(result.seed, fixedCalculation.seed);
  assert.equal(result.date, fixedCalculation.date);
  assert.equal(result.seedScope, 'guanxiang-local-v1');
  assert.deepEqual(result.inputSnapshot, {
    type: 'liuyao',
    question,
    target,
    seed: fixedCalculation.seed,
    date: fixedCalculation.date,
    seedScope: 'guanxiang-local-v1',
  });
  assert.equal(result.question, question);
  assert.equal(result.hexagramName, '离为火');
  assert.equal(result.changedHexagramName, '风火家人');
  assert.equal(result.hexagramGong, '离宫 · 火行');
  assert.equal(result.ganZhiTime, '乙巳年 戊子月 乙亥日 丙戌时');
  assert.equal(result.kongWang, '甲戌旬 · 空 申、酉');
  assert.deepEqual(result.lines.map(({ position, yinYang, liuQin, liuShen, naJia, wuXing, isChanging, isShiYao, isYingYao, strength, evidence }) => ({
    position,
    yinYang,
    liuQin,
    liuShen,
    naJia,
    wuXing,
    isChanging,
    isShiYao,
    isYingYao,
    strength,
    evidence,
  })), [
    { position: 6, yinYang: '阳', liuQin: '兄弟', liuShen: '玄武', naJia: '巳', wuXing: '火', isChanging: false, isShiYao: true, isYingYao: false, strength: '死', evidence: ['月令死', '月克', '休囚逢冲为日破'] },
    { position: 5, yinYang: '阴', liuQin: '子孙', liuShen: '白虎', naJia: '未', wuXing: '土', isChanging: true, isShiYao: false, isYingYao: false, strength: '囚', evidence: ['月令囚', '明动'] },
    { position: 4, yinYang: '阳', liuQin: '妻财', liuShen: '螣蛇', naJia: '酉', wuXing: '金', isChanging: true, isShiYao: false, isYingYao: false, strength: '休', evidence: ['月令休', '明动', '动空'] },
    { position: 3, yinYang: '阳', liuQin: '官鬼', liuShen: '勾陈', naJia: '亥', wuXing: '水', isChanging: false, isShiYao: false, isYingYao: true, strength: '旺', evidence: ['月令旺', '月扶', '日扶'] },
    { position: 2, yinYang: '阴', liuQin: '子孙', liuShen: '朱雀', naJia: '丑', wuXing: '土', isChanging: false, isShiYao: false, isYingYao: false, strength: '囚', evidence: ['月令囚'] },
    { position: 1, yinYang: '阳', liuQin: '父母', liuShen: '青龙', naJia: '卯', wuXing: '木', isChanging: false, isShiYao: false, isYingYao: false, strength: '相', evidence: ['月令相', '月生', '日生'] },
  ]);
});

test('输入边界不会把缺失时辰或未知城市伪装成精确结果', () => {
  const missingTime = { ...fixtureProfile, birthTime: undefined, timeKnown: false };
  assert.throws(() => calculateBaziView(missingTime), /需要准确出生时辰/);
  assert.throws(() => calculateZiweiView(missingTime), /需要准确出生时辰/);
  assert.throws(() => calculateAstrologyView(missingTime), /需要准确出生时辰/);

  const unknownCity = { ...fixtureProfile, birthCity: '福建省泉州市', latitude: undefined, longitude: undefined };
  const result = calculateAstrologyView(unknownCity, fixedCalculation);
  assert.equal(result.calculationMode, 'approximate');
  assert.equal(result.ascendant, undefined);
  assert.equal(result.midheaven, undefined);
  assert.equal(result.factors.some((factor) => factor.key === 'ascendant' || factor.key === 'midheaven'), false);
  assert.equal(result.factors.some((factor) => factor.house !== undefined), false);
});
