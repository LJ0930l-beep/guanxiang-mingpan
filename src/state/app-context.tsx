import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { resolveCityCoordinates } from '@/data/china-cities';
import { createLocalBackupText, parseLocalBackupText } from '@/storage/backup';
import { createEncryptedLocalBackupText, parseEncryptedLocalBackupText } from '@/storage/encrypted-backup';
import { createBaziHistorySnapshot } from '@/domains/bazi/interpretation/history';
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
import type { BirthProfile, Gender, LocalUser, ReadingFeedback, ReadingFeedbackStatus, SavedReading } from '@/types/domain';
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

interface NewFeedbackInput {
  status: ReadingFeedbackStatus;
  observedAt: string;
  note: string;
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
  updateProfile: (profileId: string, input: NewProfileInput) => Promise<BirthProfile>;
  deleteProfile: (profileId: string) => Promise<void>;
  saveReading: (input: { profile: BirthProfile; title: string; summary: string; payload: ChartPayload }) => Promise<SavedReading>;
  toggleFavorite: (readingId: string) => Promise<boolean>;
  addFeedback: (readingId: string, input: NewFeedbackInput) => Promise<ReadingFeedback>;
  deleteFeedback: (readingId: string, feedbackId: string) => Promise<void>;
  deleteReading: (readingId: string) => Promise<void>;
  clearReadings: () => Promise<void>;
  clearLocalData: () => Promise<void>;
  createLocalBackup: () => string;
  restoreLocalBackup: (raw: string) => Promise<void>;
  createEncryptedLocalBackup: (password: string) => Promise<string>;
  restoreEncryptedLocalBackup: (raw: string, password: string) => Promise<void>;
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
  const readingsRef = useRef<SavedReading[]>([]);
  const [storageBlockedKeys, setStorageBlockedKeys] = useState<string[]>([]);
  const blockedStorageKeysRef = useRef<Set<string>>(new Set());

  const setStoredValue = <T,>(key: string, value: T) => writeStorageValue(
    key,
    value,
    blockedStorageKeysRef.current,
    (storageKey, encodedValue) => AsyncStorage.setItem(storageKey, encodedValue),
  );

  useEffect(() => {
    readingsRef.current = readings;
  }, [readings]);

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
      locationId: city?.locationId,
      locationProvince: city?.province,
      locationCity: city?.city,
      locationDistrict: city?.district,
      locationDatasetVersion: city?.datasetVersion,
      locationSource: city?.source,
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

  const updateProfile = async (profileId: string, input: NewProfileInput) => {
    assertStorageWritable(STORAGE.profiles, blockedStorageKeysRef.current);
    const current = profiles.find((profile) => profile.id === profileId);
    if (!current) throw new Error('找不到要更新的命主。');
    const timestamp = new Date().toISOString();
    const city = resolveCityCoordinates(input.birthCity);
    const updated: BirthProfile = {
      ...current,
      ...input,
      birthTime: input.birthTime || undefined,
      timeKnown: Boolean(input.birthTime),
      locationId: city?.locationId,
      locationProvince: city?.province,
      locationCity: city?.city,
      locationDistrict: city?.district,
      locationDatasetVersion: city?.datasetVersion,
      locationSource: city?.source,
      latitude: city?.latitude,
      longitude: city?.longitude,
      updatedAt: timestamp,
    };
    const nextProfiles = profiles.map((profile) => profile.id === profileId ? updated : profile);
    await setStoredValue(STORAGE.profiles, nextProfiles);
    setProfiles(nextProfiles);
    return updated;
  };

  const deleteProfile = async (profileId: string) => {
    assertStorageWritable(STORAGE.profiles, blockedStorageKeysRef.current);
    assertStorageWritable(STORAGE.selectedProfile, blockedStorageKeysRef.current);
    assertStorageWritable(STORAGE.readings, blockedStorageKeysRef.current);
    const nextProfiles = profiles.filter((profile) => profile.id !== profileId);
    if (nextProfiles.length === profiles.length) throw new Error('找不到要删除的命主。');
    const nextReadings = readingsRef.current.filter((reading) => reading.profileId !== profileId);
    const nextSelectedProfileId = selectedProfileId === profileId ? nextProfiles[0]?.id ?? null : selectedProfileId;
    await Promise.all([
      setStoredValue(STORAGE.profiles, nextProfiles),
      setStoredValue(STORAGE.selectedProfile, nextSelectedProfileId),
      setStoredValue(STORAGE.readings, nextReadings),
    ]);
    setProfiles(nextProfiles);
    setSelectedProfileId(nextSelectedProfileId);
    readingsRef.current = nextReadings;
    setReadings(nextReadings);
  };

