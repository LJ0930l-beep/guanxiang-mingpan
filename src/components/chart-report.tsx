import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedReveal } from '@/components/animated-reveal';
import { PressableScale } from '@/components/pressable-scale';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import type { ChartReport } from '@/domains/report/types';

/**
 * Whole-chart report reader.  The report is part of the saved payload, so the
 * live result page and the archive viewer render the same generated text;
 * legacy records without a report simply omit the panel.
 */
export function ChartReportPanel({ report }: { report?: ChartReport }) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  if (!report || report.sections.length === 0) return null;

  const defaultOpen = report.sections[0].id;
  const toggleSection = (id: string) => {
    setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  return (
    <AnimatedReveal distance={16}>
    <View accessibilityLabel={`${report.title}，共${report.sections.length}个章节`} style={styles.panel} testID="chart-report">
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>CHART REPORT</Text>
          <Text accessibilityRole="header" style={styles.title}>{report.title}</Text>
        </View>
        <Pressable
          accessibilityHint="切换全部章节的展开状态。"
          accessibilityLabel={showAll ? '收起全部报告章节' : `展开全部${report.sections.length}个报告章节`}
          accessibilityRole="button"
          onPress={() => setShowAll((current) => !current)}
          style={({ pressed }) => [styles.toggleAll, pressed && styles.pressed]}>
          <Text style={styles.toggleAllText}>{showAll ? '收起全部' : '展开全部'}</Text>
        </Pressable>
      </View>
      <Text style={styles.summary}>{report.summary}</Text>
      <View style={styles.sectionList}>
        {report.sections.map((section, index) => {
          const expanded = showAll || expandedIds.includes(section.id) || (expandedIds.length === 0 && section.id === defaultOpen);
          return (
            <AnimatedReveal delay={index * 40} key={section.id}>
              <View style={styles.section}>
                <PressableScale
                  accessibilityHint="展开或收起这一章节的完整内容。"
                  accessibilityLabel={`${expanded ? '收起' : '展开'}章节：${section.heading}`}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => toggleSection(section.id)}
                  style={styles.sectionHeader}>
                  <Text style={styles.sectionIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  <Text style={styles.sectionHeading}>{section.heading}</Text>
                  <Text style={styles.toggle}>{expanded ? '收起' : '展开'}</Text>
                </PressableScale>
                {expanded && (
                  <AnimatedReveal distance={6}>
                    <View accessibilityLiveRegion="polite" style={styles.sectionBody}>
                      {section.paragraphs.map((paragraph) => (
                        <Text key={paragraph.slice(0, 24)} style={styles.paragraph}>{paragraph}</Text>
                      ))}
                    </View>
                  </AnimatedReveal>
                )}
              </View>
            </AnimatedReveal>
          );
        })}
      </View>
    </View>
    </AnimatedReveal>
  );
}

const styles = StyleSheet.create({
  panel: { marginTop: spacing.x4, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, backgroundColor: 'rgba(8, 26, 22, 0.72)', padding: spacing.x4 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.x3 },
  headingCopy: { flex: 1, minWidth: 0 },
  kicker: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 10, letterSpacing: 2 },
  title: { marginTop: spacing.x1, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 19, lineHeight: 26 },
  toggleAll: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, paddingHorizontal: spacing.x3 },
  toggleAllText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 13 },
  summary: { marginTop: spacing.x2, color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 21 },
  sectionList: { marginTop: spacing.x3, gap: spacing.x2 },
  section: { borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, overflow: 'hidden' },
  sectionHeader: { minHeight: layout.minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, padding: spacing.x3 },
  sectionIndex: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 12 },
  sectionHeading: { flex: 1, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 16 },
  toggle: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 12 },
  sectionBody: { borderTopWidth: 1, borderColor: palette.hairline, padding: spacing.x3, gap: spacing.x2 },
  paragraph: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 13.5, lineHeight: 22 },
  pressed: { opacity: 0.72 },
});
