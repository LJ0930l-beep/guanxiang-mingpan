import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ExplanationLayer } from '@/components/explanation-layer';
import type { BaziInterpretationDiff } from '@/domains/bazi/interpretation/history';
import { buildBaziTrueSolarEvidenceDisplay } from '@/domains/bazi/true-solar-presentation';
import { listGlossaryTerms } from '@/domains/explanation/glossary';
import { buildSnapshotViewerModel } from '@/domains/archive/types';
import { fontFamilies, palette, radii, spacing } from '@/constants/guanxiang';
import type { SavedReading } from '@/types/domain';

interface SnapshotViewerProps {
  reading: SavedReading;
  diff?: BaziInterpretationDiff;
  onRunBaziDiff?: (readingId: string) => void;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '未记录'}</Text>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function inputRows(model: ReturnType<typeof buildSnapshotViewerModel>) {
  const input = model.inputSnapshot;
  if (input.type === 'birth') {
    return [
      ['命主', model.archive.profileSnapshot?.name ?? model.archive.reading.profileName],
      ['出生日期', input.birthDate],
      ['出生时辰', input.birthTime ?? '未知时辰'],
      ['出生地点', input.birthCity],
      ['历法', input.calendar === 'lunar' ? '农历' : '公历'],
      ['业务时区', input.timezone],
    ] as const;
  }
  if (input.type === 'liuyao') {
    return [
      ['问题', input.question],
      ['用神目标', input.target],
      ['固定种子', input.seed],
      ['起卦日期', input.date],
      ['种子范围', input.seedScope],
      ['业务时区', input.timezone],
    ] as const;
  }
  return [
    ['模块', input.module],
    ['历史原因', input.reason],
    ['业务时区', input.timezone],
  ] as const;
}

function calculationRows(model: ReturnType<typeof buildSnapshotViewerModel>) {
  if (model.payload.module !== 'bazi') return [['业务时区', model.calculationSnapshot.calculationSettings.timezone] as const];
  const settings = model.payload.calculationSettings;
  const display = buildBaziTrueSolarEvidenceDisplay(settings, model.payload.calculationEvidence);
  const rows: (readonly [string, string])[] = [
    ['业务时区', settings.timezone],
    ['日界线', settings.dayBoundary === 'ziEarly' ? '子初换日' : '午夜换日'],
    ['真太阳时', settings.trueSolarTime ? `启用 · ${settings.solarTimeModel}` : '未启用'],
    ['城市数据', settings.locationDatasetVersion],
    ['历法解析', settings.calendarResolverVersion],
    ...display.rows,
  ];
  if (display.conflictMessage) rows.push(['一致性提示', display.conflictMessage]);
  return rows;
}

function resultRows(model: ReturnType<typeof buildSnapshotViewerModel>) {
  const payload = model.payload;
  const rows: (readonly [string, string])[] = [];
  if (payload.module === 'bazi') {
    rows.push(['日主', payload.dayMaster ?? '未记录'], ['关系', payload.relations?.length ? payload.relations.join('；') : '未检出重点关系']);
  } else if (payload.module === 'liuyao') {
    rows.push(['卦名', payload.changedHexagramName ? `${payload.hexagramName} → ${payload.changedHexagramName}` : payload.hexagramName], ['问题', payload.question]);
  } else if (payload.module === 'ziwei') {
    rows.push(['命宫 / 身宫', `${payload.soul} / ${payload.body}`], ['五行局', payload.fiveElement]);
  } else {
    rows.push(['太阳', payload.sunSign], ['月亮', payload.moonSign ?? '未记录'], ['上升', payload.ascendant ?? '未知时辰或地点']);
  }
  return rows;
}

