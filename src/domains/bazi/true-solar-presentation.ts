import {
  BAZI_TRUE_SOLAR_TIME_UNKNOWN,
  BAZI_TRUE_SOLAR_TIME_V1,
  BAZI_TRUE_SOLAR_TIME_V2,
  DEFAULT_BAZI_CALCULATION_SETTINGS,
} from '@/domains/bazi/types';
import type {
  BaziCalculationEvidence,
  BaziCalculationSettings,
} from '@/domains/bazi/types';
import type { BirthInputSnapshot } from '@/types/charts';
import type { BirthProfile } from '@/types/domain';

export const UNKNOWN_BAZI_EVIDENCE_TEXT = '历史记录未保存/无法确认';

export type BaziTrueSolarDisplayStatus = 'current' | 'legacy' | 'unknown' | 'not-applied';

export interface BaziTrueSolarEvidenceDisplay {
  status: BaziTrueSolarDisplayStatus;
  statusLabel: string;
  settingsVersionLabel: string;
  evidenceVersionLabel: string;
  hasConflict: boolean;
  conflictMessage?: string;
  rows: readonly (readonly [string, string])[];
  summary: string;
}

export interface BaziCurrentRuleReplay {
  profile: BirthProfile;
  settings: BaziCalculationSettings;
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function formatText(value: unknown): string {
  return hasText(value) ? value : UNKNOWN_BAZI_EVIDENCE_TEXT;
}

function formatMinutes(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value} 分钟`
    : UNKNOWN_BAZI_EVIDENCE_TEXT;
}

function formatApplied(value: unknown): string {
  if (value === true) return '已应用';
  if (value === false) return '明确未应用';
  return UNKNOWN_BAZI_EVIDENCE_TEXT;
}

function formatProvenance(value: unknown): string {
  if (value === 'current') return '当前规则证据';
  if (value === 'legacy') return '历史 v1 证据';
  if (value === 'not-applied') return '未启用证据';
  return UNKNOWN_BAZI_EVIDENCE_TEXT;
}

function formatRoundingRule(value: unknown): string {
  if (value === 'nearest-minute-half-away-from-zero') return '对称 half-away-from-zero（分钟）';
  if (value === 'legacy-js-math-round-after-tenth') return '旧版 Math.round（十分位后）';
  if (value === 'not-applied') return '未启用';
  if (value === 'legacy-unknown') return UNKNOWN_BAZI_EVIDENCE_TEXT;
  return formatText(value);
}

export function baziTrueSolarVersionLabel(value: unknown): string {
  if (value === BAZI_TRUE_SOLAR_TIME_V2) return 'NOAA v2（当前规则）';
  if (value === BAZI_TRUE_SOLAR_TIME_V1) return 'v1 近似公式（仅历史复现，非 NOAA）';
  if (value === BAZI_TRUE_SOLAR_TIME_UNKNOWN) return '历史版本未知';
  return UNKNOWN_BAZI_EVIDENCE_TEXT;
}

function evidenceStatus(evidence: BaziCalculationEvidence['trueSolarCorrection']): BaziTrueSolarDisplayStatus {
  if (evidence.provenanceStatus === 'not-applied') return 'not-applied';
  if (evidence.provenanceStatus === 'current' && evidence.algorithmVersion === BAZI_TRUE_SOLAR_TIME_V2) return 'current';
  if (evidence.provenanceStatus === 'legacy' && evidence.algorithmVersion === BAZI_TRUE_SOLAR_TIME_V1) return 'legacy';
  return 'unknown';
}

function statusLabel(status: BaziTrueSolarDisplayStatus): string {
  if (status === 'current') return 'NOAA v2（当前规则）';
  if (status === 'legacy') return 'v1 近似公式（仅历史复现，非 NOAA）';
  if (status === 'not-applied') return '未启用';
  return '历史版本未知';
}

/**
 * Build the read-only evidence projection used by both live results and
 * history. Missing legacy evidence stays visibly unknown; this helper never
 * fills a zero or a civil timestamp on behalf of an old record.
 */
export function buildBaziTrueSolarEvidenceDisplay(
  settings: BaziCalculationSettings,
  evidence: BaziCalculationEvidence,
): BaziTrueSolarEvidenceDisplay {
  const correction = evidence.trueSolarCorrection;
  const status = evidenceStatus(correction);
  const statusText = statusLabel(status);
  const settingsVersionLabel = baziTrueSolarVersionLabel(settings.trueSolarTimeVersion);
  const evidenceVersionLabel = baziTrueSolarVersionLabel(correction.algorithmVersion);
  const expectedApplied = settings.trueSolarTime && settings.solarTimeModel !== 'none';
  const versionConflict = settings.trueSolarTimeVersion !== correction.algorithmVersion;
  const appliedConflict = typeof correction.applied === 'boolean' && correction.applied !== expectedApplied;
  const modelConflict = correction.provenanceStatus !== 'unknown' && correction.model !== settings.solarTimeModel;
  const hasConflict = versionConflict || appliedConflict || modelConflict;
  const conflictMessage = hasConflict
    ? versionConflict && correction.provenanceStatus === 'unknown'
      ? `保存设置为“${settingsVersionLabel}”，但保存证据版本未知；未将未知证据解释为设置版本。`
      : '保存设置与保存证据不一致；历史结果仍按已保存快照展示。'
    : undefined;
  // The top-level evidence is the final pillar calculation time. With a
  // ziEarly boundary it can differ from the intermediate true-solar time
  // after day-boundary handling, so it must win when it is present.
  const effectiveTime = evidence.effectiveCalculationTime ?? correction.effectiveTime;
  const civilTime = correction.civilTime ?? evidence.normalizedCivilTime;
  const rows = [
    ['规则状态', statusText],
    ['保存设置版本', settingsVersionLabel],
    ['保存证据版本', evidenceVersionLabel],
    ['证据溯源', formatProvenance(correction.provenanceStatus)],
    ['应用状态', formatApplied(correction.applied)],
    ['原始修正', formatMinutes(correction.rawCorrectionMinutes)],
    ['展示修正', formatMinutes(correction.correctionMinutes)],
    ['实际应用修正', formatMinutes(correction.appliedCorrectionMinutes)],
    ['舍入规则', formatRoundingRule(correction.roundingRule)],
    ['数据来源', formatText(correction.dataSource)],
    ['来源版本', formatText(correction.dataVersion)],
    ['来源 URL', formatText(correction.dataSourceUrl)],
    ['民用时刻', formatText(civilTime)],
    ['归一化民用时刻', formatText(evidence.normalizedCivilTime)],
    ['有效计算时刻', formatText(effectiveTime)],
  ] as const;
  const summary = [
    `规则：${statusText}`,
    `证据版本：${evidenceVersionLabel}`,
    `来源：${formatText(correction.dataSource)}@${formatText(correction.dataVersion)}`,
    `原始修正：${formatMinutes(correction.rawCorrectionMinutes)}`,
    `展示修正：${formatMinutes(correction.correctionMinutes)}`,
    `实际应用修正：${formatMinutes(correction.appliedCorrectionMinutes)}`,
    `舍入：${formatRoundingRule(correction.roundingRule)}`,
    `有效计算时刻：${formatText(effectiveTime)}`,
    `来源 URL：${formatText(correction.dataSourceUrl)}`,
    ...(conflictMessage ? [`一致性提示：${conflictMessage}`] : []),
  ].join('\n');
  return {
    status,
    statusLabel: statusText,
    settingsVersionLabel,
    evidenceVersionLabel,
    hasConflict,
    ...(conflictMessage ? { conflictMessage } : {}),
    rows,
    summary,
  };
}

/**
 * Freeze the saved birth input while replacing only the true-solar algorithm
 * version with the current rule. It is intentionally pure and does not save,
 * mutate, or calculate a result.
 */
export function buildBaziCurrentRuleReplay(
  profile: BirthProfile,
  input: BirthInputSnapshot,
  savedSettings: BaziCalculationSettings,
): BaziCurrentRuleReplay {
  if (input.type !== 'birth') throw new Error('这条记录缺少可复核的出生输入快照。');
  if (!input.timeKnown || !input.birthTime) {
    throw new Error('按当前规则复核需要保存的出生时辰；原记录未保存准确时辰。');
  }

  const settings: BaziCalculationSettings = {
    ...DEFAULT_BAZI_CALCULATION_SETTINGS,
    ...savedSettings,
    trueSolarTimeVersion: BAZI_TRUE_SOLAR_TIME_V2,
  };
  if (settings.timezone !== DEFAULT_BAZI_CALCULATION_SETTINGS.timezone) {
    throw new Error(`当前版本仅支持 ${DEFAULT_BAZI_CALCULATION_SETTINGS.timezone}，无法复核其他业务时区。`);
  }
  if (settings.trueSolarTime && settings.solarTimeModel === 'none') {
    throw new Error('历史设置启用了真太阳时但未保存计算模型，无法安全复核。');
  }
  if (
    settings.trueSolarTime
    && (typeof input.longitude !== 'number' || !Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180)
  ) {
    throw new Error('按当前规则复核需要保存且已确认的出生地经度；原记录坐标无法确认，未猜测。');
  }

  return {
    profile: {
      ...profile,
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      timeKnown: input.timeKnown,
      birthCity: input.birthCity,
      calendar: input.calendar,
      isLeapMonth: input.isLeapMonth,
      gender: input.gender ?? profile.gender,
      locationId: input.locationId,
      locationDatasetVersion: input.locationDatasetVersion,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    settings,
  };
}
