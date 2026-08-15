import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BAZI_TRUE_SOLAR_TIME_UNKNOWN,
  BAZI_TRUE_SOLAR_TIME_V1,
  BAZI_TRUE_SOLAR_TIME_V2,
} from '../src/domains/bazi/types.ts';
import {
  buildBaziCurrentRuleReplay,
  buildBaziTrueSolarEvidenceDisplay,
  UNKNOWN_BAZI_EVIDENCE_TEXT,
} from '../src/domains/bazi/true-solar-presentation.ts';
import { diffBaziInterpretations } from '../src/domains/bazi/interpretation/history.ts';
import { calculateBaziView } from '../src/services/chart-engine.ts';

const generatedAt = '2026-08-15T00:00:00.000Z';
const profile = {
  id: 'p5-a3b-replay',
  name: 'P5-A3b 复核命主',
  relationship: '本人',
  birthDate: '2024-01-15',
  birthTime: '00:23',
  birthCity: '北京市',
  timeKnown: true,
  calendar: 'solar',
  gender: 'male',
  latitude: 39.9042,
  longitude: 116.4074,
  createdAt: generatedAt,
  updatedAt: generatedAt,
};

function calculate(version, overrides = {}) {
  return calculateBaziView({ ...profile, ...overrides }, undefined, {
    generatedAt,
    bazi: {
      trueSolarTime: true,
      solarTimeModel: 'apparentSolarTime',
      trueSolarTimeVersion: version,
    },
  });
}

function row(display, label) {
  return display.rows.find(([key]) => key === label)?.[1];
}

test('P5-A3b 真太阳时展示准确区分 current/v1/unknown/not-applied', () => {
  const current = calculate(BAZI_TRUE_SOLAR_TIME_V2);
  const currentDisplay = buildBaziTrueSolarEvidenceDisplay(current.calculationSettings, current.calculationEvidence);
  assert.equal(currentDisplay.status, 'current');
  assert.equal(currentDisplay.statusLabel, 'NOAA v2（当前规则）');
  assert.match(currentDisplay.summary, /NOAA Solar Calculator equation-of-time PDF/);
  assert.match(currentDisplay.summary, /https:\/\/gml\.noaa\.gov\/grad\/solcalc\/solareqns\.PDF/);
  assert.match(currentDisplay.summary, /原始修正：/);
  assert.match(currentDisplay.summary, /展示修正：/);
  assert.match(currentDisplay.summary, /实际应用修正：/);
  assert.match(currentDisplay.summary, /舍入：对称 half-away-from-zero/);
  assert.equal(row(currentDisplay, '有效计算时刻'), '2024-01-15T00:00:00');

  const legacy = calculate(BAZI_TRUE_SOLAR_TIME_V1);
  const legacyDisplay = buildBaziTrueSolarEvidenceDisplay(legacy.calculationSettings, legacy.calculationEvidence);
  assert.equal(legacyDisplay.status, 'legacy');
  assert.equal(legacyDisplay.statusLabel, 'v1 近似公式（仅历史复现，非 NOAA）');
  assert.doesNotMatch(legacyDisplay.summary, /NOAA v2/);
  assert.match(legacyDisplay.summary, /非 NOAA/);

  const unknownEvidence = {
    ...legacy.calculationEvidence,
    effectiveCalculationTime: undefined,
    trueSolarCorrection: {
      model: 'apparentSolarTime',
      algorithmVersion: BAZI_TRUE_SOLAR_TIME_UNKNOWN,
      civilTime: legacy.calculationEvidence.trueSolarCorrection.civilTime,
      roundingRule: 'legacy-unknown',
      dataSource: 'legacy-record',
      dataVersion: BAZI_TRUE_SOLAR_TIME_UNKNOWN,
      provenanceStatus: 'unknown',
    },
  };
  const unknownDisplay = buildBaziTrueSolarEvidenceDisplay(legacy.calculationSettings, unknownEvidence);
  assert.equal(unknownDisplay.status, 'unknown');
  assert.equal(unknownDisplay.statusLabel, '历史版本未知');
  assert.equal(row(unknownDisplay, '应用状态'), UNKNOWN_BAZI_EVIDENCE_TEXT);
  assert.equal(row(unknownDisplay, '原始修正'), UNKNOWN_BAZI_EVIDENCE_TEXT);
  assert.equal(row(unknownDisplay, '展示修正'), UNKNOWN_BAZI_EVIDENCE_TEXT);
  assert.equal(row(unknownDisplay, '实际应用修正'), UNKNOWN_BAZI_EVIDENCE_TEXT);
  assert.equal(row(unknownDisplay, '有效计算时刻'), UNKNOWN_BAZI_EVIDENCE_TEXT);
  assert.equal(unknownDisplay.hasConflict, true);
  assert.match(unknownDisplay.conflictMessage, /证据版本未知/);

  const notApplied = calculateBaziView(profile, undefined, { generatedAt });
  const notAppliedDisplay = buildBaziTrueSolarEvidenceDisplay(notApplied.calculationSettings, notApplied.calculationEvidence);
  assert.equal(notAppliedDisplay.status, 'not-applied');
  assert.equal(notAppliedDisplay.statusLabel, '未启用');
  assert.equal(row(notAppliedDisplay, '应用状态'), '明确未应用');
  assert.equal(notAppliedDisplay.hasConflict, false);
});

