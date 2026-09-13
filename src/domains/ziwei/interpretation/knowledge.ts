import type { NormalizedZiweiChart, ZiweiMutagenEdge, NormalizedZiweiPalace } from '@/domains/ziwei/model/normalized-chart';

/**
 * Engineering baseline for rule-based Ziwei reading content.
 *
 * Every sentence is composed from three auditable tables — palace theme,
 * star trait and transform meaning — and always names the chart facts it
 * rests on.  Wording stays on "structural tendency" (结构倾向) level per the
 * 2026-09-08 charter: no deterministic events, no fortune guarantees, and
 * every derived reading must remain traceable to a saved evidence node.
 */
export const ZIWEI_INTERPRETATION_VERSION = 'ziwei-interpretation-v1' as const;

export const PALACE_THEMES: Record<string, string> = {
  命宫: '性格底色与人生起点',
  兄弟: '手足、同行与平辈合作',
  夫妻: '亲密关系与相处模式',
  子女: '子女、创造与晚辈缘',
  财帛: '资源往来与现金流模式',
  疾厄: '身体状态与精力节奏',
  迁移: '外出、变动与外部机会',
  仆役: '人际网络与团队氛围',
  官禄: '事业方向与做事场景',
  田宅: '家庭环境与不动产',
  福德: '精神生活与兴趣享受',
  父母: '长辈缘分与文书庇荫',
};

export const STAR_TRAITS: Record<string, string> = {
  紫微: '倾向统筹与自尊，喜欢有结构感和话语权的环境',
  天机: '思路灵活，擅长分析与谋划，容易多思多变',
  太阳: '外显与付出型，倾向光明正大、乐于承担，注意精力耗散',
  武曲: '执行与财务敏感，行动直接，注意刚硬欠转圜',
  天同: '温和随缘，倾向和缓享受，注意进取节奏',
  廉贞: '原则与感情并重，做事有担当，情绪起伏需要留意',
  天府: '稳重守成，擅长积累与管理，偏好确定感',
  太阴: '细腻内敛，擅长照料与渐进积累，情绪敏感',
  贪狼: '才华与好奇并存，社交力强，兴趣广泛',
  巨门: '口才与研究心并存，擅长追根问底，注意表达引起的是非',
  天相: '周全协调，倾向做辅佐与缓和的角色',
  天梁: '荫护与原则型，倾向照顾他人、讲道理，带长者气质',
  七杀: '冲劲与决断，敢于开创变化，注意急躁',
  破军: '变动与开创，倾向先破后立，过程起伏较大',
};

export const MUTAGEN_MEANINGS: Record<string, string> = {
  禄: '资源与机会的流入点，结构上偏向顺遂、增量与人缘润滑',
  权: '主导与强化的集中点，结构上偏向承担、推进与话语权',
  科: '名声与条理的显眼处，结构上偏向贵人、文书与理性梳理',
  忌: '阻力与消耗的集中点，结构上提示执着与收尾成本，需要显式管理',
};

/** 命宫自带“宫”字，其余宫名不带；拼完整宫名时统一处理。 */
export function palaceFullName(name: string): string {
  return name.endsWith('宫') ? name : `${name}宫`;
}

function palaceOf(chart: NormalizedZiweiChart, refId: string | undefined): NormalizedZiweiPalace | undefined {
  return chart.palaces.find((palace) => palace.id === refId);
}

export function starTrait(starName: string): string {
  return STAR_TRAITS[starName] ?? `${starName}的星性说明待专业复核`;
}

export function palaceTheme(palaceName: string): string {
  return PALACE_THEMES[palaceName] ?? `${palaceName}的宫位主题说明待专业复核`;
}

export function mutagenMeaning(mutagen: string): string {
  return MUTAGEN_MEANINGS[mutagen] ?? `化${mutagen}的化象说明待专业复核`;
}

/** One-sentence structural reading for a single four-transform edge. */
export function describeMutagenEdge(chart: NormalizedZiweiChart, edge: ZiweiMutagenEdge): string {
  const palace = palaceOf(chart, edge.palaceRefId);
  const star = chart.stars.find((item) => item.id === edge.starRefId);
  const palaceLabel = palace ? `${palaceFullName(palace.name)}（${palace.stemBranch}）` : '未落宫记录';
  const brightness = star?.brightness ? `，亮度${star.brightness}` : '';
  return `${edge.starName}化${edge.mutagen}落入${palaceLabel}：${edge.starName}${starTrait(edge.starName)}${brightness}；化${edge.mutagen}是${mutagenMeaning(edge.mutagen)}；该宫关联${palaceTheme(palace?.name ?? '')}。`;
}

/** Star-combination reading for one palace, star traits only. */
export function describePalaceStars(chart: NormalizedZiweiChart, palaceRefId: string | undefined): string {
  const palace = palaceOf(chart, palaceRefId);
  if (!palace) return '宫位未记录，无法生成星曜组合说明。';
  const stars = palace.majorStarRefs
    .map((id) => chart.stars.find((item) => item.id === id))
    .filter((star): star is NonNullable<typeof star> => Boolean(star));
  if (!stars.length) return `${palace.name}宫（${palace.stemBranch}）为空宫，按对宫星曜借看前需先确认所选流派规则。`;
  return `${palace.name}宫（${palace.stemBranch}）坐${stars.map((star) => `${star.name}${star.brightness ? `（${star.brightness}）` : ''}`).join('、')}：${stars.map((star) => starTrait(star.name)).join('；')}。`;
}

/**
 * Full reading paragraphs for a selected palace: theme, star traits and the
 * four transforms landing in it.  Used by both the live workspace panel and
 * the explanation builder so the two never drift apart.
 */
export function describePalaceContext(chart: NormalizedZiweiChart, palaceRefId: string | undefined): string[] {
  const palace = palaceOf(chart, palaceRefId);
  if (!palace) return ['宫位未记录，无法生成上下文解读。'];
  const paragraphs = [describePalaceStars(chart, palaceRefId)];
  paragraphs.push(`${palace.name}宫在结构上关联${palaceTheme(palace.name)}；阅读时先看本宫主星，再对照对宫与三方。`);
  const landed = chart.mutagenEdges.filter((edge) => edge.palaceRefId === palaceRefId);
  if (landed.length) {
    paragraphs.push(`落入本宫的四化：${landed.map((edge) => describeMutagenEdge(chart, edge)).join(' ')}`);
  } else {
    paragraphs.push('本宫没有生年四化落入；四化的影响需从其对宫与三方宫位间接观察。');
  }
  return paragraphs;
}
