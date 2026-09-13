import { PropsWithChildren, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface PressableScaleProps extends PropsWithChildren<PressableProps> {
  style?: StyleProp<ViewStyle>;
  /** Resting scale of the inner content while pressed (0.9-1). */
  scaleTo?: number;
}

/**
 * Press feedback with a spring scale instead of an opacity blink.  The
 * spring is skipped entirely when the system reduce-motion preference is on,
 * in which case the component behaves like a plain Pressable.
 */
export function PressableScale({ children, style, scaleTo = 0.97, onPressIn, onPressOut, ...rest }: PressableScaleProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    const applyMotionPreference = (enabled: boolean) => {
      if (!active) return;
      setReduceMotion(enabled);
      if (enabled) scale.setValue(1);
    };
    try {
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => applyMotionPreference(enabled)).catch(() => applyMotionPreference(false));
    } catch {
      applyMotionPreference(false);
    }
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', applyMotionPreference);
    return () => {
      active = false;
      subscription.remove();
      scale.stopAnimation();
    };
  }, [scale]);

  const springTo = (value: number) => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: value,
      speed: 42,
      bounciness: 6,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  return (
    <Pressable
      {...rest}
      onPressIn={(event) => {
        springTo(scaleTo);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        springTo(1);
        onPressOut?.(event);
      }}>
      <Animated.View style={[style, { transform: reduceMotion ? [] : [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

