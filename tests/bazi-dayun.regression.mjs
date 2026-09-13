import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculateBaziView } from '../src/services/chart-engine.ts';
import {
  BAZI_DAYUN_ENTRY_COUNT,
  BAZI_DAYUN_RULE_VERSION,
  BAZI_DAYUN_SOURCE,
  assertLiunianYear,
  buildBaziTimeLayer,
  tenGodOf,
} from '../src/domains/bazi/dayun.ts';
import { resolveSolarTermBoundary } from '../src/domains/bazi/solar-terms.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const generatedAt = '2026-01-01T00:00:00.000Z';

const fixtureProfile = {
  id: 'fixture-1990-beijing-dayun',
  name: '大运样例命主',
  relationship: '本人',
  birthDate: '1990-06-15',
  birthTime: '10:30',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function ganZhiFromIndex(index) {
  const normalized = ((index % 60) + 60) % 60;
  return STEMS[normalized % 10] + BRANCHES[normalized % 12];
}

function ganZhiIndex(stem, branch) {
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === STEMS.indexOf(stem) && index % 12 === BRANCHES.indexOf(branch)) return index;
  }
  throw new Error(`未知干支：${stem}${branch}`);
}

/** Independent ten-god reference table used to lock the mapping. */
const TEN_GOD_REFERENCE = {
  '甲甲': '比肩', '甲乙': '劫财', '甲丙': '食神', '甲丁': '伤官', '甲戊': '偏财',
  '甲己': '正财', '甲庚': '七杀', '甲辛': '正官', '甲壬': '偏印', '甲癸': '正印',
  '庚庚': '比肩', '庚辛': '劫财', '庚壬': '食神', '庚癸': '伤官', '庚甲': '偏财',
  '庚乙': '正财', '庚丙': '七杀', '庚丁': '正官', '庚戊': '偏印', '庚己': '正印',
  '辛辛': '比肩', '辛庚': '劫财', '辛癸': '食神', '辛壬': '伤官', '辛甲': '正财',
  '辛乙': '偏财', '辛丙': '正官', '辛丁': '七杀', '辛戊': '正印', '辛己': '偏印',
};

const SHANGHAI_OFFSET_MINUTES = 480;

function civilToEpochMs(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  assert.ok(match, `civil time format: ${value}`);
  const [, y, m, d, hh, mm, ss = '00'] = match;
  return Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss)) - SHANGHAI_OFFSET_MINUTES * 60 * 1000;
}

function runTimeLayerFixture(hostTimezone, liunianYear) {
  const source = `
    import { calculateBaziView } from './src/services/chart-engine.ts';
    const profile = ${JSON.stringify(fixtureProfile)};
    const result = calculateBaziView(profile, undefined, {
      generatedAt: ${JSON.stringify(generatedAt)},
      bazi: ${liunianYear === undefined ? '{}' : `{ liunianYear: ${liunianYear} }`},
    });
    process.stdout.write(JSON.stringify({
      timeLayer: result.timeLayer,
      pillars: result.pillars.map((pillar) => ({ key: pillar.key, stem: pillar.stem, branch: pillar.branch })),
      settingsLiunianYear: result.calculationSettings.liunianYear,
      snapshotLiunianYear: result.inputSnapshot.liunianYear,
      fingerprint: result.inputFingerprint,
      effectiveCalculationTime: result.calculationEvidence.effectiveCalculationTime,
    }));
  `;
  return JSON.parse(execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-loader', './scripts/ts-path-loader.mjs', '-e', source],
    { cwd: projectRoot, env: { ...process.env, TZ: hostTimezone }, encoding: 'utf8' },
  ));
}

test('bazi-dayun-v1 大运方向、序列与起运折算在宿主时区下稳定', () => {
  const utc = runTimeLayerFixture('UTC');
  const shanghai = runTimeLayerFixture('Asia/Shanghai');
  assert.deepEqual(utc, shanghai);

  const { timeLayer, pillars, effectiveCalculationTime } = utc;
  assert.ok(timeLayer, 'exact charts must carry a time layer');
  assert.equal(timeLayer.ruleVersion, BAZI_DAYUN_RULE_VERSION);
  assert.equal(timeLayer.source, BAZI_DAYUN_SOURCE);

  const monthPillar = pillars.find((pillar) => pillar.key === 'month');
  const yearStem = pillars.find((pillar) => pillar.key === 'year').stem;
  const expectedForward = ['甲', '丙', '戊', '庚', '壬'].includes(yearStem);
  assert.equal(timeLayer.direction, expectedForward ? 'forward' : 'backward');
  assert.equal(timeLayer.monthPillarGanZhi, `${monthPillar.stem}${monthPillar.branch}`);

  const monthIndex = ganZhiIndex(monthPillar.stem, monthPillar.branch);
  const step = expectedForward ? 1 : -1;
  assert.equal(timeLayer.dayuns.length, BAZI_DAYUN_ENTRY_COUNT);
  for (const [index, entry] of timeLayer.dayuns.entries()) {
    assert.equal(entry.index, index + 1);
    assert.equal(entry.ganZhi, ganZhiFromIndex(monthIndex + step * (index + 1)));
    assert.equal(entry.endAge - entry.startAge, 10);
    if (index > 0) {
      assert.equal(entry.startAge, timeLayer.dayuns[index - 1].startAge + 10);
      assert.equal(entry.startDate, timeLayer.dayuns[index - 1].endDate);
    }
  }

  const resolution = resolveSolarTermBoundary(effectiveCalculationTime);
  const birthEpochMs = civilToEpochMs(effectiveCalculationTime);
  const distanceDays = (expectedForward
    ? resolution.nextTerm.epochMs - birthEpochMs
    : birthEpochMs - resolution.recentTerm.epochMs) / (24 * 60 * 60 * 1000);
  assert.ok(distanceDays > 0);
  assert.equal(timeLayer.qiYun.distanceDays, Math.round(distanceDays * 1000) / 1000);
  assert.equal(timeLayer.qiYun.years, Math.floor(distanceDays / 3));
  assert.equal(timeLayer.qiYun.anchor, 'effective-calculation-time');
  assert.match(timeLayer.qiYun.date, /^\d{4}-\d{2}-\d{2}$/);
});

