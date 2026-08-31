import { CHART_SNAPSHOT_VERSION, DEFAULT_CALCULATION_TIMEZONE } from '@/types/charts';
import type {
  ChartInputSnapshot,
  ChartPayload,
  ChartSnapshotMeta,
  CalculationSettings,
  LiuyaoInputSnapshot,
} from '@/types/charts';
import {
  BAZI_TRUE_SOLAR_TIME_UNKNOWN,
  BAZI_TRUE_SOLAR_TIME_V1,
  BAZI_TRUE_SOLAR_TIME_V2,
  DEFAULT_BAZI_CALCULATION_SETTINGS,
} from '@/domains/bazi/types';
import type { BaziCalculationEvidence, BaziCalculationSettings, BaziSolarTimeVersion } from '@/domains/bazi/types';
import { TRUE_SOLAR_DATA_URL } from '@/domains/bazi/true-solar-time';
import type { BirthProfile, DivinationModule, LocalUser, ReadingFeedback, ReadingFeedbackStatus, SavedReading } from '@/types/domain';
import { migrateExplanationSnapshot } from '@/domains/explanation/snapshot';
import { isPublicBirthDateRangePolicy } from '@/domains/policy/public-birth-date-range';
import { isAstrologyCalculationPolicy } from '@/domains/astrology/policy';

export const STORAGE_SCHEMA_VERSION = 3 as const;

export interface VersionedStorageValue<T> {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION;
  value: T;
}

export interface DecodedStorageValue<T> {
  value: T;
  needsRewrite: boolean;
  blocked: boolean;
}

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isVersionedStorageValue(value: unknown): value is { schemaVersion: number; value: unknown } {
  return isRecord(value) && typeof value.schemaVersion === 'number' && 'value' in value;
}

export function encodeStorageValue<T>(value: T): string {
  const record: VersionedStorageValue<T> = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    value,
  };
  return JSON.stringify(record);
}

export class StorageWriteBlockedError extends Error {
  readonly key: string;

  constructor(key: string) {
    super(`Storage key ${key} is read-only because it was written by a newer schema.`);
    this.name = 'StorageWriteBlockedError';
    this.key = key;
  }
}

export function assertStorageWritable(key: string, blockedKeys: ReadonlySet<string>) {
  if (blockedKeys.has(key)) throw new StorageWriteBlockedError(key);
}

export function writeStorageValue<T>(
  key: string,
  value: T,
  blockedKeys: ReadonlySet<string>,
  setItem: (key: string, value: string) => Promise<void>,
) {
  assertStorageWritable(key, blockedKeys);
  return setItem(key, encodeStorageValue(value));
}

export function removeStorageValue(
  key: string,
  blockedKeys: ReadonlySet<string>,
  removeItem: (key: string) => Promise<void>,
) {
  assertStorageWritable(key, blockedKeys);
  return removeItem(key);
}

export function decodeStorageValue<T>(
  raw: string | null,
  fallback: T,
  migrate: (value: unknown, version: number) => T,
): DecodedStorageValue<T> {
  if (raw == null) return { value: fallback, needsRewrite: false, blocked: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { value: fallback, needsRewrite: false, blocked: true };
  }

  if (!isVersionedStorageValue(parsed)) {
    return { value: migrate(parsed, 0), needsRewrite: true, blocked: false };
  }

  if (parsed.schemaVersion > STORAGE_SCHEMA_VERSION) {
    return { value: fallback, needsRewrite: false, blocked: true };
  }

  return {
    value: migrate(parsed.value, parsed.schemaVersion),
    needsRewrite: parsed.schemaVersion !== STORAGE_SCHEMA_VERSION,
    blocked: false,
  };
}

export function migrateUser(value: unknown): LocalUser | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.displayName !== 'string') return null;
  return value as unknown as LocalUser;
}

