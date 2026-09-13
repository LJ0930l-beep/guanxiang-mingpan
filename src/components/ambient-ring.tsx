import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';

interface AmbientRingProps {
  size?: number;
  /** One full revolution; kept slow so it reads as an instrument, not a loader. */
  duration?: number;
}

/**
 * Slow-rotating observation-ring motif from the Guanxiang design language.
 * Purely decorative (hidden from accessibility), and it freezes under the
 * system reduce-motion preference instead of spinning silently.
 */
export function AmbientRing({ size = 132, duration = 26000 }: AmbientRingProps) {
  const [rotate] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    let loop: Animated.CompositeAnimation | undefined;
    const applyMotionPreference = (enabled: boolean) => {
      if (!active) return;
      setReduceMotion(enabled);
      loop?.stop();
      if (enabled) {
        rotate.setValue(0);
        return;
      }
      loop = Animated.loop(Animated.timing(rotate, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }));
      loop.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => applyMotionPreference(enabled)).catch(() => applyMotionPreference(false));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', applyMotionPreference);
    return () => {
      active = false;
      subscription.remove();
      loop?.stop();
    };
  }, [duration, rotate]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          marginLeft: -size / 2,
          marginTop: -size / 2,
        },
        !reduceMotion && {
          transform: [{ rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
        },
      ]}>
      <View style={[styles.tick, { top: 0 }]} />
      <View style={[styles.tick, { bottom: 0, opacity: 0.45 }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(201, 164, 90, 0.18)',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: 8,
    backgroundColor: 'rgba(201, 164, 90, 0.4)',
  },
});
