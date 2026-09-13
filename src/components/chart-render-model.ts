import type { ChartPayload } from '@/types/charts';

function arrayOrEmpty<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export interface ChartRenderModel {
  pillars: { key: string; label: string; stem?: string; branch?: string; tenGod?: string; hiddenStems?: string[] }[];
  lines: { position: number; value?: number; yinYang: string; isChanging: boolean; isShiYao: boolean; isYingYao: boolean; liuQin?: string; naJia?: string; wuXing?: string; strength?: string }[];
  palaces: { name: string; stemBranch?: string; isBodyPalace?: boolean; stars?: string[]; minorStars?: string[]; decadalRange?: unknown }[];
  factors: { key: string; label: string; sign?: string; degree?: string; house?: number }[];
  aspects: { from: string; label: string; to: string; orb?: string }[];
  timeLayer: {
    directionLabel?: string;
    qiYun?: { years: number; months: number; days: number; date: string };
    dayuns: { index: number; ganZhi: string; startAge: number; endAge: number; startDate: string; endDate: string }[];
    liunian?: { year: number; yearGanZhi: string; yearStemTenGod: string; coveredByDayun?: { index: number; ganZhi: string } };
  } | null;
}

/**
 * Runtime-safe data preparation shared by live and archive rendering.
 * Missing legacy arrays stay empty: no fake facts and no recalculation.
 */
export function buildChartRenderModel(payload: ChartPayload): ChartRenderModel {
  const rawTimeLayer = (payload as { timeLayer?: unknown }).timeLayer;
  const timeLayer = (rawTimeLayer && typeof rawTimeLayer === 'object' ? rawTimeLayer : null) as ChartRenderModel['timeLayer'];
  return {
    pillars: arrayOrEmpty<ChartRenderModel['pillars'][number]>((payload as { pillars?: unknown }).pillars),
    lines: arrayOrEmpty<ChartRenderModel['lines'][number]>((payload as { lines?: unknown }).lines),
    palaces: arrayOrEmpty<ChartRenderModel['palaces'][number]>((payload as { palaces?: unknown }).palaces),
    factors: arrayOrEmpty<ChartRenderModel['factors'][number]>((payload as { factors?: unknown }).factors),
    aspects: arrayOrEmpty<ChartRenderModel['aspects'][number]>((payload as { aspects?: unknown }).aspects),
    timeLayer: timeLayer && Array.isArray(timeLayer.dayuns) ? timeLayer : null,
  };
}