export function migrateProfiles(value: unknown): BirthProfile[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((profile) => ({
    ...profile,
    timeKnown: typeof profile.timeKnown === 'boolean' ? profile.timeKnown : Boolean(profile.birthTime),
  })) as unknown as BirthProfile[];
}

export function migrateSelectedProfile(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

const FEEDBACK_STATUSES: ReadingFeedbackStatus[] = ['confirmed', 'partial', 'not-yet', 'contradicted'];

function migrateFeedbackLinks(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
  return ids.length > 0 ? [...new Set(ids)] : undefined;
}

function migrateFeedback(value: unknown): ReadingFeedback[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).flatMap((feedback) => {
    if (
      typeof feedback.id !== 'string'
      || typeof feedback.observedAt !== 'string'
      || typeof feedback.note !== 'string'
      || typeof feedback.createdAt !== 'string'
      || !FEEDBACK_STATUSES.includes(feedback.status as ReadingFeedbackStatus)
    ) {
      return [];
    }
    const updatedAt = typeof feedback.updatedAt === 'string' ? feedback.updatedAt : undefined;
    const linkedInterpretationIds = migrateFeedbackLinks(feedback.linkedInterpretationIds);
    const linkedEvidenceIds = migrateFeedbackLinks(feedback.linkedEvidenceIds);
    return [{
      id: feedback.id,
      status: feedback.status as ReadingFeedbackStatus,
      observedAt: feedback.observedAt,
      note: feedback.note,
      createdAt: feedback.createdAt,
      ...(updatedAt ? { updatedAt } : {}),
      ...(linkedInterpretationIds ? { linkedInterpretationIds } : {}),
      ...(linkedEvidenceIds ? { linkedEvidenceIds } : {}),
    }];
  });
}

function isInputSnapshot(value: unknown): value is ChartInputSnapshot {
  return isRecord(value) && ['birth', 'liuyao', 'legacy'].includes(String(value.type));
}

function isCompleteLegacyBaziSettings(value: unknown): value is RecordLike {
  return isRecord(value)
    && typeof value.dayBoundary === 'string'
    && typeof value.trueSolarTime === 'boolean'
    && typeof value.solarTimeModel === 'string'
    && typeof value.locationDatasetVersion === 'string'
    && typeof value.calendarResolverVersion === 'string';
}

function isBaziSolarTimeVersion(value: unknown): value is BaziSolarTimeVersion {
  return value === BAZI_TRUE_SOLAR_TIME_V1 || value === BAZI_TRUE_SOLAR_TIME_V2 || value === BAZI_TRUE_SOLAR_TIME_UNKNOWN;
}

