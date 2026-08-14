import { Horoscope, Origin } from 'circular-natal-horoscope-js/dist/index.js';
import { calculateBazi } from 'taibu-core/bazi';
import { calculateLiuyao } from 'taibu-core/liuyao';
import * as iztro from 'iztro/dist/iztro.min.js';

import { resolveCityCoordinates } from '@/data/china-cities';
import type {
  AstrologyChartView,
  BaziChartView,
  LiuyaoChartView,
  ZiweiChartView,
} from '@/types/charts';
import type { BirthProfile, Gender } from '@/types/domain';

export const ENGINE_VERSION = 'taibu-core@3.4.0' as const;
const ASTROLOGY_ENGINE_VERSION = 'circular-natal-horoscope-js@1.1.0';

const signLabels: Record<string, string> = {
  aries: '白羊座', taurus: '金牛座', gemini: '双子座', cancer: '巨蟹座',
  leo: '狮子座', virgo: '处女座', libra: '天秤座', scorpio: '天蝎座',
  sagittarius: '射手座', capricorn: '摩羯座', aquarius: '水瓶座', pisces: '双鱼座',
};
const bodyLabels: Record<string, string> = {
  sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星',
  jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星',
  ascendant: '上升点', midheaven: '天顶',
};
const aspectLabels: Record<string, string> = {
  conjunction: '合相', opposition: '对冲', trine: '拱相', square: '刑相', sextile: '六合',
};
const strengthLabels: Record<string, string> = {
  wang: '旺', xiang: '相', xiu: '休', qiu: '囚', si: '死',
};

interface BirthParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface CalculationOptions {
  /** Fixed timestamp used by regression tests and imported/replayed records. */
  generatedAt?: string;
  /** Fixed automatic-casting seed used when replaying a Liuyao record. */
  seed?: string;
  /** Fixed local ISO date used for Liuyao ganzhi and strength calculation. */
  date?: string;
}

function generatedAt(options?: CalculationOptions) {
  return options?.generatedAt ?? new Date().toISOString();
}

function birthParts(profile: BirthProfile): BirthParts {
  const [year, month, day] = profile.birthDate.split('-').map(Number);
  const [hour = 0, minute = 0] = (profile.birthTime ?? '').split(':').map(Number);
  if (![year, month, day].every(Number.isFinite)) throw new Error('出生日期格式无效，请在命主管理中修正。');
  return { year, month, day, hour, minute };
}

function requireExactBirth(profile: BirthProfile) {
  if (!profile.timeKnown || !profile.birthTime) {
    throw new Error('这套盘需要准确出生时辰。当前命主只保存了日期，请先补充时辰。');
  }
}

function requireGender(profile: BirthProfile, override?: Gender): Gender {
  const gender = profile.gender ?? override;
  if (!gender) throw new Error('八字与紫微排盘需要性别参数，请先选择本次排盘使用的性别。');
  return gender;
}

export function calculateBaziView(
  profile: BirthProfile,
  genderOverride?: Gender,
  options?: CalculationOptions,
): BaziChartView {
  requireExactBirth(profile);
  const parts = birthParts(profile);
  const gender = requireGender(profile, genderOverride);
  const result = calculateBazi({
    gender,
    birthYear: parts.year,
    birthMonth: parts.month,
    birthDay: parts.day,
    birthHour: parts.hour,
    birthMinute: parts.minute,
    calendarType: profile.calendar,
    birthPlace: profile.birthCity,
    longitude: profile.longitude,
  });
  const order = [
    ['year', '年柱'],
    ['month', '月柱'],
    ['day', '日柱'],
    ['hour', '时柱'],
  ] as const;
  const pillars = order.map(([key, label]) => {
    const pillar = result.fourPillars[key];
    return {
      key,
      label,
      stem: pillar.stem,
      branch: pillar.branch,
      tenGod: pillar.tenGod,
      hiddenStems: pillar.hiddenStems.map((item) => `${item.stem}·${item.tenGod}`),
      naYin: pillar.naYin,
    };
  });
  const relations = result.relations.slice(0, 6).map((item) => item.description);

  return {
    module: 'bazi',
    generatedAt: generatedAt(options),
    engineVersion: ENGINE_VERSION,
    completeness: 'complete',
    caveats: ['基础版展示结构证据，不直接给出吉凶定论。', '子初换日与真太阳时设置将在专业设置中开放。'],
    dayMaster: result.dayMaster,
    pillars,
    kongWang: `${result.kongWang.xun} · 空 ${result.kongWang.kongZhi.join('、')}`,
    relations,
    focus: [
      `日主为「${result.dayMaster}」，基础解读以日柱为观察中心。`,
      relations.length ? `当前可见的柱间关系包括：${relations.slice(0, 2).join('；')}。` : '当前盘面未检出需要优先标注的柱间合冲刑害。',
      '旺衰与取用需要结合月令、根气、透干和组合继续判断，基础版不把单一五行数量当作结论。',
    ],
  };
}

