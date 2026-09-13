import { shiYingReading, yongShenReading } from '@/domains/liuyao/explanation/index';
import type { ChartReport, ChartReportSection } from '@/domains/report/types';
import type { LiuyaoChartView } from '@/types/charts';

/** Whole-hexagram Liuyao report assembled from saved line facts only. */
export function buildLiuyaoReport(view: LiuyaoChartView): ChartReport {
  const moving = view.lines.filter((line) => line.isChanging);
  const sections: ChartReportSection[] = [];

  sections.push({
    id: 'hexagram',
    heading: '卦象概览',
    paragraphs: [
      `针对“${view.question}”起得${view.hexagramName}（${view.hexagramGong}）${view.changedHexagramName ? `，动而变为${view.changedHexagramName}` : '，六爻安静无变卦'}。起卦时间：${view.ganZhiTime}；旬空：${view.kongWang}。`,
      `起卦方式为${view.castingMethod === 'manual' ? '手工录入' : view.castingMethod === 'interactive' ? '六次投掷' : '快捷自动'}${view.castingRuleVersion ? `（规则 ${view.castingRuleVersion}）` : ''}；种子与日期已入快照，同条件可复现。`,
    ],
  });

  sections.push({
    id: 'yongshen',
    heading: '用神判断',
    paragraphs: [
      `本次用神方向选择为「${view.normalizedChart.yongShenTarget}」。${yongShenReading(view.normalizedChart)}`,
      '取用是否贴合问题语境，应在复盘时再核对一次；候选多现或不现时，本版只标注状态，不强行替用户定用神。',
    ],
  });

  sections.push({
    id: 'shi-ying',
    heading: '世应结构',
    paragraphs: [shiYingReading(view.normalizedChart)],
  });

  if (moving.length) {
    sections.push({
      id: 'moving',
      heading: '动爻与变卦',
      paragraphs: [
        ...moving.map((line) => `${line.position}爻（${line.liuQin}·${line.naJia}${line.wuXing}，${line.strength ?? '状态待核'}）发动${line.changed ? `，变为${line.changed.naJia}${line.changed.wuXing}（${line.changed.liuQin}）` : ''}${line.changeAnalysis ? `；变化类型：${line.changeAnalysis.description}` : ''}。`),
        '动爻是所问之事的变动启动点，变爻给出走向线索；多条动爻时以持世与持用神的动爻优先阅读。',
      ],
    });
  } else {
    sections.push({
      id: 'moving',
      heading: '动爻与变卦',
      paragraphs: ['本次为静卦：没有标出变动启动点，观察重点放在用神旺衰与月日生克上；静卦不补写变卦。'],
    });
  }

  sections.push({
    id: 'strength',
    heading: '旺衰与观察窗口',
    paragraphs: [
      `六爻旺衰证据共${view.lines.length}条，逐爻可核对；${view.timeRecommendations?.length ? `引擎给出${view.timeRecommendations.length}条需要观察的条件窗口，它们来自用神旺衰、动变或空亡事实，是待验证线索而非日期承诺。` : '当前没有足够的规则参考窗口，不为了完整感补造观察日期。'}`,
      '旺衰描述的是爻在月日环境中的结构状态，不是事件发生概率。',
    ],
  });

  sections.push({
    id: 'boundaries',
    heading: '边界与复盘建议',
    paragraphs: [
      '本报告只组合本次起卦保存的问题、取用、六爻与时间事实；不承诺结果，不推算应验日期。',
      '建议在事情明朗后回到这条记录，把实际发生的情况按日期写入事实反馈，并关联到具体解读卡，形成可回查的对照。',
    ],
  });

  return {
    version: 'chart-report-v1',
    title: `${view.hexagramName}${view.changedHexagramName ? ` 之 ${view.changedHexagramName}` : ''} · 六爻解卦报告`,
    summary: `问「${view.question.slice(0, 12)}${view.question.length > 12 ? '…' : ''}」，用神${view.normalizedChart.yongShenTarget}；${moving.length ? `${moving.length}个动爻` : '静卦'}。`,
    sections,
  };
}