function migrateCalculationSettings(value: unknown, module?: DivinationModule): CalculationSettings {
  if (module === 'bazi') {
    const raw = isRecord(value) ? value : {};
    // Keep the current policy only when the snapshot explicitly persisted it.
    // A legacy snapshot remains readable without being retroactively labeled
    // as having been admitted by a policy that did not exist when it ran.
    const { birthDateRangePolicy: _legacyPolicy, ...legacyBaziDefaults } = DEFAULT_BAZI_CALCULATION_SETTINGS;
    const hasCompleteLegacySettings = isCompleteLegacyBaziSettings(raw);
    const trueSolarTimeVersion = isBaziSolarTimeVersion(raw.trueSolarTimeVersion)
      ? raw.trueSolarTimeVersion
      : raw.trueSolarTimeVersion !== undefined
        ? BAZI_TRUE_SOLAR_TIME_UNKNOWN
        : hasCompleteLegacySettings
          ? BAZI_TRUE_SOLAR_TIME_V1
          : BAZI_TRUE_SOLAR_TIME_UNKNOWN;
    return {
      ...legacyBaziDefaults,
      timezone: DEFAULT_CALCULATION_TIMEZONE,
      ...(raw.dayBoundary === 'midnight' || raw.dayBoundary === 'ziEarly' ? { dayBoundary: raw.dayBoundary } : {}),
      ...(typeof raw.trueSolarTime === 'boolean' ? { trueSolarTime: raw.trueSolarTime } : {}),
      ...(raw.solarTimeModel === 'none' || raw.solarTimeModel === 'localMeanSolarTime' || raw.solarTimeModel === 'apparentSolarTime' ? { solarTimeModel: raw.solarTimeModel } : {}),
      trueSolarTimeVersion,
      ...(typeof raw.locationDatasetVersion === 'string' ? { locationDatasetVersion: raw.locationDatasetVersion } : {}),
      ...(typeof raw.calendarResolverVersion === 'string' ? { calendarResolverVersion: raw.calendarResolverVersion } : {}),
      ...(isPublicBirthDateRangePolicy(raw.birthDateRangePolicy)
        ? { birthDateRangePolicy: raw.birthDateRangePolicy }
        : {}),
    } as BaziCalculationSettings;
  }
  const raw = isRecord(value) ? value : {};
  return {
    timezone: DEFAULT_CALCULATION_TIMEZONE,
    ...(isPublicBirthDateRangePolicy(raw.birthDateRangePolicy)
      ? { birthDateRangePolicy: raw.birthDateRangePolicy }
      : {}),
    // Do not invent an Astrology policy for old records; preserve it only
    // when the serialized snapshot explicitly contains a valid contract.
    ...(module === 'astrology' && isAstrologyCalculationPolicy(raw.astrologyPolicy)
      ? { astrologyPolicy: raw.astrologyPolicy }
      : {}),
  };
}

function migrateInputSnapshot(value: unknown): ChartInputSnapshot | null {
  if (!isInputSnapshot(value)) return null;
  const { astrologyPolicy, ...snapshot } = value as ChartInputSnapshot & { astrologyPolicy?: unknown };
  return {
    ...snapshot,
    timezone: DEFAULT_CALCULATION_TIMEZONE,
    ...(isAstrologyCalculationPolicy(astrologyPolicy) ? { astrologyPolicy } : {}),
  } as unknown as ChartInputSnapshot;
}

function legacyBaziEvidence(inputSnapshot: ChartInputSnapshot, settings: CalculationSettings): BaziCalculationEvidence {
  const baziSettings = settings as BaziCalculationSettings;
  const birth = inputSnapshot.type === 'birth' ? inputSnapshot : null;
  const civilTime = birth
    ? `${birth.birthDate}T${birth.birthTime ? `${birth.birthTime}:00` : '00:00:00'}`
    : '历史记录未保存原始出生时刻';
  const trueSolarEvidenceIsUnknown = baziSettings.trueSolarTime;
  const trueSolarCorrection: BaziCalculationEvidence['trueSolarCorrection'] = {
    ...(trueSolarEvidenceIsUnknown ? {} : { applied: false }),
    model: baziSettings.solarTimeModel,
    algorithmVersion: trueSolarEvidenceIsUnknown ? BAZI_TRUE_SOLAR_TIME_UNKNOWN : baziSettings.trueSolarTimeVersion,
    civilTime,
    ...(trueSolarEvidenceIsUnknown
      ? {}
      : {
          effectiveTime: civilTime,
          rawCorrectionMinutes: 0,
          correctionMinutes: 0,
          appliedCorrectionMinutes: 0,
        }),
    roundingRule: trueSolarEvidenceIsUnknown ? 'legacy-unknown' : 'not-applied',
    dataSource: trueSolarEvidenceIsUnknown ? 'legacy-record' : 'not-applicable',
    dataVersion: trueSolarEvidenceIsUnknown ? BAZI_TRUE_SOLAR_TIME_UNKNOWN : baziSettings.trueSolarTimeVersion,
    provenanceStatus: trueSolarEvidenceIsUnknown ? 'unknown' : 'not-applied',
  };
  return {
    sourceCalendar: birth?.calendar ?? 'solar',
    normalizedCivilTime: civilTime,
    ...(trueSolarEvidenceIsUnknown ? {} : { effectiveCalculationTime: civilTime }),
    timezone: DEFAULT_CALCULATION_TIMEZONE,
    calendarConversion: {
      sourceCalendar: birth?.calendar ?? 'solar',
      inputDate: birth?.birthDate ?? 'unknown',
      inputTime: birth?.birthTime ? `${birth.birthTime}:00` : '00:00:00',
      isLeapMonth: birth?.isLeapMonth,
      normalizedSolarDateTime: civilTime,
      dataSource: 'legacy-record',
      dataVersion: 'unknown',
      resolverVersion: 'legacy-default',
      note: '历史记录未保存独立历法换算证据；当前版本不重算原始结果。',
    },
    solarTermBoundary: {
      status: 'pending',
      note: '历史记录未保存 P1-A 节气证据；当前版本不会重新解释原始结果。',
    },
    dayBoundaryRule: baziSettings.dayBoundary,
    trueSolarCorrection,
    locationUsed: birth
      ? {
          name: birth.birthCity,
          latitude: birth.latitude,
          longitude: birth.longitude,
          timezone: DEFAULT_CALCULATION_TIMEZONE,
          datasetVersion: baziSettings.locationDatasetVersion,
        }
      : undefined,
    warnings: [trueSolarEvidenceIsUnknown
      ? '历史记录未保存真太阳时证据，应用状态未知；原始结果未重新计算。'
      : '历史记录未保存 P1-A 计算证据，已标记为历史默认规则；原始结果未重新计算。'],
  };
}

