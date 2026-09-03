import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Atmosphere } from '@/components/atmosphere';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';

export interface PolicySection {
  heading: string;
  body: string;
}

interface PolicyScreenProps {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
  updatedAt: string;
}

export function PolicyScreen({ eyebrow, title, intro, sections, updatedAt }: PolicyScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} testID="policy-screen">
      <Atmosphere focus="center" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          accessibilityLabel="返回上一页"
          accessibilityRole="button"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹ 返回</Text>
        </Pressable>
        <View style={styles.panel}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.updatedAt}>{updatedAt}</Text>
          <Text style={styles.intro}>{intro}</Text>
          {sections.map((section) => (
            <View key={section.heading} style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionHeading}>{section.heading}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>上线前复核</Text>
            <Text style={styles.footerBody}>本文档是产品草案，不构成法律意见。正式发布前仍需由运营主体补齐联系地址、权利请求渠道、保留期限、年龄政策和平台链接，并完成法律审核。</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.obsidian },
  scrollContent: { width: '100%', maxWidth: layout.readableWidth + 80, alignSelf: 'center', paddingHorizontal: layout.mobileGutter, paddingTop: spacing.x4, paddingBottom: spacing.x10 },
  backButton: { minHeight: layout.minTouch, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: spacing.x2 },
  backText: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 14 },
  panel: { borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.panel, backgroundColor: 'rgba(8, 26, 22, 0.82)', padding: spacing.x6 },
  eyebrow: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 10, letterSpacing: 3, textAlign: 'center' },
  title: { marginTop: spacing.x3, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 30, letterSpacing: 2, textAlign: 'center' },
  updatedAt: { marginTop: spacing.x2, color: palette.patina, fontFamily: fontFamilies.data, fontSize: 11, textAlign: 'center' },
  intro: { marginTop: spacing.x6, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 25 },
  section: { marginTop: spacing.x6, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x4 },
  sectionHeading: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 18 },
  sectionBody: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 24 },
  footer: { marginTop: spacing.x8, borderWidth: 1, borderColor: 'rgba(159, 81, 67, 0.48)', borderRadius: radii.card, backgroundColor: 'rgba(159, 81, 67, 0.1)', padding: spacing.x4 },
  footerTitle: { color: '#E4A89A', fontFamily: fontFamilies.display, fontSize: 15 },
  footerBody: { marginTop: spacing.x2, color: '#D0B7AA', fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20 },
  pressed: { opacity: 0.68 },
});
