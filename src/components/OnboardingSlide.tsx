import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { ThemeColors } from '../theme';

const { width } = Dimensions.get('window');

interface SlideData {
  emoji: string;
  title: string;
  subtitle: string;
  bg: string;
  streakDemo?: boolean;
  isFinal?: boolean;
}

interface Props {
  slide: SlideData;
  colors: ThemeColors;
  streakAnim: Animated.Value;
}

export default function OnboardingSlide({ slide, colors, streakAnim }: Props) {
  return (
    <View style={[styles.slide, { width }]}>
      {/* gradient blob */}
      <View style={[styles.blob, { backgroundColor: slide.bg + '22' }]} />

      <View
        style={[
          styles.emojiCircle,
          { backgroundColor: slide.bg + '33', borderColor: slide.bg + '55' }
        ]}
      >
        <Text style={styles.emojiLarge}>{slide.emoji}</Text>
      </View>

      {slide.streakDemo && (
        <Animated.View
          style={[
            styles.streakBadge,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [
                {
                  scale: streakAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05]
                  })
                }
              ]
            }
          ]}
        >
          <Text style={styles.streakBadgeText}>🔥</Text>
          <View>
            <Text style={[styles.streakNum, { color: '#EF4444' }]}>23</Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </View>
        </Animated.View>
      )}

      <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{slide.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
    gap: SPACING.lg
  },

  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -60,
    opacity: 0.6
  },

  emojiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md
  },

  emojiLarge: {
    fontSize: 56
  },

  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderRadius: RADII.xl,
    borderWidth: 1,
    marginBottom: SPACING.md
  },

  streakBadgeText: {
    fontSize: 40
  },

  streakNum: {
    fontSize: TYPOGRAPHY['3xl'],
    fontWeight: TYPOGRAPHY.heavy,
    lineHeight: 40
  },

  streakLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium
  },

  title: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.heavy,
    textAlign: 'center',
    lineHeight: 36
  },

  subtitle: {
    fontSize: TYPOGRAPHY.md,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: TYPOGRAPHY.medium
  }
});
