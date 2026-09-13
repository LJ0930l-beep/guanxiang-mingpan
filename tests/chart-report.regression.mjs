import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { calculateAstrologyView, calculateBaziView, calculateLiuyaoView, calculateZiweiView } from '../src/services/chart-engine.ts';
import { CHART_REPORT_VERSION } from '../src/domains/report/types.ts';
import { palaceFullName } from '../src/domains/ziwei/interpretation/knowledge.ts';

const projectRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const generatedAt = '2026-08-15T00:00:00.000Z';
const FORBIDDEN = /一定|必然|注定|必有|疾病|死亡|投资收益|成功|失败|何时|应期/;

const birthProfile = {
  id: 'report-fixture',
  name: '报告样例命主',
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

function assertReportShape(report, expectedHeadings) {
  assert.ok(report, 'payload must carry a report');
  assert.equal(report.version, CHART_REPORT_VERSION);
  assert.ok(report.title.length >= 6);
  assert.ok(report.summary.length >= 10);
  for (const heading of expectedHeadings) {
    assert.ok(report.sections.some((section) => section.heading === heading), `missing section: ${heading}`);
  }
  for (const section of report.sections) {
    assert.ok(section.paragraphs.length >= 1, `${section.heading} must have paragraphs`);
    for (const paragraph of section.paragraphs) {
      assert.ok(!FORBIDDEN.test(paragraph), `${section.heading}: ${paragraph}`);
    }
  }
  assert.deepEqual(JSON.parse(JSON.stringify(report)), report, 'report must be plain JSON-safe data');
}

test('紫微报告逐宫与逐条四化覆盖整个盘面', () => {
  const view = calculateZiweiView(birthProfile, undefined, { generatedAt });
  assertReportShape(view.report, ['盘面概览', '命宫主星解读', '生年四化逐条解读', '十二宫逐宫速览', '三方四正与阅读路线', '边界与复盘建议']);
  const palaces = view.report.sections.find((section) => section.heading === '十二宫逐宫速览');
  assert.equal(palaces.paragraphs.length, view.normalizedChart.palaces.length);
  for (const edge of view.normalizedChart.mutagenEdges) {
    const joined = view.report.sections.find((section) => section.heading === '生年四化逐条解读').paragraphs.join('');
    const palace = view.normalizedChart.palaces.find((item) => item.id === edge.palaceRefId);
    assert.ok(joined.includes(`${edge.starName}化${edge.mutagen}落入${palaceFullName(palace.name)}（`));
  }
});

test('八字报告覆盖四柱、强弱与大运，部分盘单独说明', () => {
  const exact = calculateBaziView(birthProfile, undefined, { generatedAt, bazi: { liunianYear: 2024 } });
  assertReportShape(exact.report, ['四柱概览', '强弱与结构判断', '月令与十神分布', '大运与流年对照', '边界与复盘建议']);
  const timeLayer = exact.report.sections.find((section) => section.heading === '大运与流年对照');
  assert.ok(timeLayer.paragraphs.join('').includes('起运'));
  assert.ok(timeLayer.paragraphs.join('').includes('2024'));
  assert.ok(timeLayer.paragraphs.join('').includes(exact.pillars.find((pillar) => pillar.key === 'day').stem));

  const partial = calculateBaziView({ ...birthProfile, id: 'report-fixture-partial', birthTime: undefined, timeKnown: false }, undefined, { generatedAt });
  assertReportShape(partial.report, ['四柱概览', '强弱与结构判断', '部分盘说明', '边界与复盘建议']);
  assert.ok(partial.report.sections.find((section) => section.heading === '部分盘说明').paragraphs.join('').includes('时柱不补造'));
});

test('六爻报告覆盖卦象、用神与世应', async () => {
  const view = await calculateLiuyaoView('这次岗位调整对我的影响如何评估', '父母', { generatedAt, seed: 'report-seed-v1', date: generatedAt });
  assertReportShape(view.report, ['卦象概览', '用神判断', '世应结构', '旺衰与观察窗口', '边界与复盘建议']);
  const hexagram = view.report.sections.find((section) => section.heading === '卦象概览');
  assert.ok(hexagram.paragraphs.join('').includes(view.hexagramName));
  assert.ok(view.report.sections.find((section) => section.heading === '用神判断').paragraphs.join('').includes(view.normalizedChart.yongShenTarget));
});

test('占星报告在精确与近似模式下都生成且遵守精度边界', () => {
  const exact = calculateAstrologyView(birthProfile, { generatedAt });
  assertReportShape(exact.report, ['盘面概览', '太阳与月亮', '行星落座', '主要相位', '边界与复盘建议']);
  assert.ok(exact.report.sections.find((section) => section.heading === '太阳与月亮').paragraphs.join('').includes(exact.sunSign));

  const approximate = calculateAstrologyView({ ...birthProfile, id: 'report-fixture-partial', birthTime: undefined, timeKnown: false }, { generatedAt });
  assertReportShape(approximate.report, ['盘面概览', '太阳与月亮', '边界与复盘建议']);
  assert.ok(!approximate.report.sections.some((section) => section.heading === '主要相位'), 'approximate charts must not read aspects');
  assert.ok(approximate.report.summary.includes('未返回') || approximate.report.summary.includes('月亮'));
});

test('报告随快照进入 TZ 无关的完整载荷', () => {
  const source = `
    import { calculateZiweiView } from './src/services/chart-engine.ts';
    const view = calculateZiweiView(${JSON.stringify(birthProfile)}, undefined, ${JSON.stringify({ generatedAt })});
    process.stdout.write(JSON.stringify(view.report));
  `;
  const utc = JSON.parse(execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-loader', './scripts/ts-path-loader.mjs', '-e', source],
    { cwd: projectRoot, env: { ...process.env, TZ: 'UTC' }, encoding: 'utf8' },
  ));
  const shanghai = JSON.parse(execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--experimental-loader', './scripts/ts-path-loader.mjs', '-e', source],
    { cwd: projectRoot, env: { ...process.env, TZ: 'Asia/Shanghai' }, encoding: 'utf8' },
  ));
  assert.deepEqual(utc, shanghai);
});
