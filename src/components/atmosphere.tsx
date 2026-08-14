import { StyleSheet, View } from 'react-native';

import { palette } from '@/constants/guanxiang';

interface AtmosphereProps {
  accent?: string;
  focus?: 'top' | 'center' | 'bottom';
}

export function Atmosphere({ accent, focus = 'top' }: AtmosphereProps) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.noPointer]}>
      <View style={[styles.orb, styles.jadeOrb]} />
      <View style={[styles.orb, styles.brassOrb]} />
      {!!accent && (
        <View
          style={[
            styles.orb,
            styles.accentOrb,
            focus === 'center' && styles.accentCenter,
            focus === 'bottom' && styles.accentBottom,
            { backgroundColor: `${accent}16` },
          ]}
        />
      )}
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  noPointer: {
    pointerEvents: 'none',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  jadeOrb: {
    width: 420,
    height: 420,
    right: -190,
    top: -150,
    backgroundColor: palette.jadeGlow,
  },
  brassOrb: {
    width: 320,
    height: 320,
    left: -190,
    bottom: -160,
    backgroundColor: palette.brassGlow,
  },
  accentOrb: { width: 520, height: 520, left: '50%', marginLeft: -260, top: -260 },
  accentCenter: { top: '22%' },
  accentBottom: { top: '56%' },
  vignette: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderColor: 'rgba(198, 166, 107, 0.04)',
  },
});
