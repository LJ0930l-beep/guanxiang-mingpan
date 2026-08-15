import type { BaziHistorySnapshot } from '@/domains/bazi/interpretation/history';
import type { ChartInputSnapshot, ChartPayload, ChartSnapshotMeta } from '@/types/charts';
import type { BirthProfile, ReadingFeedback, SavedReading } from '@/types/domain';
import type { ExplanationSnapshot } from '@/domains/explanation/types';

export const ARCHIVE_SNAPSHOT_VERSION = 'archive-v1' as const;

/**
 * An immutable archive projection for a saved reading. It intentionally keeps
 * the calculation snapshot and the optional Phase 2 deep snapshot separate so
 * future modules can plug in their own evidence layers without changing the
 * viewer contract.
 */
export interface ArchiveSnapshot {
  archiveVersion: typeof ARCHIVE_SNAPSHOT_VERSION;
  profileSnapshot?: BirthProfile;
  reading: SavedReading;
  calculationSnapshot: ChartSnapshotMeta;
  deepSnapshot?: BaziHistorySnapshot;
  explanationSnapshot?: ExplanationSnapshot;
}

export interface SnapshotViewerModel {
  archive: ArchiveSnapshot;
  inputSnapshot: ChartInputSnapshot;
  calculationSnapshot: ChartSnapshotMeta;
  payload: ChartPayload;
  feedback: ReadingFeedback[];
  hasDeepSnapshot: boolean;
  explanationSnapshot?: ExplanationSnapshot;
  hasExplanationSnapshot: boolean;
}

export function createArchiveSnapshot(reading: SavedReading): ArchiveSnapshot {
  const hasBaziDeepSnapshot = reading.module === 'bazi'
    && Boolean(reading.normalizedChartSnapshot && reading.evidenceGraphSnapshot && reading.interpretationSnapshot);
  return {
    archiveVersion: ARCHIVE_SNAPSHOT_VERSION,
    ...(reading.profileSnapshot ? { profileSnapshot: reading.profileSnapshot } : {}),
    reading,
    calculationSnapshot: reading.snapshotMeta,
    ...(hasBaziDeepSnapshot
      ? {
          deepSnapshot: {
            normalizedChart: reading.normalizedChartSnapshot!,
            evidenceGraph: reading.evidenceGraphSnapshot!,
            interpretation: reading.interpretationSnapshot!,
          },
        }
      : {}),
    ...(reading.explanationSnapshot ? { explanationSnapshot: reading.explanationSnapshot } : {}),
  };
}

/**
 * Build the read-only viewer model from the saved record alone. No current
 * profile is accepted here on purpose: history must remain stable after a
 * user edits the profile that originally produced the reading.
 */
export function buildSnapshotViewerModel(reading: SavedReading): SnapshotViewerModel {
  const archive = createArchiveSnapshot(reading);
  return {
    archive,
    inputSnapshot: reading.inputSnapshot,
    calculationSnapshot: archive.calculationSnapshot,
    payload: reading.payload,
    feedback: reading.feedback,
    hasDeepSnapshot: Boolean(archive.deepSnapshot),
    ...(archive.explanationSnapshot ? { explanationSnapshot: archive.explanationSnapshot } : {}),
    hasExplanationSnapshot: Boolean(archive.explanationSnapshot),
  };
}
