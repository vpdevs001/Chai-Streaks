// ─────────────────────────────────────────────────────────────────────────────
//  theme/index.ts  –  Aesthetics design system: colors, themes, presets
//
//  Single source of truth for theming:
//   • `Colors`         – every palette, keyed by theme name
//   • `THEME_REGISTRY` – per-theme metadata (display label, emoji, dark flag)
//                        used by the ThemePicker and ThemeContext so new themes
//                        only ever need to be added HERE.
// ─────────────────────────────────────────────────────────────────────────────

// ─── palettes ────────────────────────────────────────────────────────────────

export const Colors = {
  dark: {
    background: '#0D0D0F',
    surface: '#161619',
    card: '#1E1E22',
    cardActive: '#2A2A30',
    primary: '#FF8A3D',
    primaryHover: '#FF9C5A',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#F5F5F5',
    textSecondary: '#A3A3A3',
    textMuted: '#5C5C66',
    border: '#2A2A30',
    borderSubtle: '#1E1E22',
    overlay: 'rgba(0,0,0,0.75)',
    tabBar: '#0D0D0F',
    tabBarBorder: '#1E1E22',
    inputBg: '#1E1E22',
    skeleton: '#26262C'
  },
  light: {
    background: '#FAFAF7',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#FFF1E6',
    primary: '#F97316',
    primaryHover: '#FB923C',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#171717',
    textSecondary: '#737373',
    textMuted: '#A6A29B',
    border: '#E8E6E1',
    borderSubtle: '#F3F2EF',
    overlay: 'rgba(0,0,0,0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E8E6E1',
    inputBg: '#F4F3F0',
    skeleton: '#E9E7E2'
  },
  forest_dark: {
    background: '#07130D',
    surface: '#0D1F16',
    card: '#132A1F',
    cardActive: '#1C3D2C',
    primary: '#34D399',
    primaryHover: '#6EE7B7',
    success: '#4ADE80',
    danger: '#F87171',
    warning: '#FBBF24',
    text: '#ECFDF5',
    textSecondary: '#8FCEAA',
    textMuted: '#4E7A5F',
    border: '#1C3D2C',
    borderSubtle: '#132A1F',
    overlay: 'rgba(0,0,0,0.8)',
    tabBar: '#07130D',
    tabBarBorder: '#132A1F',
    inputBg: '#132A1F',
    skeleton: '#1C3D2C'
  },
  forest_light: {
    background: '#F2FBF4',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#DDF7E6',
    primary: '#15803D',
    primaryHover: '#166534',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#14341F',
    textSecondary: '#3F6B4F',
    textMuted: '#7FA98C',
    border: '#C6EBD2',
    borderSubtle: '#E4F7EA',
    overlay: 'rgba(20,52,31,0.4)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#C6EBD2',
    inputBg: '#F2FAF4',
    skeleton: '#DFF2E4'
  },
  ocean_dark: {
    background: '#050D1A',
    surface: '#0B1B2E',
    card: '#10253C',
    cardActive: '#1A3855',
    primary: '#38BDF8',
    primaryHover: '#7DD3FC',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    text: '#EDF6FD',
    textSecondary: '#9DBDD6',
    textMuted: '#4E6B84',
    border: '#1A3855',
    borderSubtle: '#10253C',
    overlay: 'rgba(0,0,0,0.8)',
    tabBar: '#050D1A',
    tabBarBorder: '#10253C',
    inputBg: '#10253C',
    skeleton: '#1A3855'
  },
  ocean_light: {
    background: '#F2F9FE',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#E1F2FD',
    primary: '#0284C7',
    primaryHover: '#0369A1',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#0C3A54',
    textSecondary: '#3E6E8F',
    textMuted: '#8AB4CB',
    border: '#BBDEF0',
    borderSubtle: '#E1F2FD',
    overlay: 'rgba(12,58,84,0.4)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#BBDEF0',
    inputBg: '#F0F8FD',
    skeleton: '#D9EDF9'
  },
  lavender_dark: {
    background: '#0C0714',
    surface: '#150B26',
    card: '#1E1136',
    cardActive: '#2C1A4E',
    primary: '#A78BFA',
    primaryHover: '#C4B5FD',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    text: '#F5F0FF',
    textSecondary: '#C4AEE8',
    textMuted: '#6B5394',
    border: '#2C1A4E',
    borderSubtle: '#1E1136',
    overlay: 'rgba(0,0,0,0.8)',
    tabBar: '#0C0714',
    tabBarBorder: '#1E1136',
    inputBg: '#1E1136',
    skeleton: '#2C1A4E'
  },
  lavender_light: {
    background: '#FAF7FE',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#F3EBFD',
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#3B1A66',
    textSecondary: '#6D4AA3',
    textMuted: '#A78BD1',
    border: '#E3D6F7',
    borderSubtle: '#F3EBFD',
    overlay: 'rgba(59,26,102,0.4)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E3D6F7',
    inputBg: '#F8F4FD',
    skeleton: '#EDE3FA'
  },
  sunset_dark: {
    background: '#17070C',
    surface: '#250C14',
    card: '#33101D',
    cardActive: '#4A182A',
    primary: '#FB7185',
    primaryHover: '#FDA4AF',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    text: '#FFF1F3',
    textSecondary: '#F0A9B6',
    textMuted: '#8A4A5C',
    border: '#4A182A',
    borderSubtle: '#33101D',
    overlay: 'rgba(0,0,0,0.8)',
    tabBar: '#17070C',
    tabBarBorder: '#33101D',
    inputBg: '#33101D',
    skeleton: '#4A182A'
  },
  sunset_light: {
    background: '#FFF5F6',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#FFE9EC',
    primary: '#E11D48',
    primaryHover: '#BE123C',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#5B1226',
    textSecondary: '#9A3A54',
    textMuted: '#D48CA0',
    border: '#F8CFD8',
    borderSubtle: '#FFE9EC',
    overlay: 'rgba(91,18,38,0.4)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#F8CFD8',
    inputBg: '#FDF3F4',
    skeleton: '#FBDCE2'
  },
  midnight_sky: {
    background: '#020204',
    surface: '#0A0A12',
    card: '#12121E',
    cardActive: '#1D1D33',
    primary: '#818CF8',
    primaryHover: '#A5B4FC',
    success: '#34D399',
    danger: '#F87171',
    warning: '#FBBF24',
    text: '#EEF1FA',
    textSecondary: '#A5B4FC',
    textMuted: '#4A4A78',
    border: '#1D1D33',
    borderSubtle: '#12121E',
    overlay: 'rgba(0,0,0,0.9)',
    tabBar: '#020204',
    tabBarBorder: '#12121E',
    inputBg: '#12121E',
    skeleton: '#1D1D33'
  },
  nord: {
    background: '#2E3440',
    surface: '#3B4252',
    card: '#434C5E',
    cardActive: '#4C566A',
    primary: '#88C0D0',
    primaryHover: '#8FBCBB',
    success: '#A3BE8C',
    danger: '#BF616A',
    warning: '#EBCB8B',
    text: '#ECEFF4',
    textSecondary: '#D8DEE9',
    textMuted: '#616E88',
    border: '#4C566A',
    borderSubtle: '#3B4252',
    overlay: 'rgba(0,0,0,0.85)',
    tabBar: '#2E3440',
    tabBarBorder: '#434C5E',
    inputBg: '#434C5E',
    skeleton: '#4C566A'
  },
  // ── new: signature brand theme — warm chai/cream tones ────────────────────
  masala_chai: {
    background: '#FBF3E7',
    surface: '#FFFDF8',
    card: '#FFFDF8',
    cardActive: '#FBEEDA',
    primary: '#C2703D',
    primaryHover: '#A85E2E',
    success: '#5C8A3A',
    danger: '#C2453A',
    warning: '#D98E2B',
    text: '#3E2C1C',
    textSecondary: '#8A6F55',
    textMuted: '#BFA98C',
    border: '#EBDCC4',
    borderSubtle: '#F5EBD8',
    overlay: 'rgba(62,44,28,0.45)',
    tabBar: '#FFFDF8',
    tabBarBorder: '#EBDCC4',
    inputBg: '#F7EFDF',
    skeleton: '#F0E3CC'
  },
  // ── new: true-black OLED theme ─────────────────────────────────────────────
  amoled: {
    background: '#000000',
    surface: '#0E0E10',
    card: '#141416',
    cardActive: '#232326',
    primary: '#FF8A3D',
    primaryHover: '#FFA25E',
    success: '#4ADE80',
    danger: '#F87171',
    warning: '#FBBF24',
    text: '#FAFAFA',
    textSecondary: '#A8A8B0',
    textMuted: '#585860',
    border: '#232326',
    borderSubtle: '#141416',
    overlay: 'rgba(0,0,0,0.9)',
    tabBar: '#000000',
    tabBarBorder: '#141416',
    inputBg: '#141416',
    skeleton: '#1C1C1F'
  },
  // ── new: soft cherry-blossom light theme ──────────────────────────────────
  sakura: {
    background: '#FFF7F8',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#FDECEF',
    primary: '#E15A7A',
    primaryHover: '#C94364',
    success: '#4C9A6D',
    danger: '#D4453C',
    warning: '#DE8F3C',
    text: '#4C2430',
    textSecondary: '#94626F',
    textMuted: '#CBA6AF',
    border: '#F3D5DB',
    borderSubtle: '#FBE9ED',
    overlay: 'rgba(76,36,48,0.4)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#F3D5DB',
    inputBg: '#FBF0F2',
    skeleton: '#F6DEE4'
  },
  // ── new: warm coffee-house dark theme ──────────────────────────────────────
  mocha: {
    background: '#140E0A',
    surface: '#1E1610',
    card: '#291E14',
    cardActive: '#3A2B1D',
    primary: '#E3A05C',
    primaryHover: '#EFBB7E',
    success: '#8FBC72',
    danger: '#E06555',
    warning: '#E3A05C',
    text: '#F6EBDD',
    textSecondary: '#C9AE91',
    textMuted: '#7A6249',
    border: '#3A2B1D',
    borderSubtle: '#291E14',
    overlay: 'rgba(0,0,0,0.85)',
    tabBar: '#140E0A',
    tabBarBorder: '#291E14',
    inputBg: '#291E14',
    skeleton: '#3A2B1D'
  },
  // ── new: neon teal-on-violet night theme ───────────────────────────────────
  cyberpunk: {
    background: '#08040F',
    surface: '#100A1E',
    card: '#171029',
    cardActive: '#241A3F',
    primary: '#00E5D4',
    primaryHover: '#5CF2E5',
    success: '#00E5A0',
    danger: '#FF2E88',
    warning: '#FFE14D',
    text: '#EAF9F6',
    textSecondary: '#8FD9CE',
    textMuted: '#3F8A80',
    border: '#241A3F',
    borderSubtle: '#171029',
    overlay: 'rgba(4,2,10,0.9)',
    tabBar: '#08040F',
    tabBarBorder: '#171029',
    inputBg: '#171029',
    skeleton: '#241A3F'
  }
} as const;

