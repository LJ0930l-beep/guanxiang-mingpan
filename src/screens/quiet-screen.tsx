import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Atmosphere } from '@/components/atmosphere';
import { BottomDock } from '@/components/bottom-dock';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { useScrollToTopOnMount } from '@/hooks/use-scroll-to-top-on-mount';

interface QuietScreenProps {
  kicker: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function QuietScreen({ kicker, title, description, actionLabel, onAction, children }: QuietScreenProps) {
  useScrollToTopOnMount();
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <Atmosphere />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable accessibilityLabel="返回观象首页" accessibilityRole="button" onPress={() => router.replace('/home')} style={styles.backButton}>
          <Text style={styles.backText}>返回观象</Text>
        </Pressable>
        <View style={styles.content}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          {children}
          {actionLabel && onAction && (
            <Pressable accessibilityLabel={actionLabel} accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      <BottomDock />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.obsidian },
  scrollContent: { width: '100%', maxWidth: layout.maxWidth, minHeight: '100%', alignSelf: 'center', paddingHorizontal: layout.mobileGutter, paddingTop: spacing.x5, paddingBottom: 112 },
  backButton: { minHeight: layout.minTouch, alignSelf: 'flex-start', justifyContent: 'center' },
  backText: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 12, letterSpacing: 1 },
  content: { flex: 1, minHeight: 500, alignItems: 'center', justifyContent: 'center', maxWidth: 620, width: '100%', alignSelf: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.panel, backgroundColor: 'rgba(8, 26, 22, 0.72)', padding: spacing.x8 },
  kicker: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 10, letterSpacing: 3 },
  title: { marginTop: spacing.x3, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 31, letterSpacing: 2, textAlign: 'center' },
  description: { maxWidth: 460, marginTop: spacing.x4, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 24, textAlign: 'center' },
  action: { minHeight: layout.minTouch, marginTop: spacing.x6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.brass, borderRadius: radii.input, paddingHorizontal: spacing.x5 },
  actionText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 13 },
  pressed: { opacity: 0.68 },
});