test('bazi-dayun-v1 流年对照锁定立春干支、十神映射与输入指纹', () => {
  const withLiunian = runTimeLayerFixture('Asia/Shanghai', 2024);
  assert.equal(withLiunian.timeLayer.liunian.year, 2024);
  assert.equal(withLiunian.timeLayer.liunian.yearGanZhi, '甲辰');
  assert.equal(withLiunian.settingsLiunianYear, 2024);
  assert.equal(withLiunian.snapshotLiunianYear, 2024);
  assert.equal(withLiunian.timeLayer.liunian.anchor, 'lichun-exact');

  const dayStem = withLiunian.pillars.find((pillar) => pillar.key === 'day').stem;
  const expectedTenGod = TEN_GOD_REFERENCE[`${dayStem}甲`];
  assert.ok(expectedTenGod, 'reference table must cover the fixture day stem');
  assert.equal(withLiunian.timeLayer.liunian.yearStemTenGod, expectedTenGod);

  const birthYear = Number(fixtureProfile.birthDate.slice(0, 4));
  const age = 2024 - birthYear;
  const covering = withLiunian.timeLayer.dayuns.find((entry) => age >= entry.startAge && age < entry.endAge);
  assert.ok(covering, '2024 must fall inside a dayun entry for the fixture');
  assert.deepEqual(withLiunian.timeLayer.liunian.coveredByDayun, {
    index: covering.index, ganZhi: covering.ganZhi, startAge: covering.startAge, endAge: covering.endAge,
  });

  const withoutLiunian = runTimeLayerFixture('Asia/Shanghai');
  assert.equal(withoutLiunian.timeLayer.liunian, undefined);
  assert.notEqual(withLiunian.fingerprint, withoutLiunian.fingerprint);
});

test('bazi-dayun-v1 女性命主取逆行且大运序列相应反排', () => {
  const femaleProfile = { ...fixtureProfile, id: 'fixture-1990-beijing-dayun-f', gender: 'female' };
  const result = calculateBaziView(femaleProfile, undefined, { generatedAt });
  const yearStem = result.pillars.find((pillar) => pillar.key === 'year').stem;
  const expectedForward = ['甲', '丙', '戊', '庚', '壬'].includes(yearStem);
  // Same yang-year stem: a female chart must run backward while the male runs forward.
  assert.equal(result.timeLayer.direction, expectedForward ? 'backward' : 'forward');
  assert.equal(result.timeLayer.dayuns.length, BAZI_DAYUN_ENTRY_COUNT);
});

test('bazi-dayun-v1 十神映射与流年范围校验拒绝非法输入', () => {
  for (const [pair, expected] of Object.entries(TEN_GOD_REFERENCE)) {
    assert.equal(tenGodOf(pair[0], pair[1]), expected, pair);
  }
  assert.throws(() => tenGodOf('甲', 'X'), /未知天干/);
  assert.throws(() => assertLiunianYear(1899), /1900-2099/);
  assert.throws(() => assertLiunianYear(2100), /1900-2099/);
  assert.throws(() => assertLiunianYear(2024.5), /1900-2099/);
  assert.doesNotThrow(() => assertLiunianYear(1900));
  assert.doesNotThrow(() => assertLiunianYear(2099));

  assert.throws(
    () => calculateBaziView(fixtureProfile, undefined, { generatedAt, bazi: { liunianYear: 1800 } }),
    /流年对照年份必须在 1900-2099 之间/,
  );
});

test('bazi-dayun-v1 时间层不改变八字解释快照八块合同', () => {
  const result = calculateBaziView(fixtureProfile, undefined, { generatedAt, bazi: { liunianYear: 2024 } });
  assert.equal(result.explanation.blocks.length, 8);
  assert.ok(result.timeLayer);
  assert.ok(result.timeLayer.caveats.some((caveat) => caveat.includes('不构成运势、吉凶或应期结论')));
});

test('bazi-dayun-v1 buildBaziTimeLayer 拒绝未知干支输入', () => {
  assert.throws(
    () => buildBaziTimeLayer({
      gender: 'male',
      yearStem: '庚',
      monthStem: 'X',
      monthBranch: '午',
      dayStem: '甲',
      natalBranches: [{ key: 'day', branch: '子' }],
      birthDate: '1990-06-15',
      effectiveCivilTime: '1990-06-15T10:30',
    }),
    /未知干支|不存在/,
  );
});
