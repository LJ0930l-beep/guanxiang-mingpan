import type { ChartPayload } from '@/types/charts';

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
  payload: ChartPayload;
}