function migrateTrueSolarCorrection(value: unknown, settings: BaziCalculationSettings, fallbackCivilTime?: string): RecordLike {
  const raw = isRecord(value) ? value : {};
  const hasAppliedFlag = typeof raw.applied === 'boolean';
  const applied = hasAppliedFlag ? raw.applied : undefined;
  const hasEffectiveTime = typeof raw.effectiveTime === 'string';
  const hasCorrectionValue = typeof raw.rawCorrectionMinutes === 'number'
    || typeof raw.correctionMinutes === 'number'
    || typeof raw.appliedCorrectionMinutes === 'number';
  const evidenceIsUnknown = settings.trueSolarTime && (
    raw.provenanceStatus === 'unknown'
    || raw.dataVersion === BAZI_TRUE_SOLAR_TIME_UNKNOWN
    || raw.roundingRule === 'legacy-unknown'
    || !hasEffectiveTime
    || !hasCorrectionValue
  );
  if (evidenceIsUnknown) {
    return {
      ...raw,
      ...(typeof raw.civilTime === 'string'
        ? { civilTime: raw.civilTime }
        : fallbackCivilTime
          ? { civilTime: fallbackCivilTime }
          : {}),
      algorithmVersion: BAZI_TRUE_SOLAR_TIME_UNKNOWN,
      ...(typeof raw.effectiveTime === 'string' ? { effectiveTime: raw.effectiveTime } : {}),
      ...(typeof raw.rawCorrectionMinutes === 'number' ? { rawCorrectionMinutes: raw.rawCorrectionMinutes } : {}),
      ...(typeof raw.correctionMinutes === 'number' ? { correctionMinutes: raw.correctionMinutes } : {}),
      ...(typeof raw.appliedCorrectionMinutes === 'number' ? { appliedCorrectionMinutes: raw.appliedCorrectionMinutes } : {}),
      roundingRule: 'legacy-unknown',
      dataSource: 'legacy-record',
      dataVersion: BAZI_TRUE_SOLAR_TIME_UNKNOWN,
      provenanceStatus: 'unknown',
    };
  }
  const correctionMinutes = typeof raw.correctionMinutes === 'number' ? raw.correctionMinutes : undefined;
  return {
    ...raw,
    applied: applied ?? false,
    algorithmVersion: isBaziSolarTimeVersion(raw.algorithmVersion)
      ? raw.algorithmVersion
      : settings.trueSolarTimeVersion,
    ...(typeof raw.civilTime === 'string' ? { civilTime: raw.civilTime } : fallbackCivilTime ? { civilTime: fallbackCivilTime } : {}),
    ...(typeof raw.effectiveTime === 'string' ? { effectiveTime: raw.effectiveTime } : fallbackCivilTime ? { effectiveTime: fallbackCivilTime } : {}),
    rawCorrectionMinutes: typeof raw.rawCorrectionMinutes === 'number' ? raw.rawCorrectionMinutes : correctionMinutes ?? 0,
    appliedCorrectionMinutes: typeof raw.appliedCorrectionMinutes === 'number'
      ? raw.appliedCorrectionMinutes
      : applied === true && correctionMinutes !== undefined
        ? Math.round(correctionMinutes)
        : 0,
    roundingRule: typeof raw.roundingRule === 'string'
      ? raw.roundingRule
      : evidenceIsUnknown
        ? 'legacy-unknown'
        : applied === true
          ? 'legacy-js-math-round-after-tenth'
          : 'not-applied',
    dataSource: typeof raw.dataSource === 'string'
      ? raw.dataSource
      : evidenceIsUnknown
        ? 'legacy-record'
        : applied === true
          ? 'legacy-record'
          : 'not-applicable',
    dataVersion: typeof raw.dataVersion === 'string'
      ? raw.dataVersion
      : evidenceIsUnknown
        ? BAZI_TRUE_SOLAR_TIME_UNKNOWN
        : settings.trueSolarTimeVersion,
    ...(typeof raw.dataSourceUrl === 'string'
      ? { dataSourceUrl: raw.dataSourceUrl }
      : raw.provenanceStatus === 'current' && raw.algorithmVersion === BAZI_TRUE_SOLAR_TIME_V2
        ? { dataSourceUrl: TRUE_SOLAR_DATA_URL }
        : {}),
    provenanceStatus: raw.provenanceStatus === 'current'
      || raw.provenanceStatus === 'legacy'
      || raw.provenanceStatus === 'unknown'
      || raw.provenanceStatus === 'not-applied'
      ? raw.provenanceStatus
      : evidenceIsUnknown
        ? 'unknown'
        : applied === true
          ? 'legacy'
          : 'not-applied',
  };
}

