import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Atmosphere } from '@/components/atmosphere';
import { BrandMark } from '@/components/brand-mark';
import { fontFamilies, palette, spacing } from '@/constants/guanxiang';

export function LoadingScreen() {
  return (
    <View accessibilityLabel="正在校准观象仪" accessibilityLiveRegion="polite" accessibilityRole="progressbar" style={styles.root}>
      <Atmosphere />
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <BrandMark size={62} />
        <ActivityIndicator color={palette.brass} style={styles.spinner} />
      </View>
      <Text style={styles.label}>正在校准观象仪</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.obsidian,
  },
  spinner: {
    marginTop: spacing.x6,
  },
  label: {
    marginTop: spacing.x3,
    color: palette.ashGreen,
    fontFamily: fontFamilies.body,
    fontSize: 13,
    letterSpacing: 2,
  },
});
