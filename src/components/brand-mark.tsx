import { StyleSheet, Text, View } from 'react-native';

import { fontFamilies, palette } from '@/constants/guanxiang';

interface BrandMarkProps {
  size?: number;
  compact?: boolean;
}

export function BrandMark({ size = 52, compact = false }: BrandMarkProps) {
  return (
    <View style={[styles.root, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.inner, { borderRadius: (size - 10) / 2 }]}>
        <Text style={[styles.glyph, { fontSize: size * 0.42 }]}>观</Text>
      </View>
      {!compact && <View style={styles.axisDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.brass,
    backgroundColor: palette.deepJade,
  },
  inner: {
    position: 'absolute',
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  glyph: {
    color: palette.paleBrass,
    fontFamily: fontFamilies.display,
    lineHeight: undefined,
  },
  axisDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    top: -2,
    backgroundColor: palette.paleBrass,
  },
});

