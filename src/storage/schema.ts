import { CHART_SNAPSHOT_VERSION, DEFAULT_CALCULATION_TIMEZONE } from '@/types/charts';
import type {
  ChartInputSnapshot,
  ChartPayload,
  ChartSnapshotMeta,
  CalculationSettings,
  LiuyaoInputSnapshot,
} from '@/types/charts';
import { DEFAULT_BAZI_CALCULATION_SETTINGS } from '@/domains/bazi/types';
import type { BaziCalculationEvidence, BaziCalculationSettings } from '@/domains/bazi/types';
import type { BirthProfile, DivinationModule, LocalUser, ReadingFeedback, ReadingFeedbackStatus, SavedReading } from '@/types/domain';

export const STORAGE_SCHEMA_VERSION = 2 as const;

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
    return [{
      id: feedback.id,
      status: feedback.status as ReadingFeedbackStatus,
      observedAt: feedback.observedAt,
      note: feedback.note,
      createdAt: feedback.createdAt,
    }];
  });
}

function isInputSnapshot(value: unknown): value is ChartInputSnapshot {
  return isRecord(value) && ['birth', 'liuyao', 'legacy'].includes(String(value.type));
}

function migrateCalculationSettings(value: unknown, module?: DivinationModule): CalculationSettings {
  if (module === 'bazi') {
    const raw = isRecord(value) ? value : {};
    return {
      ...DEFAULT_BAZI_CALCULATION_SETTINGS,
      timezone: DEFAULT_CALCULATION_TIMEZONE,
      ...(raw.dayBoundary === 'midnight' || raw.dayBoundary === 'ziEarly' ? { dayBoundary: raw.dayBoundary } : {}),
      ...(typeof raw.trueSolarTime === 'boolean' ? { trueSolarTime: raw.trueSolarTime } : {}),
      ...(raw.solarTimeModel === 'none' || raw.solarTimeModel === 'localMeanSolarTime' || raw.solarTimeModel === 'apparentSolarTime' ? { solarTimeModel: raw.solarTimeModel } : {}),
      ...(typeof raw.locationDatasetVersion === 'string' ? { locationDatasetVersion: raw.locationDatasetVersion } : {}),
      ...(typeof raw.calendarResolverVersion === 'string' ? { calendarResolverVersion: raw.calendarResolverVersion } : {}),
    } satisfies BaziCalculationSettings;
  }
  return { timezone: DEFAULT_CALCULATION_TIMEZONE };
}

function migrateInputSnapshot(value: unknown): ChartInputSnapshot | null {
  if (!isInputSnapshot(value)) return null;
  return {
    ...value,
    timezone: DEFAULT_CALCULATION_TIMEZONE,
  } as unknown as ChartInputSnapshot;
}

function legacyBaziEvidence(inputSnapshot: ChartInputSnapshot, settings: CalculationSettings): BaziCalculationEvidence {
  const baziSettings = settings as BaziCalculationSettings;
  const birth = inputSnapshot.type === 'birth' ? inputSnapshot : null;
  const civilTime = birth
    ? `${birth.birthDate}T${birth.birthTime ? `${birth.birthTime}:00` : '00:00:00'}`
    : '历史记录未保存原始出生时刻';
  return {
    sourceCalendar: birth?.calendar ?? 'solar',
    normalizedCivilTime: civilTime,
    effectiveCalculationTime: civilTime,
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
    trueSolarCorrection: {
      applied: false,
      model: baziSettings.solarTimeModel,
      civilTime,
      effectiveTime: civilTime,
      correctionMinutes: 0,
    },
    locationUsed: birth
      ? {
          name: birth.birthCity,
          latitude: birth.latitude,
          longitude: birth.longitude,
          timezone: DEFAULT_CALCULATION_TIMEZONE,
          datasetVersion: baziSettings.locationDatasetVersion,
        }
      : undefined,
    warnings: ['历史记录未保存 P1-A 计算证据，已标记为历史默认规则；原始结果未重新计算。'],
  };
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
  const rawCalculationSettings = value.calculationSettings ?? rawPayload.calculationSettings;
  const calculationSettings = migrateCalculationSettings(rawCalculationSettings, module);
  const hasBaziSettings = module !== 'bazi' || (isRecord(rawCalculationSettings)
    && typeof rawCalculationSettings.dayBoundary === 'string'
    && typeof rawCalculationSettings.trueSolarTime === 'boolean'
    && typeof rawCalculationSettings.solarTimeModel === 'string'
    && typeof rawCalculationSettings.locationDatasetVersion === 'string'
    && typeof rawCalculationSettings.calendarResolverVersion === 'string');
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
  const payloadCalculationSettings = migrateCalculationSettings(rawPayload.calculationSettings ?? calculationSettings, module);
  const payloadBaziEvidence = module === 'bazi'
    ? !isRecord(rawPayload.calculationEvidence)
      ? legacyBaziEvidence(payloadInputSnapshot, payloadCalculationSettings)
      : !isRecord(rawPayload.calculationEvidence.calendarConversion)
        ? {
            ...rawPayload.calculationEvidence,
            calendarConversion: legacyBaziEvidence(payloadInputSnapshot, payloadCalculationSettings).calendarConversion,
          }
        : rawPayload.calculationEvidence
    : undefined;
  const payload = {
    ...rawPayload,
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
  } as unknown as ChartPayload;
  const snapshotMeta = isRecord(value.snapshotMeta)
    ? {
        snapshotVersion: value.snapshotMeta.snapshotVersion ?? CHART_SNAPSHOT_VERSION,
        generatedAt: value.snapshotMeta.generatedAt ?? generatedAt,
        engineVersion: value.snapshotMeta.engineVersion ?? engineVersion,
        calculationSettings: migrateCalculationSettings(value.snapshotMeta.calculationSettings ?? calculationSettings, module),
        calculationSettingsOrigin: value.snapshotMeta.calculationSettingsOrigin === 'legacy-default' || !hasBaziSettings ? 'legacy-default' : 'current',
        inputSnapshot: migrateInputSnapshot(value.snapshotMeta.inputSnapshot) ?? inputSnapshot,
      } as ChartSnapshotMeta
    : {
        ...snapshotMetaFromPayload(payload),
        calculationSettingsOrigin: hasBaziSettings ? 'current' : 'legacy-default',
      };
  const liuyaoPayload = module === 'liuyao' && payload.module === 'liuyao' ? payload : null;

  return {
    ...value,
    module,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : generatedAt,
    engineVersion,
    interpretationVersion: typeof value.interpretationVersion === 'string' ? value.interpretationVersion : 'rules-v1',
    snapshotMeta,
    inputSnapshot,
    favorite: value.favorite === true,
    feedback: migrateFeedback(value.feedback),
    ...(liuyaoPayload
      ? {
          seed: liuyaoPayload.seed,
          date: liuyaoPayload.date,
          seedScope: liuyaoPayload.seedScope,
        }
      : {}),
    payload,
  } as unknown as SavedReading;
}

export function migrateReadings(value: unknown): SavedReading[] {
  if (!Array.isArray(value)) return [];
  return value.map(migrateReading).filter((reading): reading is SavedReading => reading !== null);
}