  const selectProfile = async (profileId: string) => {
    assertStorageWritable(STORAGE.selectedProfile, blockedStorageKeysRef.current);
    setSelectedProfileId(profileId);
    await setStoredValue(STORAGE.selectedProfile, profileId);
  };

  const saveReading: AppContextValue['saveReading'] = async ({ profile, title, summary, payload }) => {
    assertStorageWritable(STORAGE.readings, blockedStorageKeysRef.current);
    const baziSnapshot = createBaziHistorySnapshot(payload);
    const reading: SavedReading = {
      id: createId('reading'),
      profileId: profile.id,
      profileName: profile.name,
      module: payload.module,
      title,
      summary,
      createdAt: payload.generatedAt,
      engineVersion: payload.engineVersion,
      interpretationVersion: payload.module === 'bazi' && payload.interpretation
        ? payload.interpretation.interpretationVersion
        : 'rules-v1',
      snapshotMeta: snapshotMetaFromPayload(payload),
      inputSnapshot: payload.inputSnapshot,
      favorite: false,
      feedback: [],
      ...(payload.module === 'liuyao'
        ? {
            seed: payload.seed,
            date: payload.date,
            seedScope: payload.seedScope,
        }
        : {}),
      ...(baziSnapshot
        ? {
            normalizedChartSnapshot: baziSnapshot.normalizedChart,
            evidenceGraphSnapshot: baziSnapshot.evidenceGraph,
            interpretationSnapshot: baziSnapshot.interpretation,
          }
        : {}),
      payload,
    };
    const nextReadings = [reading, ...readingsRef.current].slice(0, 100);
    readingsRef.current = nextReadings;
    setReadings(nextReadings);
    await setStoredValue(STORAGE.readings, nextReadings);
    return reading;
  };

  const toggleFavorite = async (readingId: string) => {
    assertStorageWritable(STORAGE.readings, blockedStorageKeysRef.current);
    const currentReadings = readingsRef.current;
    const current = currentReadings.find((reading) => reading.id === readingId);
    if (!current) throw new Error('找不到要收藏的排盘记录。');
    const favorite = !current.favorite;
    const nextReadings = currentReadings.map((reading) => reading.id === readingId ? { ...reading, favorite } : reading);
    await setStoredValue(STORAGE.readings, nextReadings);
    readingsRef.current = nextReadings;
    setReadings(nextReadings);
    return favorite;
  };