export function SnapshotViewer({ reading, diff, onRunBaziDiff }: SnapshotViewerProps) {
  const model = buildSnapshotViewerModel(reading);
  const deep = model.archive.deepSnapshot;
  const focus = Array.isArray(reading.payload.focus) ? reading.payload.focus : [];
  return (
    <View style={styles.viewer}>
      <Section label="L1 · 记录摘要">
        <Row label="档案标题" value={reading.title} />
        <Row label="创建时间" value={formatDate(reading.createdAt)} />
        <Row label="收藏状态" value={reading.favorite ? '已收藏' : '未收藏'} />
        <Row label="基础摘要" value={reading.summary} />
      </Section>

      <Section label="L2 · 当时输入与计算设置">
        {inputRows(model).map(([label, value]) => <Row key={label} label={label} value={value} />)}
        <View style={styles.subsection}><Text style={styles.subsectionLabel}>计算设置</Text></View>
        {calculationRows(model).map(([label, value]) => <Row key={label} label={label} value={value} />)}
        <View style={styles.versionStrip}>
          <Text style={styles.versionText}>算法 {reading.engineVersion}</Text>
          <Text style={styles.versionText}>解释 {reading.interpretationVersion}</Text>
          <Text style={styles.versionText}>快照 v{reading.snapshotMeta.snapshotVersion}</Text>
          <Text style={styles.versionText}>档案 {model.archive.archiveVersion}</Text>
        </View>
      </Section>

      <Section label="L3 · 保存时结果">
        {resultRows(model).map(([label, value]) => <Row key={label} label={label} value={value} />)}
        <View style={styles.subsection}><Text style={styles.subsectionLabel}>基础观察</Text></View>
        {focus.map((item, index) => <Text key={`${item}-${index}`} style={styles.observation}>{index + 1}. {item}</Text>)}
      </Section>

      <Section label="L4 · 保存时解释快照">
        {model.explanationSnapshot ? (
          <ExplanationLayer
            snapshot={model.explanationSnapshot}
            evidenceNodes={(() => {
              const graph = model.payload.module === 'bazi' || model.payload.module === 'liuyao' || model.payload.module === 'ziwei' || model.payload.module === 'astrology'
                ? (model.payload as typeof model.payload & { evidenceGraph?: { nodes?: { id: string; label: string; facts?: Record<string, unknown>; ruleVersion?: string; source?: string }[] } }).evidenceGraph
                : undefined;
              return graph?.nodes ?? [];
            })()}
            glossaryTerms={listGlossaryTerms(reading.module)}
          />
        ) : (
          <Text style={styles.missing}>历史版本未保存解释快照；本次查看不会补造或静默重算。</Text>
        )}
      </Section>

      {reading.module === 'bazi' && (
        <Section label="L4 · 八字 Phase 2 深度快照">
          {deep ? (
            <>
              <Row label="解释版本" value={deep.interpretation.interpretationVersion} />
              <Row label="强弱证据" value={`${deep.evidenceGraph.strengthAssessment?.status ?? '未记录'} · ${deep.evidenceGraph.strengthAssessment?.confidence ?? '未记录'}`} />
              <Row label="证据节点" value={`${deep.evidenceGraph.nodes.length} 个`} />
              {deep.interpretation.results.map((item) => (
                <View key={item.id} style={styles.deepResult}>
                  <Text style={styles.deepTitle}>{item.title} · {item.confidence}</Text>
                  <Text style={styles.deepConclusion}>{item.conclusion}</Text>
                  <Text style={styles.deepRefs}>依据 {item.evidenceRefs.length} 条 · 反证 {item.counterEvidenceRefs.length} 条</Text>
                </View>
              ))}
              {onRunBaziDiff && (
                <Pressable accessibilityLabel={`按当前规则复核${reading.title}`} accessibilityRole="button" onPress={() => onRunBaziDiff(reading.id)} style={({ pressed }) => [styles.diffButton, pressed && styles.pressed]}>
                  <Text style={styles.diffButtonText}>按当前规则复核并生成 Diff</Text>
                </Pressable>
              )}
              {!!diff && (
                <View style={styles.diffBox}>
                  <Text style={styles.diffTitle}>old vs new</Text>
                  <Text style={styles.diffText}>规则版本：{diff.oldInterpretationVersion} → {diff.newInterpretationVersion}</Text>
                  <Text style={styles.diffText}>结论变化 {diff.changedConclusions.length} 条 · 新增证据 {diff.addedEvidenceRefs.length} 条 · 删除证据 {diff.removedEvidenceRefs.length} 条</Text>
                  <Text style={styles.diffText}>强弱状态变化：{diff.strengthChanged ? '是' : '否'}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.missing}>历史版本未保存该层；本次查看不会补造或静默重算。</Text>
          )}
        </Section>
      )}

      <Section label="L5 · 现实复盘时间线">
        {model.feedback.length === 0 ? (
          <Text style={styles.missing}>尚无事实反馈。后续反馈只记录现实发生了什么，不修改原排盘。</Text>
        ) : model.feedback.map((feedback) => (
            <View key={feedback.id} style={styles.feedbackItem}>
            <View style={styles.feedbackTop}><Text style={styles.feedbackStatus}>{feedback.status}</Text><Text style={styles.feedbackDate}>{feedback.observedAt}</Text>{!!feedback.updatedAt && <Text style={styles.feedbackDate}>更新 {feedback.updatedAt.slice(0, 10)}</Text>}</View>
            <Text style={styles.feedbackNote}>{feedback.note}</Text>
            {!!feedback.linkedInterpretationIds?.length && <Text style={styles.feedbackLink}>user-linked Interpretation: {feedback.linkedInterpretationIds.join(', ')}</Text>}
            {!!feedback.linkedEvidenceIds?.length && <Text style={styles.feedbackLink}>user-linked Evidence: {feedback.linkedEvidenceIds.join(', ')}</Text>}
          </View>
        ))}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  viewer: { marginTop: spacing.x3, gap: spacing.x3 },
  section: { borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, backgroundColor: 'rgba(5,9,7,0.28)', padding: spacing.x3 },
  sectionLabel: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 14, letterSpacing: 0.4 },
  row: { flexDirection: 'row', gap: spacing.x3, marginTop: spacing.x2 },
  rowLabel: { width: 76, color: palette.patina, fontFamily: fontFamilies.body, fontSize: 10 },
  rowValue: { flex: 1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 17 },
  subsection: { marginTop: spacing.x3, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x2 },
  subsectionLabel: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  versionStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x3 },
  versionText: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9 },
  observation: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  deepResult: { marginTop: spacing.x3, borderLeftWidth: 2, borderLeftColor: palette.brass, paddingLeft: spacing.x3 },
  deepTitle: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 11 },
  deepConclusion: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  deepRefs: { marginTop: spacing.x1, color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9 },
  missing: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  diffButton: { minHeight: 36, alignSelf: 'flex-start', marginTop: spacing.x3, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  diffButtonText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 10 },
  diffBox: { marginTop: spacing.x3, borderLeftWidth: 2, borderLeftColor: palette.brass, paddingLeft: spacing.x3 },
  diffTitle: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 13 },
  diffText: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 9, lineHeight: 15 },
  feedbackItem: { marginTop: spacing.x3, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x2 },
  feedbackTop: { flexDirection: 'row', gap: spacing.x2 },
  feedbackStatus: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 10 },
  feedbackDate: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 10 },
  feedbackNote: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 17 },
  feedbackLink: { marginTop: spacing.x1, color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9, lineHeight: 15 },
  pressed: { opacity: 0.72 },
});
