import { signTrait } from '@/domains/astrology/interpretation/knowledge';
import type { ChartReport, ChartReportSection } from '@/domains/report/types';
import type { AstrologyChartView } from '@/types/charts';

/** Whole-chart natal report for the Western module. */
export function buildAstrologyReport(view: AstrologyChartView): ChartReport {
  const exact = view.calculationMode === 'exact';
  const sections: ChartReportSection[] = [];

  sections.push({
    id: 'overview',
    heading: '盘面概览',
    paragraphs: [
      `本盘为${exact ? '精确盘' : '近似盘'}（${view.precision === 'date-level-approximate' ? '出生时辰未知，采用日级近似' : '完整时刻计算'}）。太阳落${view.sunSign}，月亮${view.moonSign ? `落${view.moonSign}` : '未返回'}${exact && view.ascendant ? `，上升在${view.ascendant}` : ''}${exact && view.midheaven ? `，天顶在${view.midheaven}` : ''}。`,
      exact
        ? '精确盘包含行星落座、角点、宫位与相位四层结构；近似盘只保留经过全天稳定性检查的日期级落座。'
        : '当前模式隐藏上升、天顶、宫位与相位，补充准确时辰或可识别城市后可重新计算完整盘。',
    ],
  });

  sections.push({
    id: 'luminaries',
    heading: '太阳与月亮',
    paragraphs: [
      `太阳在${view.sunSign}：${signTrait(view.sunSign)}。太阳描述显性表达与追求方式。`,
      view.moonSign
        ? `月亮在${view.moonSign}：${signTrait(view.moonSign)}。月亮描述情绪习惯与安全感来源。`
        : '月亮落座未返回（日期内可能跨星座），不作解读。',
      '太阳与月亮的组合只是观察起点；性格描述停留在倾向层面，不构成人格结论。',
    ],
  });

  const placements = view.normalizedChart.points
    .filter((point) => !['sun', 'moon', 'ascendant', 'midheaven'].includes(point.key))
    .slice(0, 8);
  if (placements.length) {
    sections.push({
      id: 'planets',
      heading: '行星落座',
      paragraphs: [
        ...placements.map((point) => `${point.label}落${point.sign}${point.retrograde ? '（逆行）' : ''}：${signTrait(point.sign)}；${point.label}的领域倾向以这种风格展开。`),
        '行星特质按落座给出观察角度；具体表现需结合宫位与相位综合判断。',
      ],
    });
  }

  const aspects = view.aspects.slice(0, 6);
  if (aspects.length) {
    sections.push({
      id: 'aspects',
      heading: '主要相位',
      paragraphs: [
        `记录${view.aspects.length}组主要相位，最紧密的包括：${aspects.map((aspect) => `${aspect.from} ${aspect.label} ${aspect.to}（容许度 ${aspect.orb}）`).join('；')}。`,
        '相位描述两个天体领域之间的配合或张力结构；容许度越小，结构特征越明显，但不对应事件强度。',
      ],
    });
  }

  sections.push({
    id: 'boundaries',
    heading: '边界与复盘建议',
    paragraphs: [
      '本报告只组合本盘已保存的落座、角点、宫位与相位事实；占星描述属于象征体系的结构倾向，不具备经验证的人格测量或预测效力。',
      '保存后可在记录页回看本报告；规则或精度政策升级时会以新版本另存，不改写本报告。',
    ],
  });

  return {
    version: 'chart-report-v1',
    title: `${view.sunSign} · 西方本命盘报告`,
    summary: `太阳${view.sunSign}、月亮${view.moonSign ?? '未返回'}${exact && view.ascendant ? `、上升${view.ascendant}` : ''}；${view.aspects.length}组主要相位。`,
    sections,
  };
}
