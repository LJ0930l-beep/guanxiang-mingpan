import type { DivinationModule } from '@/types/domain';
import {
  EXPLANATION_SNAPSHOT_VERSION,
  type ExplanationBlock,
  type ExplanationConfidence,
  type ExplanationSnapshot,
} from '@/domains/explanation/types';

const MODULES: DivinationModule[] = ['bazi', 'liuyao', 'ziwei', 'astrology'];
const CONFIDENCES: ExplanationConfidence[] = ['high', 'medium', 'low'];

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isExplanationBlock(value: unknown): value is ExplanationBlock {
  return isRecord(value)
    && isString(value.id)
    && MODULES.includes(value.module as DivinationModule)
    && isString(value.category)
    && isString(value.title)
    && isString(value.summary)
    && isStringArray(value.paragraphs)
    && isStringArray(value.evidenceRefs)
    && isStringArray(value.counterEvidenceRefs)
    && isStringArray(value.glossaryRefs)
    && CONFIDENCES.includes(value.confidence as ExplanationConfidence)
    && isStringArray(value.caveats)
    && isString(value.explanationVersion);
}

export function isExplanationSnapshot(value: unknown): value is ExplanationSnapshot {
  return isRecord(value)
    && value.snapshotVersion === EXPLANATION_SNAPSHOT_VERSION
    && isString(value.explanationVersion)
    && isString(value.generatedAt)
    && Array.isArray(value.blocks)
    && value.blocks.every(isExplanationBlock)
    && isString(value.glossaryVersion);
}

export class ExplanationSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExplanationSnapshotError';
  }
}

export function validateExplanationSnapshot(value: unknown, label = '解释快照'): asserts value is ExplanationSnapshot {
  if (!isExplanationSnapshot(value)) throw new ExplanationSnapshotError(`${label}格式无效。`);
}

/**
 * Legacy records may not have an explanation snapshot. Invalid optional data
 * is ignored during migration so opening an old record never invents a new
 * explanation or blocks the rest of the archive.
 */
export function migrateExplanationSnapshot(value: unknown): ExplanationSnapshot | undefined {
  return isExplanationSnapshot(value) ? value : undefined;
}

export function createExplanationSnapshot(
  blocks: ExplanationBlock[],
  options: { explanationVersion: string; generatedAt: string; glossaryVersion: string },
): ExplanationSnapshot {
  const snapshot: ExplanationSnapshot = {
    snapshotVersion: EXPLANATION_SNAPSHOT_VERSION,
    explanationVersion: options.explanationVersion,
    generatedAt: options.generatedAt,
    blocks,
    glossaryVersion: options.glossaryVersion,
  };
  validateExplanationSnapshot(snapshot);
  return snapshot;
}
