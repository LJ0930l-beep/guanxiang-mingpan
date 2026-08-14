import '@/global.css';

import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { palette } from '@/constants/guanxiang';
import { AppProvider } from '@/state/app-context';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: palette.brass,
    background: palette.obsidian,
    card: palette.deepJade,
    text: palette.ricePaper,
    border: palette.hairline,
    notification: palette.cinnabar,
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <AppProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.obsidian } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
          <Stack.Screen name="profiles" />
          <Stack.Screen name="records" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="module/[slug]" />
        </Stack>
      </AppProvider>
    </ThemeProvider>
  );
}
