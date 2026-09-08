import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { ArchiveFilterBar } from '@/components/archive-filter-bar';
import { AnimatedReveal } from '@/components/animated-reveal';
import { Atmosphere } from '@/components/atmosphere';
import { BottomDock } from '@/components/bottom-dock';
import { SnapshotViewer } from '@/components/snapshot-viewer';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { UI_STATE_COPY } from '@/constants/ui-copy';
import { moduleBySlug } from '@/data/modules';
import {
  compareArchiveReadings,
  DEFAULT_ARCHIVE_FILTER_STATE,
  filterArchiveReadings,
  groupArchiveReadings,
  type ArchiveFilterState,
} from '@/domains/archive/query';
import {
  feedbackLinkSummary,
  listFeedbackLinkOptions,
  resolveFeedbackLinkSelection,
  serializeFeedbackLinkSelection,
} from '@/domains/archive/feedback-links';
import { diffBaziInterpretations } from '@/domains/bazi/interpretation/history';
import { buildBaziCurrentRuleReplay } from '@/domains/bazi/true-solar-presentation';
import { useScrollToTopOnMount } from '@/hooks/use-scroll-to-top-on-mount';
import { calculateBaziView } from '@/services/chart-engine';
import { useApp } from '@/state/app-context';
import type { ReadingFeedback, ReadingFeedbackStatus } from '@/types/domain';

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
  const { readings, profiles, toggleFavorite, addFeedback, updateFeedback, deleteFeedback, deleteReading, clearReadings, storageBlockedKeys } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(readings[0]?.id ?? null);
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilterState>(DEFAULT_ARCHIVE_FILTER_STATE);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareError, setCompareError] = useState('');
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<ReadingFeedbackStatus>('not-yet');
  const [feedbackObservedAt, setFeedbackObservedAt] = useState(todayShanghai());
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackLinkedInterpretationId, setFeedbackLinkedInterpretationId] = useState<string | undefined>();
  const [feedbackLinkedEvidenceIds, setFeedbackLinkedEvidenceIds] = useState<string[]>([]);
  const [feedbackUnresolvedInterpretationIds, setFeedbackUnresolvedInterpretationIds] = useState<string[]>([]);
  const [feedbackUnresolvedEvidenceIds, setFeedbackUnresolvedEvidenceIds] = useState<string[]>([]);
  const [feedbackError, setFeedbackError] = useState('');
  const [diffByReadingId, setDiffByReadingId] = useState<Record<string, ReturnType<typeof diffBaziInterpretations>>>({});
  const [diffError, setDiffError] = useState('');
  const recordsReadOnly = storageBlockedKeys.includes('@guanxiang/readings');
  const visibleReadings = useMemo(() => filterArchiveReadings(readings, archiveFilter), [archiveFilter, readings]);
  const readingGroups = useMemo(() => groupArchiveReadings(visibleReadings, archiveFilter.groupBy), [archiveFilter.groupBy, visibleReadings]);
  const compareLeft = compareIds.length === 2 ? readings.find((reading) => reading.id === compareIds[0]) : undefined;
  const compareRight = compareIds.length === 2 ? readings.find((reading) => reading.id === compareIds[1]) : undefined;
  const compareResult = compareLeft && compareRight ? compareArchiveReadings(compareLeft, compareRight) : undefined;

  const updateArchiveFilter = (patch: Partial<ArchiveFilterState>) => {
    setArchiveFilter((current) => ({ ...current, ...patch }));
  };

  const clearArchiveFilter = () => setArchiveFilter(DEFAULT_ARCHIVE_FILTER_STATE);

  const toggleCompare = (readingId: string) => {
    setCompareError('');
    setCompareIds((current) => {
      if (current.includes(readingId)) return current.filter((id) => id !== readingId);
      if (current.length === 0) return [readingId];
      const left = readings.find((reading) => reading.id === current[0]);
      const right = readings.find((reading) => reading.id === readingId);
      if (!left || !right) return [readingId];
      const result = compareArchiveReadings(left, right);
      if (!result.allowed) {
        setCompareError(result.reason ?? UI_STATE_COPY.failure.body);
        return current;
      }
      return [current[0], readingId];
    });
  };

  const startFeedback = (readingId: string) => {
    setFeedbackTargetId((current) => current === readingId ? null : readingId);
    setEditingFeedbackId(null);
    setFeedbackStatus('not-yet');
    setFeedbackObservedAt(todayShanghai());
    setFeedbackNote('');
    setFeedbackLinkedInterpretationId(undefined);
    setFeedbackLinkedEvidenceIds([]);
    setFeedbackUnresolvedInterpretationIds([]);
    setFeedbackUnresolvedEvidenceIds([]);
    setFeedbackError('');
  };

  const selectFeedbackInterpretation = (readingId: string, interpretationId?: string) => {
    const reading = readings.find((item) => item.id === readingId);
    const option = reading ? listFeedbackLinkOptions(reading).find((item) => item.id === interpretationId) : undefined;
    setFeedbackLinkedInterpretationId(option?.id);
    setFeedbackLinkedEvidenceIds([]);
    setFeedbackUnresolvedInterpretationIds([]);
    setFeedbackUnresolvedEvidenceIds([]);
  };

  const toggleFeedbackEvidence = (evidenceId: string) => {
    setFeedbackLinkedEvidenceIds((current) => current.includes(evidenceId) ? current.filter((id) => id !== evidenceId) : [...current, evidenceId]);
  };

  const startEditFeedback = (readingId: string, feedback: ReadingFeedback) => {
    setFeedbackTargetId(readingId);
    setEditingFeedbackId(feedback.id);
    setFeedbackStatus(feedback.status);
    setFeedbackObservedAt(feedback.observedAt);
    setFeedbackNote(feedback.note);
    const reading = readings.find((item) => item.id === readingId);
    const selection = reading
      ? resolveFeedbackLinkSelection(reading, feedback)
      : {
          evidenceIds: [],
          unresolvedInterpretationIds: feedback.linkedInterpretationIds ?? [],
          unresolvedEvidenceIds: feedback.linkedEvidenceIds ?? [],
        };
    setFeedbackLinkedInterpretationId(selection.interpretationId);
    setFeedbackLinkedEvidenceIds(selection.evidenceIds);
    setFeedbackUnresolvedInterpretationIds(selection.unresolvedInterpretationIds);
    setFeedbackUnresolvedEvidenceIds(selection.unresolvedEvidenceIds);
    setFeedbackError('');
  };

  const submitFeedback = async (readingId: string) => {
    try {
      const input = {
        status: feedbackStatus,
        observedAt: feedbackObservedAt,
        note: feedbackNote,
        ...serializeFeedbackLinkSelection({
          ...(feedbackLinkedInterpretationId ? { interpretationId: feedbackLinkedInterpretationId } : {}),
          evidenceIds: feedbackLinkedEvidenceIds,
          unresolvedInterpretationIds: feedbackUnresolvedInterpretationIds,
          unresolvedEvidenceIds: feedbackUnresolvedEvidenceIds,
        }),
      };
      if (editingFeedbackId) await updateFeedback(readingId, editingFeedbackId, input);
      else await addFeedback(readingId, input);
      setFeedbackTargetId(null);
      setEditingFeedbackId(null);
      setFeedbackNote('');
      setFeedbackLinkedInterpretationId(undefined);
      setFeedbackLinkedEvidenceIds([]);
      setFeedbackUnresolvedInterpretationIds([]);
      setFeedbackUnresolvedEvidenceIds([]);
      setFeedbackError('');
    } catch (operationError) {
      setFeedbackError(operationError instanceof Error ? operationError.message : UI_STATE_COPY.failure.body);
    }
  };

  const runBaziDiff = (readingId: string) => {
    const reading = readings.find((item) => item.id === readingId);
    if (!reading || reading.module !== 'bazi') return;
    if (reading.payload.module !== 'bazi') {
      setDiffError('这条记录的八字载荷不完整，无法安全复核。');
      return;
    }
    if (!reading.interpretationSnapshot || !reading.evidenceGraphSnapshot) {
      setDiffError('这条历史记录缺少可复核的解释或证据快照；不会补造历史结果。');
      return;
    }
    const input = reading.inputSnapshot;
    if (input.type !== 'birth') {
      setDiffError('这条记录缺少可复核的出生输入快照。');
      return;
    }
    const profile = reading.profileSnapshot ?? profiles.find((item) => item.id === reading.profileId);
    if (!profile) {
      setDiffError('这条记录缺少保存的命主快照，无法安全复核。');
      return;
    }
    try {
      const replay = buildBaziCurrentRuleReplay(profile, input, reading.payload.calculationSettings);
      const current = calculateBaziView(replay.profile, replay.profile.gender, {
        timezone: replay.settings.timezone,
        bazi: replay.settings,
      });
      const oldStrength = reading.evidenceGraphSnapshot.strengthAssessment;
      const diff = diffBaziInterpretations(
        reading.interpretationSnapshot,
        current.interpretation,
        oldStrength ? { status: oldStrength.status, confidence: oldStrength.confidence } : undefined,
        { status: current.strengthAssessment.status, confidence: current.strengthAssessment.confidence },
      );
      setDiffByReadingId((currentDiffs) => ({ ...currentDiffs, [readingId]: diff }));
      setDiffError('');
    } catch (operationError) {
      setDiffError(operationError instanceof Error ? operationError.message : UI_STATE_COPY.failure.body);
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
    <SafeAreaView style={styles.safeArea} testID="records-screen">
      <Atmosphere focus="bottom" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>LOCAL ARCHIVE</Text>
              <Text accessibilityRole="header" style={styles.title}>观象记录</Text>
            </View>
            <View style={styles.headerActions}>
              {readings.length > 0 && (
                <Pressable accessibilityHint="切换是否只显示已收藏的记录。" accessibilityLabel={archiveFilter.favoritesOnly ? '显示全部观象记录' : '只看收藏记录'} accessibilityRole="checkbox" accessibilityState={{ checked: archiveFilter.favoritesOnly }} onPress={() => updateArchiveFilter({ favoritesOnly: !archiveFilter.favoritesOnly })} style={({ pressed }) => [styles.filterButton, archiveFilter.favoritesOnly && styles.filterButtonActive, pressed && styles.pressed]}>
                  <Text style={styles.filterButtonText}>{archiveFilter.favoritesOnly ? '全部记录' : '只看收藏'}</Text>
                </Pressable>
              )}
              {readings.length > 0 && (
                <Pressable accessibilityHint="删除本机保存的全部排盘记录，操作无法撤销。" accessibilityLabel="清空全部观象记录" accessibilityRole="button" disabled={recordsReadOnly} onPress={confirmClear} style={({ pressed }) => [styles.clearButton, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                  <Text style={styles.clearButtonText}>{recordsReadOnly ? '记录只读' : '清空记录'}</Text>
                </Pressable>
              )}
            </View>
          </View>
          <Text style={styles.description}>每次排盘都会保存算法版本、基础观察和边界说明，方便之后按事实反馈复盘。</Text>
        </View>
        {recordsReadOnly && (
            <View accessibilityLabel={UI_STATE_COPY.blocked.announcement} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyTitle}>记录数据只读</Text>
            <Text style={styles.readOnlyText}>这份数据由更新版本写入，当前版本不会覆盖它。请先升级应用后再删除或清空。</Text>
          </View>
        )}
        {readings.length > 0 && <ArchiveFilterBar filter={archiveFilter} profiles={profiles} onChange={updateArchiveFilter} onClear={clearArchiveFilter} />}
        {compareIds.length > 0 && (
          <View style={styles.comparePanel}>
            <View style={styles.compareHeader}>
              <View>
                <Text style={styles.compareTitle}>只读对比</Text>
                <Text style={styles.compareHint}>{compareIds.length === 1 ? '再选择一条同命主、同模块记录' : '不会重算，也不会创建新记录'}</Text>
              </View>
              <Pressable accessibilityLabel="清除对比选择" accessibilityRole="button" onPress={() => { setCompareIds([]); setCompareError(''); }} style={({ pressed }) => [styles.compareClear, pressed && styles.pressed]}>
                <Text style={styles.compareClearText}>清除</Text>
              </Pressable>
            </View>
            {!!compareError && <Text accessibilityLabel={`错误：${compareError}`} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.compareError}>{compareError}</Text>}
            {compareResult?.allowed && (
              <View style={styles.compareFields}>
                {compareResult.fields.length === 0 ? (
                  <Text style={styles.compareEmpty}>两条记录的可比字段一致。</Text>
                ) : compareResult.fields.map((field) => (
                  <View key={field.key} style={styles.compareRow}>
                    <Text style={styles.compareLabel}>{field.label}</Text>
                    <View style={styles.compareValueColumn}>
                      <Text style={styles.compareOld}>{field.oldValue}</Text>
                      <Text style={styles.compareNew}>{field.newValue}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        {readings.length === 0 || visibleReadings.length === 0 ? (
          <View accessibilityLabel={`${UI_STATE_COPY.empty.announcement} ${readings.length === 0 ? '完成一次排盘后，结果会留在本机记录中。' : '可以清除筛选后重新查看。'}`} accessibilityRole="text" style={styles.empty}>
            <MaterialCommunityIcons accessibilityElementsHidden color={palette.brass} importantForAccessibility="no-hide-descendants" name="archive-clock-outline" size={34} />
            <Text style={styles.emptyTitle}>{readings.length === 0 ? '还没有排盘记录' : '没有符合筛选的记录'}</Text>
            <Text style={styles.emptyText}>{readings.length === 0 ? '从首页进入任一体系完成排盘后，结果会自动保存在这里。' : '试试清除筛选，或换一个关键词、时间范围和反馈状态。'}</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {readingGroups.map((group, groupIndex) => (
              <View key={group.key} style={styles.group}>
                {!!group.label && <Text accessibilityRole="header" style={styles.groupLabel}>{group.label}</Text>}
                {group.readings.map((reading, index) => {
                  const module = moduleBySlug[reading.module];
                  const expanded = reading.id === expandedId;
                  const feedbackList = reading.feedback ?? [];
                  const feedbackLinkOptions = listFeedbackLinkOptions(reading);
                  const selectedFeedbackLink = feedbackLinkOptions.find((option) => option.id === feedbackLinkedInterpretationId);
                  const compareSelected = compareIds.includes(reading.id);
                  return (
                    <AnimatedReveal delay={Math.min(groupIndex * 3 + index, 6) * 55} key={reading.id}>
                      <View style={[styles.card, expanded && styles.cardExpanded]}>
                        <View style={styles.cardHeader}>
                          <Pressable
                            accessibilityHint="查看或收起这条记录的输入、结果、解释和复盘反馈。"
                            accessibilityLabel={`${expanded ? '收起' : '展开'}${reading.title}排盘记录`}
                            accessibilityRole="button"
                            accessibilityState={{ expanded }}
                            onPress={() => setExpandedId(expanded ? null : reading.id)}
                            style={({ pressed }) => [styles.cardHeaderMain, pressed && styles.pressed]}>
                            <View style={[styles.moduleMark, { borderColor: module.accent }]}><Text style={[styles.moduleGlyph, { color: module.accent }]}>{module.glyph}</Text></View>
                            <View style={styles.cardCopy}>
                              <View style={styles.cardTop}><Text style={styles.moduleName}>{module.title} · {reading.profileName}</Text><Text style={styles.date}>{new Date(reading.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text></View>
                              <Text style={styles.cardTitle}>{reading.title}</Text>
                              <Text style={styles.cardSummary}>{reading.summary}</Text>
                            </View>
                            <MaterialCommunityIcons accessibilityElementsHidden color={palette.ashGreen} importantForAccessibility="no-hide-descendants" name={expanded ? 'chevron-up' : 'chevron-down'} size={20} />
                          </Pressable>
                          <Pressable accessibilityHint="选择两条同命主、同模块记录进行只读对比。" accessibilityLabel={compareSelected ? `取消对比${reading.title}` : `选择${reading.title}进行对比`} accessibilityRole="checkbox" accessibilityState={{ checked: compareSelected }} onPress={() => toggleCompare(reading.id)} style={({ pressed }) => [styles.compareToggle, compareSelected && styles.compareToggleActive, pressed && styles.pressed]}><Text style={[styles.compareToggleText, compareSelected && styles.compareToggleTextActive]}>{compareSelected ? '已选' : '对比'}</Text></Pressable>
                        </View>
                        {expanded && (
                          <View style={styles.detail}>
                            <SnapshotViewer reading={reading} diff={diffByReadingId[reading.id]} onRunBaziDiff={runBaziDiff} />
                            {!!diffError && <Text accessibilityRole="alert" style={styles.feedbackError}>{diffError}</Text>}
                            <View style={styles.detailActions}>
                              <Pressable accessibilityHint="切换这条记录是否出现在收藏筛选中。" accessibilityLabel={reading.favorite ? `取消收藏${reading.title}` : `收藏${reading.title}`} accessibilityRole="checkbox" accessibilityState={{ checked: reading.favorite }} disabled={recordsReadOnly} onPress={() => void toggleFavorite(reading.id)} style={({ pressed }) => [styles.favoriteButton, reading.favorite && styles.favoriteButtonActive, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                                <MaterialCommunityIcons accessibilityElementsHidden color={reading.favorite ? palette.brass : palette.ashGreen} importantForAccessibility="no-hide-descendants" name={reading.favorite ? 'star' : 'star-outline'} size={16} />
                                <Text style={[styles.favoriteButtonText, reading.favorite && styles.favoriteButtonTextActive]}>{reading.favorite ? '已收藏' : '收藏'}</Text>
                              </Pressable>
                              <Pressable accessibilityHint="展开或收起事实反馈表单；反馈只记录现实发生的事情。" accessibilityLabel={`给${reading.title}添加事实反馈`} accessibilityRole="button" accessibilityState={{ expanded: feedbackTargetId === reading.id }} disabled={recordsReadOnly} onPress={() => startFeedback(reading.id)} style={({ pressed }) => [styles.feedbackButton, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                                <Text style={styles.feedbackButtonText}>{feedbackTargetId === reading.id ? '收起反馈' : '添加反馈'}</Text>
                              </Pressable>
                            </View>
                            <View accessibilityLabel={`${reading.title}的事实反馈`} style={styles.feedbackPanel}>
                              <View style={styles.feedbackHeader}>
                                <Text accessibilityRole="header" style={styles.feedbackTitle}>事实反馈</Text>
                                <Text style={styles.feedbackCount}>{feedbackList.length} 条</Text>
                              </View>
                              <Text style={styles.feedbackHint}>以日为最小粒度；事实不明确时，保留具体说明，不强行归因。</Text>
                              {feedbackList.length === 0 ? (
                                <Text accessibilityRole="text" style={styles.feedbackEmpty}>还没有反馈。等事情发生后，再回来记录“发生了什么”。</Text>
                              ) : (
                                feedbackList.map((feedback) => (
                                  <View key={feedback.id} style={styles.feedbackItem}>
                                    <View style={styles.feedbackItemTop}>
                                      <Text style={styles.feedbackStatus}>{feedbackStatusOptions.find((option) => option.value === feedback.status)?.label ?? feedback.status}</Text>
                                      <Text style={styles.feedbackDate}>{feedback.observedAt}</Text>
                                      {!!feedback.updatedAt && <Text style={styles.feedbackUpdated}>更新 {feedback.updatedAt.slice(0, 10)}</Text>}
                                      <Pressable accessibilityLabel="编辑这条事实反馈" accessibilityRole="button" disabled={recordsReadOnly} onPress={() => startEditFeedback(reading.id, feedback)} style={({ pressed }) => [styles.feedbackEdit, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                                        <Text style={styles.feedbackEditText}>编辑</Text>
                                      </Pressable>
                                      <Pressable accessibilityLabel="删除这条事实反馈" accessibilityRole="button" disabled={recordsReadOnly} onPress={() => confirmDeleteFeedback(reading.id, feedback.id)} style={({ pressed }) => [styles.feedbackDelete, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                                        <Text style={styles.feedbackDeleteText}>删除</Text>
                                      </Pressable>
                                    </View>
                                    <Text style={styles.feedbackNote}>{feedback.note}</Text>
                                    {feedbackLinkSummary(reading, feedback).map((summary) => <Text key={summary} style={styles.feedbackLinks}>用户复盘标记 · {summary}</Text>)}
                                  </View>
                                ))
                              )}
                              {feedbackTargetId === reading.id && (
                                <View style={styles.feedbackForm}>
                                  <Text accessibilityRole="header" style={styles.feedbackFormLabel}>{editingFeedbackId ? '修改这条事实反馈' : '这次反馈的状态'}</Text>
                                  <View accessibilityLabel="事实反馈状态" accessibilityRole="radiogroup" style={styles.statusOptions}>
                                    {feedbackStatusOptions.map((option) => (
                                      <Pressable accessibilityHint="选择本次事实反馈的记录状态。" accessibilityLabel={`反馈状态${option.label}`} accessibilityRole="radio" accessibilityState={{ selected: feedbackStatus === option.value }} key={option.value} onPress={() => setFeedbackStatus(option.value)} style={({ pressed }) => [styles.statusOption, feedbackStatus === option.value && styles.statusOptionActive, pressed && styles.pressed]}>
                                        <Text style={[styles.statusOptionText, feedbackStatus === option.value && styles.statusOptionTextActive]}>{option.label}</Text>
                                      </Pressable>
                                    ))}
                                  </View>
                                  <TextInput accessibilityLabel="反馈发生日期" onChangeText={setFeedbackObservedAt} placeholder="发生日期 YYYY-MM-DD" placeholderTextColor="#65736D" style={styles.feedbackInput} value={feedbackObservedAt} />
                                  <TextInput accessibilityLabel="反馈事实说明" multiline onChangeText={setFeedbackNote} placeholder="记录可核对的事实，例如：哪一天、发生了什么、与盘面哪条观察有关" placeholderTextColor="#65736D" style={[styles.feedbackInput, styles.feedbackNoteInput]} textAlignVertical="top" value={feedbackNote} />
                                  <Text style={styles.feedbackLinkHint}>选择一张具体解读卡，再从它引用的依据中选择可核对事实；默认不关联。关联只是用户复盘标记，不是系统证明。</Text>
                                  <View accessibilityLabel="选择要复盘的解读卡片" accessibilityRole="radiogroup" style={styles.feedbackLinkOptions}>
                                    <Pressable accessibilityLabel="不关联解读" accessibilityRole="radio" accessibilityState={{ selected: !feedbackLinkedInterpretationId }} onPress={() => selectFeedbackInterpretation(reading.id)} style={({ pressed }) => [styles.feedbackLinkOption, !feedbackLinkedInterpretationId && styles.feedbackLinkOptionActive, pressed && styles.pressed]}>
                                      <Text style={[styles.feedbackLinkOptionTitle, !feedbackLinkedInterpretationId && styles.feedbackLinkOptionTitleActive]}>不关联</Text>
                                      <Text style={styles.feedbackLinkOptionSummary}>只记录现实事实</Text>
                                    </Pressable>
                                    {feedbackLinkOptions.map((option) => (
                                      <Pressable accessibilityHint="选择这张解读卡片后，再决定是否关联它的依据。" accessibilityLabel={`解读卡片：${option.title}`} accessibilityRole="radio" accessibilityState={{ selected: feedbackLinkedInterpretationId === option.id }} key={option.id} onPress={() => selectFeedbackInterpretation(reading.id, option.id)} style={({ pressed }) => [styles.feedbackLinkOption, feedbackLinkedInterpretationId === option.id && styles.feedbackLinkOptionActive, pressed && styles.pressed]}>
                                        <Text style={[styles.feedbackLinkOptionTitle, feedbackLinkedInterpretationId === option.id && styles.feedbackLinkOptionTitleActive]}>{option.title}</Text>
                                        <Text style={styles.feedbackLinkOptionSummary}>{option.summary}</Text>
                                      </Pressable>
                                    ))}
                                  </View>
                                  {!!selectedFeedbackLink && selectedFeedbackLink.evidence.length > 0 && (
                                    <View accessibilityLabel="选择要复盘的依据" style={styles.feedbackEvidenceOptions}>
                                      <Text style={styles.feedbackEvidenceLabel}>这张解读引用的依据（可多选）</Text>
                                      {selectedFeedbackLink.evidence.map((evidence) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: feedbackLinkedEvidenceIds.includes(evidence.id) }} accessibilityLabel={`依据：${evidence.label}`} key={evidence.id} onPress={() => toggleFeedbackEvidence(evidence.id)} style={({ pressed }) => [styles.feedbackEvidenceOption, feedbackLinkedEvidenceIds.includes(evidence.id) && styles.feedbackEvidenceOptionActive, pressed && styles.pressed]}><Text style={styles.feedbackEvidenceText}>{feedbackLinkedEvidenceIds.includes(evidence.id) ? '✓ ' : ''}{evidence.label}</Text></Pressable>)}
                                    </View>
                                  )}
                                  {(feedbackUnresolvedInterpretationIds.length > 0 || feedbackUnresolvedEvidenceIds.length > 0) && <Text style={styles.feedbackLinkHint}>这条历史反馈含有当前版本无法显示的旧关联；保存时会保留原始关联，点击“不关联”才会解除。</Text>}
                                  {!!feedbackError && <Text accessibilityLabel={`错误：${feedbackError}`} accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.feedbackError}>{feedbackError}</Text>}
                                  <ActionButton accessibilityLabel="保存这次事实反馈" disabled={recordsReadOnly} onPress={() => void submitFeedback(reading.id)} style={styles.feedbackSaveButton} variant="secondary">{editingFeedbackId ? '保存修改' : '保存反馈'}</ActionButton>
                                </View>
                              )}
                            </View>
                            <Pressable accessibilityHint="删除这条本机排盘记录，操作无法撤销。" accessibilityLabel={`删除${reading.title}记录`} accessibilityRole="button" disabled={recordsReadOnly} onPress={() => confirmDelete(reading.id, reading.title)} style={({ pressed }) => [styles.deleteButton, recordsReadOnly && styles.disabled, pressed && styles.pressed]}>
                              <Text style={styles.deleteButtonText}>删除这条记录</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </AnimatedReveal>
                  );
                })}
              </View>
            ))}
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
  comparePanel: { marginTop: spacing.x4, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.card, backgroundColor: 'rgba(16,42,33,0.72)', padding: spacing.x4 },
  compareHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.x3 },
  compareTitle: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 16 },
  compareHint: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  compareClear: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  compareClearText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  compareError: { marginTop: spacing.x3, color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  compareFields: { marginTop: spacing.x3, borderTopWidth: 1, borderColor: palette.hairline },
  compareEmpty: { marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  compareRow: { flexDirection: 'row', gap: spacing.x3, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x2 },
  compareLabel: { width: 74, color: palette.patina, fontFamily: fontFamilies.body, fontSize: 10 },
  compareValueColumn: { flex: 1, gap: spacing.x1 },
  compareOld: { color: '#C9A58E', fontFamily: fontFamilies.body, fontSize: 11 },
  compareNew: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 11 },
  readOnlyBanner: { marginTop: spacing.x5, borderWidth: 1, borderColor: 'rgba(216, 137, 120, 0.48)', borderRadius: radii.card, backgroundColor: 'rgba(120, 48, 36, 0.14)', padding: spacing.x4 },
  readOnlyTitle: { color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 13, fontWeight: '600' },
  readOnlyText: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  empty: { marginTop: spacing.x8, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: palette.hairline, borderRadius: radii.panel, padding: spacing.x10 },
  emptyTitle: { marginTop: spacing.x3, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 20 },
  emptyText: { maxWidth: 380, marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20, textAlign: 'center' },
  list: { marginTop: spacing.x6, gap: spacing.x4 },
  group: { gap: spacing.x3 },
  groupLabel: { color: palette.brass, fontFamily: fontFamilies.display, fontSize: 15, letterSpacing: 1 },
  card: { borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.card, backgroundColor: 'rgba(8,26,22,0.88)', overflow: 'hidden' },
  cardExpanded: { borderColor: palette.hairlineStrong },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x2, padding: spacing.x4 },
  cardHeaderMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3 },
  moduleMark: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 22, backgroundColor: palette.obsidian },
  moduleGlyph: { fontFamily: fontFamilies.display, fontSize: 16 },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  moduleName: { flex: 1, color: palette.brass, fontFamily: fontFamilies.body, fontSize: 10 },
  date: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 9 },
  compareToggle: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  compareToggleActive: { borderColor: palette.hairlineStrong, backgroundColor: palette.brassGlow },
  compareToggleText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 9 },
  compareToggleTextActive: { color: palette.paleBrass },
  cardTitle: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 18 },
  cardSummary: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  detail: { marginTop: spacing.x4, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x2 },
  detailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x4 },
  favoriteButton: { minHeight: layout.minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.x1, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  favoriteButtonActive: { borderColor: palette.hairlineStrong, backgroundColor: palette.brassGlow },
  favoriteButtonText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  favoriteButtonTextActive: { color: palette.paleBrass },
  feedbackButton: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
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
  feedbackUpdated: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9 },
  feedbackEdit: { minHeight: layout.minTouch, marginLeft: 'auto', justifyContent: 'center', paddingHorizontal: spacing.x3 },
  feedbackEditText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 10 },
  feedbackDelete: { minHeight: layout.minTouch, marginLeft: 'auto', justifyContent: 'center', paddingHorizontal: spacing.x3 },
  feedbackDeleteText: { color: '#C89283', fontFamily: fontFamilies.body, fontSize: 10 },
  feedbackNote: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  feedbackLinks: { marginTop: spacing.x1, color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9, lineHeight: 15 },
  feedbackForm: { marginTop: spacing.x4, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x3 },
  feedbackFormLabel: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11 },
  feedbackLinkHint: { marginTop: spacing.x2, color: palette.patina, fontFamily: fontFamilies.body, fontSize: 9, lineHeight: 15 },
  feedbackLinkOptions: { marginTop: spacing.x2, gap: spacing.x2 },
  feedbackLinkOption: { minHeight: layout.minTouch, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: spacing.x2 },
  feedbackLinkOptionActive: { borderColor: palette.hairlineStrong, backgroundColor: palette.brassGlow },
  feedbackLinkOptionTitle: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  feedbackLinkOptionTitleActive: { color: palette.paleBrass },
  feedbackLinkOptionSummary: { marginTop: spacing.x1, color: palette.patina, fontFamily: fontFamilies.body, fontSize: 9, lineHeight: 15 },
  feedbackEvidenceOptions: { marginTop: spacing.x3, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x2, gap: spacing.x1 },
  feedbackEvidenceLabel: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  feedbackEvidenceOption: { minHeight: layout.minTouch, justifyContent: 'center', paddingHorizontal: spacing.x2, borderRadius: radii.input },
  feedbackEvidenceOptionActive: { backgroundColor: 'rgba(183,155,101,0.14)' },
  feedbackEvidenceText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x2 },
  statusOption: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  statusOptionActive: { borderColor: palette.hairlineStrong, backgroundColor: palette.jadeGlow },
  statusOptionText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  statusOptionTextActive: { color: palette.paleBrass },
  feedbackInput: { minHeight: layout.minTouch, marginTop: spacing.x2, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 12, paddingHorizontal: spacing.x3, paddingVertical: spacing.x2 },
  feedbackNoteInput: { minHeight: 86, paddingTop: spacing.x3 },
  feedbackError: { marginTop: spacing.x2, color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16 },
  feedbackSaveButton: { marginTop: spacing.x3 },
  deleteButton: { minHeight: layout.minTouch, alignSelf: 'flex-start', marginTop: spacing.x3, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(216, 137, 120, 0.42)', borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  deleteButtonText: { color: '#E4A89A', fontFamily: fontFamilies.body, fontSize: 11 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.72 },
});
