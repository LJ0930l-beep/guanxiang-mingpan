import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { resolveCityCoordinates } from '@/data/china-cities';
import { BirthProfile, Gender, LocalUser, SavedReading } from '@/types/domain';
import type { ChartPayload } from '@/types/charts';

const STORAGE = {
  user: '@guanxiang/user',
  profiles: '@guanxiang/profiles',
  selectedProfile: '@guanxiang/selected-profile',
  readings: '@guanxiang/readings',
} as const;

interface SignInResult {
  ok: boolean;
  message?: string;
}

interface NewProfileInput {
  name: string;
  relationship: BirthProfile['relationship'];
  birthDate: string;
  birthTime?: string;
  birthCity: string;
  calendar: BirthProfile['calendar'];
  isLeapMonth?: boolean;
  gender: Gender;
}

interface AppContextValue {
  ready: boolean;
  user: LocalUser | null;
  profiles: BirthProfile[];
  selectedProfile: BirthProfile | null;
  readings: SavedReading[];
  signInWithPhone: (phone: string, code: string) => Promise<SignInResult>;
  signInWithProvider: (provider: 'apple' | 'wechat') => Promise<void>;
  signOut: () => Promise<void>;
  addProfile: (input: NewProfileInput) => Promise<BirthProfile>;
  selectProfile: (profileId: string) => Promise<void>;
  saveReading: (input: { profile: BirthProfile; title: string; summary: string; payload: ChartPayload }) => Promise<SavedReading>;
}

const AppContext = createContext<AppContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [readings, setReadings] = useState<SavedReading[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all([
      AsyncStorage.getItem(STORAGE.user),
      AsyncStorage.getItem(STORAGE.profiles),
      AsyncStorage.getItem(STORAGE.selectedProfile),
      AsyncStorage.getItem(STORAGE.readings),
    ])
      .then(([storedUser, storedProfiles, storedSelectedProfile, storedReadings]) => {
        if (!active) return;
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedProfiles) setProfiles(JSON.parse(storedProfiles));
        if (storedSelectedProfile) setSelectedProfileId(storedSelectedProfile);
        if (storedReadings) setReadings(JSON.parse(storedReadings));
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const signInWithPhone = async (phone: string, code: string): Promise<SignInResult> => {
    const normalizedPhone = phone.replace(/\s/g, '');
    if (!/^1\d{10}$/.test(normalizedPhone)) {
      return { ok: false, message: '请输入正确的 11 位手机号。' };
    }
    if (!/^\d{6}$/.test(code)) {
      return { ok: false, message: '请输入 6 位验证码。' };
    }

    const nextUser: LocalUser = {
      id: `phone_${normalizedPhone}`,
      displayName: `${normalizedPhone.slice(0, 3)}****${normalizedPhone.slice(-4)}`,
      phone: normalizedPhone,
      provider: 'phone',
    };
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE.user, JSON.stringify(nextUser));
    return { ok: true };
  };

  const signInWithProvider = async (provider: 'apple' | 'wechat') => {
    const nextUser: LocalUser = {
      id: createId(provider),
      displayName: provider === 'apple' ? 'Apple 用户' : '微信用户',
      provider,
    };
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE.user, JSON.stringify(nextUser));
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE.user);
  };

  const addProfile = async (input: NewProfileInput) => {
    const timestamp = new Date().toISOString();
    const city = resolveCityCoordinates(input.birthCity);
    const profile: BirthProfile = {
      id: createId('profile'),
      ...input,
      birthTime: input.birthTime || undefined,
      timeKnown: Boolean(input.birthTime),
      latitude: city?.latitude,
      longitude: city?.longitude,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const nextProfiles = [profile, ...profiles];
    setProfiles(nextProfiles);
    setSelectedProfileId(profile.id);
    await Promise.all([
      AsyncStorage.setItem(STORAGE.profiles, JSON.stringify(nextProfiles)),
      AsyncStorage.setItem(STORAGE.selectedProfile, profile.id),
    ]);
    return profile;
  };

  const selectProfile = async (profileId: string) => {
    setSelectedProfileId(profileId);
    await AsyncStorage.setItem(STORAGE.selectedProfile, profileId);
  };

  const saveReading: AppContextValue['saveReading'] = async ({ profile, title, summary, payload }) => {
    const reading: SavedReading = {
      id: createId('reading'),
      profileId: profile.id,
      profileName: profile.name,
      module: payload.module,
      title,
      summary,
      createdAt: payload.generatedAt,
      engineVersion: payload.engineVersion,
      interpretationVersion: 'rules-v1',
      payload,
    };
    const nextReadings = [reading, ...readings].slice(0, 100);
    setReadings(nextReadings);
    await AsyncStorage.setItem(STORAGE.readings, JSON.stringify(nextReadings));
    return reading;
  };

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0] ?? null,
    [profiles, selectedProfileId],
  );

  const value: AppContextValue = {
    ready,
    user,
    profiles,
    selectedProfile,
    readings,
    signInWithPhone,
    signInWithProvider,
    signOut,
    addProfile,
    selectProfile,
    saveReading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
