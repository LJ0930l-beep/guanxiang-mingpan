import { StyleSheet, Text, View } from 'react-native';

import { AnimatedReveal } from '@/components/animated-reveal';

import { fontFamilies, palette, radii, spacing } from '@/constants/guanxiang';
import { buildChartRenderModel } from '@/components/chart-render-model';
import type { ChartPayload } from '@/types/charts';

/**
 * Read-only, presentation-neutral chart renderer shared by live and archive
 * screens. It deliberately reads the saved payload rather than recalculating
 * from the current profile, so an old record remains an immutable snapshot.
 */
export function ChartRenderer({ payload, compact = false }: { payload: ChartPayload; compact?: boolean }) {
  const { pillars, lines, palaces, factors, aspects, timeLayer, partialChart } = buildChartRenderModel(payload);
  return (
    <View accessibilityLabel={`${payload.module}完整盘面`} style={[styles.root, compact && styles.compact]}>
      {payload.module === 'bazi' && (
        <>
          <Text style={styles.caption}>四柱{partialChart ? ' · 部分盘（时辰未提供）' : ''} · {payload.dayMaster}日主</Text>
          <View style={styles.grid}>
            {pillars.length === 0 && <Text style={styles.missing}>历史记录未保存四柱逐柱数据，当前只读展示不会补造或重算。</Text>}
            {pillars.map((pillar, cellIndex) => (
              <AnimatedReveal key={pillar.key} delay={cellIndex * 45} distance={8} style={styles.cell}>
                <Text style={styles.cellLabel}>{pillar.label}</Text>
                <Text style={styles.primary}>{pillar.stem}{pillar.branch}</Text>
                <Text style={styles.secondary}>{pillar.tenGod ?? '十神未记录'}</Text>
                <Text style={styles.secondary}>{pillar.hiddenStems?.join('、') || '藏干未记录'}</Text>
              </AnimatedReveal>
            ))}
          </View>
          {timeLayer && (
            <View style={styles.timeLayerBlock}>
              <Text style={styles.timeLayerTitle}>大运 · {timeLayer.directionLabel ?? ''}</Text>
              {timeLayer.qiYun && <Text style={styles.timeLayerMeta}>起运 {timeLayer.qiYun.years}年{timeLayer.qiYun.months}月{timeLayer.qiYun.days}日（{timeLayer.qiYun.date}）</Text>}
              {timeLayer.dayuns.map((entry) => (
                <Text key={entry.index} style={styles.timeLayerRow}>{entry.index}运 {entry.ganZhi} {entry.startAge}-{entry.endAge}岁 · {entry.startDate}起</Text>
              ))}
              {timeLayer.liunian && <Text style={styles.timeLayerRow}>流年 {timeLayer.liunian.year}：{timeLayer.liunian.yearGanZhi} · {timeLayer.liunian.yearStemTenGod}{timeLayer.liunian.coveredByDayun ? ` · 第${timeLayer.liunian.coveredByDayun.index}运${timeLayer.liunian.coveredByDayun.ganZhi}覆盖` : ''}</Text>}
              <Text style={styles.timeLayerMeta}>大运与流年为结构事实（bazi-dayun-v1），不构成运势、吉凶或应期结论。</Text>
            </View>
          )}
          {partialChart && (
            <View style={styles.timeLayerBlock}>
              <Text style={styles.timeLayerTitle}>部分盘 · {partialChart.policy}</Text>
              {partialChart.candidates.map((candidate) => (
                <Text key={candidate.pillar} style={styles.timeLayerRow}>{candidate.label ?? candidate.pillar}候选：{candidate.options.map((option) => option.ganZhi).join(' / ')}</Text>
              ))}
              {partialChart.candidates.length === 0 && <Text style={styles.timeLayerRow}>年月日柱在日内锚点变化下保持稳定。</Text>}
              <Text style={styles.timeLayerMeta}>未知时辰部分盘只提供年、月、日三柱；时柱不补造，大运与流年对照需要准确时辰。</Text>
            </View>
          )}
        </>
      )}
      {payload.module === 'liuyao' && (
        <>
          <Text style={styles.caption}>{payload.hexagramName}{payload.changedHexagramName ? ` → ${payload.changedHexagramName}` : ''} · {payload.hexagramGong}</Text>
          <Text style={styles.secondary}>问题：{payload.question} · 用神：{payload.inputSnapshot.type === 'liuyao' ? payload.inputSnapshot.target : '未记录'}</Text>
          {lines.length === 0 && <Text style={styles.missing}>历史记录未保存六条逐爻事实，当前只读展示不会补造或重算。</Text>}
          {lines.map((line, lineIndex) => (
            <AnimatedReveal key={line.position} delay={lineIndex * 55} distance={6} style={styles.lineRow}>
              <Text style={styles.cellLabel}>{line.position}爻</Text>
              <Text style={styles.primary}>{line.value ? `${line.value}点 · ` : ''}{line.yinYang}{line.isChanging ? ' · 动' : ' · 静'}{line.isShiYao ? ' · 世' : ''}{line.isYingYao ? ' · 应' : ''}</Text>
              <Text style={styles.secondary}>{line.liuQin ?? '六亲未记录'} · {line.naJia ?? '纳甲未记录'} · {line.wuXing ?? '五行未记录'} · {line.strength ?? '旺衰未记录'}</Text>
            </AnimatedReveal>
          ))}
        </>
      )}
      {payload.module === 'ziwei' && (
        <>
          <Text style={styles.caption}>十二宫 · 命宫 {palaces.find((palace) => palace.name === '命宫')?.stemBranch ?? '未记录'}</Text>
          <View style={styles.palaceGrid}>
            {palaces.length === 0 && <Text style={styles.missing}>历史记录未保存十二宫逐宫数据，当前只读展示不会补造或重算。</Text>}
            {palaces.map((palace, palaceIndex) => (
              <AnimatedReveal key={`${palace.name}-${palace.stemBranch}`} delay={palaceIndex * 35} distance={6} style={styles.palaceCell}>
                <Text style={styles.cellLabel}>{palace.name}{palace.isBodyPalace ? ' · 身' : ''}</Text>
                <Text style={styles.primary}>{palace.stemBranch}</Text>
                <Text style={styles.secondary}>{palace.stars?.join('、') || '无主星'}</Text>
                <Text style={styles.secondary}>{palace.minorStars?.join('、') || '无辅星'}</Text>
                {!!palace.decadalRange && <Text style={styles.secondary}>大限 {String(palace.decadalRange)}</Text>}
              </AnimatedReveal>
            ))}
          </View>
        </>
      )}
      {payload.module === 'astrology' && (
        <>
          <Text style={styles.caption}>星盘 · {payload.calculationMode === 'exact' ? '精确' : '日级近似'} · 太阳 {payload.sunSign}</Text>
          <View style={styles.grid}>
            {factors.length === 0 && <Text style={styles.missing}>历史记录未保存星体数据，当前只读展示不会补造或重算。</Text>}
            {factors.map((factor) => <View key={factor.key} style={styles.cell}><Text style={styles.cellLabel}>{factor.label}</Text><Text style={styles.primary}>{factor.sign ?? '落座未记录'}</Text><Text style={styles.secondary}>{factor.degree ?? '度数未记录'}{factor.house ? ` · ${factor.house}宫` : ''}</Text></View>)}
          </View>
          <Text style={styles.caption}>全部相位 · {aspects.length} 组</Text>
          {aspects.map((aspect, index) => <Text key={`${aspect.from}-${aspect.to}-${index}`} style={styles.secondary}>{aspect.from} {aspect.label} {aspect.to} · 容许度 {aspect.orb ?? '未记录'}</Text>)}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: spacing.x2, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: spacing.x3, gap: spacing.x2, backgroundColor: 'rgba(4,8,6,0.34)' },
  compact: { padding: spacing.x2 },
  caption: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  cell: { minWidth: 78, flexGrow: 1, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: spacing.x2, gap: 2 },
  palaceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  palaceCell: { width: '31%', minWidth: 94, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: spacing.x2, gap: 2 },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x1 },
  cellLabel: { color: palette.patina, fontFamily: fontFamilies.body, fontSize: 11 },
  primary: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 13 },
  secondary: { color: palette.patina, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 16 },
  missing: { color: palette.patina, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 18 },
  timeLayerBlock: { borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: spacing.x2, gap: 2 },
  timeLayerTitle: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 13 },
  timeLayerRow: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 12, lineHeight: 17 },
  timeLayerMeta: { color: palette.patina, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 16 },
});
