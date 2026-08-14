import { useState } from 'react';
import {
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
import { useScrollToTopOnMount } from '@/hooks/use-scroll-to-top-on-mount';
import { useApp } from '@/state/app-context';
import { Gender, Relationship } from '@/types/domain';

const relationships: Relationship[] = ['本人', '伴侣', '家人', '朋友', '其他'];

export function ProfilesScreen() {
  useScrollToTopOnMount();
  const { profiles, selectedProfile, addProfile, selectProfile } = useApp();
  const [showForm, setShowForm] = useState(profiles.length === 0);
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

  const save = async () => {
    if (!name.trim()) return setError('请填写命主称呼。');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return setError('出生日期请使用 YYYY-MM-DD 格式。');
    if (timeKnown && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) return setError('出生时间请使用 HH:mm 格式。');
    if (!birthCity.trim()) return setError('请填写出生城市。');

    await addProfile({
      name: name.trim(),
      relationship,
      birthDate,
      birthTime: timeKnown ? birthTime : undefined,
      birthCity: birthCity.trim(),
      calendar,
      isLeapMonth: calendar === 'lunar' ? isLeapMonth : undefined,
      gender,
    });
    setName('');
    setBirthDate('');
    setBirthTime('');
    setBirthCity('');
    setError('');
    setShowForm(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
              accessibilityRole="button"
              onPress={() => setShowForm((current) => !current)}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <Text style={styles.addButtonText}>{showForm ? '收起' : '新增命主'}</Text>
            </Pressable>
          </View>

          {showForm && (
            <View style={styles.formPanel}>
              <Text style={styles.formTitle}>建立命主</Text>
              <Text style={styles.formHint}>不知道具体时辰可以关闭“时辰已知”，我们不会自动猜测。</Text>

              <Text style={styles.label}>称呼</Text>
              <TextInput accessibilityLabel="命主称呼" onChangeText={setName} placeholder="例如：我、妈妈、小林" placeholderTextColor="#65736D" style={styles.input} value={name} />

              <Text style={styles.label}>关系</Text>
              <View style={styles.chipRow}>
                {relationships.map((item) => (
                  <Pressable
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
              <View style={styles.segment}>
                {(['solar', 'lunar'] as const).map((item) => (
                  <Pressable
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
                    onValueChange={setIsLeapMonth}
                    thumbColor={isLeapMonth ? palette.paleBrass : palette.ashGreen}
                    trackColor={{ false: palette.jadeMist, true: palette.patina }}
                    value={isLeapMonth}
                  />
                </View>
              )}

              <Text style={styles.label}>排盘性别</Text>
              <View style={styles.segment}>
                {(['female', 'male'] as const).map((item) => (
                  <Pressable
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
              <TextInput accessibilityLabel="出生日期" keyboardType="numbers-and-punctuation" onChangeText={setBirthDate} placeholder="1998-08-20" placeholderTextColor="#65736D" style={styles.input} value={birthDate} />

              <View style={styles.switchRow}>
                <View style={styles.switchCopy}>
                  <Text style={styles.switchLabel}>时辰已知</Text>
                  <Text style={styles.switchHint}>关闭后只显示日级别可计算内容，并标注偏差。</Text>
                </View>
                <Switch
                  accessibilityLabel="出生时辰是否已知"
                  onValueChange={setTimeKnown}
                  thumbColor={timeKnown ? palette.paleBrass : palette.ashGreen}
                  trackColor={{ false: palette.jadeMist, true: palette.patina }}
                  value={timeKnown}
                />
              </View>

              {timeKnown && (
                <>
                  <Text style={styles.label}>出生时间</Text>
                  <TextInput accessibilityLabel="出生时间" keyboardType="numbers-and-punctuation" onChangeText={setBirthTime} placeholder="20:30" placeholderTextColor="#65736D" style={styles.input} value={birthTime} />
                </>
              )}

              <Text style={styles.label}>出生城市</Text>
              <TextInput accessibilityLabel="出生城市" onChangeText={setBirthCity} placeholder="例如：广东省深圳市" placeholderTextColor="#65736D" style={styles.input} value={birthCity} />

              {!!error && <Text style={styles.error}>{error}</Text>}
              <ActionButton accessibilityLabel="保存命主" onPress={save} style={styles.saveButton}>保存命主</ActionButton>
            </View>
          )}

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>已保存</Text>
            <Text style={styles.listCount}>{profiles.length} 位</Text>
          </View>

          {profiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyGlyph}>命</Text>
              <Text style={styles.emptyTitle}>还没有命主</Text>
              <Text style={styles.emptyText}>建立第一位命主后，就可以在四种体系间复用出生资料。</Text>
            </View>
          ) : (
            <View style={styles.profileList}>
              {profiles.map((profile) => {
                const active = selectedProfile?.id === profile.id;
                return (
                  <Pressable
                    accessibilityLabel={`选择命主${profile.name}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    key={profile.id}
                    onPress={() => selectProfile(profile.id)}
                    style={({ pressed }) => [styles.profileCard, active && styles.profileCardActive, pressed && styles.pressed]}>
                    <View style={styles.profileMonogram}><Text style={styles.profileMonogramText}>{profile.name.slice(0, 1)}</Text></View>
                    <View style={styles.profileCopy}>
                      <View style={styles.profileNameRow}>
                        <Text style={styles.profileName}>{profile.name}</Text>
                        <Text style={styles.relationship}>{profile.relationship}</Text>
                      </View>
                      <Text style={styles.profileMeta}>{profile.birthDate} · {profile.birthTime ?? '时辰未知'} · {profile.gender === 'male' ? '男' : profile.gender === 'female' ? '女' : '性别待补'} · {profile.birthCity}</Text>
                    </View>
                    <View style={[styles.selection, active && styles.selectionActive]} />
                  </Pressable>
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
  formPanel: { marginTop: spacing.x8, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.panel, backgroundColor: 'rgba(8, 26, 22, 0.88)', padding: spacing.x6 },
  formTitle: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 23, letterSpacing: 1 },
  formHint: { marginTop: spacing.x2, marginBottom: spacing.x5, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20 },
  label: { marginTop: spacing.x4, marginBottom: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 13 },
  input: { minHeight: 48, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, backgroundColor: palette.obsidian, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 16, paddingHorizontal: spacing.x4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  chip: { minHeight: 40, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.pill, paddingHorizontal: spacing.x4 },
  chipSelected: { borderColor: palette.brass, backgroundColor: palette.brassGlow },
  chipText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12 },
  chipTextSelected: { color: palette.paleBrass },
  segment: { flexDirection: 'row', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: 3, backgroundColor: palette.obsidian },
  segmentItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  segmentItemSelected: { backgroundColor: palette.jadeMist },
  segmentText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12 },
  segmentTextSelected: { color: palette.ricePaper },
  switchRow: { marginTop: spacing.x5, flexDirection: 'row', alignItems: 'center', gap: spacing.x4, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x4 },
  switchCopy: { flex: 1 },
  switchLabel: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 13 },
  switchHint: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 17 },
  error: { marginTop: spacing.x4, color: '#D88978', fontFamily: fontFamilies.body, fontSize: 12 },
  saveButton: { marginTop: spacing.x5 },
  listHeader: { marginTop: spacing.x10, marginBottom: spacing.x4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 21, letterSpacing: 1 },
  listCount: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 12 },
  emptyState: { alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: palette.hairline, borderRadius: radii.card, padding: spacing.x8 },
  emptyGlyph: { color: palette.brass, fontFamily: fontFamilies.display, fontSize: 30 },
  emptyTitle: { marginTop: spacing.x3, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 18 },
  emptyText: { maxWidth: 360, marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20, textAlign: 'center' },
  profileList: { gap: spacing.x3 },
  profileCard: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: spacing.x4, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.card, backgroundColor: palette.deepJade, padding: spacing.x4 },
  profileCardActive: { borderColor: palette.hairlineStrong },
  profileMonogram: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.hairlineStrong, backgroundColor: palette.obsidian },
  profileMonogramText: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 18 },
  profileCopy: { flex: 1 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  profileName: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 15, fontWeight: '600' },
  relationship: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 10 },
  profileMeta: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  selection: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: palette.ashGreen },
  selectionActive: { borderColor: palette.brass, backgroundColor: palette.brass },
  pressed: { opacity: 0.68 },
});
