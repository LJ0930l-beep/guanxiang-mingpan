import { calculateLiuyao, findHexagram } from 'taibu-core/liuyao';

import type { LiuyaoChartView } from '@/types/charts';
import { calculationSettings, CHART_SNAPSHOT_VERSION, ENGINE_VERSIONS, generatedAt, inputFingerprint, LIUYAO_SEED_SCOPE, normalizeLiuyaoDate, normalizeLiuyaoSeed, strengthLabels } from '@/services/chart-engine-shared';
import { withAsyncChartEngineErrorBoundary } from '@/services/chart-errors';
import type { CalculationOptions } from '@/services/chart-engine-shared';
import { normalizeLiuyaoChart } from '@/domains/liuyao/model/normalized-chart';
import { buildLiuyaoEvidenceGraph } from '@/domains/liuyao/evidence/index';
import { buildLiuyaoExplanation } from '@/domains/liuyao/explanation/index';

const LIUYAO_TARGETS = ['父母', '兄弟', '官鬼', '妻财', '子孙'] as const;
type LiuyaoCoinValue = 6 | 7 | 8 | 9;

function expectedCoinValue(yinYang: '阴' | '阳', isChanging: boolean): LiuyaoCoinValue {
  if (yinYang === '阳') return isChanging ? 9 : 7;
  return isChanging ? 6 : 8;
}

function assertLiuyaoEngineResult(value: unknown): void {
  if (value === null || typeof value !== 'object') throw new Error('六爻引擎未返回完整盘面。');
  const candidate = value as {
    fullYaos?: unknown;
    ganZhiTime?: unknown;
    kongWang?: unknown;
    hexagramName?: unknown;
    hexagramGong?: unknown;
    hexagramElement?: unknown;
  };
  const isText = (item: unknown): item is string => typeof item === 'string' && item.trim().length > 0;
  const isTimePart = (item: unknown): boolean => {
    if (item === null || typeof item !== 'object') return false;
    const part = item as Record<string, unknown>;
    return isText(part.gan) && isText(part.zhi);
  };
  const isLine = (item: unknown): boolean => {
    if (item === null || typeof item !== 'object') return false;
    const line = item as Record<string, unknown>;
    return typeof line.position === 'number'
      && Number.isFinite(line.position)
      && (line.type === 0 || line.type === 1)
      && isText(line.liuQin)
      && isText(line.liuShen)
      && isText(line.naJia)
      && isText(line.wuXing)
      && typeof line.isChanging === 'boolean'
      && typeof line.isShiYao === 'boolean'
      && typeof line.isYingYao === 'boolean';
  };
  if (!Array.isArray(candidate.fullYaos)
    || candidate.fullYaos.length !== 6
    || !candidate.fullYaos.every(isLine)
    || candidate.ganZhiTime === null
    || typeof candidate.ganZhiTime !== 'object'
    || !['year', 'month', 'day', 'hour'].every((key) => isTimePart((candidate.ganZhiTime as Record<string, unknown>)[key]))
    || candidate.kongWang === null
    || typeof candidate.kongWang !== 'object'
    || !isText((candidate.kongWang as Record<string, unknown>).xun)
    || !Array.isArray((candidate.kongWang as Record<string, unknown>).kongDizhi)
    || !isText(candidate.hexagramName)
    || !isText(candidate.hexagramGong)
    || !isText(candidate.hexagramElement)) {
    throw new Error('六爻引擎返回的盘面结构不完整。');
  }
}

