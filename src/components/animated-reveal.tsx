import { PropsWithChildren, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';

interface AnimatedRevealProps extends PropsWithChildren {
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedReveal({ children, delay = 0, distance = 12, style }: AnimatedRevealProps) {
  const [progress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;

    const applyMotionPreference = (enabled: boolean) => {
      if (!active) return;
      setReduceMotion(enabled);
      animation?.stop();
      if (enabled) {
        progress.setValue(1);
        return;
      }

      animation = Animated.timing(progress, {
        toValue: 1,
        duration: 360,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      });
      animation.start();
    };

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      applyMotionPreference(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', applyMotionPreference);

    return () => {
      active = false;
      subscription.remove();
      animation?.stop();
      progress.stopAnimation();
    };
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        reduceMotion
          ? undefined
          : {
              opacity: progress,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
            },
      ]}>
      {children}
    </Animated.View>
  );
}