function migrateBaziEvidence(value: unknown, inputSnapshot: ChartInputSnapshot, settings: BaziCalculationSettings): BaziCalculationEvidence {
  const fallback = legacyBaziEvidence(inputSnapshot, settings);
  if (!isRecord(value)) return fallback;
  return {
    ...value,
    calendarConversion: isRecord(value.calendarConversion)
      ? value.calendarConversion
      : fallback.calendarConversion,
    trueSolarCorrection: migrateTrueSolarCorrection(value.trueSolarCorrection, settings, fallback.trueSolarCorrection.civilTime),
  } as unknown as BaziCalculationEvidence;
}

function calculationSettingsOrigin(
  module: DivinationModule,
  rawSettings: unknown,
  settings: CalculationSettings,
): ChartSnapshotMeta['calculationSettingsOrigin'] {
  if (module !== 'bazi') return 'current';
  const baziSettings = settings as BaziCalculationSettings;
  if (baziSettings.trueSolarTimeVersion === BAZI_TRUE_SOLAR_TIME_V2 && isBaziSolarTimeVersion(isRecord(rawSettings) ? rawSettings.trueSolarTimeVersion : undefined)) {
    return 'current';
  }
  if (baziSettings.trueSolarTimeVersion === BAZI_TRUE_SOLAR_TIME_V1) return 'legacy-true-solar-v1';
  return 'legacy-unknown';
}

