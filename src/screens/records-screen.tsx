import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { AnimatedReveal } from '@/components/animated-reveal';
import { Atmosphere } from '@/components/atmosphere';
import { BottomDock } from '@/components/bottom-dock';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { moduleBySlug } from '@/data/modules';
import { useScrollToTopOnMount } from '@/hooks/use-scroll-to-top-on-mount';
import { useApp } from '@/state/app-context';
import type { ReadingFeedbackStatus } from '@/types/domain';

const feedbackStatusOptions: { value: ReadingFeedbackStatus; label: string }[] = [
  { value: 'confirmed', label: '已发生' },
  { value: 'partial', label: '部分符合' },
  { value: 'not-yet', label: '尚未验证' },
  { value: 'contradicted', label: '相反' },
];

function todayShanghai() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function RecordsScreen() {
  useScrollToTopOnMount();
  const { readings, toggleFavorite, addFeedback, deleteFeedback, deleteReading, clearReadings, storageBlockedKeys } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(readings[0]?.id ?? null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<ReadingFeedbackStatus>('confirmed');
  const [feedbackObservedAt, setFeedbackObservedAt] = useState(todayShanghai());
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const recordsReadOnly = storageBlockedKeys.includes('@guanxiang/readings');
  const visibleReadings = favoritesOnly ? readings.filter((reading) => reading.favorite) : readings;

  const startFeedback = (readingId: string) => {
    setFeedbackTargetId((current) => current === readingId ? null : readingId);
    setFeedbackStatus('confirmed');
    setFeedbackObservedAt(todayShanghai());
    setFeedbackNote('');
    setFeedbackError('');
  };

  const submitFeedback = async (readingId: string) => {
    try {
      await addFeedback(readingId, { status: feedbackStatus, observedAt: feedbackObservedAt, note: feedbackNote });
      setFeedbackTargetId(null);
      setFeedbackNote('');
      setFeedbackError('');
    } catch (operationError) {
      setFeedbackError(operationError instanceof Error ? operationError.message : '保存反馈失败，请稍后重试。');
    }
  };

  const confirmDeleteFeedback = (readingId: string, feedbackId: string) => {
    Alert.alert('删除这条反馈', '这只会删除反馈笔记，不会删除排盘记录。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFeedback(readingId, feedbackId);
          } catch (operationError) {
            setFeedbackError(operationError instanceof Error ? operationError.message : '删除反馈失败，请稍后重试。');
          }
        },
      },
    ]);
  };

  const confirmClear = () => {
    Alert.alert(
      '清空观象记录',
      '会删除本机保存的全部排盘记录，命主资料不会受影响。此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认清空',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearReadings();
              setExpandedId(null);
            } catch {
              // The storage layer rejects writes for incompatible future data.
            }
          },
        },
      ],
    );
  };

  const confirmDelete = (readingId: string, title: string) => {
    Alert.alert(
      '删除这条记录',
      `确认删除「${title}」吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReading(readingId);
              setExpandedId((current) => current === readingId ? null : current);
            } catch {
              // The storage layer rejects writes for incompatible future data.
            }
          },
        },
      ],
    );
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <Atmosphere focus="bottom" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>LOCAL ARCHIVE</Text>
              <Text accessibilityRole="header" style={styles.title}>观象记录</Text>
            </View>
            <View style={styles.headerActions}>
              {readings.length > 0 && (
                <Pressable accessibilityLabel={favoritesOnly ? '显示全部观象记录' : '只看收藏记录'} accessibilityRole="button" onPress={() => setFavoritesOnly((current) => !current)} style={({ pressed }) => [styles.filterButton, favoritesOnly && styles.filterButtonActive, pressed && styles.pressed]}>
                  <Text style={styles.filterButtonText}>{favoritesOnly ? '全部记录' : '只看收藏'}</Text>
                </Pressable>
              )}
              {readings.length > 0 && (
                <Pressable accessibilityLabel="清空全部观象记录" accessibilityRole="button" disabled={recordsReadOnly} onPress={confirmClear} style={({ pressed }) => [styles.clearButton, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                  <Text style={styles.clearButtonText}>{recordsReadOnly ? '记录只读' : '清空记录'}</Text>
                </Pressable>
              )}
            </View>
          </View>
          <Text style={styles.description}>每次排盘都会保存算法版本、基础观察和边界说明，方便之后按事实反馈复盘。</Text>
        </View>
        {recordsReadOnly && (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyTitle}>记录数据只读</Text>
            <Text style={styles.readOnlyText}>这份数据由更新版本写入，当前版本不会覆盖它。请先升级应用后再删除或清空。</Text>
          </View>
        )}
        {readings.length === 0 || visibleReadings.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons color={palette.brass} name="archive-clock-outline" size={34} />
            <Text style={styles.emptyTitle}>{favoritesOnly ? '还没有收藏记录' : '还没有排盘记录'}</Text>
            <Text style={styles.emptyText}>{favoritesOnly ? '在记录详情中点亮收藏，重要的盘会集中显示在这里。' : '从首页进入任一体系完成排盘后，结果会自动保存在这里。'}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleReadings.map((reading, index) => {
              const module = moduleBySlug[reading.module];
              const expanded = reading.id === expandedId;
              const feedbackList = reading.feedback ?? [];
              return (
                <AnimatedReveal delay={Math.min(index, 6) * 55} key={reading.id}>
                  <Pressable
                    accessibilityLabel={`${expanded ? '收起' : '展开'}${reading.title}排盘记录`}
                    accessibilityRole="button"
                    onPress={() => setExpandedId(expanded ? null : reading.id)}
                    style={({ pressed }) => [styles.card, expanded && styles.cardExpanded, pressed && styles.pressed]}>
                    <View style={[styles.moduleMark, { borderColor: module.accent }]}><Text style={[styles.moduleGlyph, { color: module.accent }]}>{module.glyph}</Text></View>
                    <View style={styles.cardCopy}>
                      <View style={styles.cardTop}><Text style={styles.moduleName}>{module.title} · {reading.profileName}</Text><Text style={styles.date}>{new Date(reading.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text></View>
                      <Text style={styles.cardTitle}>{reading.title}</Text>
                      <Text style={styles.cardSummary}>{reading.summary}</Text>
                      {expanded && (
                        <View style={styles.detail}>
                          {reading.payload.focus.map((item, itemIndex) => <View key={item} style={styles.focusRow}><Text style={styles.focusIndex}>{itemIndex + 1}</Text><Text style={styles.focusText}>{item}</Text></View>)}
                          <View style={styles.versionRow}><Text style={styles.version}>算法 {reading.engineVersion}</Text><Text style={styles.version}>解读 {reading.interpretationVersion}</Text></View>
                          <View style={styles.detailActions}>
                            <Pressable accessibilityLabel={reading.favorite ? `取消收藏${reading.title}` : `收藏${reading.title}`} accessibilityRole="button" disabled={recordsReadOnly} onPress={() => toggleFavorite(reading.id)} style={({ pressed }) => [styles.favoriteButton, reading.favorite && styles.favoriteButtonActive, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                              <MaterialCommunityIcons color={reading.favorite ? palette.brass : palette.ashGreen} name={reading.favorite ? 'star' : 'star-outline'} size={16} />
                              <Text style={[styles.favoriteButtonText, reading.favorite && styles.favoriteButtonTextActive]}>{reading.favorite ? '已收藏' : '收藏'}</Text>
                            </Pressable>
                            <Pressable accessibilityLabel={`给${reading.title}添加事实反馈`} accessibilityRole="button" disabled={recordsReadOnly} onPress={() => startFeedback(reading.id)} style={({ pressed }) => [styles.feedbackButton, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                              <Text style={styles.feedbackButtonText}>{feedbackTargetId === reading.id ? '收起反馈' : '添加反馈'}</Text>
                            </Pressable>
                          </View>
                          <View style={styles.feedbackPanel}>
                            <View style={styles.feedbackHeader}>
                              <Text style={styles.feedbackTitle}>事实反馈</Text>
                              <Text style={styles.feedbackCount}>{feedbackList.length} 条</Text>
                            </View>
                            <Text style={styles.feedbackHint}>以日为最小粒度；事实不明确时，保留具体说明，不强行归因。</Text>
                            {feedbackList.length === 0 ? (
                              <Text style={styles.feedbackEmpty}>还没有反馈。等事情发生后，再回来记录“发生了什么”。</Text>
                            ) : (
                              feedbackList.map((feedback) => (
                                <View key={feedback.id} style={styles.feedbackItem}>
                                  <View style={styles.feedbackItemTop}>
                                    <Text style={styles.feedbackStatus}>{feedbackStatusOptions.find((option) => option.value === feedback.status)?.label ?? feedback.status}</Text>
                                    <Text style={styles.feedbackDate}>{feedback.observedAt}</Text>
                                    <Pressable accessibilityLabel="删除这条事实反馈" accessibilityRole="button" disabled={recordsReadOnly} onPress={() => confirmDeleteFeedback(reading.id, feedback.id)} style={({ pressed }) => [styles.feedbackDelete, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                                      <Text style={styles.feedbackDeleteText}>删除</Text>
                                    </Pressable>
                                  </View>
                                  <Text style={styles.feedbackNote}>{feedback.note}</Text>
                                </View>
                              ))
                            )}
                            {feedbackTargetId === reading.id && (
                              <View style={styles.feedbackForm}>
                                <Text style={styles.feedbackFormLabel}>这次反馈的状态</Text>
                                <View style={styles.statusOptions}>
                                  {feedbackStatusOptions.map((option) => (
                                    <Pressable accessibilityLabel={`反馈状态${option.label}`} accessibilityRole="radio" accessibilityState={{ selected: feedbackStatus === option.value }} key={option.value} onPress={() => setFeedbackStatus(option.value)} style={({ pressed }) => [styles.statusOption, feedbackStatus === option.value && styles.statusOptionActive, pressed && styles.pressed]}>
                                      <Text style={[styles.statusOptionText, feedbackStatus === option.value && styles.statusOptionTextActive]}>{option.label}</Text>
                                    </Pressable>
                                  ))}
                                </View>
                                <TextInput accessibilityLabel="反馈发生日期" onChangeText={setFeedbackObservedAt} placeholder="发生日期 YYYY-MM-DD" placeholderTextColor="#65736D" style={styles.feedbackInput} value={feedbackObservedAt} />
                                <TextInput accessibilityLabel="反馈事实说明" multiline onChangeText={setFeedbackNote} placeholder="记录可核对的事实，例如：哪一天、发生了什么、与盘面哪条观察有关" placeholderTextColor="#65736D" style={[styles.feedbackInput, styles.feedbackNoteInput]} textAlignVertical="top" value={feedbackNote} />
                                {!!feedbackError && <Text style={styles.feedbackError}>{feedbackError}</Text>}
                                <ActionButton accessibilityLabel="保存这次事实反馈" disabled={recordsReadOnly} onPress={() => submitFeedback(reading.id)} style={styles.feedbackSaveButton} variant="secondary">保存反馈</ActionButton>
                              </View>
                            )}
                          </View>
                          <Pressable accessibilityLabel={`删除${reading.title}记录`} accessibilityRole="button" disabled={recordsReadOnly} onPress={() => confirmDelete(reading.id, reading.title)} style={({ pressed }) => [styles.deleteButton, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                            <Text style={styles.deleteButtonText}>删除这条记录</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                    <MaterialCommunityIcons color={palette.ashGreen} name={expanded ? 'chevron-up' : 'chevron-down'} size={20} />
                  </Pressable>
                </AnimatedReveal>
              );
            })}
          </View>
        )}
      </ScrollView>
      <BottomDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.obsidian },
  scrollContent: { width: '100%', maxWidth: 860, alignSelf: 'center', paddingHorizontal: layout.mobileGutter, paddingTop: spacing.x6, paddingBottom: 112 },
  header: { borderBottomWidth: 1, borderColor: palette.hairline, paddingBottom: spacing.x6 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.x4 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', gap: spacing.x2 },
  kicker: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 9, letterSpacing: 2.5 },
  title: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 31, letterSpacing: 2 },
  description: { maxWidth: 560, marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 21 },
  clearButton: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(216, 137, 120, 0.42)', borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  clearButtonText: { color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 11 },
  filterButton: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  filterButtonActive: { borderColor: palette.hairlineStrong, backgroundColor: palette.brassGlow },
  filterButtonText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 11 },
  readOnlyBanner: { marginTop: spacing.x5, borderWidth: 1, borderColor: 'rgba(216, 137, 120, 0.48)', borderRadius: radii.card, backgroundColor: 'rgba(120, 48, 36, 0.14)', padding: spacing.x4 },
  readOnlyTitle: { color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 13, fontWeight: '600' },
  readOnlyText: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  empty: { marginTop: spacing.x8, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: palette.hairline, borderRadius: radii.panel, padding: spacing.x10 },
  emptyTitle: { marginTop: spacing.x3, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 20 },
  emptyText: { maxWidth: 380, marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20, textAlign: 'center' },
  list: { marginTop: spacing.x6, gap: spacing.x3 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.card, backgroundColor: 'rgba(8,26,22,0.88)', padding: spacing.x4 },
  cardExpanded: { borderColor: palette.hairlineStrong },
  moduleMark: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 22, backgroundColor: palette.obsidian },
  moduleGlyph: { fontFamily: fontFamilies.display, fontSize: 16 },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
  moduleName: { flex: 1, color: palette.brass, fontFamily: fontFamilies.body, fontSize: 10 },
  date: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 9 },
  cardTitle: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 18 },
  cardSummary: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  detail: { marginTop: spacing.x4, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x2 },
  focusRow: { flexDirection: 'row', gap: spacing.x3, paddingVertical: spacing.x2 },
  focusIndex: { width: 18, color: palette.brass, fontFamily: fontFamilies.data, fontSize: 9 },
  focusText: { flex: 1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  versionRow: { marginTop: spacing.x2, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x3 },
  version: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9 },
  detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x4 },
  favoriteButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: spacing.x1, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  favoriteButtonActive: { borderColor: palette.hairlineStrong, backgroundColor: palette.brassGlow },
  favoriteButtonText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  favoriteButtonTextActive: { color: palette.paleBrass },
  feedbackButton: { minHeight: 36, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  feedbackButtonText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 11 },
  feedbackPanel: { marginTop: spacing.x4, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, backgroundColor: 'rgba(5,9,7,0.32)', padding: spacing.x3 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedbackTitle: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 15 },
  feedbackCount: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 10 },
  feedbackHint: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16 },
  feedbackEmpty: { marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  feedbackItem: { marginTop: spacing.x3, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x3 },
  feedbackItemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  feedbackStatus: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 11 },
  feedbackDate: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 10 },
  feedbackDelete: { minHeight: 30, marginLeft: 'auto', justifyContent: 'center', paddingHorizontal: spacing.x2 },
  feedbackDeleteText: { color: '#C89283', fontFamily: fontFamilies.body, fontSize: 10 },
  feedbackNote: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  feedbackForm: { marginTop: spacing.x4, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x3 },
  feedbackFormLabel: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x2 },
  statusOption: { minHeight: 34, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x2 },
  statusOptionActive: { borderColor: palette.hairlineStrong, backgroundColor: palette.jadeGlow },
  statusOptionText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  statusOptionTextActive: { color: palette.paleBrass },
  feedbackInput: { minHeight: 42, marginTop: spacing.x2, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 12, paddingHorizontal: spacing.x3, paddingVertical: spacing.x2 },
  feedbackNoteInput: { minHeight: 86, paddingTop: spacing.x3 },
  feedbackError: { marginTop: spacing.x2, color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16 },
  feedbackSaveButton: { marginTop: spacing.x3 },
  deleteButton: { minHeight: 36, alignSelf: 'flex-start', marginTop: spacing.x3, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(216, 137, 120, 0.42)', borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  deleteButtonText: { color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 11 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72 },
});
