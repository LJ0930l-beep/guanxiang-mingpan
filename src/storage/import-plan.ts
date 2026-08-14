import type { LocalBackupData } from '@/storage/backup';
import { validateArchiveIntegrity } from '@/storage/backup';

export type ImportMode = 'merge' | 'replace';
export type ImportEntity = 'profile' | 'reading';
export type ImportConflictKind = 'duplicate-same' | 'duplicate-different';

export interface ArchiveSummary {
  profileCount: number;
  readingCount: number;
  feedbackCount: number;
  favoriteCount: number;
  baziDeepSnapshotCount: number;
}

export interface ImportConflict {
  entity: ImportEntity;
  id: string;
  kind: ImportConflictKind;
  resolution: 'keep-current' | 'use-incoming';
  message: string;
}

export interface PlannedArchiveOperation {
  entity: ImportEntity;
  id: string;
  action: 'add' | 'keep-current' | 'use-incoming' | 'replace-archive';
}

export interface ImportPreview {
  mode: ImportMode;
  currentSummary: ArchiveSummary;
  incomingSummary: ArchiveSummary;
  conflicts: ImportConflict[];
  operations: PlannedArchiveOperation[];
  canApply: boolean;
}

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function summarizeArchive(data: LocalBackupData): ArchiveSummary {
  return {
    profileCount: data.profiles.length,
    readingCount: data.readings.length,
    feedbackCount: data.readings.reduce((count, reading) => count + (reading.feedback?.length ?? 0), 0),
    favoriteCount: data.readings.filter((reading) => reading.favorite).length,
    baziDeepSnapshotCount: data.readings.filter((reading) => reading.module === 'bazi'
      && Boolean(reading.normalizedChartSnapshot && reading.evidenceGraphSnapshot && reading.interpretationSnapshot)).length,
  };
}

function duplicateConflicts(current: LocalBackupData, incoming: LocalBackupData, mode: ImportMode): ImportConflict[] {
  const conflicts: ImportConflict[] = [];
  const currentProfiles = new Map(current.profiles.map((profile) => [profile.id, profile]));
  const currentReadings = new Map(current.readings.map((reading) => [reading.id, reading]));
  for (const profile of incoming.profiles) {
    const existing = currentProfiles.get(profile.id);
    if (!existing) continue;
    const same = sameJson(existing, profile);
    conflicts.push({
      entity: 'profile',
      id: profile.id,
      kind: same ? 'duplicate-same' : 'duplicate-different',
      resolution: mode === 'replace' ? 'use-incoming' : 'keep-current',
      message: same ? '命主 ID 重复，内容一致。' : '命主 ID 重复，资料内容不同。',
    });
  }
  for (const reading of incoming.readings) {
    const existing = currentReadings.get(reading.id);
    if (!existing) continue;
    const same = sameJson(existing, reading);
    conflicts.push({
      entity: 'reading',
      id: reading.id,
      kind: same ? 'duplicate-same' : 'duplicate-different',
      resolution: mode === 'replace' ? 'use-incoming' : 'keep-current',
      message: same ? '排盘记录 ID 重复，内容一致。' : '排盘记录 ID 重复，快照或反馈内容不同。',
    });
  }
  return conflicts;
}

export function buildImportPreview(current: LocalBackupData, incoming: LocalBackupData, mode: ImportMode = 'replace'): ImportPreview {
  validateArchiveIntegrity(current);
  validateArchiveIntegrity(incoming);
  const conflicts = duplicateConflicts(current, incoming, mode);
  const conflictKeys = new Set(conflicts.map((conflict) => `${conflict.entity}:${conflict.id}`));
  const operations: PlannedArchiveOperation[] = mode === 'replace'
    ? [{ entity: 'profile', id: '*', action: 'replace-archive' }]
    : [
        ...incoming.profiles.map((profile) => ({
          entity: 'profile' as const,
          id: profile.id,
          action: conflictKeys.has(`profile:${profile.id}`) ? 'keep-current' as const : 'add' as const,
        })),
        ...incoming.readings.map((reading) => ({
          entity: 'reading' as const,
          id: reading.id,
          action: conflictKeys.has(`reading:${reading.id}`) ? 'keep-current' as const : 'add' as const,
        })),
      ];
  return {
    mode,
    currentSummary: summarizeArchive(current),
    incomingSummary: summarizeArchive(incoming),
    conflicts,
    operations,
    canApply: true,
  };
}

export function applyImportPlan(current: LocalBackupData, incoming: LocalBackupData, mode: ImportMode): LocalBackupData {
  const preview = buildImportPreview(current, incoming, mode);
  if (!preview.canApply) throw new Error('导入计划无法执行。');
  if (mode === 'replace') return jsonClone(incoming);

  const profileIds = new Set(current.profiles.map((profile) => profile.id));
  const readingIds = new Set(current.readings.map((reading) => reading.id));
  const profiles = [
    ...current.profiles,
    ...incoming.profiles.filter((profile) => !profileIds.has(profile.id)),
  ];
  const readings = [
    ...current.readings,
    ...incoming.readings.filter((reading) => !readingIds.has(reading.id)),
  ];
  const selectedProfileId = incoming.selectedProfileId && profiles.some((profile) => profile.id === incoming.selectedProfileId)
    ? incoming.selectedProfileId
    : current.selectedProfileId && profiles.some((profile) => profile.id === current.selectedProfileId)
      ? current.selectedProfileId
      : null;
  return jsonClone({
    user: incoming.user ?? current.user,
    profiles,
    selectedProfileId,
    readings,
  });
}
