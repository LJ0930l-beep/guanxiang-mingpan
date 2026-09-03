import '@/global.css';

import { useEffect } from 'react';
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
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return undefined;
    const navigatorWithServiceWorker = window.navigator as Navigator & { serviceWorker?: ServiceWorkerContainer };
    navigatorWithServiceWorker.serviceWorker?.register('/sw.js').catch(() => {
      // Offline support is progressive enhancement; local-first storage remains available if registration fails.
    });
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.webmanifest';
    document.head.appendChild(manifest);
    return () => manifest.remove();
  }, []);

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