function legacyInputSnapshot(module: DivinationModule, payload: RecordLike, reading: RecordLike): ChartInputSnapshot {
  if (module === 'liuyao') {
    const liuyao: LiuyaoInputSnapshot = {
      type: 'liuyao',
      timezone: DEFAULT_CALCULATION_TIMEZONE,
      question: typeof payload.question === 'string' ? payload.question : '历史记录（问题未保存）',
      target: '历史记录（用神未保存）',
      seed: 'legacy-unknown',
      date: typeof payload.date === 'string' ? payload.date : typeof payload.generatedAt === 'string' ? payload.generatedAt : String(reading.createdAt ?? ''),
      seedScope: 'legacy',
    };
    return liuyao;
  }
  return {
    type: 'legacy',
    timezone: DEFAULT_CALCULATION_TIMEZONE,
    module,
    reason: 'pre-snapshot-v1 record; original input was not persisted',
  };
}

export function snapshotMetaFromPayload(payload: ChartPayload): ChartSnapshotMeta {
  return {
    snapshotVersion: payload.snapshotVersion,
    generatedAt: payload.generatedAt,
    engineVersion: payload.engineVersion,
    calculationSettings: payload.calculationSettings,
    calculationSettingsOrigin: 'current',
    inputSnapshot: payload.inputSnapshot,
  };
}

