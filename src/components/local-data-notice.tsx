import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';

/**
 * A deliberately explicit boundary for the first local-only release.
 * Keeping this copy close to the entry points prevents the prototype login
 * controls from being mistaken for a connected account service.
 */
export function LocalDataNotice() {
  const router = useRouter();

  return (
    <View accessibilityLabel="本地数据说明" style={styles.container} testID="local-data-notice">
      <Text accessibilityRole="header" style={styles.title}>本地原型说明</Text>
      <Text style={styles.body}>
        当前版本只在这台设备保存命主、排盘结果和备份。验证码、Apple、微信、订阅、广告、AI 与服务端同步尚未接入。
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="查看隐私政策"
          accessibilityRole="link"
          onPress={() => router.push('/privacy')}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Text style={styles.linkText}>隐私政策</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="查看用户协议"
          accessibilityRole="link"
          onPress={() => router.push('/terms')}
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
          <Text style={styles.linkText}>用户协议</Text>
        </Pressable>
      </View>
      <Text style={styles.disclaimer}>命理内容仅供传统文化研究与自我观察，不构成医疗、法律、投资或其他专业建议。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: layout.readableWidth,
    marginTop: spacing.x5,
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: radii.card,
    backgroundColor: 'rgba(20, 49, 41, 0.54)',
    padding: spacing.x4,
  },
  title: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 15, textAlign: 'center' },
  body: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 21, textAlign: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.x5, marginTop: spacing.x3 },
  link: { minHeight: layout.minTouch, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.x2 },
  linkText: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 13, textDecorationLine: 'underline' },
  disclaimer: { marginTop: spacing.x2, color: '#718078', fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
