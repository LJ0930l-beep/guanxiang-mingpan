import { STORAGE_SCHEMA_VERSION } from '@/storage/schema';
import type { BirthProfile, LocalUser, ReadingFeedback, ReadingFeedbackStatus, SavedReading } from '@/types/domain';
import { validateExplanationSnapshot } from '@/domains/explanation/snapshot';

export const LOCAL_BACKUP_FORMAT = 'guanxiang-local-backup' as const;
export const LOCAL_BACKUP_VERSION = 1 as const;
const LEGACY_STORAGE_SCHEMA_VERSIONS = [1] as const;

export interface LocalBackupData {
  user: LocalUser | null;
  profiles: BirthProfile[];
  selectedProfileId: string | null;
  readings: SavedReading[];
}

export interface LocalBackupDocument {
  format: typeof LOCAL_BACKUP_FORMAT;
  backupVersion: typeof LOCAL_BACKUP_VERSION;
  storageSchemaVersion: typeof STORAGE_SCHEMA_VERSION;
  exportedAt: string;
  data: LocalBackupData;
}

export class BackupFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupFormatError';
  }
}

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function requireString(value: unknown, label: string): string {
  if (!isString(value)) throw new BackupFormatError(`备份文件缺少有效的${label}。`);
  return value;
}

function validateUser(value: unknown): LocalUser | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new BackupFormatError('备份文件中的账户资料无效。');
  const provider = value.provider;
  if (!isString(value.id) || !isString(value.displayName) || !['phone', 'apple', 'wechat'].includes(String(provider))) {
    throw new BackupFormatError('备份文件中的账户资料无效。');
  }
  return value as unknown as LocalUser;
}

function validateProfiles(value: unknown): BirthProfile[] {
  if (!Array.isArray(value)) throw new BackupFormatError('备份文件中的命主列表无效。');
  const ids = new Set<string>();
  return value.map((item) => {
    if (!isRecord(item)) throw new BackupFormatError('备份文件中的命主资料无效。');
    const id = requireString(item.id, '命主 ID');
    if (ids.has(id)) throw new BackupFormatError('备份文件中存在重复的命主 ID。');
    ids.add(id);
    if (!isString(item.name) || !isString(item.birthDate) || !isString(item.birthCity) || !isString(item.createdAt) || !isString(item.updatedAt)) {
      throw new BackupFormatError('备份文件中的命主资料不完整。');
    }
    if (!['本人', '伴侣', '家人', '朋友', '其他'].includes(String(item.relationship))) {
      throw new BackupFormatError('备份文件中的命主关系无效。');
    }
    if (!['solar', 'lunar'].includes(String(item.calendar)) || typeof item.timeKnown !== 'boolean') {
      throw new BackupFormatError('备份文件中的命主历法资料无效。');
    }
    if (item.gender !== undefined && !['male', 'female'].includes(String(item.gender))) {
      throw new BackupFormatError('备份文件中的命主性别无效。');
    }
    return item as unknown as BirthProfile;
  });
}

const FEEDBACK_STATUSES: ReadingFeedbackStatus[] = ['confirmed', 'partial', 'not-yet', 'contradicted'];

function validateOptionalFeedbackLinks(value: unknown, label: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => !isString(item))) {
    throw new BackupFormatError(`澶囦唤鏂囦欢涓殑${label}鏃犳晥銆?`);
  }
  const ids = [...new Set(value.map((item) => item.trim()).filter(Boolean))];
  return ids.length > 0 ? ids : undefined;
}

function validateFeedback(value: unknown): ReadingFeedback[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new BackupFormatError('备份文件中的反馈记录无效。');
  const ids = new Set<string>();
  return value.map((item) => {
    if (!isRecord(item)) throw new BackupFormatError('备份文件中的反馈记录无效。');
    const id = requireString(item.id, '反馈 ID');
    if (ids.has(id)) throw new BackupFormatError('备份文件中存在重复的反馈 ID。');
    ids.add(id);
    if (!isString(item.observedAt) || !isString(item.note) || !isString(item.createdAt) || !FEEDBACK_STATUSES.includes(item.status as ReadingFeedbackStatus)) {
      throw new BackupFormatError('备份文件中的反馈记录不完整。');
    }
    const updatedAt = item.updatedAt === undefined ? undefined : requireString(item.updatedAt, '反馈更新时间');
    const linkedInterpretationIds = validateOptionalFeedbackLinks(item.linkedInterpretationIds, '用户关联解释 ID');
    const linkedEvidenceIds = validateOptionalFeedbackLinks(item.linkedEvidenceIds, '用户关联证据 ID');
    return {
      id,
      status: item.status as ReadingFeedbackStatus,
      observedAt: item.observedAt,
      note: item.note,
      createdAt: item.createdAt,
      ...(updatedAt ? { updatedAt } : {}),
      ...(linkedInterpretationIds ? { linkedInterpretationIds } : {}),
      ...(linkedEvidenceIds ? { linkedEvidenceIds } : {}),
    };
  });
}

