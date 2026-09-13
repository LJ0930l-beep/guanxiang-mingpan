import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet } from 'react-native';

/**
 * Small attention marker for changing lines (动爻) and similar facts.
 * Pulses gently; frozen when the system reduce-motion preference is on.
 */
export function PulseDot({ color = '#D8A05F', size = 7 }: { color?: string; size?: number }) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    let loop: Animated.CompositeAnimation | undefined;
    const applyMotionPreference = (enabled: boolean) => {
      if (!active) return;
      setReduceMotion(enabled);
      loop?.stop();
      if (enabled) {
        pulse.setValue(1);
        return;
      }
      loop = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 0, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      ]));
      loop.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => applyMotionPreference(enabled)).catch(() => applyMotionPreference(false));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', applyMotionPreference);
    return () => {
      active = false;
      subscription.remove();
      loop?.stop();
    };
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: reduceMotion ? 1 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
          transform: reduceMotion ? [] : [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.18] }) }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    alignSelf: 'center',
  },
});
