import type { BirthProfile } from '@/types/domain';
import type { BaziCalculationEvidence, BaziCalculationSettings } from '@/domains/bazi/types';

function normalizedCivilTime(profile: BirthProfile): string {
  const time = profile.birthTime ?? '00:00';
  return `${profile.birthDate}T${time.length === 5 ? `${time}:00` : time}`;
}

export function createBaziCalculationEvidence(
  profile: BirthProfile,
  settings: BaziCalculationSettings,
): BaziCalculationEvidence {
  const civilTime = normalizedCivilTime(profile);
  const warnings = [
    'P1-A：节气边界解析尚未启用，当前月柱沿用排盘引擎结果；不得将此字段当作边界校准证明。',
    'P1-A：真太阳时尚未启用，当前有效计算时刻与输入民用时刻相同。',
  ];
  if (profile.calendar === 'lunar') {
    warnings.push('农历转公历的独立换算证据将在 P1-E 补齐。');
  }
  if (profile.latitude == null || profile.longitude == null) {
    warnings.push('出生地没有可用经纬度，位置证据暂不声明坐标精度。');
  }

  return {
    sourceCalendar: profile.calendar,
    normalizedCivilTime: civilTime,
    effectiveCalculationTime: civilTime,
    timezone: settings.timezone,
    solarTermBoundary: {
      status: 'pending',
      note: 'P1-B 将写入最近节气、下一节气、边界窗口与当前月柱依据。',
    },
    dayBoundaryRule: settings.dayBoundary,
    trueSolarCorrection: {
      applied: false,
      model: settings.solarTimeModel,
      civilTime,
      effectiveTime: civilTime,
      correctionMinutes: 0,
    },
    locationUsed: profile.latitude != null && profile.longitude != null
      ? {
          name: profile.birthCity,
          latitude: profile.latitude,
          longitude: profile.longitude,
          timezone: settings.timezone,
          datasetVersion: settings.locationDatasetVersion,
        }
      : undefined,
    warnings,
  };
}
