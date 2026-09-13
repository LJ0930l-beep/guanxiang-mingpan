/**
 * Engineering baseline for Western natal reading content.  Sign traits stay
 * on the structural-tendency level required by the 2026-09-08 charter; they
 * describe observation angles, never deterministic personality verdicts or
 * event promises.
 */
export const ASTROLOGY_INTERPRETATION_VERSION = 'astrology-interpretation-v1' as const;

export const SIGN_TRAITS: Record<string, string> = {
  白羊座: '倾向直接启动，行动先于计划',
  金牛座: '倾向稳定务实，节奏偏慢但持久',
  双子座: '倾向好奇多线，信息敏感',
  巨蟹座: '倾向照顾与归属感，情绪记忆深',
  狮子座: '倾向表达与主导，需要在场感',
  处女座: '倾向核对与优化，注意细节流程',
  天秤座: '倾向权衡协调，在意关系平衡',
  天蝎座: '倾向深入专注，情感浓度高',
  射手座: '倾向探索外延，追寻意义感',
  摩羯座: '倾向目标与责任，长线经营',
  水瓶座: '倾向独立思考，偏好差异化结构',
  双鱼座: '倾向感受联想，边界弹性大',
};

export function signTrait(sign: string | undefined): string {
  if (!sign) return '落座未返回，无法给出特质描述。';
  return SIGN_TRAITS[sign] ?? `${sign}的落座特质说明待专业复核`;
}

/** Composed sun/moon reading used by the explanation builder. */
export function describeCoreTriad(sunSign: string | undefined, moonSign: string | undefined): string {
  return `太阳落${sunSign ?? '未返回'}，观察角度是${signTrait(sunSign)}；月亮落${moonSign ?? '未返回'}，情绪习惯偏向${signTrait(moonSign)}。太阳看显性表达与追求方式，月亮看安全感来源与情绪节奏，两者组合只是本命盘的观察起点。`;
}
