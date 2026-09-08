import type { DivinationModule, Gender } from '@/types/domain';
import type { BaziCalculationEvidence, BaziCalculationSettings } from '@/domains/bazi/types';
import type { BaziHistoricalDstPolicy, BaziHistoricalDstResolution } from '@/domains/bazi/historical-dst';
import type { NormalizedBaziChart } from '@/domains/bazi/model/normalized-chart';
import type { BaziEvidenceGraph, StrengthAssessment } from '@/domains/bazi/evidence/index';
import type { BaziInterpretation } from '@/domains/bazi/interpretation/rules';
import type { ExplanationSnapshot } from '@/domains/explanation/types';
import type { NormalizedZiweiChart } from '@/domains/ziwei/model/normalized-chart';
import type { ZiweiEvidenceGraph } from '@/domains/ziwei/evidence/index';
import type { NormalizedAstrologyChart } from '@/domains/astrology/model/normalized-chart';
import type { AstrologyEvidenceGraph } from '@/domains/astrology/evidence/index';
import type { AstrologyCalculationPolicy, AstrologyPrecision } from '@/domains/astrology/policy';
import type { NormalizedLiuyaoChart, LiuyaoCastingFacts, LiuyaoTimeRecommendation, LiuyaoYongShenGroup } from '@/domains/liuyao/model/normalized-chart';
import type { PublicBirthDateRangePolicy } from '@/domains/policy/public-birth-date-range';
import type { LiuyaoEvidenceGraph } from '@/domains/liuyao/evidence/index';

export const CHART_SNAPSHOT_VERSION = 1 as const;
export const DEFAULT_CALCULATION_TIMEZONE = 'Asia/Shanghai' as const;

export type CalculationTimezone = typeof DEFAULT_CALCULATION_TIMEZONE;

export interface CalculationSettings {
  /** Business timezone used for civil-time calculations and replay. */
  timezone: CalculationTimezone;
  /**
   * Owner-approved public birth-date contract.  It is optional only so
   * legacy/Liuyao snapshots without a birth date policy remain readable.
   */
  birthDateRangePolicy?: PublicBirthDateRangePolicy;
  /** Frozen Bazi historical DST policy; absent on legacy non-Bazi snapshots. */
  historicalDstPolicy?: BaziHistoricalDstPolicy;
  /** Versioned Astrology precision and location policy; absent on legacy records. */
  astrologyPolicy?: AstrologyCalculationPolicy;
  /** Versioned three-coin rule used for Liuyao reproducibility. */
  liuyaoCastingRuleVersion?: string;
}

export interface BirthInputSnapshot {
  type: 'birth';
  timezone: CalculationTimezone;
  profileId: string;
  birthDate: string;
  birthTime?: string;
  timeKnown: boolean;
  birthCity: string;
  calendar: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  gender?: Gender;
  locationId?: string;
  locationDatasetVersion?: string;
  latitude?: number;
  longitude?: number;
  /** The same policy is copied into the input snapshot for replay/export. */
  birthDateRangePolicy?: PublicBirthDateRangePolicy;
  /** The frozen historical DST policy is copied for Bazi replay/export. */
  historicalDstPolicy?: BaziHistoricalDstPolicy;
  /** Original clock plus post-calendar historical DST resolution metadata. */
  historicalDstResolution?: BaziHistoricalDstResolution;
  /** Versioned Astrology precision and location policy; absent on legacy records. */
  astrologyPolicy?: AstrologyCalculationPolicy;
}

export interface LiuyaoInputSnapshot {
  type: 'liuyao';
  timezone: CalculationTimezone;
  question: string;
  target: string;
  seed: string;
  date: string;
  seedScope: string;
  /** How the six lines were obtained. Legacy records omit this field. */
  castingMethod?: 'auto' | 'interactive' | 'manual' | 'time' | 'number';
  /** Explicit rule contract; legacy snapshots omit it and remain read-only facts. */
  castingRuleVersion?: string;
  /** Exact user-entered/coin-toss facts, when the method was not auto. */
  manualYaos?: {
    position: number;
    yinYang: '阴' | '阳';
    isChanging: boolean;
    /** Coin total: 6 old yin, 7 young yang, 8 young yin, 9 old yang. */
    value?: 6 | 7 | 8 | 9;
  }[];
}

export interface LegacyInputSnapshot {
  type: 'legacy';
  timezone: CalculationTimezone;
  module: DivinationModule;
  reason: string;
}

export type ChartInputSnapshot = BirthInputSnapshot | LiuyaoInputSnapshot | LegacyInputSnapshot;

