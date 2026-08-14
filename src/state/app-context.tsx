import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { resolveCityCoordinates } from '@/data/china-cities';
import {
  decodeStorageValue,
  encodeStorageValue,
  assertStorageWritable,
  migrateProfiles,
  migrateReadings,
  migrateSelectedProfile,
  migrateUser,
  removeStorageValue,
  snapshotMetaFromPayload,
  writeStorageValue,
} from '@/storage/schema';
import type { BirthProfile, Gender, LocalUser, SavedReading } from '@/types/domain';
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
  storageBlockedKeys: string[];
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
  const [storageBlockedKeys, setStorageBlockedKeys] = useState<string[]>([]);
  const blockedStorageKeysRef = useRef<Set<string>>(new Set());

  const setStoredValue = <T,>(key: string, value: T) => writeStorageValue(
    key,
    value,
    blockedStorageKeysRef.current,
    (storageKey, encodedValue) => AsyncStorage.setItem(storageKey, encodedValue),
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      AsyncStorage.getItem(STORAGE.user),
      AsyncStorage.getItem(STORAGE.profiles),
      AsyncStorage.getItem(STORAGE.selectedProfile),
      AsyncStorage.getItem(STORAGE.readings),
    ])
      .then(async ([storedUser, storedProfiles, storedSelectedProfile, storedReadings]) => {
        if (!active) return;
        const userState = decodeStorageValue(storedUser, null, migrateUser);
        const profilesState = decodeStorageValue(storedProfiles, [], migrateProfiles);
        const selectedProfileState = decodeStorageValue(storedSelectedProfile, null, migrateSelectedProfile);
        const readingsState = decodeStorageValue(storedReadings, [], migrateReadings);
        const blockedKeys = new Set<string>([
          ...(userState.blocked ? [STORAGE.user] : []),
          ...(profilesState.blocked ? [STORAGE.profiles] : []),
          ...(selectedProfileState.blocked ? [STORAGE.selectedProfile] : []),
          ...(readingsState.blocked ? [STORAGE.readings] : []),
        ]);
        blockedStorageKeysRef.current = blockedKeys;
        setStorageBlockedKeys([...blockedKeys]);
        setUser(userState.value);
        setProfiles(profilesState.value);
        setSelectedProfileId(selectedProfileState.value);
        setReadings(readingsState.value);

        const migrations: [string, string][] = [];
        if (storedUser && userState.needsRewrite && !userState.blocked) migrations.push([STORAGE.user, encodeStorageValue(userState.value)]);
        if (storedProfiles && profilesState.needsRewrite && !profilesState.blocked) migrations.push([STORAGE.profiles, encodeStorageValue(profilesState.value)]);
        if (storedSelectedProfile && selectedProfileState.needsRewrite && !selectedProfileState.blocked) migrations.push([STORAGE.selectedProfile, encodeStorageValue(selectedProfileState.value)]);
        if (storedReadings && readingsState.needsRewrite && !readingsState.blocked) migrations.push([STORAGE.readings, encodeStorageValue(readingsState.value)]);
        if (migrations.length) await AsyncStorage.multiSet(migrations);
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

    assertStorageWritable(STORAGE.user, blockedStorageKeysRef.current);
    const nextUser: LocalUser = {
      id: `phone_${normalizedPhone}`,
      displayName: `${normalizedPhone.slice(0, 3)}****${normalizedPhone.slice(-4)}`,
      phone: normalizedPhone,
      provider: 'phone',
    };
    setUser(nextUser);
    await setStoredValue(STORAGE.user, nextUser);
    return { ok: true };
  };

  const signInWithProvider = async (provider: 'apple' | 'wechat') => {
    assertStorageWritable(STORAGE.user, blockedStorageKeysRef.current);
    const nextUser: LocalUser = {
      id: createId(provider),
      displayName: provider === 'apple' ? 'Apple 用户' : '微信用户',
      provider,
    };
    setUser(nextUser);
    await setStoredValue(STORAGE.user, nextUser);
  };

  const signOut = async () => {
    await removeStorageValue(STORAGE.user, blockedStorageKeysRef.current, (key) => AsyncStorage.removeItem(key));
    setUser(null);
  };

  const addProfile = async (input: NewProfileInput) => {
    assertStorageWritable(STORAGE.profiles, blockedStorageKeysRef.current);
    assertStorageWritable(STORAGE.selectedProfile, blockedStorageKeysRef.current);
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
      setStoredValue(STORAGE.profiles, nextProfiles),
      setStoredValue(STORAGE.selectedProfile, profile.id),
    ]);
    return profile;
  };

  const selectProfile = async (profileId: string) => {
    assertStorageWritable(STORAGE.selectedProfile, blockedStorageKeysRef.current);
    setSelectedProfileId(profileId);
    await setStoredValue(STORAGE.selectedProfile, profileId);
  };

  const saveReading: AppContextValue['saveReading'] = async ({ profile, title, summary, payload }) => {
    assertStorageWritable(STORAGE.readings, blockedStorageKeysRef.current);
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
      snapshotMeta: snapshotMetaFromPayload(payload),
      inputSnapshot: payload.inputSnapshot,
      ...(payload.module === 'liuyao'
        ? {
            seed: payload.seed,
            date: payload.date,
            seedScope: payload.seedScope,
          }
        : {}),
      payload,
    };
    const nextReadings = [reading, ...readings].slice(0, 100);
    setReadings(nextReadings);
    await setStoredValue(STORAGE.readings, nextReadings);
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
    storageBlockedKeys,
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
