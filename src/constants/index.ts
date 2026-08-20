export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48
} as const;

export const RADII = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 999
} as const;

export const FONTS = {
  sketch: 'Caveat_700Bold',
  sketchSemiBold: 'Caveat_600SemiBold',
  sketchRegular: 'Caveat_400Regular',
  handwritten: 'PatrickHand_400Regular',
  wavy: 'Kalam_700Bold',
  wavyRegular: 'Kalam_400Regular'
} as const;

export const TYPOGRAPHY = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const
} as const;

export const SLIDES = [
  {
    emoji: '🌱',
    title: 'Build Tiny Habits\nThat Actually Stick',
    subtitle: 'Consistency beats motivation.\nSmall steps, big changes.',
    bg: '#FF8A3D'
  },
  {
    emoji: '🔥',
    title: 'Track Your Streaks',
    subtitle: "Watch your streak grow every day.\nDon't break the chain.",
    bg: '#EF4444',
    streakDemo: true
  },
  {
    emoji: '☕',
    title: 'One Cup At A Time',
    subtitle: 'Build habits one chai at a time.\nReady to start?',
    bg: '#F59E0B',
    isFinal: true
  }
];
