import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedReveal } from '@/components/animated-reveal';
import { Atmosphere } from '@/components/atmosphere';
import { BottomDock } from '@/components/bottom-dock';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { moduleBySlug } from '@/data/modules';
import { useScrollToTopOnMount } from '@/hooks/use-scroll-to-top-on-mount';
import { useApp } from '@/state/app-context';

export function RecordsScreen() {
  useScrollToTopOnMount();
  const { readings, deleteReading, clearReadings, storageBlockedKeys } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(readings[0]?.id ?? null);
  const recordsReadOnly = storageBlockedKeys.includes('@guanxiang/readings');

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
            {readings.length > 0 && (
              <Pressable accessibilityLabel="清空全部观象记录" accessibilityRole="button" disabled={recordsReadOnly} onPress={confirmClear} style={({ pressed }) => [styles.clearButton, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                <Text style={styles.clearButtonText}>{recordsReadOnly ? '记录只读' : '清空记录'}</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.description}>每次排盘都会保存算法版本、基础观察和边界说明，方便之后按事实反馈复盘。</Text>
        </View>
        {recordsReadOnly && (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyTitle}>记录数据只读</Text>
            <Text style={styles.readOnlyText}>这份数据由更新版本写入，当前版本不会覆盖它。请先升级应用后再删除或清空。</Text>
          </View>
        )}
        {readings.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons color={palette.brass} name="archive-clock-outline" size={34} />
            <Text style={styles.emptyTitle}>还没有排盘记录</Text>
            <Text style={styles.emptyText}>从首页进入任一体系完成排盘后，结果会自动保存在这里。</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {readings.map((reading, index) => {
              const module = moduleBySlug[reading.module];
              const expanded = reading.id === expandedId;
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
  kicker: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 9, letterSpacing: 2.5 },
  title: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 31, letterSpacing: 2 },
  description: { maxWidth: 560, marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 21 },
  clearButton: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(216, 137, 120, 0.42)', borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  clearButtonText: { color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 11 },
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
  deleteButton: { minHeight: 36, alignSelf: 'flex-start', marginTop: spacing.x3, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(216, 137, 120, 0.42)', borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  deleteButtonText: { color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 11 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72 },
});
