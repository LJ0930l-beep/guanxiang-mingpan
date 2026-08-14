import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Atmosphere } from '@/components/atmosphere';
import { AnimatedReveal } from '@/components/animated-reveal';
import { BottomDock } from '@/components/bottom-dock';
import { BrandMark } from '@/components/brand-mark';
import { ModuleSigil } from '@/components/module-sigil';
import { ObservatoryDial } from '@/components/observatory-dial';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { divinationModules } from '@/data/modules';
import { useScrollToTopOnMount } from '@/hooks/use-scroll-to-top-on-mount';
import { useApp } from '@/state/app-context';

export function HomeScreen() {
  useScrollToTopOnMount();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { profiles, selectedProfile } = useApp();
  const isDesktop = width >= 920;
  const dialSize = width < 390 ? 238 : isDesktop ? 310 : 272;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Atmosphere />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.container, isDesktop && styles.containerDesktop]}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <BrandMark compact size={42} />
              <View>
                <Text style={styles.brandName}>观象·命盘</Text>
                <Text style={styles.brandMeta}>PRIVATE OBSERVATORY</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="切换命主"
              accessibilityRole="button"
              onPress={() => router.push('/profiles')}
              style={({ pressed }) => [styles.profileChip, pressed && styles.pressed]}>
              <View style={styles.profileDot} />
              <Text numberOfLines={1} style={styles.profileChipText}>
                {selectedProfile?.name ?? '建立命主'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
            <View style={[styles.heroCopy, isDesktop && styles.heroCopyDesktop]}>
              <Text style={styles.eyebrow}>今日 · 观象台</Text>
              <Text accessibilityRole="header" style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
                从一张命盘，{isDesktop ? '\n' : ''}看见时间留下的纹理
              </Text>
              <Text style={styles.heroDescription}>
                选择一种体系开始排盘。我们会保存输入、计算版本与基础解读，让每次推演都能回头检查。
              </Text>
              <View style={styles.heroFacts}>
                <View style={styles.factItem}>
                  <Text style={styles.factValue}>4</Text>
                  <Text style={styles.factLabel}>种命理体系</Text>
                </View>
                <View style={styles.factDivider} />
                <View style={styles.factItem}>
                  <Text style={styles.factValue}>本地</Text>
                  <Text style={styles.factLabel}>命盘资料保存</Text>
                </View>
                <View style={styles.factDivider} />
                <View style={styles.factItem}>
                  <Text style={styles.factValue}>可复盘</Text>
                  <Text style={styles.factLabel}>记录计算版本</Text>
                </View>
              </View>
            </View>
            <View style={styles.dialWrap}>
              <ObservatoryDial size={dialSize} />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>选择观测方式</Text>
              <Text style={styles.sectionTitle}>四术入口</Text>
            </View>
            <Text style={styles.sectionMeta}>基础排盘永久免费</Text>
          </View>

          <View style={styles.moduleGrid}>
            {divinationModules.map((module, index) => (
              <AnimatedReveal delay={index * 70} key={module.slug} style={[styles.moduleCardWrap, isDesktop ? styles.moduleCardDesktop : styles.moduleCardMobile]}>
                <Pressable
                accessibilityHint={module.inputHint}
                accessibilityLabel={`进入${module.title}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/module/[slug]', params: { slug: module.slug } })
                }
                style={({ pressed }) => [
                  styles.moduleCard,
                  pressed && styles.moduleCardPressed,
                ]}>
                <View style={styles.moduleTopRow}>
                  <ModuleSigil accent={module.accent} module={module.slug} size={78} />
                  <View style={styles.moduleAction}><Text style={styles.moduleArrow}>进入</Text><View style={[styles.moduleAccent, { backgroundColor: module.accent }]} /></View>
                </View>
                <Text style={styles.moduleClassicalName}>{module.classicalName}</Text>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
                <View style={styles.moduleFooter}><Text style={styles.moduleFooterText}>{module.slug === 'liuyao' ? '写下问题并起卦' : '使用当前命主排盘'}</Text></View>
                </Pressable>
              </AnimatedReveal>
            ))}
          </View>

          <View style={styles.profileSection}>
            <View style={styles.profileSectionCopy}>
              <Text style={styles.sectionKicker}>本机命主</Text>
              <Text style={styles.sectionTitle}>
                {profiles.length ? `已保存 ${profiles.length} 位命主` : '先建立一位命主'}
              </Text>
              <Text style={styles.profileDescription}>
                {selectedProfile
                  ? `${selectedProfile.name} · ${selectedProfile.birthCity || '地点待补充'} · ${selectedProfile.timeKnown ? '时辰完整' : '时辰未知，部分结果会有偏差'}`
                  : '出生日期、时辰与地点只保存在当前设备，可随时导出加密备份。'}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={profiles.length ? '管理命主' : '建立命主'}
              accessibilityRole="button"
              onPress={() => router.push('/profiles')}
              style={({ pressed }) => [styles.profileAction, pressed && styles.pressed]}>
              <Text style={styles.profileActionText}>{profiles.length ? '管理命主' : '建立命主'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <BottomDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.obsidian },
  scrollContent: { paddingBottom: 112 },
  container: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.mobileGutter,
  },
  containerDesktop: { paddingHorizontal: layout.desktopGutter },
  header: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  brandName: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 18, letterSpacing: 2 },
  brandMeta: { marginTop: 2, color: palette.brass, fontFamily: fontFamilies.data, fontSize: 8, letterSpacing: 1.5 },
  profileChip: {
    maxWidth: 138,
    minHeight: layout.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x2,
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.x3,
    backgroundColor: palette.deepJade,
  },
  profileDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.patina },
  profileChipText: { flexShrink: 1, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 12 },
  hero: { paddingTop: spacing.x8, alignItems: 'center', gap: spacing.x8 },
  heroDesktop: { minHeight: 490, flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.x6 },
  heroCopy: { width: '100%', maxWidth: 610 },
  heroCopyDesktop: { flex: 1 },
  eyebrow: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 11, letterSpacing: 3 },
  heroTitle: {
    marginTop: spacing.x3,
    color: palette.ricePaper,
    fontFamily: fontFamilies.display,
    fontSize: 34,
    lineHeight: 47,
    letterSpacing: 1.5,
  },
  heroTitleDesktop: { fontSize: 50, lineHeight: 68 },
  heroDescription: {
    maxWidth: 560,
    marginTop: spacing.x5,
    color: palette.ashGreen,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 26,
  },
  heroFacts: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.x8 },
  factItem: { flex: 1 },
  factValue: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 16, letterSpacing: 1 },
  factLabel: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  factDivider: { width: 1, height: 32, marginHorizontal: spacing.x3, backgroundColor: palette.hairline },
  dialWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.x3 },
  sectionHeader: {
    marginTop: spacing.x12,
    marginBottom: spacing.x5,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionKicker: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 10, letterSpacing: 2.5 },
  sectionTitle: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 24, letterSpacing: 1.5 },
  sectionMeta: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x3 },
  moduleCardWrap: { minWidth: 0 },
  moduleCard: {
    minHeight: 286,
    height: '100%',
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: radii.card,
    backgroundColor: 'rgba(8, 26, 22, 0.76)',
    padding: spacing.x5,
  },
  moduleCardMobile: { flexBasis: '47%', flexGrow: 1 },
  moduleCardDesktop: { flexBasis: '23%', flexGrow: 1 },
  moduleCardPressed: { opacity: 0.76, transform: [{ translateY: 2 }] },
  moduleTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  moduleAction: { alignItems: 'flex-end', gap: spacing.x2 },
  moduleArrow: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 15 },
  moduleClassicalName: { marginTop: spacing.x5, color: palette.brass, fontFamily: fontFamilies.body, fontSize: 9, letterSpacing: 1.8 },
  moduleTitle: { marginTop: spacing.x1, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 20, letterSpacing: 1 },
  moduleDescription: { marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20 },
  moduleFooter: { marginTop: 'auto', paddingTop: spacing.x5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moduleFooterText: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11 },
  moduleAccent: { width: 18, height: 2, borderRadius: 1 },
  profileSection: {
    marginTop: spacing.x8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x5,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.hairline,
    paddingVertical: spacing.x6,
  },
  profileSectionCopy: { flex: 1 },
  profileDescription: { marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20 },
  profileAction: {
    minHeight: layout.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
    borderRadius: radii.input,
    paddingHorizontal: spacing.x4,
  },
  profileActionText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 12 },
  pressed: { opacity: 0.68 },
});
