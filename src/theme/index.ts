// ─── colors ──────────────────────────────────────────────────────────────────

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
    skeleton: '#262626',
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
    skeleton: '#E5E5E5',
  },
} as const;

export type ColorScheme = 'dark' | 'light';
export type ThemeColors = typeof Colors.dark;

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
  '🧹',
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
];
