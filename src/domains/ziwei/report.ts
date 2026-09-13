import type { ChartReport, ChartReportSection } from '@/domains/report/types';
import { describeMutagenEdge, palaceFullName, palaceTheme, starTrait } from '@/domains/ziwei/interpretation/knowledge';
import type { ZiweiChartView } from '@/types/charts';

/** Whole-board Ziwei report: overview, stars, mutagens, palace walkthrough. */
export function buildZiweiReport(view: ZiweiChartView): ChartReport {
  const chart = view.normalizedChart;
  const life = chart.palaces.find((palace) => palace.id === chart.lifePalaceRefId);
  const body = chart.palaces.find((palace) => palace.id === chart.bodyPalaceRefId);
  const lifeStarText = (life?.majorStarRefs ?? [])
    .map((id) => chart.stars.find((star) => star.id === id))
    .filter((star): star is NonNullable<typeof star> => Boolean(star))
    .map((star) => `${star.name}${star.brightness ? `（${star.brightness}）` : ''}${star.mutagen ? `，化${star.mutagen}` : ''}：${starTrait(star.name)}。`)
    .join('') || '命宫为空宫：按所选流派可借对宫星曜阅读，本版不擅自补齐。';

  const sections: ChartReportSection[] = [
    {
      id: 'overview',
      heading: '盘面概览',
      paragraphs: [
        `本盘为${view.fiveElement}，命宫在${life ? `${palaceFullName(life.name)}（${life.stemBranch}）` : '未记录'}，身宫在${body ? `${palaceFullName(body.name)}（${body.stemBranch}）` : '未记录'}；命主${view.lifeMasterStar ?? '未记录'}，身主${view.bodyMasterStar ?? '未记录'}；农历${view.lunarDate}。`,
        `命宫看性格底色与人生起点，身宫看后天投入的方向；两者同宫时先天与后天取向高度重叠，异宫时则需要分别阅读。命宫主星为${(life?.majorStarRefs ?? []).map((id) => chart.stars.find((star) => star.id === id)?.name).filter(Boolean).join('、') || '无主星'}。`,
      ],
    },
    {
      id: 'life-stars',
      heading: '命宫主星解读',
      paragraphs: [lifeStarText, '主星描述的是做事风格与心理倾向的“底色”；亮度表示特质发挥的稳定程度，化象（禄权科忌）表示该特质被生年干强化的方向。读星时先本宫、再对宫，避免只看单星下结论。'],
    },
    {
      id: 'mutagens',
      heading: '生年四化逐条解读',
      paragraphs: chart.mutagenEdges.length
        ? [
            ...chart.mutagenEdges.map((edge) => describeMutagenEdge(chart, edge)),
            '阅读顺序建议：先找化忌落宫（消耗与收尾成本所在），再看化禄落宫（资源与机会流入处），最后用化权、化科判断主攻方向与贵人文书线索。',
          ]
        : ['当前引擎没有返回生年四化，本报告不作化象推断。'],
    },
    {
      id: 'palaces',
      heading: '十二宫逐宫速览',
      paragraphs: chart.palaces.map((palace) => {
        const stars = palace.majorStarRefs
          .map((id) => chart.stars.find((star) => star.id === id))
          .filter((star): star is NonNullable<typeof star> => Boolean(star));
        const starPart = stars.length
          ? `坐${stars.map((star) => star.name).join('、')}：${stars.map((star) => starTrait(star.name)).join('；')}。`
          : '空宫，需按所选流派决定是否借对宫星曜。';
        const landed = chart.mutagenEdges.filter((edge) => edge.palaceRefId === palace.id);
        const mutagenPart = landed.length
          ? `落入本宫的四化：${landed.map((edge) => `${edge.starName}化${edge.mutagen}（${palaceTheme(palace.name)}主题下的${edge.mutagen === '忌' ? '重点管理位' : '显著加持位'}）`).join('、')}。`
          : '无生年四化落入。';
        return `${palaceFullName(palace.name)}（${palace.stemBranch}）——主题：${palaceTheme(palace.name)}。${starPart}${mutagenPart}${palace.isBodyPalace ? '身宫落于此处，后天投入与该主题关系密切。' : ''}`;
      }),
    },
    {
      id: 'structure',
      heading: '三方四正与阅读路线',
      paragraphs: [
        life
          ? `命宫${life.name}的三方四正为：本宫${life.name}、对宫${chart.palaces.find((palace) => palace.id === life.oppositePalaceRefId)?.name ?? '未记录'}，以及三方${(life.trinePalaceRefIds ?? []).map((id) => chart.palaces.find((palace) => palace.id === id)?.name).filter(Boolean).join('、') || '未记录'}；判断命宫主题时四宫必须合看。`
          : '命宫未记录，无法生成三方四正路线。',
        '建议路线：命宫定风格 → 四化找资源与消耗 → 财帛/官禄看现实场景 → 夫妻/福德看关系与内在 → 各宫对宫补充对照。',
      ],
    },
    {
      id: 'boundaries',
      heading: '边界与复盘建议',
      paragraphs: [
        '本报告只组合本盘已保存的宫位、星曜、亮度与四化事实，措辞停留在结构倾向层面；不同流派的安星与四化规则存在差异，本报告不评价流派优劣。',
        '报告不给出事件预测、吉凶承诺或医疗/法律/投资建议。保存后可在记录页回看本报告，并在规则版本升级时用当前规则复核生成对照。',
      ],
    },
  ];
  return {
    version: 'chart-report-v1',
    title: `${view.fiveElement} · 命宫${life?.name ?? '?'}（${life?.stemBranch ?? '?'}）紫微报告`,
    summary: `命宫${life?.name ?? '?'}坐${(life?.majorStarRefs ?? []).map((id) => chart.stars.find((star) => star.id === id)?.name).filter(Boolean).join('、') || '空宫'}；四化集中处见“生年四化逐条解读”。`,
    sections,
  };
}
