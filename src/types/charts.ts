import type { DivinationModule, Gender } from '@/types/domain';

export const CHART_SNAPSHOT_VERSION = 1 as const;

export interface BirthInputSnapshot {
  type: 'birth';
  profileId: string;
  birthDate: string;
  birthTime?: string;
  timeKnown: boolean;
  birthCity: string;
  calendar: 'solar' | 'lunar';
  isLeapMonth?: boolean;
  gender?: Gender;
  latitude?: number;
  longitude?: number;
}

export interface LiuyaoInputSnapshot {
  type: 'liuyao';
  question: string;
  target: string;
  seed: string;
  date: string;
  seedScope: string;
}

export interface LegacyInputSnapshot {
  type: 'legacy';
  module: DivinationModule;
  reason: string;
}

export type ChartInputSnapshot = BirthInputSnapshot | LiuyaoInputSnapshot | LegacyInputSnapshot;

export interface ChartSnapshotMeta {
  snapshotVersion: typeof CHART_SNAPSHOT_VERSION;
  generatedAt: string;
  engineVersion: string;
  inputSnapshot: ChartInputSnapshot;
}

export interface ChartMeta extends ChartSnapshotMeta {
  module: DivinationModule;
  completeness: 'complete' | 'partial';
  caveats: string[];
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
  dayMaster: string;
  pillars: BaziPillarView[];
  kongWang: string;
  relations: string[];
  focus: string[];
}

export interface LiuyaoLineView {
  position: number;
  yinYang: '阴' | '阳';
  liuQin: string;
  liuShen: string;
  naJia: string;
  wuXing: string;
  isChanging: boolean;
  isShiYao: boolean;
  isYingYao: boolean;
  strength?: string;
  evidence: string[];
}

export interface LiuyaoChartView extends ChartMeta {
  module: 'liuyao';
  question: string;
  seed: string;
  date: string;
  seedScope: string;
  hexagramName: string;
  changedHexagramName?: string;
  hexagramGong: string;
  ganZhiTime: string;
  kongWang: string;
  lines: LiuyaoLineView[];
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
  sunSign: string;
  moonSign?: string;
  ascendant?: string;
  midheaven?: string;
  factors: AstrologyFactorView[];
  aspects: AstrologyAspectView[];
  focus: string[];
}

export type ChartPayload =
  | BaziChartView
  | LiuyaoChartView
  | ZiweiChartView
  | AstrologyChartView;