test('P5-A3b 保存设置与保存证据版本冲突时显式提示', () => {
  const v1 = calculate(BAZI_TRUE_SOLAR_TIME_V1);
  const v2 = calculate(BAZI_TRUE_SOLAR_TIME_V2);
  const display = buildBaziTrueSolarEvidenceDisplay(v1.calculationSettings, v2.calculationEvidence);
  assert.equal(display.status, 'current');
  assert.equal(display.hasConflict, true);
  assert.match(display.conflictMessage, /保存设置与保存证据不一致/);
  assert.equal(display.settingsVersionLabel, 'v1 近似公式（仅历史复现，非 NOAA）');
  assert.equal(display.evidenceVersionLabel, 'NOAA v2（当前规则）');
});

test('P5-A3b 真太阳时与子初换日跨界展示最终有效计算时刻', () => {
  const crossing = calculateBaziView({
    ...profile,
    birthTime: '22:56',
    birthCity: '东经121度测试点',
    latitude: 30,
    longitude: 121,
  }, undefined, {
    generatedAt,
    bazi: {
      dayBoundary: 'ziEarly',
      trueSolarTime: true,
      solarTimeModel: 'localMeanSolarTime',
      trueSolarTimeVersion: BAZI_TRUE_SOLAR_TIME_V2,
    },
  });
  const display = buildBaziTrueSolarEvidenceDisplay(crossing.calculationSettings, crossing.calculationEvidence);
  assert.equal(crossing.calculationEvidence.trueSolarCorrection.effectiveTime, '2024-01-15T23:00:00');
  assert.equal(crossing.calculationEvidence.effectiveCalculationTime, '2024-01-16T23:00:00');
  assert.equal(row(display, '有效计算时刻'), '2024-01-16T23:00:00');
  assert.equal(row(display, '民用时刻'), '2024-01-15T22:56:00');
  assert.equal(row(display, '归一化民用时刻'), '2024-01-15T22:56:00');
});

test('P5-A3b 当前规则复核强制 v2，且边界 fixture 可与 v1 产生不同结果', () => {
  const v1 = calculate(BAZI_TRUE_SOLAR_TIME_V1);
  const savedReading = {
    id: 'reading-p5-a3b',
    profileId: profile.id,
    profileName: profile.name,
    module: 'bazi',
    title: 'v1 历史结果',
    summary: '历史快照',
    createdAt: generatedAt,
    engineVersion: v1.engineVersion,
    interpretationVersion: v1.interpretation.interpretationVersion,
    snapshotMeta: v1,
    inputSnapshot: v1.inputSnapshot,
    profileSnapshot: profile,
    normalizedChartSnapshot: v1.normalizedChart,
    evidenceGraphSnapshot: v1.evidenceGraph,
    interpretationSnapshot: v1.interpretation,
    favorite: false,
    feedback: [],
    payload: v1,
  };
  const before = structuredClone(savedReading);
  const replay = buildBaziCurrentRuleReplay(savedReading.profileSnapshot, savedReading.inputSnapshot, savedReading.payload.calculationSettings);
  assert.equal(replay.settings.trueSolarTimeVersion, BAZI_TRUE_SOLAR_TIME_V2);
  assert.equal(replay.settings.timezone, 'Asia/Shanghai');
  assert.equal(replay.profile.birthTime, '00:23');
  assert.equal(replay.profile.longitude, 116.4074);
  const current = calculateBaziView(replay.profile, replay.profile.gender, {
    generatedAt,
    timezone: replay.settings.timezone,
    bazi: replay.settings,
  });
  assert.equal(current.calculationEvidence.trueSolarCorrection.algorithmVersion, BAZI_TRUE_SOLAR_TIME_V2);
  assert.equal(v1.calculationEvidence.effectiveCalculationTime, '2024-01-14T23:59:00');
  assert.equal(current.calculationEvidence.effectiveCalculationTime, '2024-01-15T00:00:00');
  assert.notDeepEqual(
    savedReading.payload.pillars.map((pillar) => `${pillar.stem}${pillar.branch}`),
    current.pillars.map((pillar) => `${pillar.stem}${pillar.branch}`),
  );
  diffBaziInterpretations(savedReading.interpretationSnapshot, current.interpretation);
  assert.deepEqual(savedReading, before);
});

test('P5-A3b legacy-unknown 复核使用 v2，缺时辰或缺经度时明确拒绝', () => {
  const v1 = calculate(BAZI_TRUE_SOLAR_TIME_V1);
  const unknownSettings = { ...v1.calculationSettings, trueSolarTimeVersion: BAZI_TRUE_SOLAR_TIME_UNKNOWN };
  const replay = buildBaziCurrentRuleReplay(profile, v1.inputSnapshot, unknownSettings);
  assert.equal(replay.settings.trueSolarTimeVersion, BAZI_TRUE_SOLAR_TIME_V2);

  const missingLongitude = { ...v1.inputSnapshot };
  delete missingLongitude.longitude;
  assert.throws(
    () => buildBaziCurrentRuleReplay(profile, missingLongitude, v1.calculationSettings),
    /经度.*无法确认.*未猜测/,
  );

  const missingTime = { ...v1.inputSnapshot, birthTime: undefined, timeKnown: false };
  assert.throws(
    () => buildBaziCurrentRuleReplay(profile, missingTime, v1.calculationSettings),
    /需要保存的出生时辰.*未保存准确时辰/,
  );
});
