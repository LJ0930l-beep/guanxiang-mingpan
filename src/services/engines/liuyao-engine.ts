import { calculateLiuyao } from 'taibu-core/liuyao';

import type { LiuyaoChartView } from '@/types/charts';
import { calculationSettings, CHART_SNAPSHOT_VERSION, ENGINE_VERSIONS, generatedAt, LIUYAO_SEED_SCOPE, normalizeLiuyaoDate, strengthLabels } from '@/services/chart-engine-shared';
import type { CalculationOptions } from '@/services/chart-engine-shared';
import { normalizeLiuyaoChart } from '@/domains/liuyao/model/normalized-chart';
import { buildLiuyaoEvidenceGraph } from '@/domains/liuyao/evidence/index';
import { buildLiuyaoExplanation } from '@/domains/liuyao/explanation/index';

export async function calculateLiuyaoView(
  question: string,
  target: string,
  options?: CalculationOptions,
): Promise<LiuyaoChartView> {
  const seed = options?.seed ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const date = options?.date ?? new Date().toISOString();
  const settings = calculationSettings(options);
  const calculationDate = normalizeLiuyaoDate(date, settings.timezone);
  const seedScope = LIUYAO_SEED_SCOPE;
  const result = await calculateLiuyao({
    question,
    yongShenTargets: [target as '父母' | '兄弟' | '官鬼' | '妻财' | '子孙'],
    method: 'auto',
    date: calculationDate,
    seed,
    seedScope,
    detailLevel: 'more',
  });
  const lines = result.fullYaos
    .slice()
    .sort((a, b) => b.position - a.position)
    .map((line) => ({
      position: line.position,
      yinYang: line.type === 1 ? ('阳' as const) : ('阴' as const),
      liuQin: line.liuQin,
      liuShen: line.liuShen,
      naJia: line.naJia,
      wuXing: line.wuXing,
      isChanging: line.isChanging,
      isShiYao: line.isShiYao,
      isYingYao: line.isYingYao,
      strength: line.strength?.wangShuai ? (strengthLabels[line.strength.wangShuai] ?? line.strength.wangShuai) : undefined,
      evidence: line.strength?.evidence?.slice(0, 3) ?? [],
    }));
  const moving = lines.filter((line) => line.isChanging);
  const time = result.ganZhiTime;
  const generated = generatedAt(options);
  const normalizedChart = normalizeLiuyaoChart({
    question,
    yongShenTarget: target,
    seed,
    date: calculationDate,
    seedScope,
    hexagramName: result.hexagramName,
    changedHexagramName: result.changedHexagramName,
    hexagramGong: `${result.hexagramGong}宫 · ${result.hexagramElement}行`,
    ganZhiTime: `${time.year.gan}${time.year.zhi}年 ${time.month.gan}${time.month.zhi}月 ${time.day.gan}${time.day.zhi}日 ${time.hour.gan}${time.hour.zhi}时`,
    kongWang: `${result.kongWang.xun} · 空 ${result.kongWang.kongDizhi.join('、')}`,
    lines,
  }, { engineVersion: ENGINE_VERSIONS.liuyao, snapshotVersion: CHART_SNAPSHOT_VERSION });
  const evidenceGraph = buildLiuyaoEvidenceGraph(normalizedChart, { engineVersion: ENGINE_VERSIONS.liuyao });

  return {
    module: 'liuyao',
    snapshotVersion: CHART_SNAPSHOT_VERSION,
    generatedAt: generated,
    engineVersion: ENGINE_VERSIONS.liuyao,
    calculationSettings: settings,
    inputSnapshot: { type: 'liuyao', timezone: settings.timezone, question, target, seed, date, seedScope },
    completeness: 'complete',
    caveats: ['一次起卦对应一个具体问题；基础版保留盘面证据，不代替现实决策。'],
    question,
    seed,
    date,
    seedScope,
    hexagramName: result.hexagramName,
    changedHexagramName: result.changedHexagramName,
    hexagramGong: `${result.hexagramGong}宫 · ${result.hexagramElement}行`,
    ganZhiTime: `${time.year.gan}${time.year.zhi}年 ${time.month.gan}${time.month.zhi}月 ${time.day.gan}${time.day.zhi}日 ${time.hour.gan}${time.hour.zhi}时`,
    kongWang: `${result.kongWang.xun} · 空 ${result.kongWang.kongDizhi.join('、')}`,
    lines,
    normalizedChart,
    evidenceGraph,
    explanation: buildLiuyaoExplanation({ chart: normalizedChart, evidenceGraph, generatedAt: generated }),
    focus: [
      `本卦「${result.hexagramName}」${result.changedHexagramName ? `变「${result.changedHexagramName}」` : '无变卦'}。`,
      moving.length ? `共有 ${moving.length} 个动爻：${moving.map((line) => `${line.position}爻`).join('、')}，复盘时应优先核对动变。` : '本次为静卦，后续复盘应侧重世应、月日与用神状态。',
      `本次以「${target}」为用神方向；页面同时保留纳甲、六亲、六神、世应、空亡与旺衰证据。`,
    ],
  };
}