export type ColorScheme = 'dark' | 'light';
export type ThemeColors = {
  [K in keyof typeof Colors.dark]: string;
};

/** Every selectable theme (the 'system' pseudo-theme is not a palette). */
export type ThemeName = keyof typeof Colors;

// ─── theme registry (metadata the UI needs per theme) ───────────────────────

export interface ThemeMeta {
  /** Human-readable name shown in the ThemePicker. */
  label: string;
  emoji: string;
  /** true → dark palette, false → light palette, null → follows the OS. */
  isDark: boolean | null;
}

export const THEME_REGISTRY: Record<ThemeName | 'system', ThemeMeta> = {
  system: { label: 'System', emoji: '⚙️', isDark: null },
  light: { label: 'Classic Light', emoji: '☀️', isDark: false },
  dark: { label: 'Classic Dark', emoji: '🌙', isDark: true },
  amoled: { label: 'AMOLED', emoji: '🖤', isDark: true },
  masala_chai: { label: 'Masala Chai', emoji: '☕', isDark: false },
  forest_light: { label: 'Forest Light', emoji: '🌲', isDark: false },
  forest_dark: { label: 'Forest Dark', emoji: '🌳', isDark: true },
  ocean_light: { label: 'Ocean Light', emoji: '🌊', isDark: false },
  ocean_dark: { label: 'Ocean Dark', emoji: '🐳', isDark: true },
  lavender_light: { label: 'Lavender', emoji: '🪻', isDark: false },
  lavender_dark: { label: 'Twilight', emoji: '🔮', isDark: true },
  sunset_light: { label: 'Sunrise', emoji: '🌸', isDark: false },
  sunset_dark: { label: 'Sunset', emoji: '🌇', isDark: true },
  midnight_sky: { label: 'Midnight', emoji: '🌌', isDark: true },
  nord: { label: 'Nord', emoji: '❄️', isDark: true },
  sakura: { label: 'Sakura', emoji: '🌺', isDark: false },
  mocha: { label: 'Mocha', emoji: '🍫', isDark: true },
  cyberpunk: { label: 'Cyberpunk', emoji: '🌃', isDark: true }
};

