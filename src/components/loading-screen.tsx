import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Atmosphere } from '@/components/atmosphere';
import { BrandMark } from '@/components/brand-mark';
import { fontFamilies, palette, spacing } from '@/constants/guanxiang';
import { UI_STATE_COPY } from '@/constants/ui-copy';

export function LoadingScreen() {
  const copy = UI_STATE_COPY.loading;
  return (
    <View accessibilityLabel={copy.announcement} accessibilityLiveRegion="polite" accessibilityRole="progressbar" style={styles.root}>
      <Atmosphere />
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <BrandMark size={62} />
        <ActivityIndicator color={palette.brass} style={styles.spinner} />
      </View>
      <Text style={styles.label}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>
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
  body: {
    maxWidth: 280,
    marginTop: spacing.x2,
    color: palette.ashGreen,
    fontFamily: fontFamilies.body,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
  },
});