export interface ChartSnapshotMeta {
  snapshotVersion: typeof CHART_SNAPSHOT_VERSION;
  generatedAt: string;
  engineVersion: string;
  calculationSettings: CalculationSettings;
  /** Old records are explicitly labeled instead of being silently reinterpreted. */
  calculationSettingsOrigin?: 'current' | 'legacy-default' | 'legacy-true-solar-v1' | 'legacy-unknown';
  inputSnapshot: ChartInputSnapshot;
  /** Stable fingerprint of the full calculation input and settings. */
  inputFingerprint?: string;
}

export interface ChartMeta extends ChartSnapshotMeta {
  module: DivinationModule;
  completeness: 'complete' | 'partial';
  caveats: string[];
  /** Optional until a module has completed its Phase 4 explanation builder. */
  explanation?: ExplanationSnapshot;
}

export interface BaziPillarView {
  key: 'year' | 'month' | 'day' | 'hour';
  label: string;
  stem: string;
  branch: string;
  tenGod?: string;
  hiddenStems: string[];
  naYin?: string;
}

export interface BaziChartView extends ChartMeta {
  module: 'bazi';
  calculationSettings: BaziCalculationSettings;
  calculationEvidence: BaziCalculationEvidence;
  normalizedChart: NormalizedBaziChart;
  evidenceGraph: BaziEvidenceGraph;
  strengthAssessment: StrengthAssessment;
  interpretation: BaziInterpretation;
  dayMaster: string;
  pillars: BaziPillarView[];
  kongWang: string;
  relations: string[];
  focus: string[];
}

export interface LiuyaoLineView {
  position: number;
  yinYang: '阴' | '阳';
  /** Exact six/ seven/ eight/ nine coin total when the casting method records it. */
  value?: 6 | 7 | 8 | 9;
  liuQin: string;
  liuShen: string;
  naJia: string;
  wuXing: string;
  isChanging: boolean;
  isShiYao: boolean;
  isYingYao: boolean;
  strength?: string;
  evidence: string[];
  changed?: {
    naJia: string;
    wuXing: string;
    liuQin: string;
    relation: string;
  };
  changeAnalysis?: { huaType: string; description: string; originalNaJia: string; changedNaJia: string };
}

export interface LiuyaoChartView extends ChartMeta {
  module: 'liuyao';
  question: string;
  seed: string;
  date: string;
  seedScope: string;
  castingMethod?: LiuyaoInputSnapshot['castingMethod'];
  castingRuleVersion?: string;
  manualYaos?: LiuyaoInputSnapshot['manualYaos'];
  hexagramName: string;
  changedHexagramName?: string;
  hexagramGong: string;
  ganZhiTime: string;
  kongWang: string;
  lines: LiuyaoLineView[];
  normalizedChart: NormalizedLiuyaoChart;
  evidenceGraph: LiuyaoEvidenceGraph;
  /** The engine's structured analysis facts, kept separate from explanation prose. */
  yongShen?: LiuyaoYongShenGroup[];
  timeRecommendations?: LiuyaoTimeRecommendation[];
  castingFacts?: LiuyaoCastingFacts;
  focus: string[];
}

export interface ZiweiPalaceView {
  name: string;
  stemBranch: string;
  isBodyPalace: boolean;
  stars: string[];
  minorStars: string[];
  decadalRange?: string;
}

export interface ZiweiChartView extends ChartMeta {
  module: 'ziwei';
  solarDate: string;
  lunarDate: string;
  soul: string;
  body: string;
  fiveElement: string;
  lifeMasterStar?: string;
  bodyMasterStar?: string;
  palaces: ZiweiPalaceView[];
  normalizedChart: NormalizedZiweiChart;
  evidenceGraph: ZiweiEvidenceGraph;
  mutagens: string[];
  focus: string[];
}

export interface AstrologyFactorView {
  key: string;
  label: string;
  sign: string;
  degree: string;
  longitude: number;
  house?: number;
  retrograde?: boolean;
}

export interface AstrologyAspectView {
  label: string;
  from: string;
  to: string;
  orb: string;
}

export interface AstrologyChartView extends ChartMeta {
  module: 'astrology';
  calculationMode: 'exact' | 'approximate';
  /** Additive precision label; legacy snapshots may not contain it. */
  precision?: AstrologyPrecision;
  sunSign: string;
  moonSign?: string;
  ascendant?: string;
  midheaven?: string;
  factors: AstrologyFactorView[];
  aspects: AstrologyAspectView[];
  normalizedChart: NormalizedAstrologyChart;
  evidenceGraph: AstrologyEvidenceGraph;
  focus: string[];
}

export type ChartPayload =
  | BaziChartView
  | LiuyaoChartView
  | ZiweiChartView
  | AstrologyChartView;