/** Light & dark theme names in registry order — drives the ThemePicker layout. */
export const LIGHT_THEMES = (Object.keys(THEME_REGISTRY) as (ThemeName | 'system')[]).filter(
  (k): k is ThemeName => k !== 'system' && THEME_REGISTRY[k].isDark === false
);
export const DARK_THEMES = (Object.keys(THEME_REGISTRY) as (ThemeName | 'system')[]).filter(
  (k): k is ThemeName => k !== 'system' && THEME_REGISTRY[k].isDark === true
);

// ─── habit color presets ─────────────────────────────────────────────────────

export const HABIT_COLORS = [
  '#FF8A3D', // orange
  '#22C55E', // green
  '#F59E0B', // amber
  '#EC4899', // pink
  '#EF4444', // red
  '#14B8A6', // teal
  '#8B5CF6', // violet
  '#3B82F6', // blue
  '#F97316', // deep orange
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#A855F7', // purple
  '#6366F1', // indigo
  '#D946EF', // fuchsia
  '#84CC16', // lime
  '#0EA5E9', // sky
  '#F43F5E', // rose
  '#475569', // slate
  '#0284C7', // light blue
  '#16A34A', // dark green
  '#B91C1C', // dark red
  '#7C3AED', // dark violet
  '#C084FC', // soft purple
  '#FB7185' // coral/rose
];

// ─── preset icons ────────────────────────────────────────────────────────────

export const PRESET_ICONS = [
  '🏃',
  '💪',
  '📚',
  '🧘',
  '💧',
  '🥗',
  '😴',
  '✍️',
  '🎯',
  '🎨',
  '🎵',
  '💊',
  '🧠',
  '🌿',
  '☀️',
  '🚴',
  '🏋️',
  '🍎',
  '📝',
  '🙏',
  '💻',
  '🐕',
  '🌙',
  '❤️',
  '🤸',
  '☕',
  '🧹',
  '📖',
  '🎸',
  '🏊',
  '🌱',
  '🦷',
  '🛁',
  '🌞',
  '⭐',
  '🏅',
  '🎖️',
  '🔥',
  '⚡',
  '🚶',
  '🚶‍♀️',
  '🚶‍♂️',
  '🚭',
  '🥛',
  '🍵',
  '💰',
  '💼',
  '🎓',
  '🧸',
  '🚿',
  '🧼',
  '🧘‍♀️',
  '🧘‍♂️',
  '🧗',
  '🧗‍♀️',
  '🛹',
  '🚴‍♀️',
  '🚴‍♂️',
  '🏓',
  '🏸'
];
