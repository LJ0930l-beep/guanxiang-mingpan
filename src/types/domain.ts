import type { ChartInputSnapshot, ChartPayload, ChartSnapshotMeta } from '@/types/charts';
import type { BaziHistorySnapshot } from '@/domains/bazi/interpretation/history';
import type { ExplanationSnapshot } from '@/domains/explanation/types';

export type DivinationModule = 'bazi' | 'liuyao' | 'ziwei' | 'astrology';

export type Relationship = '本人' | '伴侣' | '家人' | '朋友' | '其他';
export type Gender = 'male' | 'female';

export interface BirthProfile {
  id: string;
  name: string;
  relationship: Relationship;
  birthDate: string;
  birthTime?: string;
  birthCity: string;
  timeKnown: boolean;
  calendar: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  gender?: Gender;
  locationId?: string;
  locationProvince?: string;
  locationCity?: string;
  locationDistrict?: string;
  locationDatasetVersion?: string;
  locationSource?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalUser {
  id: string;
  displayName: string;
  phone?: string;
  provider: 'phone' | 'apple' | 'wechat';
}

export type ReadingFeedbackStatus = 'confirmed' | 'partial' | 'not-yet' | 'contradicted';

export interface ReadingFeedback {
  id: string;
  status: ReadingFeedbackStatus;
  /** The smallest supported feedback time unit is a calendar day. */
  observedAt: string;
  note: string;
  createdAt: string;
  /** Feedback owns its own edit clock; editing never changes the reading timestamp. */
  updatedAt?: string;
  /** Manual links only. They are user-linked, never system-proven relationships. */
  linkedInterpretationIds?: string[];
  linkedEvidenceIds?: string[];
}

export interface SavedReading {
  id: string;
  profileId: string;
  profileName: string;
  module: DivinationModule;
  title: string;
  summary: string;
  createdAt: string;
  engineVersion: string;
  interpretationVersion: string;
  snapshotMeta: ChartSnapshotMeta;
  inputSnapshot: ChartInputSnapshot;
  /** Replay inputs are kept at the record boundary for quick inspection/export. */
  seed?: string;
  date?: string;
  seedScope?: string;
  /** Immutable copy of the profile used when this reading was created. */
  profileSnapshot?: BirthProfile;
  /** Phase 2 deep-result snapshots. These are absent on legacy records by design. */
  normalizedChartSnapshot?: BaziHistorySnapshot['normalizedChart'];
  evidenceGraphSnapshot?: BaziHistorySnapshot['evidenceGraph'];
  interpretationSnapshot?: BaziHistorySnapshot['interpretation'];
  /** Phase 4 user-facing explanation; absent on legacy records by design. */
  explanationSnapshot?: ExplanationSnapshot;
  favorite: boolean;
  feedback: ReadingFeedback[];
  payload: ChartPayload;
}