export async function calculateLiuyaoView(
  question: string,
  target: string,
  options?: CalculationOptions,
): Promise<LiuyaoChartView> {
  const seed = options?.seed ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const result = await calculateLiuyao({
    question,
    yongShenTargets: [target as '父母' | '兄弟' | '官鬼' | '妻财' | '子孙'],
    method: 'auto',
    date: options?.date ?? new Date().toISOString(),
    seed,
    seedScope: 'guanxiang-local-v1',
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
    generatedAt: generatedAt(options),
    engineVersion: ENGINE_VERSION,
    completeness: 'complete',
    caveats: ['一次起卦对应一个具体问题；基础版保留盘面证据，不代替现实决策。'],
    question,
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

export function calculateZiweiView(
  profile: BirthProfile,
  genderOverride?: Gender,
  options?: CalculationOptions,
): ZiweiChartView {
  requireExactBirth(profile);
  const parts = birthParts(profile);
  const gender = requireGender(profile, genderOverride);
  const timeIndex = parts.hour >= 23 ? 12 : parts.hour < 1 ? 0 : Math.floor((parts.hour + 1) / 2);
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const result = profile.calendar === 'lunar'
    ? iztro.astro.byLunar(date, timeIndex, gender, profile.isLeapMonth ?? false, true, 'zh-CN')
    : iztro.astro.bySolar(date, timeIndex, gender, true, 'zh-CN');
  const palaces = result.palaces.map((palace) => ({
    name: palace.name,
    stemBranch: `${palace.heavenlyStem}${palace.earthlyBranch}`,
    isBodyPalace: palace.isBodyPalace,
    stars: palace.majorStars.map((star) => `${star.name}${star.brightness ? `·${star.brightness}` : ''}${star.mutagen ? `·化${star.mutagen}` : ''}`),
    minorStars: palace.minorStars.slice(0, 3).map((star) => star.name),
    decadalRange: palace.decadal?.range ? `${palace.decadal.range[0]}–${palace.decadal.range[1]}岁` : undefined,
  }));
  const lifePalace = palaces.find((palace) => palace.name === '命宫');
  const bodyPalace = palaces.find((palace) => palace.isBodyPalace);
  const mutagens = result.palaces.flatMap((palace) =>
    [...palace.majorStars, ...palace.minorStars]
      .filter((star) => star.mutagen)
      .map((star) => `${star.name}化${star.mutagen}入${palace.name}`),
  );

  return {
    module: 'ziwei',
    generatedAt: generatedAt(options),
    engineVersion: ENGINE_VERSION,
    completeness: 'complete',
    caveats: ['不同流派在安星与四化规则上存在差异，本版固定算法版本以便复盘。'],
    solarDate: result.solarDate,
    lunarDate: result.lunarDate,
    soul: result.earthlyBranchOfSoulPalace,
    body: result.earthlyBranchOfBodyPalace,
    fiveElement: result.fiveElementsClass,
    lifeMasterStar: result.soul,
    bodyMasterStar: result.body,
    palaces,
    mutagens,
    focus: [
      `命宫落「${lifePalace?.stemBranch ?? result.earthlyBranchOfSoulPalace}」，${lifePalace?.stars.length ? `主星为 ${lifePalace.stars.join('、')}` : '本宫无十四主星坐守'}。`,
      `身宫落在「${bodyPalace?.name ?? result.earthlyBranchOfBodyPalace}」，命主 ${result.soul}，身主 ${result.body}。`,
      mutagens.length ? `生年四化：${mutagens.join('；')}。` : '生年四化资料暂未返回。',
    ],
  };
}

export function calculateAstrologyView(profile: BirthProfile, options?: CalculationOptions): AstrologyChartView {
  requireExactBirth(profile);
  const parts = birthParts(profile);
  const city = profile.latitude != null && profile.longitude != null
    ? { latitude: profile.latitude, longitude: profile.longitude }
    : resolveCityCoordinates(profile.birthCity);
  const origin = new Origin({
    year: parts.year,
    month: parts.month - 1,
    date: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    latitude: city?.latitude ?? 0,
    longitude: city?.longitude ?? 0,
  });
  const horoscope = new Horoscope({
    origin,
    language: 'en',
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: city ? ['bodies', 'angles'] : ['bodies'],
    aspectWithPoints: city ? ['bodies', 'angles'] : ['bodies'],
    aspectTypes: ['major'],
  });
  const standardBodyKeys = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']);
  const bodies = (horoscope.CelestialBodies.all as any[]).filter((item) => standardBodyKeys.has(item.key));
  const angles = city ? [horoscope.Ascendant, horoscope.Midheaven] as any[] : [];
  const body = (key: string) => bodies.find((item) => item.key === key);
  const moon = body('moon');
  const ascendant = city ? horoscope.Ascendant : undefined;
  const midheaven = city ? horoscope.Midheaven : undefined;
  const signOf = (factor: any) => signLabels[factor?.Sign?.key] ?? factor?.Sign?.label ?? '未返回';
  const degreeOf = (factor: any) => {
    const decimal = Number(factor.ChartPosition.Ecliptic.DecimalDegrees);
    const within = ((decimal % 30) + 30) % 30;
    const degrees = Math.floor(within);
    const minutes = Math.round((within - degrees) * 60);
    return `${degrees}°${String(minutes).padStart(2, '0')}′`;
  };
  const factors = [...bodies, ...angles].map((factor) => ({
    key: factor.key,
    label: bodyLabels[factor.key] ?? factor.label,
    sign: signOf(factor),
    degree: degreeOf(factor),
    longitude: Number(factor.ChartPosition.Ecliptic.DecimalDegrees),
    house: city ? factor.House?.id : undefined,
    retrograde: factor.isRetrograde,
  }));
  const aspects = (horoscope.Aspects.all as any[])
    .filter((aspect) => {
      const allowed = new Set([...standardBodyKeys, ...(city ? ['ascendant', 'midheaven'] : [])]);
      return allowed.has(aspect.point1Key) && allowed.has(aspect.point2Key);
    });
  const sun = body('sun');
  const sunSign = signOf(sun);
  const caveats = ['基础版只解释核心落座与主要相位，不输出确定性事件预测。'];
  if (!city) caveats.unshift('未识别出生城市坐标，当前为近似盘：不计算上升、天顶与十二宫位。');

  return {
    module: 'astrology',
    generatedAt: generatedAt(options),
    engineVersion: ASTROLOGY_ENGINE_VERSION,
    completeness: city ? 'complete' : 'partial',
    caveats,
    calculationMode: city ? 'exact' : 'approximate',
    sunSign,
    moonSign: moon ? signOf(moon) : undefined,
    ascendant: ascendant ? signOf(ascendant) : undefined,
    midheaven: midheaven ? signOf(midheaven) : undefined,
    factors,
    aspects: aspects.slice(0, 12).map((aspect) => ({
      label: aspectLabels[aspect.aspectKey] ?? aspect.label,
      from: bodyLabels[aspect.point1Key] ?? aspect.point1Label,
      to: bodyLabels[aspect.point2Key] ?? aspect.point2Label,
      orb: `${Number(aspect.orb).toFixed(2)}°`,
    })),
    focus: [
      `太阳落在「${sunSign}」${moon ? `，月亮落在「${signOf(moon)}」` : ''}。`,
      ascendant ? `上升为「${signOf(ascendant)}」，天顶为「${signOf(midheaven)}」。` : '当前缺少可识别坐标，因此不显示上升、天顶与宫位。',
      `盘面检出 ${aspects.length} 组主要相位；基础版优先展示容许度较小的结构。`,
    ],
  };
}
