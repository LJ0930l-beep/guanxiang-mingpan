import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedReveal } from '@/components/animated-reveal';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { UI_STATE_COPY } from '@/constants/ui-copy';
import type { ExplanationSnapshot, GlossaryTerm } from '@/domains/explanation/types';

export interface ExplanationEvidenceNode {
  id: string;
  label: string;
  facts?: Record<string, unknown>;
  ruleVersion?: string;
  source?: string;
}

interface ExplanationLayerProps {
  snapshot?: ExplanationSnapshot;
  evidenceNodes: readonly ExplanationEvidenceNode[];
  glossaryTerms: readonly GlossaryTerm[];
}

const confidenceLabels = { high: '高置信', medium: '中置信', low: '低置信' } as const;

function formatFacts(facts: Record<string, unknown> | undefined): string {
  if (!facts) return '该节点没有额外事实字段。';
  return Object.entries(facts)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join('、') : String(value)}`)
    .join(' · ') || '该节点没有额外事实字段。';
}

export function ExplanationLayer({ snapshot, evidenceNodes, glossaryTerms }: ExplanationLayerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rawEvidenceId, setRawEvidenceId] = useState<string | null>(null);
  const [glossaryId, setGlossaryId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const evidenceById = useMemo(() => new Map(evidenceNodes.map((node) => [node.id, node])), [evidenceNodes]);
  const glossaryById = useMemo(() => new Map(glossaryTerms.map((term) => [term.id, term])), [glossaryTerms]);

  if (!snapshot) {
    return (
      <View accessibilityLabel={UI_STATE_COPY.unknown.announcement} accessibilityRole="text" style={styles.emptyPanel}>
        <Text style={styles.kicker}>EXPLANATION LAYER</Text>
        <Text accessibilityRole="header" style={styles.emptyTitle}>旧记录未保存解释快照</Text>
        <Text style={styles.emptyText}>本次只展示保存时存在的解释，不会用当前版本静默补写历史内容。</Text>
      </View>
    );
  }

  const blocks = showAll ? snapshot.blocks : snapshot.blocks.slice(0, 6);
  return (
    <View style={styles.panel}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>EXPLANATION LAYER</Text>
          <Text accessibilityRole="header" style={styles.title}>先看懂，再回到依据</Text>
          <Text style={styles.subtitle}>默认显示人话说明；点击卡片可查看为什么、反证和术语。</Text>
        </View>
        <Text style={styles.version}>{snapshot.explanationVersion}</Text>
      </View>
      <View style={styles.blockList}>
        {blocks.map((block, index) => {
          const expanded = expandedId === block.id;
          const references = [
            ...block.evidenceRefs.map((ref) => ({ ref, counter: false })),
            ...block.counterEvidenceRefs.filter((ref) => !block.evidenceRefs.includes(ref)).map((ref) => ({ ref, counter: true })),
          ];
          return (
            <AnimatedReveal delay={100 + index * 50} key={block.id} style={styles.card}>
              <Pressable
                accessibilityHint="展开后查看说明、术语、依据与边界。"
                accessibilityLabel={`${expanded ? '收起' : '展开'}${block.title}解释`}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpandedId((current) => current === block.id ? null : block.id)}
                style={({ pressed }) => [styles.cardHeader, pressed && styles.pressed]}>
                <View style={styles.cardCopy}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{block.title}</Text>
                    <Text style={[styles.confidence, block.confidence === 'low' && styles.confidenceLow]}>{confidenceLabels[block.confidence]}</Text>
                  </View>
                  <Text style={styles.summary}>{block.summary}</Text>
                </View>
                <Text style={styles.toggle}>{expanded ? '收起' : '为什么'}</Text>
              </Pressable>
              {expanded && (
                <View style={styles.details}>
                  <Text style={styles.detailKicker}>这意味着什么</Text>
                  {block.paragraphs.map((paragraph) => <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>)}
                  {block.glossaryRefs.length > 0 && (
                    <View style={styles.glossarySection}>
                      <Text style={styles.detailKicker}>术语</Text>
                      <View style={styles.glossaryRow}>
                        {block.glossaryRefs.map((ref) => {
                          const term = glossaryById.get(ref);
                          if (!term) return null;
                          const selected = glossaryId === ref;
                          return (
                            <Pressable accessibilityHint="查看或收起术语释义与边界。" accessibilityLabel={`${selected ? '收起' : '查看'}术语${term.term}`} accessibilityRole="button" accessibilityState={{ expanded: selected }} key={ref} onPress={() => setGlossaryId((current) => current === ref ? null : ref)} style={[styles.glossaryChip, selected && styles.glossaryChipActive]}>
                              <Text style={[styles.glossaryChipText, selected && styles.glossaryChipTextActive]}>{term.term}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {glossaryId && block.glossaryRefs.includes(glossaryId) && glossaryById.get(glossaryId) && (
                        <View accessibilityLiveRegion="polite" accessibilityRole="text" style={styles.glossaryDetail}>
                          <Text style={styles.glossaryDefinition}>{glossaryById.get(glossaryId)?.shortDefinition}</Text>
                          {!!glossaryById.get(glossaryId)?.caution && <Text style={styles.glossaryCaution}>边界：{glossaryById.get(glossaryId)?.caution}</Text>}
                        </View>
                      )}
                    </View>
                  )}
                  {references.length > 0 && (
                    <View style={styles.evidenceSection}>
                      <Text style={styles.detailKicker}>为什么</Text>
                      {references.map(({ ref, counter }) => {
                        const node = evidenceById.get(ref);
                        if (!node) return null;
                        const rawOpen = rawEvidenceId === ref;
                        return (
                          <View key={`${block.id}-${ref}`} style={styles.evidenceRow}>
                            <View style={styles.evidenceRowCopy}>
                              <Text style={[styles.evidenceKind, counter && styles.evidenceCounter]}>{counter ? '反证' : '依据'}</Text>
                              <Text style={styles.evidenceLabel}>{node.label}</Text>
                            </View>
                            <Pressable accessibilityHint="展开后查看原始事实字段、规则版本和来源。" accessibilityLabel={`${rawOpen ? '收起' : '展开'}${ref}原始证据`} accessibilityRole="button" accessibilityState={{ expanded: rawOpen }} onPress={() => setRawEvidenceId((current) => current === ref ? null : ref)} style={styles.evidenceAction}>
                              <Text style={styles.evidenceActionText}>{rawOpen ? '收起' : '原始'}</Text>
                            </Pressable>
                            {rawOpen && <View accessibilityRole="text" style={styles.rawEvidence}><Text style={styles.rawText}>{formatFacts(node.facts)}</Text><Text style={styles.rawMeta}>{node.ruleVersion ?? '未记录规则版本'} · {node.source ?? '未记录来源'}</Text></View>}
                          </View>
                        );
                      })}
                    </View>
                  )}
                  {block.caveats.map((caveat) => <Text key={caveat} style={styles.caveat}>边界：{caveat}</Text>)}
                </View>
              )}
            </AnimatedReveal>
          );
        })}
      </View>
      {snapshot.blocks.length > 6 && (
        <Pressable accessibilityHint="切换显示其余解释卡片。" accessibilityLabel={showAll ? '收起其余解释' : `查看其余 ${snapshot.blocks.length - 6} 个解释`} accessibilityRole="button" accessibilityState={{ expanded: showAll }} onPress={() => setShowAll((current) => !current)} style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
          <Text style={styles.moreButtonText}>{showAll ? '收起其余解释' : `查看其余 ${snapshot.blocks.length - 6} 个解释`}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: spacing.x6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x5 },
  emptyPanel: { marginTop: spacing.x6, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: spacing.x4 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.x3 },
  headingCopy: { flex: 1 },
  kicker: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9, letterSpacing: 1.4 },
  title: { marginTop: spacing.x1, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 19 },
  subtitle: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  version: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 9, paddingTop: spacing.x1 },
  emptyTitle: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 16 },
  emptyText: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  blockList: { marginTop: spacing.x4, gap: spacing.x2 },
  card: { borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, backgroundColor: 'rgba(255,255,255,0.015)', overflow: 'hidden' },
  cardHeader: { minHeight: layout.minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, padding: spacing.x3 },
  cardCopy: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  cardTitle: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 14 },
  confidence: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9 },
  confidenceLow: { color: '#D7A071' },
  summary: { marginTop: spacing.x1, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  toggle: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 10 },
  details: { borderTopWidth: 1, borderColor: palette.hairline, paddingHorizontal: spacing.x3, paddingBottom: spacing.x3, paddingTop: spacing.x3 },
  detailKicker: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9, letterSpacing: 1, marginBottom: spacing.x1 },
  paragraph: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 19, marginTop: spacing.x1 },
  glossarySection: { marginTop: spacing.x3 },
  glossaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x1 },
  glossaryChip: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: 999, paddingHorizontal: spacing.x3 },
  glossaryChipActive: { borderColor: palette.patina, backgroundColor: 'rgba(93,143,128,0.12)' },
  glossaryChipText: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 10 },
  glossaryChipTextActive: { color: palette.ricePaper },
  glossaryDetail: { marginTop: spacing.x2, borderLeftWidth: 1, borderLeftColor: palette.patina, paddingLeft: spacing.x2 },
  glossaryDefinition: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 17 },
  glossaryCaution: { marginTop: spacing.x1, color: '#C8A38E', fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16 },
  evidenceSection: { marginTop: spacing.x3 },
  evidenceRow: { borderTopWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x2 },
  evidenceRowCopy: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x2, paddingRight: spacing.x6 },
  evidenceKind: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9 },
  evidenceCounter: { color: '#D7A071' },
  evidenceLabel: { flex: 1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16 },
  evidenceAction: { minHeight: layout.minTouch, alignSelf: 'flex-start', justifyContent: 'center', marginTop: spacing.x1, paddingHorizontal: spacing.x3 },
  evidenceActionText: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 9 },
  rawEvidence: { marginTop: spacing.x2, borderLeftWidth: 1, borderLeftColor: palette.patina, backgroundColor: 'rgba(93,143,128,0.06)', padding: spacing.x2 },
  rawText: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 9, lineHeight: 15 },
  rawMeta: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 9 },
  caveat: { marginTop: spacing.x2, color: '#C8A38E', fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16 },
  moreButton: { minHeight: layout.minTouch, marginTop: spacing.x3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingVertical: spacing.x2 },
  moreButtonText: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 10 },
  pressed: { opacity: 0.72 },
});
