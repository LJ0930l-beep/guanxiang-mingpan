import { CHART_SNAPSHOT_VERSION } from '@/types/charts';
import type { BirthInputSnapshot } from '@/types/charts';
import type { BirthProfile, Gender } from '@/types/domain';

export const ENGINE_VERSIONS = {
  bazi: 'taibu-core@3.4.0/bazi',
  liuyao: 'taibu-core@3.4.0/liuyao+guanxiang-rng-v1',
  ziwei: 'iztro@2.5.8',
  astrology: 'circular-natal-horoscope-js@1.1.0',
} as const;

export const LIUYAO_SEED_SCOPE = 'guanxiang-local-v1' as const;

export const signLabels: Record<string, string> = {
  aries: '白羊座', taurus: '金牛座', gemini: '双子座', cancer: '巨蟹座',
  leo: '狮子座', virgo: '处女座', libra: '天秤座', scorpio: '天蝎座',
  sagittarius: '射手座', capricorn: '摩羯座', aquarius: '水瓶座', pisces: '双鱼座',
};

export const bodyLabels: Record<string, string> = {
  sun: '太阳', moon: '月亮', mercury: '水星', venus: '金星', mars: '火星',
  jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星',
  ascendant: '上升点', midheaven: '天顶',
};

export const aspectLabels: Record<string, string> = {
  conjunction: '合相', opposition: '对冲', trine: '拱相', square: '刑相', sextile: '六合',
};

export const strengthLabels: Record<string, string> = {
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

export function generatedAt(options?: CalculationOptions) {
  return options?.generatedAt ?? new Date().toISOString();
}

export function birthInputSnapshot(profile: BirthProfile, gender?: Gender): BirthInputSnapshot {
  const snapshot: BirthInputSnapshot = {
    type: 'birth',
    profileId: profile.id,
    birthDate: profile.birthDate,
    timeKnown: profile.timeKnown,
    birthCity: profile.birthCity,
    calendar: profile.calendar,
  };
  const effectiveGender = gender ?? profile.gender;
  if (profile.birthTime) snapshot.birthTime = profile.birthTime;
  if (profile.isLeapMonth !== undefined) snapshot.isLeapMonth = profile.isLeapMonth;
  if (effectiveGender) snapshot.gender = effectiveGender;
  if (profile.latitude !== undefined) snapshot.latitude = profile.latitude;
  if (profile.longitude !== undefined) snapshot.longitude = profile.longitude;
  return snapshot;
}

export function birthParts(profile: BirthProfile): BirthParts {
  const [year, month, day] = profile.birthDate.split('-').map(Number);
  const [hour = 0, minute = 0] = (profile.birthTime ?? '').split(':').map(Number);
  if (![year, month, day].every(Number.isFinite)) throw new Error('出生日期格式无效，请在命主管理中修正。');
  return { year, month, day, hour, minute };
}

export function requireExactBirth(profile: BirthProfile) {
  if (!profile.timeKnown || !profile.birthTime) {
    throw new Error('这套盘需要准确出生时辰。当前命主只保存了日期，请先补充时辰。');
  }
}

export function requireGender(profile: BirthProfile, override?: Gender): Gender {
  const gender = profile.gender ?? override;
  if (!gender) throw new Error('八字与紫微排盘需要性别参数，请先选择本次排盘使用的性别。');
  return gender;
}

export { CHART_SNAPSHOT_VERSION };
