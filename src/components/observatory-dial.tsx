import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fontFamilies, palette } from '@/constants/guanxiang';

interface ObservatoryDialProps {
  size?: number;
}

const cardinalPoints = [
  { label: '子', style: { top: 12, left: '48%' as const } },
  { label: '午', style: { bottom: 12, left: '48%' as const } },
  { label: '卯', style: { left: 12, top: '47%' as const } },
  { label: '酉', style: { right: 12, top: '47%' as const } },
];

export function ObservatoryDial({ size = 286 }: ObservatoryDialProps) {
  const [rotation] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!active) return;
      setReduceMotion(enabled);
      if (!enabled) {
        animation = Animated.timing(rotation, {
          toValue: 1,
          duration: 18000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        });
        animation.start();
      }
    });

    return () => {
      active = false;
      animation?.stop();
    };
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '22.5deg'],
  });

  return (
    <View
      accessibilityLabel="观象仪，标有子午卯酉的命盘入口"
      style={[styles.root, { width: size, height: size, borderRadius: size / 2 }]}>
      <Animated.View
        style={[
          styles.rotatingRing,
          {
            borderRadius: (size - 22) / 2,
            transform: reduceMotion ? undefined : [{ rotate: spin }],
          },
        ]}>
        {Array.from({ length: 16 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.tick,
              {
                transform: [
                  { rotate: `${index * 22.5}deg` },
                  { translateY: -(size / 2 - 23) },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      <View style={[styles.middleRing, { borderRadius: (size - 72) / 2 }]} />
      <View style={[styles.innerRing, { borderRadius: (size - 132) / 2 }]}>
        <Text style={styles.centerLabel}>观象</Text>
        <Text style={styles.centerMeta}>四术合参</Text>
      </View>

      {cardinalPoints.map((point) => (
        <Text key={point.label} style={[styles.cardinal, point.style]}>
          {point.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
    backgroundColor: 'rgba(8, 26, 22, 0.72)',
  },
  rotatingRing: {
    position: 'absolute',
    top: 11,
    right: 11,
    bottom: 11,
    left: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: 8,
    backgroundColor: palette.brass,
    opacity: 0.55,
  },
  middleRing: {
    position: 'absolute',
    top: 36,
    right: 36,
    bottom: 36,
    left: 36,
    borderWidth: 1,
    borderColor: 'rgba(93, 143, 128, 0.38)',
    transform: [{ rotate: '45deg' }],
  },
  innerRing: {
    position: 'absolute',
    top: 66,
    right: 66,
    bottom: 66,
    left: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.hairlineStrong,
    backgroundColor: palette.deepJade,
  },
  centerLabel: {
    color: palette.ricePaper,
    fontFamily: fontFamilies.display,
    fontSize: 26,
    letterSpacing: 5,
    marginLeft: 5,
  },
  centerMeta: {
    marginTop: 5,
    color: palette.brass,
    fontFamily: fontFamilies.body,
    fontSize: 10,
    letterSpacing: 3,
    marginLeft: 3,
  },
  cardinal: {
    position: 'absolute',
    color: palette.ashGreen,
    fontFamily: fontFamilies.display,
    fontSize: 12,
  },
});
