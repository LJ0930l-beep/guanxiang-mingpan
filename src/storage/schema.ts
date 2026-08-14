import { CHART_SNAPSHOT_VERSION } from '@/types/charts';
import type {
  ChartInputSnapshot,
  ChartPayload,
  ChartSnapshotMeta,
  LiuyaoInputSnapshot,
} from '@/types/charts';
import type { BirthProfile, DivinationModule, LocalUser, SavedReading } from '@/types/domain';

export const STORAGE_SCHEMA_VERSION = 1 as const;

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

function isInputSnapshot(value: unknown): value is ChartInputSnapshot {
  return isRecord(value) && typeof value.type === 'string';
}

function legacyInputSnapshot(module: DivinationModule, payload: RecordLike, reading: RecordLike): ChartInputSnapshot {
  if (module === 'liuyao') {
    const liuyao: LiuyaoInputSnapshot = {
      type: 'liuyao',
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
    module,
    reason: 'pre-snapshot-v1 record; original input was not persisted',
  };
}

export function snapshotMetaFromPayload(payload: ChartPayload): ChartSnapshotMeta {
  return {
    snapshotVersion: payload.snapshotVersion,
    generatedAt: payload.generatedAt,
    engineVersion: payload.engineVersion,
    inputSnapshot: payload.inputSnapshot,
  };
}

function migrateReading(value: unknown): SavedReading | null {
  if (!isRecord(value) || !isRecord(value.payload)) return null;
  const rawPayload = value.payload;
  const module = (value.module ?? rawPayload.module) as DivinationModule;
  if (!['bazi', 'liuyao', 'ziwei', 'astrology'].includes(module)) return null;

  const inputSnapshot = isInputSnapshot(value.inputSnapshot)
    ? value.inputSnapshot
    : isInputSnapshot(rawPayload.inputSnapshot)
      ? rawPayload.inputSnapshot
      : legacyInputSnapshot(module, rawPayload, value);
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
  const payload = {
    ...rawPayload,
    module,
    snapshotVersion: rawPayload.snapshotVersion ?? CHART_SNAPSHOT_VERSION,
    generatedAt: rawPayload.generatedAt ?? generatedAt,
    engineVersion: rawPayload.engineVersion ?? engineVersion,
    inputSnapshot: rawPayload.inputSnapshot ?? inputSnapshot,
    ...(module === 'liuyao'
      ? {
          seed: rawPayload.seed ?? (inputSnapshot.type === 'liuyao' ? inputSnapshot.seed : 'legacy-unknown'),
          date: rawPayload.date ?? (inputSnapshot.type === 'liuyao' ? inputSnapshot.date : generatedAt),
          seedScope: rawPayload.seedScope ?? (inputSnapshot.type === 'liuyao' ? inputSnapshot.seedScope : 'legacy'),
        }
      : {}),
  } as unknown as ChartPayload;
  const snapshotMeta = isRecord(value.snapshotMeta) && isInputSnapshot(value.snapshotMeta.inputSnapshot)
    ? value.snapshotMeta as unknown as ChartSnapshotMeta
    : snapshotMetaFromPayload(payload);
  const liuyaoPayload = module === 'liuyao' && payload.module === 'liuyao' ? payload : null;

  return {
    ...value,
    module,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : generatedAt,
    engineVersion,
    interpretationVersion: typeof value.interpretationVersion === 'string' ? value.interpretationVersion : 'rules-v1',
    snapshotMeta,
    inputSnapshot,
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