export async function calculateLiuyaoView(
  question: string,
  target: string,
  options?: CalculationOptions,
): Promise<LiuyaoChartView> {
  if (typeof question !== 'string' || question.trim().length === 0) throw new Error('请先明确问题后再解卦');
  if (!LIUYAO_TARGETS.includes(target as (typeof LIUYAO_TARGETS)[number])) throw new Error('yongShenTargets 含非法值');
  const autoSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const seed = normalizeLiuyaoSeed(options?.seed === undefined ? autoSeed : options.seed);
  const date = options?.date === undefined ? new Date().toISOString() : options.date;
  const settings = calculationSettings(options);
  const calculationDate = normalizeLiuyaoDate(date, settings.timezone);
  const seedScope = LIUYAO_SEED_SCOPE;
  const requestedMethod = options?.liuyao?.method ?? 'auto';
  const manualYaos = options?.liuyao?.manualYaos;
  if (requestedMethod === 'manual' || requestedMethod === 'interactive') {
    if (!manualYaos || manualYaos.length !== 6) throw new Error('手工六爻需要完整录入六条爻。');
    const positions = new Set(manualYaos.map((line) => line.position));
    if (positions.size !== 6 || manualYaos.some((line) => line.position < 1 || line.position > 6 || !['阴', '阳'].includes(line.yinYang))) {
      throw new Error('手工六爻的爻位必须为 1–6，且阴阳字段完整。');
    }
    if (manualYaos.some((line) => line.value !== undefined && ![6, 7, 8, 9].includes(line.value))) {
      throw new Error('手工六爻的投掷值必须为 6、7、8 或 9。');
    }
    if (manualYaos.some((line) => line.value !== undefined && line.value !== expectedCoinValue(line.yinYang, line.isChanging))) {
      throw new Error('手工六爻的投掷值与阴阳、动静事实不一致。');
    }
  }
  return withAsyncChartEngineErrorBoundary('liuyao', async () => {
    const recordedManualYaos = manualYaos
      ?.slice()
      .sort((a, b) => a.position - b.position)
      .map((line) => ({
        ...line,
        value: line.value ?? expectedCoinValue(line.yinYang, line.isChanging),
      }));
    const selectedBaseCode = manualYaos
      ? recordedManualYaos!.map((line) => line.yinYang === '阳' ? '1' : '0').join('')
      : undefined;
    const selectedChangedCode = manualYaos
      ? recordedManualYaos!.map((line) => (line.yinYang === '阳') !== line.isChanging ? '1' : '0').join('')
      : undefined;
    const method = requestedMethod === 'manual' || requestedMethod === 'interactive' ? 'select' : requestedMethod;
    // taibu-core's select contract accepts the canonical Chinese hexagram
    // name, while the UI records the six line facts. Resolve the code through
    // the package's own data so manual/interactive casting does not silently
    // fall back or fail with an opaque "not found" error.
    const selectedBaseName = selectedBaseCode ? findHexagram(selectedBaseCode)?.name : undefined;
    const selectedChangedName = selectedChangedCode ? findHexagram(selectedChangedCode)?.name : undefined;
    if (method === 'select' && (!selectedBaseName || !selectedChangedName && selectedChangedCode)) {
      throw new Error('手工六爻无法匹配到标准卦象，请检查六条爻的阴阳与动静。');
    }
    const result = await calculateLiuyao({
      question,
      yongShenTargets: [target as '父母' | '兄弟' | '官鬼' | '妻财' | '子孙'],
      method,
      ...(selectedBaseName ? { hexagramName: selectedBaseName } : {}),
      ...(selectedChangedName ? { changedHexagramName: selectedChangedName } : {}),
      ...(options?.liuyao?.numbers ? { numbers: options.liuyao.numbers } : {}),
      date: calculationDate,
      seed,
      seedScope,
      detailLevel: 'more',
    });
    assertLiuyaoEngineResult(result);
    const lines = result.fullYaos
      .slice()
      .sort((a, b) => b.position - a.position)
      .map((line) => ({
      position: line.position,
      yinYang: line.type === 1 ? ('阳' as const) : ('阴' as const),
      ...(recordedManualYaos ? { value: recordedManualYaos.find((manual) => manual.position === line.position)?.value } : {}),
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
    const inputSnapshot = {
      type: 'liuyao' as const,
      timezone: settings.timezone,
      question,
      target,
      seed,
      date: calculationDate,
      seedScope,
      castingMethod: requestedMethod,
      ...(recordedManualYaos ? { manualYaos: recordedManualYaos } : {}),
    };
    const fingerprint = inputFingerprint({ module: 'liuyao', inputSnapshot, calculationSettings: settings });
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
    inputSnapshot,
    inputFingerprint: fingerprint,
    completeness: 'complete',
    caveats: ['一次起卦对应一个具体问题；基础版保留盘面证据，不代替现实决策。'],
    question,
    seed,
    date,
    seedScope,
    castingMethod: requestedMethod,
    ...(recordedManualYaos ? { manualYaos: recordedManualYaos } : {}),
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
  });
}