function validateReadings(value: unknown): SavedReading[] {
  if (!Array.isArray(value)) throw new BackupFormatError('备份文件中的排盘记录无效。');
  const ids = new Set<string>();
  return value.map((item) => {
    if (!isRecord(item)) throw new BackupFormatError('备份文件中的排盘记录无效。');
    const id = requireString(item.id, '记录 ID');
    if (ids.has(id)) throw new BackupFormatError('备份文件中存在重复的记录 ID。');
    ids.add(id);
    if (!isString(item.profileId) || !isString(item.profileName) || !isString(item.module) || !isString(item.title) || !isString(item.summary) || !isString(item.createdAt) || !isString(item.engineVersion) || !isString(item.interpretationVersion) || !isRecord(item.snapshotMeta) || !isRecord(item.inputSnapshot) || !isRecord(item.payload)) {
      throw new BackupFormatError('备份文件中的排盘记录不完整。');
    }
    if (!['bazi', 'liuyao', 'ziwei', 'astrology'].includes(String(item.module))) {
      throw new BackupFormatError('备份文件中的排盘模块无效。');
    }
    const explanationSnapshot = item.explanationSnapshot === undefined
      ? undefined
      : (() => {
          try {
            validateExplanationSnapshot(item.explanationSnapshot, '备份文件中的解释快照');
          } catch {
            throw new BackupFormatError('备份文件中的解释快照无效。');
          }
          return item.explanationSnapshot;
        })();
    return {
      ...item,
      favorite: item.favorite === true,
      feedback: validateFeedback(item.feedback),
      ...(explanationSnapshot ? { explanationSnapshot } : {}),
    } as unknown as SavedReading;
  });
}

export function createLocalBackupText(data: LocalBackupData, exportedAt = new Date().toISOString()): string {
  validateArchiveIntegrity(data);
  const document: LocalBackupDocument = {
    format: LOCAL_BACKUP_FORMAT,
    backupVersion: LOCAL_BACKUP_VERSION,
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    exportedAt,
    data,
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

/**
 * Validate cross-record references before a backup leaves the device. This is
 * deliberately independent of the JSON decoder so export and import share the
 * same archive invariants.
 */
export function validateArchiveIntegrity(data: LocalBackupData): void {
  const profileIds = new Set(data.profiles.map((profile) => profile.id));
  if (data.selectedProfileId !== null && !profileIds.has(data.selectedProfileId)) {
    throw new BackupFormatError('本地档案的当前命主选择无效。');
  }
  const readingIds = new Set<string>();
  for (const reading of data.readings) {
    if (readingIds.has(reading.id)) throw new BackupFormatError('本地档案中存在重复的记录 ID。');
    readingIds.add(reading.id);
    if (!profileIds.has(reading.profileId)) throw new BackupFormatError('本地档案中存在找不到命主的记录。');
    if (reading.payload.module !== reading.module) throw new BackupFormatError('记录模块与保存结果不一致。');
    const feedbackIds = new Set<string>();
    for (const feedback of reading.feedback ?? []) {
      if (feedbackIds.has(feedback.id)) throw new BackupFormatError('同一记录中存在重复的反馈 ID。');
      feedbackIds.add(feedback.id);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(feedback.observedAt)) throw new BackupFormatError('事实反馈必须使用日级日期。');
    }
    if (reading.explanationSnapshot) {
      try {
        validateExplanationSnapshot(reading.explanationSnapshot, '本地档案中的解释快照');
      } catch {
        throw new BackupFormatError('本地档案中的解释快照无效。');
      }
    }
  }
}

export function parseLocalBackupText(raw: string): LocalBackupDocument {
  if (raw.length > 10_000_000) throw new BackupFormatError('备份文件过大，已拒绝导入。');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BackupFormatError('备份文件不是有效的 JSON。');
  }

  const supportedStorageSchema = isRecord(parsed)
    && (parsed.storageSchemaVersion === STORAGE_SCHEMA_VERSION || LEGACY_STORAGE_SCHEMA_VERSIONS.includes(parsed.storageSchemaVersion as 1));
  if (!isRecord(parsed) || parsed.format !== LOCAL_BACKUP_FORMAT || parsed.backupVersion !== LOCAL_BACKUP_VERSION || !supportedStorageSchema || !isString(parsed.exportedAt) || !isRecord(parsed.data)) {
    throw new BackupFormatError('备份文件版本不兼容，请使用观象导出的本机备份。');
  }

  const profiles = validateProfiles(parsed.data.profiles);
  const selectedProfileId = parsed.data.selectedProfileId;
  if (selectedProfileId !== null && !isString(selectedProfileId)) {
    throw new BackupFormatError('备份文件中的当前命主选择无效。');
  }
  if (selectedProfileId !== null && !profiles.some((profile) => profile.id === selectedProfileId)) {
    throw new BackupFormatError('备份文件中的当前命主不存在。');
  }

  const data: LocalBackupData = {
    user: validateUser(parsed.data.user),
    profiles,
    selectedProfileId,
    readings: validateReadings(parsed.data.readings),
  };
  validateArchiveIntegrity(data);
  return {
    format: LOCAL_BACKUP_FORMAT,
    backupVersion: LOCAL_BACKUP_VERSION,
    storageSchemaVersion: STORAGE_SCHEMA_VERSION,
    exportedAt: parsed.exportedAt,
    data,
  };
}
