import { calculateLiuyao } from 'taibu-core/liuyao';

import type { LiuyaoChartView } from '@/types/charts';
import { CHART_SNAPSHOT_VERSION, ENGINE_VERSIONS, generatedAt, LIUYAO_SEED_SCOPE, strengthLabels } from '@/services/chart-engine-shared';
import type { CalculationOptions } from '@/services/chart-engine-shared';

export async function calculateLiuyaoView(
  question: string,
  target: string,
  options?: CalculationOptions,
): Promise<LiuyaoChartView> {
  const seed = options?.seed ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const date = options?.date ?? new Date().toISOString();
  const seedScope = LIUYAO_SEED_SCOPE;
  const result = await calculateLiuyao({
    question,
    yongShenTargets: [target as '父母' | '兄弟' | '官鬼' | '妻财' | '子孙'],
    method: 'auto',
    date,
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

  return {
    module: 'liuyao',
    snapshotVersion: CHART_SNAPSHOT_VERSION,
    generatedAt: generatedAt(options),
    engineVersion: ENGINE_VERSIONS.liuyao,
    inputSnapshot: { type: 'liuyao', question, target, seed, date, seedScope },
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
    focus: [
      `本卦「${result.hexagramName}」${result.changedHexagramName ? `变「${result.changedHexagramName}」` : '无变卦'}。`,
      moving.length ? `共有 ${moving.length} 个动爻：${moving.map((line) => `${line.position}爻`).join('、')}，复盘时应优先核对动变。` : '本次为静卦，后续复盘应侧重世应、月日与用神状态。',
      `本次以「${target}」为用神方向；页面同时保留纳甲、六亲、六神、世应、空亡与旺衰证据。`,
    ],
  };
}
