import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';

interface ActionButtonProps extends PressableProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet';
  loading?: boolean;
}

export function ActionButton({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  accessibilityState,
  ...props
}: ActionButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: loading || accessibilityState?.busy,
        disabled: isDisabled || accessibilityState?.disabled,
      }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}>
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            accessibilityElementsHidden
            color={variant === 'primary' ? palette.obsidian : palette.brass}
            importantForAccessibility="no-hide-descendants"
          />
        )}
        <Text style={[styles.label, styles[`${variant}Label`]]}>{children}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouch,
    borderRadius: radii.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.x5,
    paddingVertical: spacing.x3,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: palette.brass,
    borderColor: palette.brass,
  },
  secondary: {
    backgroundColor: palette.deepJade,
    borderColor: palette.hairlineStrong,
  },
  quiet: {
    backgroundColor: palette.transparent,
    borderColor: palette.hairline,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.x2,
  },
  label: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  primaryLabel: {
    color: palette.obsidian,
  },
  secondaryLabel: {
    color: palette.ricePaper,
  },
  quietLabel: {
    color: palette.ashGreen,
  },
});
