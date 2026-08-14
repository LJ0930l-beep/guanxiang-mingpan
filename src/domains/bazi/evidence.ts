import type { BirthProfile } from '@/types/domain';
import { resolveSolarTermBoundary } from '@/domains/bazi/solar-terms';
import type { BaziDayBoundaryResolution } from '@/domains/bazi/day-boundary';
import type { BaziCalculationEvidence, BaziCalculationSettings, SolarTermBoundaryEvidence } from '@/domains/bazi/types';

function normalizedCivilTime(profile: BirthProfile): string {
  const time = profile.birthTime ?? '00:00';
  return `${profile.birthDate}T${time.length === 5 ? `${time}:00` : time}`;
}

export function createBaziCalculationEvidence(
  profile: BirthProfile,
  settings: BaziCalculationSettings,
  dayBoundaryResolution?: BaziDayBoundaryResolution,
): BaziCalculationEvidence {
  const civilTime = normalizedCivilTime(profile);
  const effectiveTime = dayBoundaryResolution
    ? `${dayBoundaryResolution.effectiveDate}T${dayBoundaryResolution.effectiveTime}`
    : civilTime;
  const warningsForDayBoundary: string[] = [];
  if (dayBoundaryResolution?.shiftedToNextDate) {
    warningsForDayBoundary.push(dayBoundaryResolution.note);
  }
  const warnings = ['P1-B：真太阳时尚未启用，当前有效计算时刻与输入民用时刻相同。'];
  warnings.push(...warningsForDayBoundary);
  if (dayBoundaryResolution?.shiftedToNextDate) warnings[0] = 'P1-B：真太阳时尚未启用；日界线规则已改变有效计算日期。';
  let solarTermBoundary: SolarTermBoundaryEvidence = {
    status: 'pending',
    note: '当前为农历输入，公历换算与节气证据将在 P1-E 补齐。',
  };
  if (profile.calendar === 'lunar') {
    warnings.push('农历转公历的独立换算证据将在 P1-E 写入。');
  } else {
    try {
      const resolution = resolveSolarTermBoundary(civilTime);
      solarTermBoundary = {
        status: 'resolved',
        recentTerm: `${resolution.recentTerm.name} · ${resolution.recentTerm.civilTime}`,
        nextTerm: `${resolution.nextTerm.name} · ${resolution.nextTerm.civilTime}`,
        boundaryWindow: resolution.boundaryWindow,
        currentMonthBasis: resolution.currentMonthBasis.explanation,
        note: `数据源 ${resolution.dataSource}@${resolution.dataVersion}；精度 ${resolution.precisionSeconds} 秒；业务时区 ${resolution.timezone}。`,
      };
    } catch (error) {
      warnings.push(error instanceof Error ? `节气边界暂时无法解析：${error.message}` : '节气边界暂时无法解析。');
    }
  }
  if (profile.latitude == null || profile.longitude == null) {
    warnings.push('出生地没有可用经纬度，位置证据暂不声明坐标精度。');
  }

  return {
    sourceCalendar: profile.calendar,
    normalizedCivilTime: civilTime,
    effectiveCalculationTime: effectiveTime,
    timezone: settings.timezone,
    solarTermBoundary,
    dayBoundaryRule: settings.dayBoundary,
    trueSolarCorrection: {
      applied: false,
      model: settings.solarTimeModel,
      civilTime,
      effectiveTime,
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
