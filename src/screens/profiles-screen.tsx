import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { Atmosphere } from '@/components/atmosphere';
import { BottomDock } from '@/components/bottom-dock';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { UI_STATE_COPY } from '@/constants/ui-copy';
import { listMainlandCities, resolveCityCoordinates } from '@/data/china-cities';
import { useScrollToTopOnMount } from '@/hooks/use-scroll-to-top-on-mount';
import { useApp } from '@/state/app-context';
import { Gender, Relationship } from '@/types/domain';

const relationships: Relationship[] = ['本人', '伴侣', '家人', '朋友', '其他'];

export function ProfilesScreen() {
  useScrollToTopOnMount();
  const { profiles, selectedProfile, addProfile, selectProfile, updateProfile, deleteProfile, storageBlockedKeys } = useApp();
  const [showForm, setShowForm] = useState(profiles.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('本人');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthCity, setBirthCity] = useState('');
  const [timeKnown, setTimeKnown] = useState(true);
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>('solar');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [gender, setGender] = useState<Gender>('female');
  const [error, setError] = useState('');
  const nameInputRef = useRef<TextInput | null>(null);
  const birthDateInputRef = useRef<TextInput | null>(null);
  const birthTimeInputRef = useRef<TextInput | null>(null);
  const birthCityInputRef = useRef<TextInput | null>(null);

  const profilesReadOnly = storageBlockedKeys.includes('@guanxiang/profiles');
  const selectionReadOnly = storageBlockedKeys.includes('@guanxiang/selected-profile');
  const recordsReadOnly = storageBlockedKeys.includes('@guanxiang/readings');
  const profileDeleteBlocked = profilesReadOnly || selectionReadOnly || recordsReadOnly;
  const cityMatch = birthCity.trim() ? resolveCityCoordinates(birthCity) : undefined;
  const citySuggestions = birthCity.trim()
    ? listMainlandCities().filter((city) => [city.name, ...city.aliases].some((alias) => alias.includes(birthCity.trim()))).slice(0, 6)
    : listMainlandCities().slice(0, 6);

  const handleSelectProfile = async (profileId: string) => {
    try {
      setError('');
      await selectProfile(profileId);
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : UI_STATE_COPY.failure.body);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRelationship('本人');
    setBirthDate('');
    setBirthTime('');
    setBirthCity('');
    setTimeKnown(true);
    setCalendar('solar');
    setIsLeapMonth(false);
    setGender('female');
    setError('');
  };

  const startEdit = (profile: (typeof profiles)[number]) => {
    setEditingId(profile.id);
    setName(profile.name);
    setRelationship(profile.relationship);
    setBirthDate(profile.birthDate);
    setBirthTime(profile.birthTime ?? '');
    setBirthCity(profile.birthCity);
    setTimeKnown(profile.timeKnown);
    setCalendar(profile.calendar);
    setIsLeapMonth(Boolean(profile.isLeapMonth));
    setGender(profile.gender ?? 'female');
    setError('');
    setShowForm(true);
  };

  const confirmDelete = (profile: (typeof profiles)[number]) => {
    Alert.alert(
      '删除命主',
      `将删除「${profile.name}」及其关联的排盘记录，且无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(profile.id);
              if (editingId === profile.id) {
                resetForm();
                setShowForm(false);
              }
            } catch (operationError) {
              setError(operationError instanceof Error ? operationError.message : '删除失败，请稍后重试。');
            }
          },
        },
      ],
    );
  };

  const save = async () => {
    if (!name.trim()) {
      setError('请填写命主称呼。');
      nameInputRef.current?.focus();
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setError('出生日期请使用 YYYY-MM-DD 格式。');
      birthDateInputRef.current?.focus();
      return;
    }
    if (timeKnown && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
      setError('出生时间请使用 HH:mm 格式。');
      birthTimeInputRef.current?.focus();
      return;
    }
    if (!birthCity.trim()) {
      setError('请填写出生城市。');
      birthCityInputRef.current?.focus();
      return;
    }

    try {
      const input = {
        name: name.trim(),
        relationship,
        birthDate,
        birthTime: timeKnown ? birthTime : undefined,
        birthCity: birthCity.trim(),
        calendar,
        isLeapMonth: calendar === 'lunar' ? isLeapMonth : undefined,
        gender,
      };
      if (editingId) {
        await updateProfile(editingId, input);
      } else {
        await addProfile(input);
      }
      resetForm();
      setShowForm(false);
    } catch (operationError) {
      setError(operationError instanceof Error ? operationError.message : UI_STATE_COPY.failure.body);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="profiles-screen">
      <Atmosphere />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>LOCAL PROFILES</Text>
              <Text accessibilityRole="header" style={styles.title}>命主管理</Text>
              <Text style={styles.description}>每位命主独立保存出生资料、命盘与复盘记录。</Text>
            </View>
            <Pressable
              accessibilityLabel={showForm ? '收起新增命主表单' : '新增命主'}
              accessibilityHint={profilesReadOnly ? '当前版本只读，不能编辑命主资料。' : showForm ? '关闭表单并清空未保存内容。' : '打开表单填写出生资料。'}
              accessibilityRole="button"
              disabled={profilesReadOnly}
              onPress={() => {
                if (showForm) resetForm();
                setShowForm((current) => !current);
              }}
              style={({ pressed }) => [styles.addButton, profilesReadOnly && styles.disabled, pressed && styles.pressed]}>
              <Text style={styles.addButtonText}>{profilesReadOnly ? '命主只读' : showForm ? '收起' : '新增命主'}</Text>
            </Pressable>
          </View>

          {profilesReadOnly && (
            <View accessibilityLabel={UI_STATE_COPY.blocked.announcement} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.readOnlyBanner}>
              <Text style={styles.readOnlyTitle}>命主数据只读</Text>
              <Text style={styles.readOnlyText}>这份数据由更新版本写入，当前版本不会覆盖它。请先升级应用后再编辑或删除。</Text>
            </View>
          )}
          {!!error && !showForm && <Text accessibilityLabel={`错误：${error}`} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.globalError}>{error}</Text>}

          {showForm && (
            <View accessibilityLabel="命主资料表单" style={styles.formPanel} testID="profiles-form">
              <Text accessibilityRole="header" style={styles.formTitle}>{editingId ? '编辑命主' : '建立命主'}</Text>
              <Text style={styles.formHint}>不知道具体时辰可以关闭“时辰已知”，我们不会自动猜测。</Text>

              <Text style={styles.label}>称呼</Text>
              <TextInput accessibilityLabel="命主称呼" autoComplete="name" onChangeText={setName} onSubmitEditing={() => birthDateInputRef.current?.focus()} placeholder="例如：我、妈妈、小林" placeholderTextColor="#65736D" ref={nameInputRef} returnKeyType="next" style={styles.input} textContentType="name" value={name} />

              <Text style={styles.label}>关系</Text>
              <View accessibilityLabel="命主关系" accessibilityRole="radiogroup" style={styles.chipRow}>
                {relationships.map((item) => (
                  <Pressable
                    accessibilityHint="选择命主与自己的关系。"
                    accessibilityLabel={`关系：${item}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: relationship === item }}
                    key={item}
                    onPress={() => setRelationship(item)}
                    style={[styles.chip, relationship === item && styles.chipSelected]}>
                    <Text style={[styles.chipText, relationship === item && styles.chipTextSelected]}>{item}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>历法</Text>
              <View accessibilityLabel="出生历法" accessibilityRole="radiogroup" style={styles.segment}>
                {(['solar', 'lunar'] as const).map((item) => (
                  <Pressable
                    accessibilityHint="选择用于输入出生日期的历法。"
                    accessibilityLabel={item === 'solar' ? '公历' : '农历'}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: calendar === item }}
                    key={item}
                    onPress={() => setCalendar(item)}
                    style={[styles.segmentItem, calendar === item && styles.segmentItemSelected]}>
                    <Text style={[styles.segmentText, calendar === item && styles.segmentTextSelected]}>{item === 'solar' ? '公历' : '农历'}</Text>
                  </Pressable>
                ))}
              </View>

              {calendar === 'lunar' && (
                <View style={styles.switchRow}>
                  <View style={styles.switchCopy}>
                    <Text style={styles.switchLabel}>出生月是闰月</Text>
                    <Text style={styles.switchHint}>只有农历生日明确写有“闰”字时才开启。</Text>
                  </View>
                  <Switch
                    accessibilityLabel="农历出生月是否为闰月"
                    accessibilityHint="只有农历生日明确写有闰字时才开启。"
                    onValueChange={setIsLeapMonth}
                    thumbColor={isLeapMonth ? palette.paleBrass : palette.ashGreen}
                    trackColor={{ false: palette.jadeMist, true: palette.patina }}
                    value={isLeapMonth}
                  />
                </View>
              )}

              <Text style={styles.label}>排盘性别</Text>
              <View accessibilityLabel="排盘性别" accessibilityRole="radiogroup" style={styles.segment}>
                {(['female', 'male'] as const).map((item) => (
                  <Pressable
                    accessibilityHint="选择用于排盘的性别参数。"
                    accessibilityLabel={item === 'female' ? '女' : '男'}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: gender === item }}
                    key={item}
                    onPress={() => setGender(item)}
                    style={[styles.segmentItem, gender === item && styles.segmentItemSelected]}>
                    <Text style={[styles.segmentText, gender === item && styles.segmentTextSelected]}>
                      {item === 'female' ? '女' : '男'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>出生日期</Text>
              <TextInput accessibilityLabel="出生日期" keyboardType="numbers-and-punctuation" onChangeText={setBirthDate} onSubmitEditing={() => timeKnown ? birthTimeInputRef.current?.focus() : birthCityInputRef.current?.focus()} placeholder="1998-08-20" placeholderTextColor="#65736D" ref={birthDateInputRef} returnKeyType="next" style={styles.input} value={birthDate} />

              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchLabel}>时辰已知</Text>
                  <Text style={styles.switchHint}>关闭后保留日级别信息；需要准确时辰的模块会明确提示，不会自动猜测。</Text>
                </View>
                <Switch
                  accessibilityLabel="出生时辰是否已知"
                  accessibilityHint="关闭后仅保留日级别信息，需要准确时辰的模块会明确提示。"
                  onValueChange={setTimeKnown}
                  thumbColor={timeKnown ? palette.paleBrass : palette.ashGreen}
                  trackColor={{ false: palette.jadeMist, true: palette.patina }}
                  value={timeKnown}
                />
              </View>

              {timeKnown && (
                <>
                  <Text style={styles.label}>出生时间</Text>
                  <TextInput accessibilityLabel="出生时间" keyboardType="numbers-and-punctuation" onChangeText={setBirthTime} onSubmitEditing={() => birthCityInputRef.current?.focus()} placeholder="20:30" placeholderTextColor="#65736D" ref={birthTimeInputRef} returnKeyType="next" style={styles.input} value={birthTime} />
                </>
              )}

              <Text style={styles.label}>出生城市</Text>
              <TextInput accessibilityLabel="出生城市" autoComplete="street-address" onChangeText={setBirthCity} onSubmitEditing={() => void save()} placeholder="例如：广东省深圳市" placeholderTextColor="#65736D" ref={birthCityInputRef} returnKeyType="done" style={styles.input} value={birthCity} />
              <Text style={[styles.cityStatus, cityMatch ? styles.cityStatusMatched : styles.cityStatusUnknown]}>
                {cityMatch
                  ? `已匹配 ${cityMatch.province} · ${cityMatch.city}；中心坐标仅作近似，记录会保留 locationId。`
                  : '未命中首发离线城市表时不会按包含关系猜测；需要精确星盘请改选下方城市。'}
              </Text>
              <View accessibilityLabel="首发离线城市建议" accessibilityRole="list" style={styles.citySuggestions}>
                {citySuggestions.map((city) => (
                  <Pressable accessibilityHint={`将出生城市设为${city.province}${city.name}。`} accessibilityLabel={`选择${city.province}${city.name}`} accessibilityRole="button" key={city.locationId} onPress={() => setBirthCity(city.name)} style={({ pressed }) => [styles.citySuggestion, pressed && styles.pressed]}>
                    <Text style={styles.citySuggestionText}>{city.city}</Text>
                  </Pressable>
                ))}
              </View>

              {!!error && <Text accessibilityLabel={`错误：${error}`} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.error}>{error}</Text>}
              <ActionButton accessibilityLabel={editingId ? '保存命主修改' : '保存命主'} accessibilityHint="验证资料后保存在当前设备。" disabled={profilesReadOnly} onPress={save} style={styles.saveButton}>{editingId ? '保存修改' : '保存命主'}</ActionButton>
            </View>
          )}

          <View style={styles.listHeader}>
            <Text accessibilityRole="header" style={styles.listTitle}>已保存</Text>
            <Text style={styles.listCount}>{profiles.length} 位</Text>
          </View>

          {profiles.length === 0 ? (
            <View accessibilityLabel={`${UI_STATE_COPY.empty.announcement} 建立第一位命主后，可以在四种体系间复用出生资料。`} accessibilityRole="text" style={styles.emptyState}>
              <Text style={styles.emptyGlyph}>命</Text>
              <Text style={styles.emptyTitle}>还没有命主</Text>
              <Text style={styles.emptyText}>建立第一位命主后，就可以在四种体系间复用出生资料。</Text>
            </View>
          ) : (
            <View style={styles.profileList}>
              {profiles.map((profile) => {
                const active = selectedProfile?.id === profile.id;
                return (
                  <View style={[styles.profileCard, active && styles.profileCardActive]} key={profile.id}>
                    <Pressable
                      accessibilityLabel={`选择命主${profile.name}`}
                      accessibilityHint={`${profile.birthDate}，${profile.birthCity}。选择后用于后续排盘。`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      disabled={selectionReadOnly}
                      onPress={() => void handleSelectProfile(profile.id)}
                      style={({ pressed }) => [styles.profileSelectArea, pressed && styles.pressed]}>
                      <View style={styles.profileMonogram}><Text style={styles.profileMonogramText}>{profile.name.slice(0, 1)}</Text></View>
                      <View style={styles.profileCopy}>
                        <View style={styles.profileNameRow}>
                          <Text style={styles.profileName}>{profile.name}</Text>
                          <Text style={styles.relationship}>{profile.relationship}</Text>
                        </View>
                        <Text style={styles.profileMeta}>{profile.birthDate} · {profile.birthTime ?? '时辰未提供'} · {profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '性别待补'} · {profile.birthCity}</Text>
                      </View>
                      <View style={[styles.selection, active && styles.selectionActive]} />
                    </Pressable>
                    <View style={styles.profileActions}>
                      <Pressable accessibilityLabel={`编辑命主${profile.name}`} accessibilityHint="打开并填充该命主资料。" accessibilityRole="button" disabled={profilesReadOnly} onPress={() => startEdit(profile)} style={({ pressed }) => [styles.profileAction, profilesReadOnly && styles.disabled, pressed && styles.pressed]}>
                        <Text style={styles.profileActionText}>编辑</Text>
                      </Pressable>
                      <Pressable accessibilityLabel={`删除命主${profile.name}`} accessibilityHint="删除该命主及其关联排盘记录，操作无法撤销。" accessibilityRole="button" disabled={profileDeleteBlocked} onPress={() => confirmDelete(profile)} style={({ pressed }) => [styles.profileAction, styles.deleteAction, profileDeleteBlocked && styles.disabled, pressed && styles.pressed]}>
                        <Text style={[styles.profileActionText, styles.deleteActionText]}>删除</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: palette.obsidian },
  scrollContent: { width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: layout.mobileGutter, paddingTop: spacing.x6, paddingBottom: 112 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.x4 },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 9, letterSpacing: 2.5 },
  title: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 31, letterSpacing: 2 },
  description: { marginTop: spacing.x3, maxWidth: 520, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 21 },
  addButton: { flexShrink: 0, minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, paddingHorizontal: spacing.x4 },
  addButtonText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 12 },
  readOnlyBanner: { marginTop: spacing.x5, borderWidth: 1, borderColor: 'rgba(216, 137, 120, 0.48)', borderRadius: radii.card, backgroundColor: 'rgba(120, 48, 36, 0.14)', padding: spacing.x4 },
  readOnlyTitle: { color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 13, fontWeight: '600' },
  readOnlyText: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  formPanel: { marginTop: spacing.x8, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.panel, backgroundColor: 'rgba(8, 26, 22, 0.88)', padding: spacing.x6 },
  formTitle: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 23, letterSpacing: 1 },
  formHint: { marginTop: spacing.x2, marginBottom: spacing.x5, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20 },
  label: { marginTop: spacing.x4, marginBottom: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 13 },
  input: { minHeight: 48, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, backgroundColor: palette.obsidian, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 16, paddingHorizontal: spacing.x4 },
  cityStatus: { marginTop: spacing.x2, fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16 },
  cityStatusMatched: { color: palette.patina },
  cityStatusUnknown: { color: '#C8A38E' },
  citySuggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x1, marginTop: spacing.x2 },
  citySuggestion: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.pill, paddingHorizontal: spacing.x3 },
  citySuggestionText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  chip: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.pill, paddingHorizontal: spacing.x4 },
  chipSelected: { borderColor: palette.brass, backgroundColor: palette.brassGlow },
  chipText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12 },
  chipTextSelected: { color: palette.paleBrass },
  segment: { flexDirection: 'row', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: 3, backgroundColor: palette.obsidian },
  segmentItem: { flex: 1, minHeight: layout.minTouch, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  segmentItemSelected: { backgroundColor: palette.jadeMist },
  segmentText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12 },
  segmentTextSelected: { color: palette.ricePaper },
  switchRow: { marginTop: spacing.x5, flexDirection: 'row', alignItems: 'center', gap: spacing.x4, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x4 },
  switchCopy: { flex: 1 },
  switchLabel: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 13 },
  switchHint: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 17 },
  error: { marginTop: spacing.x4, color: '#D88978', fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 18 },
  globalError: { marginTop: spacing.x4, color: '#D88978', fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 18 },
  saveButton: { marginTop: spacing.x5 },
  listHeader: { marginTop: spacing.x10, marginBottom: spacing.x4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 21, letterSpacing: 1 },
  listCount: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 12 },
  emptyState: { alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: palette.hairline, borderRadius: radii.card, padding: spacing.x8 },
  emptyGlyph: { color: palette.brass, fontFamily: fontFamilies.display, fontSize: 30 },
  emptyTitle: { marginTop: spacing.x3, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 18 },
  emptyText: { maxWidth: 360, marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20, textAlign: 'center' },
  profileList: { gap: spacing.x3 },
  profileCard: { minHeight: 84, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.card, backgroundColor: palette.deepJade, padding: spacing.x4 },
  profileCardActive: { borderColor: palette.hairlineStrong },
  profileSelectArea: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.x4 },
  profileMonogram: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.hairlineStrong, backgroundColor: palette.obsidian },
  profileMonogramText: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 18 },
  profileCopy: { flex: 1 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  profileName: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 15, fontWeight: '600' },
  relationship: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 10 },
  profileMeta: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  selection: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: palette.ashGreen },
  selectionActive: { borderColor: palette.brass, backgroundColor: palette.brass },
  profileActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.x2, borderTopWidth: 1, borderColor: palette.hairline, marginTop: spacing.x3, paddingTop: spacing.x2 },
  profileAction: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  profileActionText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 11 },
  deleteAction: { borderColor: 'rgba(216, 137, 120, 0.42)' },
  deleteActionText: { color: '#E4A89A' },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.68 },
});
