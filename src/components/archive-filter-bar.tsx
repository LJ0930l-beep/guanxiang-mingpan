import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { divinationModules } from '@/data/modules';
import type { ArchiveDateRange, ArchiveFilterState, ArchiveGroupBy } from '@/domains/archive/query';
import type { BirthProfile, DivinationModule, ReadingFeedbackStatus } from '@/types/domain';

const feedbackFilters: { value: ReadingFeedbackStatus; label: string }[] = [
  { value: 'confirmed', label: '已发生' },
  { value: 'partial', label: '部分符合' },
  { value: 'not-yet', label: '尚未验证' },
  { value: 'contradicted', label: '相反' },
];

interface ArchiveFilterBarProps {
  filter: ArchiveFilterState;
  profiles: BirthProfile[];
  onChange: (patch: Partial<ArchiveFilterState>) => void;
  onClear: () => void;
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function Chip({
  active,
  label,
  onPress,
  accessibilityLabel,
  selectionMode = 'multiple',
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  selectionMode?: 'action' | 'multiple' | 'single';
}) {
  const isAction = selectionMode === 'action';
  const isSingle = selectionMode === 'single';

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={isAction ? '清除当前筛选条件' : isSingle ? (active ? '当前选项' : '选择此选项') : (active ? '取消此筛选' : '加入此筛选')}
      accessibilityRole={isAction ? 'button' : isSingle ? 'radio' : 'checkbox'}
      accessibilityState={isAction ? undefined : isSingle ? { selected: active } : { checked: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ArchiveFilterBar({ filter, profiles, onChange, onClear }: ArchiveFilterBarProps) {
  const hasFilters = Boolean(filter.query.trim())
    || filter.modules.length > 0
    || filter.profileIds.length > 0
    || filter.favoritesOnly
    || filter.feedbackStatuses.length > 0
    || filter.dateRange !== 'all'
    || filter.groupBy !== 'none';
  const setDateRange = (dateRange: ArchiveDateRange) => onChange({ dateRange });
  const setGroupBy = (groupBy: ArchiveGroupBy) => onChange({ groupBy });
  const toggleModule = (module: DivinationModule) => onChange({ modules: toggleValue(filter.modules, module) });
  const toggleProfile = (profileId: string) => onChange({ profileIds: toggleValue(filter.profileIds, profileId) });
  const toggleFeedback = (status: ReadingFeedbackStatus) => onChange({ feedbackStatuses: toggleValue(filter.feedbackStatuses, status) });

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          accessibilityLabel="搜索记录"
          autoCapitalize="none"
          clearButtonMode="while-editing"
          onChangeText={(query) => onChange({ query })}
          placeholder="搜索命主、标题、问题或摘要"
          placeholderTextColor="#65736D"
          style={styles.searchInput}
          value={filter.query}
        />
        {hasFilters && <Chip label="清除筛选" onPress={onClear} active={false} selectionMode="action" />}
      </View>
      <Text style={styles.filterLabel}>模块</Text>
      <View style={styles.chipRow}>
        {divinationModules.map((module) => (
          <Chip key={module.slug} active={filter.modules.includes(module.slug)} label={module.title} onPress={() => toggleModule(module.slug)} />
        ))}
      </View>
      {profiles.length > 0 && (
        <>
          <Text style={styles.filterLabel}>命主</Text>
          <View style={styles.chipRow}>
            {profiles.map((profile) => (
              <Chip key={profile.id} active={filter.profileIds.includes(profile.id)} label={profile.name} onPress={() => toggleProfile(profile.id)} />
            ))}
          </View>
        </>
      )}
      <View style={styles.filterLine}>
        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>时间</Text>
          <View style={styles.chipRow}>
            {(['7d', '30d', 'all'] as ArchiveDateRange[]).map((range) => (
              <Chip key={range} active={filter.dateRange === range} label={range === 'all' ? '全部' : `近 ${range.slice(0, -1)} 天`} onPress={() => setDateRange(range)} selectionMode="single" />
            ))}
          </View>
        </View>
        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>分组</Text>
          <View style={styles.chipRow}>
            {(['none', 'profile', 'date'] as ArchiveGroupBy[]).map((groupBy) => (
              <Chip key={groupBy} active={filter.groupBy === groupBy} label={groupBy === 'none' ? '不分组' : groupBy === 'profile' ? '按命主' : '按日期'} onPress={() => setGroupBy(groupBy)} selectionMode="single" />
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.filterLabel}>反馈</Text>
      <View style={styles.chipRow}>
        {feedbackFilters.map((feedback) => (
          <Chip key={feedback.value} active={filter.feedbackStatuses.includes(feedback.value)} label={feedback.label} onPress={() => toggleFeedback(feedback.value)} />
        ))}
        <Chip active={filter.favoritesOnly} label="只看收藏" onPress={() => onChange({ favoritesOnly: !filter.favoritesOnly })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.x5, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.card, backgroundColor: 'rgba(8,26,22,0.66)', padding: spacing.x3 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  searchInput: { flex: 1, minHeight: layout.minTouch, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 12, paddingHorizontal: spacing.x3 },
  filterLine: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x4 },
  filterColumn: { minWidth: 210, flex: 1 },
  filterLabel: { marginTop: spacing.x3, marginBottom: spacing.x1, color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9, letterSpacing: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x1 },
  chip: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  chipActive: { borderColor: palette.hairlineStrong, backgroundColor: palette.brassGlow },
  chipText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  chipTextActive: { color: palette.paleBrass },
  pressed: { opacity: 0.72 },
});
