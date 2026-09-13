import type { ChartReport, ChartReportSection } from '@/domains/report/types';
import type { BaziChartView, BaziPillarView } from '@/types/charts';

const STRENGTH_LABELS: Record<string, string> = {
  strong: '偏旺',
  weak: '偏弱',
  conflict: '冲突待定（支持与反对证据并存）',
  balanced: '经规则验证接近平衡',
  uncertain: '证据不足，保持待定',
};

function pillarText(pillar: BaziPillarView): string {
  return `${pillar.label} ${pillar.stem}${pillar.branch}（十神：${pillar.tenGod ?? '日主'}；藏干 ${pillar.hiddenStems.join('、') || '未记录'}；纳音 ${pillar.naYin ?? '未记录'}）`;
}

/** Whole-chart Bazi report: pillars, strength, relations, time layer. */
export function buildBaziReport(view: BaziChartView): ChartReport {
  const [year, month, , hour] = view.pillars;
  const sections: ChartReportSection[] = [];

  sections.push({
    id: 'pillars',
    heading: '四柱概览',
    paragraphs: [
      `日主为「${view.dayMaster}」。四柱依次为：${view.pillars.map(pillarText).join('；')}。`,
      `旬空：${view.kongWang}。月柱是全局季节与月令的依据，日柱以日主为中心，时柱看晚年与下属晚辈宫位。`,
    ],
  });

  const strengthResult = view.interpretation.results.find((item) => item.id === 'interpretation:strength');
  sections.push({
    id: 'strength',
    heading: '强弱与结构判断',
    paragraphs: [
      `当前规则判定日主为「${STRENGTH_LABELS[view.strengthAssessment.status] ?? view.strengthAssessment.status}」（置信：${view.strengthAssessment.confidence}）。${strengthResult ? `${strengthResult.conclusion}` : ''}`,
      ...view.interpretation.results
        .filter((item) => item.id !== 'interpretation:strength')
        .slice(0, 3)
        .map((item) => `${item.title}：${item.conclusion}${item.counterEvidenceRefs.length ? `（含反证 ${item.counterEvidenceRefs.length} 条）` : ''}。`),
      view.strengthAssessment.caveats.length
        ? `判定边界：${view.strengthAssessment.caveats.join(' ')}`
        : '强弱判定全部条件已记录在证据链中，可逐条展开核对。',
    ],
  });

  const monthBranch = month ? `月令为${month.branch}` : '月柱未记录';
  sections.push({
    id: 'season',
    heading: '月令与十神分布',
    paragraphs: [
      `${monthBranch}；年柱${year ? `${year.stem}${year.branch}` : '未记录'}、时柱${hour ? `${hour.stem}${hour.branch}` : '未记录'}围绕日主形成生克结构。`,
      `四柱天干十神：${view.pillars.map((pillar) => `${pillar.label}${pillar.tenGod ?? '日主'}`).join('、')}。十神描述日主与各柱的互动角色（例如正官主约束与责任、食神主表达与产出），具体强弱仍以强弱判定为准。`,
    ],
  });

  if (view.relations.length) {
    sections.push({
      id: 'relations',
      heading: '柱间关系',
      paragraphs: [
        `检出柱间关系：${view.relations.join('；')}。合冲刑害提示柱与柱之间的互动方式，不单独决定吉凶。`,
      ],
    });
  }

  if (view.timeLayer) {
    const { qiYun, dayuns, directionLabel, liunian } = view.timeLayer;
    sections.push({
      id: 'time-layer',
      heading: '大运与流年对照',
      paragraphs: [
        `大运${directionLabel}：起运${qiYun.years}年${qiYun.months}月${qiYun.days}日（${qiYun.date}），依据节气${qiYun.anchorTerm}（${qiYun.anchorTermTime}）。前四步大运：${dayuns.slice(0, 4).map((entry) => `第${entry.index}运${entry.ganZhi}（${entry.startAge}-${entry.endAge}岁，${entry.startDate}起）`).join('；')}。`,
        liunian
          ? `所选流年${liunian.year}为${liunian.yearGanZhi}：流年天干对日主为${liunian.yearStemTenGod}${liunian.branchRelations.length ? `；与原局地支${liunian.branchRelations.map((item) => `${item.targetPillar}${item.targetBranch}成${item.kind}`).join('、')}` : '；与原局地支未检出已支持的合冲关系'}${liunian.coveredByDayun ? `；该年处于第${liunian.coveredByDayun.index}运${liunian.coveredByDayun.ganZhi}覆盖期` : ''}。`
          : '未选择流年年份；需要对照时在排盘页填入年份后重新生成。',
        '大运与流年对照为结构事实（bazi-dayun-v1，通行三日折一年口径），专业复核前不构成运势或吉凶结论，也不推算具体日期。',
      ],
    });
  } else if (view.completeness === 'partial') {
    sections.push({
      id: 'partial-note',
      heading: '部分盘说明',
      paragraphs: [
        `本盘为未知时辰部分盘（${view.partialChart?.policy ?? 'bazi-partial-chart-policy.v1'}）：仅年、月、日三柱，时柱不补造。${view.partialChart?.candidates.length ? `候选分歧：${view.partialChart.candidates.map((candidate) => `${candidate.label}可能为${candidate.options.map((option) => option.ganZhi).join(' / ')}`).join('；')}。` : '年月日柱在日内锚点变化下保持稳定。'}`,
        '补充准确时辰后重新排盘，可获得完整四柱、时柱十神与大运对照。',
      ],
    });
  }

  sections.push({
    id: 'boundaries',
    heading: '边界与复盘建议',
    paragraphs: [
      '本报告只组合本盘已保存的四柱、十神、藏干、关系与大运事实；强弱判定依赖当前规则版本（' + view.strengthAssessment.ruleVersion + '），流派扩展后结论可能更新。',
      '报告不给出事件预测或吉凶承诺。建议把现实反馈按日期记录到这条盘面上，用于检验当前判断的适用边界。',
    ],
  });

  return {
    version: 'chart-report-v1',
    title: `${view.dayMaster}日主 · 八字整体报告`,
    summary: `日主${view.dayMaster}，${STRENGTH_LABELS[view.strengthAssessment.status] ?? view.strengthAssessment.status}；${view.timeLayer ? `起运${view.timeLayer.qiYun.years}年${view.timeLayer.qiYun.months}月` : '未知时辰部分盘'}。`,
    sections,
  };
}
