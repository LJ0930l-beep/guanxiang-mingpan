import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Href, usePathname, useRouter } from 'expo-router';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const items: { label: string; href: Href; icon: IconName }[] = [
  { label: '观象', href: '/home', icon: 'compass-outline' },
  { label: '命主', href: '/profiles', icon: 'account-multiple-outline' },
  { label: '记录', href: '/records', icon: 'history' },
  { label: '我的', href: '/settings', icon: 'account-outline' },
];

export function BottomDock() {
  const pathname = usePathname();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktopRail = width >= 1280;

  return (
    <View style={[styles.wrap, isDesktopRail && styles.wrapDesktop]}>
      <View accessibilityLabel="主导航" accessibilityRole="tablist" style={[styles.dock, isDesktopRail && styles.dockDesktop]}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Pressable
              accessibilityLabel={`前往${item.label}`}
              accessibilityHint={active ? '当前页面' : `打开${item.label}页面`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              testID={`bottom-dock-${item.label}`}
              key={item.label}
              onPress={() => {
                if (!active) router.replace(item.href);
              }}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <View style={[styles.marker, active && styles.markerActive]} />
              <MaterialCommunityIcons
                accessibilityElementsHidden
                color={active ? palette.paleBrass : palette.ashGreen}
                importantForAccessibility="no-hide-descendants"
                name={item.icon}
                size={20}
              />
              <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.x4,
    alignItems: 'center',
    paddingHorizontal: layout.mobileGutter,
  },
  wrapDesktop: {
    width: 76,
    left: 20,
    right: 'auto',
    top: '28%',
    bottom: 'auto',
    paddingHorizontal: 0,
  },
  dock: {
    width: '100%',
    maxWidth: 520,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: palette.hairline,
    borderRadius: radii.panel,
    backgroundColor: 'rgba(8, 26, 22, 0.96)',
    paddingHorizontal: spacing.x3,
  },
  dockDesktop: {
    width: 76,
    minHeight: 312,
    flexDirection: 'column',
    paddingHorizontal: spacing.x2,
    paddingVertical: spacing.x4,
  },
  item: {
    minWidth: 58,
    minHeight: layout.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.x1,
  },
  marker: { width: 14, height: 2, borderRadius: 1, backgroundColor: palette.transparent },
  markerActive: { backgroundColor: palette.brass },
  label: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, letterSpacing: 1 },
  labelActive: { color: palette.ricePaper },
  pressed: { opacity: 0.65 },
});