  const addFeedback = async (readingId: string, input: NewFeedbackInput) => {
    assertStorageWritable(STORAGE.readings, blockedStorageKeysRef.current);
    if (!['confirmed', 'partial', 'not-yet', 'contradicted'].includes(input.status)) throw new Error('反馈状态无效。');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.observedAt)) throw new Error('反馈日期请使用 YYYY-MM-DD 格式。');
    const note = input.note.trim();
    if (!note) throw new Error('请写下这次反馈的事实说明。');
    const currentReadings = readingsRef.current;
    const current = currentReadings.find((reading) => reading.id === readingId);
    if (!current) throw new Error('找不到要反馈的排盘记录。');
    const feedback: ReadingFeedback = {
      id: createId('feedback'),
      status: input.status,
      observedAt: input.observedAt,
      note,
      createdAt: new Date().toISOString(),
    };
    const nextReadings = currentReadings.map((reading) => reading.id === readingId ? { ...reading, feedback: [feedback, ...reading.feedback] } : reading);
    await setStoredValue(STORAGE.readings, nextReadings);
    readingsRef.current = nextReadings;
    setReadings(nextReadings);
    return feedback;
  };

  const deleteFeedback = async (readingId: string, feedbackId: string) => {
    assertStorageWritable(STORAGE.readings, blockedStorageKeysRef.current);
    const currentReadings = readingsRef.current;
    const current = currentReadings.find((reading) => reading.id === readingId);
    if (!current) throw new Error('找不到要反馈的排盘记录。');
    const nextFeedback = current.feedback.filter((feedback) => feedback.id !== feedbackId);
    if (nextFeedback.length === current.feedback.length) throw new Error('找不到要删除的反馈。');
    const nextReadings = currentReadings.map((reading) => reading.id === readingId ? { ...reading, feedback: nextFeedback } : reading);
    await setStoredValue(STORAGE.readings, nextReadings);
    readingsRef.current = nextReadings;
    setReadings(nextReadings);
  };

  const deleteReading = async (readingId: string) => {
    assertStorageWritable(STORAGE.readings, blockedStorageKeysRef.current);
    const currentReadings = readingsRef.current;
    const nextReadings = currentReadings.filter((reading) => reading.id !== readingId);
    if (nextReadings.length === currentReadings.length) throw new Error('找不到要删除的排盘记录。');
    await setStoredValue(STORAGE.readings, nextReadings);
    readingsRef.current = nextReadings;
    setReadings(nextReadings);
  };

  const clearReadings = async () => {
    assertStorageWritable(STORAGE.readings, blockedStorageKeysRef.current);
    await setStoredValue(STORAGE.readings, []);
    readingsRef.current = [];
    setReadings([]);
  };

  const clearLocalData = async () => {
    Object.values(STORAGE).forEach((key) => assertStorageWritable(key, blockedStorageKeysRef.current));
    await AsyncStorage.multiRemove(Object.values(STORAGE));
    blockedStorageKeysRef.current = new Set();
    setStorageBlockedKeys([]);
    setUser(null);
    setProfiles([]);
    setSelectedProfileId(null);
    readingsRef.current = [];
    setReadings([]);
  };

  const createLocalBackup = () => {
    Object.values(STORAGE).forEach((key) => assertStorageWritable(key, blockedStorageKeysRef.current));
    return createLocalBackupText({ user, profiles, selectedProfileId, readings: readingsRef.current });
  };

  const createEncryptedLocalBackup = async (password: string) => {
    Object.values(STORAGE).forEach((key) => assertStorageWritable(key, blockedStorageKeysRef.current));
    return createEncryptedLocalBackupText({ user, profiles, selectedProfileId, readings: readingsRef.current }, password);
  };

  const restoreLocalBackup = async (raw: string) => {
    const backup = parseLocalBackupText(raw);
    Object.values(STORAGE).forEach((key) => assertStorageWritable(key, blockedStorageKeysRef.current));
    const { data } = backup;
    await AsyncStorage.multiSet([
      [STORAGE.user, encodeStorageValue(data.user)],
      [STORAGE.profiles, encodeStorageValue(data.profiles)],
      [STORAGE.selectedProfile, encodeStorageValue(data.selectedProfileId)],
      [STORAGE.readings, encodeStorageValue(data.readings)],
    ]);
    blockedStorageKeysRef.current = new Set();
    setStorageBlockedKeys([]);
    setUser(data.user);
    setProfiles(data.profiles);
    setSelectedProfileId(data.selectedProfileId);
    readingsRef.current = data.readings;
    setReadings(data.readings);
  };

  const restoreEncryptedLocalBackup = async (raw: string, password: string) => {
    const backup = await parseEncryptedLocalBackupText(raw, password);
    Object.values(STORAGE).forEach((key) => assertStorageWritable(key, blockedStorageKeysRef.current));
    const { data } = backup;
    await AsyncStorage.multiSet([
      [STORAGE.user, encodeStorageValue(data.user)],
      [STORAGE.profiles, encodeStorageValue(data.profiles)],
      [STORAGE.selectedProfile, encodeStorageValue(data.selectedProfileId)],
      [STORAGE.readings, encodeStorageValue(data.readings)],
    ]);
    blockedStorageKeysRef.current = new Set();
    setStorageBlockedKeys([]);
    setUser(data.user);
    setProfiles(data.profiles);
    setSelectedProfileId(data.selectedProfileId);
    readingsRef.current = data.readings;
    setReadings(data.readings);
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
    updateProfile,
    deleteProfile,
    saveReading,
    toggleFavorite,
    addFeedback,
    deleteFeedback,
    deleteReading,
    clearReadings,
    clearLocalData,
    createLocalBackup,
    restoreLocalBackup,
    createEncryptedLocalBackup,
    restoreEncryptedLocalBackup,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
