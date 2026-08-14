import type { BirthProfile } from '@/types/domain';
import { resolveSolarTermBoundary } from '@/domains/bazi/solar-terms';
import type { BaziDayBoundaryResolution } from '@/domains/bazi/day-boundary';
import type { TrueSolarTimeResolution } from '@/domains/bazi/true-solar-time';
import type { BaziCalendarResolution } from '@/domains/bazi/calendar-resolver';
import type { BaziCalculationEvidence, BaziCalculationSettings, SolarTermBoundaryEvidence } from '@/domains/bazi/types';

function normalizedCivilTime(profile: BirthProfile): string {
  const time = profile.birthTime ?? '00:00';
  return `${profile.birthDate}T${time.length === 5 ? `${time}:00` : time}`;
}

export function createBaziCalculationEvidence(
  profile: BirthProfile,
  settings: BaziCalculationSettings,
  dayBoundaryResolution?: BaziDayBoundaryResolution,
  trueSolarResolution?: TrueSolarTimeResolution,
  calendarResolution?: BaziCalendarResolution,
): BaziCalculationEvidence {
  const civilTime = normalizedCivilTime(profile);
  const calendarConversion = calendarResolution?.conversion ?? {
    sourceCalendar: profile.calendar,
    inputDate: profile.birthDate,
    inputTime: civilTime.slice(11),
    normalizedSolarDateTime: civilTime,
    dataSource: '6tail/lunar-javascript',
    dataVersion: '1.7.7',
    resolverVersion: 'calendar-resolver-p1e-v1',
    note: '未提供独立历法解析上下文。',
  };
  const effectiveTime = dayBoundaryResolution
    ? `${dayBoundaryResolution.effectiveDate}T${dayBoundaryResolution.effectiveTime}`
    : trueSolarResolution?.applied
      ? `${trueSolarResolution.effectiveDate}T${trueSolarResolution.effectiveTime}`
      : calendarConversion.normalizedSolarDateTime;
  const warningsForDayBoundary: string[] = [];
  if (dayBoundaryResolution?.shiftedToNextDate) {
    warningsForDayBoundary.push(dayBoundaryResolution.note);
  }
  const warnings = trueSolarResolution?.applied
    ? []
    : ['P1-B：真太阳时尚未启用，当前有效计算时刻与输入民用时刻相同。'];
  warnings.push(...warningsForDayBoundary);
  if (dayBoundaryResolution?.shiftedToNextDate && !trueSolarResolution?.applied && warnings.length > 0) warnings[0] = 'P1-B：真太阳时尚未启用；日界线规则已改变有效计算日期。';
  if (trueSolarResolution?.applied) warnings.push(trueSolarResolution.note);
  if (profile.calendar === 'lunar') warnings.push(calendarConversion.note);
  let solarTermBoundary: SolarTermBoundaryEvidence = {
    status: 'pending',
    note: '当前尚未取得可用的节气边界证据。',
  };
  try {
    const resolution = resolveSolarTermBoundary(effectiveTime);
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
  if (profile.latitude == null || profile.longitude == null) {
    warnings.push('出生地没有可用经纬度，位置证据暂不声明坐标精度。');
  }

  return {
    sourceCalendar: profile.calendar,
    normalizedCivilTime: civilTime,
    effectiveCalculationTime: effectiveTime,
    timezone: settings.timezone,
    calendarConversion,
    solarTermBoundary,
    dayBoundaryRule: settings.dayBoundary,
    trueSolarCorrection: trueSolarResolution?.applied
      ? {
          applied: true,
          model: trueSolarResolution.model,
          civilTime: trueSolarResolution.civilTime,
          effectiveTime: `${trueSolarResolution.effectiveDate}T${trueSolarResolution.effectiveTime}`,
          correctionMinutes: trueSolarResolution.correctionMinutes,
          longitude: trueSolarResolution.longitude,
          standardMeridian: trueSolarResolution.standardMeridian,
          precisionMinutes: trueSolarResolution.precisionMinutes,
          note: trueSolarResolution.note,
        }
      : {
          applied: false,
          model: settings.solarTimeModel,
          civilTime: calendarConversion.normalizedSolarDateTime,
          effectiveTime,
          correctionMinutes: 0,
          standardMeridian: 120,
          precisionMinutes: 1,
          note: '未启用真太阳时；有效计算时刻等于输入民用时刻。',
        },
    locationUsed: profile.latitude != null && profile.longitude != null
      ? {
          name: profile.birthCity,
          locationId: profile.locationId,
          province: profile.locationProvince,
          city: profile.locationCity,
          district: profile.locationDistrict,
          latitude: profile.latitude,
          longitude: profile.longitude,
          timezone: settings.timezone,
          datasetVersion: profile.locationDatasetVersion ?? settings.locationDatasetVersion,
          source: profile.locationSource,
        }
      : undefined,
    warnings,
  };
}
