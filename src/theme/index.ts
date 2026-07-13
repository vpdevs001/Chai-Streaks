// ─────────────────────────────────────────────────────────────────────────────
//  theme/index.ts  –  Aesthetics design system: colors, themes, presets
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  dark: {
    background: '#0D0D0D',
    surface: '#171717',
    card: '#1F1F1F',
    cardActive: '#2A2A2A',
    primary: '#FF8A3D',
    primaryHover: '#FF9C5A',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#F5F5F5',
    textSecondary: '#A3A3A3',
    textMuted: '#525252',
    border: '#2A2A2A',
    borderSubtle: '#1F1F1F',
    overlay: 'rgba(0,0,0,0.75)',
    tabBar: '#0D0D0D',
    tabBarBorder: '#1F1F1F',
    inputBg: '#1F1F1F',
    skeleton: '#262626'
  },
  light: {
    background: '#FAFAF8',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#FFF7F0',
    primary: '#F97316',
    primaryHover: '#FB923C',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#171717',
    textSecondary: '#737373',
    textMuted: '#A3A3A3',
    border: '#E5E5E5',
    borderSubtle: '#F5F5F5',
    overlay: 'rgba(0,0,0,0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E5E5',
    inputBg: '#F5F5F5',
    skeleton: '#E5E5E5'
  },
  forest_dark: {
    background: '#060F0B',
    surface: '#0C1A14',
    card: '#12241C',
    cardActive: '#1B3428',
    primary: '#22C55E',
    primaryHover: '#4ADE80',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#ECFDF5',
    textSecondary: '#A7F3D0',
    textMuted: '#10B98188',
    border: '#1B3428',
    borderSubtle: '#12241C',
    overlay: 'rgba(0,0,0,0.8)',
    tabBar: '#060F0B',
    tabBarBorder: '#12241C',
    inputBg: '#12241C',
    skeleton: '#1B3428'
  },
  forest_light: {
    background: '#F0FDF4',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#DCFCE7',
    primary: '#15803D',
    primaryHover: '#166534',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#14532D',
    textSecondary: '#166534',
    textMuted: '#86EFAC',
    border: '#BBF7D0',
    borderSubtle: '#DCFCE7',
    overlay: 'rgba(0,0,0,0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#BBF7D0',
    inputBg: '#F0FDF4',
    skeleton: '#E8F5E9'
  },
  ocean_dark: {
    background: '#030712',
    surface: '#0F172A',
    card: '#1E293B',
    cardActive: '#334155',
    primary: '#0EA5E9',
    primaryHover: '#38BDF8',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#475569',
    border: '#334155',
    borderSubtle: '#1E293B',
    overlay: 'rgba(0,0,0,0.8)',
    tabBar: '#030712',
    tabBarBorder: '#1E293B',
    inputBg: '#1E293B',
    skeleton: '#334155'
  },
  ocean_light: {
    background: '#F0F9FF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#E0F2FE',
    primary: '#0284C7',
    primaryHover: '#0369A1',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#0369A1',
    textSecondary: '#0EA5E9',
    textMuted: '#BAE6FD',
    border: '#7DD3FC',
    borderSubtle: '#E0F2FE',
    overlay: 'rgba(0,0,0,0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#7DD3FC',
    inputBg: '#F0F9FF',
    skeleton: '#E1F5FE'
  },
  lavender_dark: {
    background: '#09050F',
    surface: '#120A21',
    card: '#1B0F33',
    cardActive: '#261647',
    primary: '#A855F7',
    primaryHover: '#C084FC',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#F3E8FF',
    textSecondary: '#C084FC',
    textMuted: '#581C87',
    border: '#261647',
    borderSubtle: '#1B0F33',
    overlay: 'rgba(0,0,0,0.8)',
    tabBar: '#09050F',
    tabBarBorder: '#1B0F33',
    inputBg: '#1B0F33',
    skeleton: '#261647'
  },
  lavender_light: {
    background: '#FAF5FF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#F3E8FF',
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#4C1D95',
    textSecondary: '#7C3AED',
    textMuted: '#E9D5FF',
    border: '#E9D5FF',
    borderSubtle: '#F3E8FF',
    overlay: 'rgba(0,0,0,0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E9D5FF',
    inputBg: '#FAF5FF',
    skeleton: '#EDE7F6'
  },
  sunset_dark: {
    background: '#0F050B',
    surface: '#210A18',
    card: '#300F22',
    cardActive: '#421430',
    primary: '#F43F5E',
    primaryHover: '#FB7185',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#FFE4E6',
    textSecondary: '#FB7185',
    textMuted: '#881337',
    border: '#421430',
    borderSubtle: '#300F22',
    overlay: 'rgba(0,0,0,0.8)',
    tabBar: '#0F050B',
    tabBarBorder: '#300F22',
    inputBg: '#300F22',
    skeleton: '#421430'
  },
  sunset_light: {
    background: '#FFF1F2',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardActive: '#FFE4E6',
    primary: '#DB2777',
    primaryHover: '#BE185D',
    success: '#16A34A',
    danger: '#DC2626',
    warning: '#D97706',
    text: '#831843',
    textSecondary: '#DB2777',
    textMuted: '#FECDD3',
    border: '#FECDD3',
    borderSubtle: '#FFE4E6',
    overlay: 'rgba(0,0,0,0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#FECDD3',
    inputBg: '#FFF1F2',
    skeleton: '#FCE4EC'
  },
  midnight_sky: {
    background: '#030303',
    surface: '#09090E',
    card: '#12121E',
    cardActive: '#1B1B2F',
    primary: '#6366F1',
    primaryHover: '#818CF8',
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    text: '#EEF2F6',
    textSecondary: '#A5B4FC',
    textMuted: '#312E81',
    border: '#1B1B2F',
    borderSubtle: '#12121E',
    overlay: 'rgba(0,0,0,0.9)',
    tabBar: '#030303',
    tabBarBorder: '#12121E',
    inputBg: '#12121E',
    skeleton: '#1B1B2F'
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
    textMuted: '#4C566A',
    border: '#4C566A',
    borderSubtle: '#434C5E',
    overlay: 'rgba(0,0,0,0.85)',
    tabBar: '#2E3440',
    tabBarBorder: '#434C5E',
    inputBg: '#434C5E',
    skeleton: '#4C566A'
  }
} as const;

export type ColorScheme = 'dark' | 'light';
export type ThemeColors = {
  [K in keyof typeof Colors.dark]: string;
};

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
