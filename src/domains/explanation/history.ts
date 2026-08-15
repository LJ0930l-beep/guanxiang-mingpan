import type { ExplanationBlock, ExplanationSnapshot } from '@/domains/explanation/types';

export interface ExplanationBlockDiff {
  id: string;
  category: string;
  summaryChanged: boolean;
  paragraphsChanged: boolean;
  evidenceAdded: string[];
  evidenceRemoved: string[];
  counterEvidenceAdded: string[];
  counterEvidenceRemoved: string[];
  glossaryAdded: string[];
  glossaryRemoved: string[];
}

export interface ExplanationSnapshotDiff {
  oldExplanationVersion?: string;
  newExplanationVersion?: string;
  versionChanged: boolean;
  addedBlockIds: string[];
  removedBlockIds: string[];
  changedBlocks: ExplanationBlockDiff[];
  addedEvidenceRefs: string[];
  removedEvidenceRefs: string[];
  addedGlossaryRefs: string[];
  removedGlossaryRefs: string[];
  hasChanges: boolean;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function difference(next: string[], previous: string[]): string[] {
  const previousSet = new Set(previous);
  return sortedUnique(next.filter((value) => !previousSet.has(value)));
}

function blockMap(snapshot?: ExplanationSnapshot): Map<string, ExplanationBlock> {
  return new Map((snapshot?.blocks ?? []).map((block) => [block.id, block]));
}

function allRefs(snapshot: ExplanationSnapshot | undefined, key: 'evidenceRefs' | 'counterEvidenceRefs' | 'glossaryRefs'): string[] {
  return (snapshot?.blocks ?? []).flatMap((block) => block[key]);
}

function blockDiff(oldBlock: ExplanationBlock, newBlock: ExplanationBlock): ExplanationBlockDiff | null {
  const evidenceAdded = difference(newBlock.evidenceRefs, oldBlock.evidenceRefs);
  const evidenceRemoved = difference(oldBlock.evidenceRefs, newBlock.evidenceRefs);
  const counterEvidenceAdded = difference(newBlock.counterEvidenceRefs, oldBlock.counterEvidenceRefs);
  const counterEvidenceRemoved = difference(oldBlock.counterEvidenceRefs, newBlock.counterEvidenceRefs);
  const glossaryAdded = difference(newBlock.glossaryRefs, oldBlock.glossaryRefs);
  const glossaryRemoved = difference(oldBlock.glossaryRefs, newBlock.glossaryRefs);
  const summaryChanged = oldBlock.summary !== newBlock.summary;
  const paragraphsChanged = JSON.stringify(oldBlock.paragraphs) !== JSON.stringify(newBlock.paragraphs);
  if (!summaryChanged && !paragraphsChanged && evidenceAdded.length === 0 && evidenceRemoved.length === 0 && counterEvidenceAdded.length === 0 && counterEvidenceRemoved.length === 0 && glossaryAdded.length === 0 && glossaryRemoved.length === 0) return null;
  return {
    id: newBlock.id,
    category: newBlock.category,
    summaryChanged,
    paragraphsChanged,
    evidenceAdded,
    evidenceRemoved,
    counterEvidenceAdded,
    counterEvidenceRemoved,
    glossaryAdded,
    glossaryRemoved,
  };
}

/** Compare saved explanation snapshots only; this never recalculates a chart. */
export function diffExplanationSnapshots(oldSnapshot?: ExplanationSnapshot, newSnapshot?: ExplanationSnapshot): ExplanationSnapshotDiff {
  const oldBlocks = blockMap(oldSnapshot);
  const newBlocks = blockMap(newSnapshot);
  const oldIds = [...oldBlocks.keys()];
  const newIds = [...newBlocks.keys()];
  const addedBlockIds = sortedUnique(newIds.filter((id) => !oldBlocks.has(id)));
  const removedBlockIds = sortedUnique(oldIds.filter((id) => !newBlocks.has(id)));
  const changedBlocks = sortedUnique([...oldBlocks.keys()].filter((id) => newBlocks.has(id)))
    .flatMap((id) => {
      const oldBlock = oldBlocks.get(id)!;
      const newBlock = newBlocks.get(id)!;
      const changed = blockDiff(oldBlock, newBlock);
      return changed ? [changed] : [];
    });
  const addedEvidenceRefs = difference(
    [...allRefs(newSnapshot, 'evidenceRefs'), ...allRefs(newSnapshot, 'counterEvidenceRefs')],
    [...allRefs(oldSnapshot, 'evidenceRefs'), ...allRefs(oldSnapshot, 'counterEvidenceRefs')],
  );
  const removedEvidenceRefs = difference(
    [...allRefs(oldSnapshot, 'evidenceRefs'), ...allRefs(oldSnapshot, 'counterEvidenceRefs')],
    [...allRefs(newSnapshot, 'evidenceRefs'), ...allRefs(newSnapshot, 'counterEvidenceRefs')],
  );
  const addedGlossaryRefs = difference(allRefs(newSnapshot, 'glossaryRefs'), allRefs(oldSnapshot, 'glossaryRefs'));
  const removedGlossaryRefs = difference(allRefs(oldSnapshot, 'glossaryRefs'), allRefs(newSnapshot, 'glossaryRefs'));
  const versionChanged = oldSnapshot?.explanationVersion !== newSnapshot?.explanationVersion;
  return {
    ...(oldSnapshot ? { oldExplanationVersion: oldSnapshot.explanationVersion } : {}),
    ...(newSnapshot ? { newExplanationVersion: newSnapshot.explanationVersion } : {}),
    versionChanged,
    addedBlockIds,
    removedBlockIds,
    changedBlocks,
    addedEvidenceRefs,
    removedEvidenceRefs,
    addedGlossaryRefs,
    removedGlossaryRefs,
    hasChanges: versionChanged || addedBlockIds.length > 0 || removedBlockIds.length > 0 || changedBlocks.length > 0 || addedEvidenceRefs.length > 0 || removedEvidenceRefs.length > 0 || addedGlossaryRefs.length > 0 || removedGlossaryRefs.length > 0,
  };
}