function migrateReading(value: unknown): SavedReading | null {
  if (!isRecord(value) || !isRecord(value.payload)) return null;
  const rawPayload = value.payload;
  const module = (value.module ?? rawPayload.module) as DivinationModule;
  if (!['bazi', 'liuyao', 'ziwei', 'astrology'].includes(module)) return null;

  const inputSnapshot = migrateInputSnapshot(value.inputSnapshot)
    ?? migrateInputSnapshot(rawPayload.inputSnapshot)
    ?? legacyInputSnapshot(module, rawPayload, value);
  const rawSnapshotMeta = isRecord(value.snapshotMeta) ? value.snapshotMeta : undefined;
  const rawCalculationSettings = rawPayload.calculationSettings
    ?? rawSnapshotMeta?.calculationSettings
    ?? value.calculationSettings;
  const calculationSettings = migrateCalculationSettings(rawCalculationSettings, module);
  const hasBaziSettings = module !== 'bazi' || isCompleteLegacyBaziSettings(rawCalculationSettings);
  const generatedAt = typeof value.createdAt === 'string'
    ? value.createdAt
    : typeof rawPayload.generatedAt === 'string'
      ? rawPayload.generatedAt
      : new Date(0).toISOString();
  const engineVersion = typeof value.engineVersion === 'string'
    ? value.engineVersion
    : typeof rawPayload.engineVersion === 'string'
      ? rawPayload.engineVersion
      : 'legacy-unknown';
  const payloadInputSnapshot = migrateInputSnapshot(rawPayload.inputSnapshot) ?? inputSnapshot;
  const payloadCalculationSettings = calculationSettings;
  const payloadBaziEvidence = module === 'bazi'
    ? migrateBaziEvidence(rawPayload.calculationEvidence, payloadInputSnapshot, payloadCalculationSettings as BaziCalculationSettings)
    : undefined;
  const explanationSnapshot = migrateExplanationSnapshot(value.explanationSnapshot ?? rawPayload.explanation);
  const rawPayloadWithoutExplanation = Object.fromEntries(
    Object.entries(rawPayload).filter(([key]) => key !== 'explanation'),
  );
  const payload = {
    ...rawPayloadWithoutExplanation,
    module,
    snapshotVersion: rawPayload.snapshotVersion ?? CHART_SNAPSHOT_VERSION,
    generatedAt: rawPayload.generatedAt ?? generatedAt,
    engineVersion: rawPayload.engineVersion ?? engineVersion,
    calculationSettings: payloadCalculationSettings,
    inputSnapshot: payloadInputSnapshot,
    ...(module === 'bazi' ? { calculationEvidence: payloadBaziEvidence } : {}),
    ...(module === 'liuyao'
      ? {
          seed: rawPayload.seed ?? (inputSnapshot.type === 'liuyao' ? inputSnapshot.seed : 'legacy-unknown'),
          date: rawPayload.date ?? (inputSnapshot.type === 'liuyao' ? inputSnapshot.date : generatedAt),
          seedScope: rawPayload.seedScope ?? (inputSnapshot.type === 'liuyao' ? inputSnapshot.seedScope : 'legacy'),
        }
      : {}),
    ...(explanationSnapshot ? { explanation: explanationSnapshot } : {}),
  } as unknown as ChartPayload;
  const migratedOrigin = calculationSettingsOrigin(module, rawCalculationSettings, calculationSettings);
  const snapshotMeta = rawSnapshotMeta
    ? {
        snapshotVersion: rawSnapshotMeta.snapshotVersion ?? CHART_SNAPSHOT_VERSION,
        generatedAt: rawSnapshotMeta.generatedAt ?? generatedAt,
        engineVersion: rawSnapshotMeta.engineVersion ?? engineVersion,
        calculationSettings: payloadCalculationSettings,
        calculationSettingsOrigin: rawSnapshotMeta.calculationSettingsOrigin === 'legacy-default'
          || rawSnapshotMeta.calculationSettingsOrigin === 'legacy-true-solar-v1'
          || rawSnapshotMeta.calculationSettingsOrigin === 'legacy-unknown'
          ? rawSnapshotMeta.calculationSettingsOrigin
          : migratedOrigin,
        inputSnapshot: migrateInputSnapshot(rawSnapshotMeta.inputSnapshot) ?? inputSnapshot,
      } as ChartSnapshotMeta
    : {
        ...snapshotMetaFromPayload(payload),
        calculationSettingsOrigin: module === 'bazi' ? migratedOrigin : hasBaziSettings ? 'current' : 'legacy-default',
      };
  const liuyaoPayload = module === 'liuyao' && payload.module === 'liuyao' ? payload : null;
  const baziSnapshots = module === 'bazi'
    ? {
        ...(isRecord(value.normalizedChartSnapshot)
          ? { normalizedChartSnapshot: value.normalizedChartSnapshot }
          : isRecord(rawPayload.normalizedChart)
            ? { normalizedChartSnapshot: rawPayload.normalizedChart }
            : {}),
        ...(isRecord(value.evidenceGraphSnapshot)
          ? { evidenceGraphSnapshot: value.evidenceGraphSnapshot }
          : isRecord(rawPayload.evidenceGraph)
            ? { evidenceGraphSnapshot: rawPayload.evidenceGraph }
            : {}),
        ...(isRecord(value.interpretationSnapshot)
          ? { interpretationSnapshot: value.interpretationSnapshot }
          : isRecord(rawPayload.interpretation)
            ? { interpretationSnapshot: rawPayload.interpretation }
            : {}),
      }
    : {};

  return {
    ...value,
    module,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : generatedAt,
    engineVersion,
    interpretationVersion: typeof value.interpretationVersion === 'string'
      ? value.interpretationVersion
      : module === 'bazi' && isRecord(rawPayload.interpretation) && typeof rawPayload.interpretation.interpretationVersion === 'string'
        ? rawPayload.interpretation.interpretationVersion
        : 'rules-v1',
    snapshotMeta,
    inputSnapshot,
    ...(isRecord(value.profileSnapshot) ? { profileSnapshot: value.profileSnapshot } : {}),
    favorite: value.favorite === true,
    feedback: migrateFeedback(value.feedback),
    ...(liuyaoPayload
      ? {
          seed: liuyaoPayload.seed,
          date: liuyaoPayload.date,
          seedScope: liuyaoPayload.seedScope,
        }
      : {}),
    ...baziSnapshots,
    ...(explanationSnapshot ? { explanationSnapshot } : {}),
    payload,
  } as unknown as SavedReading;
}

export function migrateReadings(value: unknown): SavedReading[] {
  if (!Array.isArray(value)) return [];
  return value.map(migrateReading).filter((reading): reading is SavedReading => reading !== null);
}
