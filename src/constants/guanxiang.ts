import { Platform } from 'react-native';

export const palette = {
  obsidian: '#050907',
  deepJade: '#081A16',
  jadeMist: '#143129',
  brass: '#C6A66B',
  paleBrass: '#E2C88E',
  ricePaper: '#E9E0CA',
  ashGreen: '#98A79F',
  patina: '#5D8F80',
  cinnabar: '#9F5143',
  white: '#FFFFFF',
  transparent: 'transparent',
  hairline: 'rgba(198, 166, 107, 0.22)',
  hairlineStrong: 'rgba(198, 166, 107, 0.42)',
  jadeGlow: 'rgba(60, 126, 105, 0.18)',
  brassGlow: 'rgba(198, 166, 107, 0.12)',
  veil: 'rgba(5, 9, 7, 0.72)',
} as const;

export const fontFamilies = {
  display: Platform.select({
    ios: 'Songti SC',
    web: 'STSong, Songti SC, Noto Serif SC, serif',
    default: 'serif',
  }),
  body: Platform.select({
    ios: 'PingFang SC',
    web: 'PingFang SC, Microsoft YaHei, system-ui, sans-serif',
    default: 'sans-serif',
  }),
  data: Platform.select({
    ios: 'DIN Alternate',
    web: 'DIN Alternate, SF Pro Rounded, system-ui, sans-serif',
    default: 'sans-serif',
  }),
} as const;

export const spacing = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x8: 32,
  x10: 40,
  x12: 48,
  x18: 72,
} as const;

export const radii = {
  input: 8,
  card: 14,
  panel: 20,
  pill: 999,
} as const;

export const layout = {
  maxWidth: 1120,
  readableWidth: 680,
  mobileGutter: 20,
  desktopGutter: 40,
  minTouch: 44,
} as const;

