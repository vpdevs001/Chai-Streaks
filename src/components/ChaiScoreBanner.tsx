import { View, Text, StyleSheet } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { ThemeColors } from '../theme';
import { chaiScoreLabel, chaiScoreEmoji } from '../utils/chaiScore';

interface Props {
  colors: ThemeColors;
  chaiScore: number;
}

export default function ChaiScoreBanner({ colors, chaiScore }: Props) {
  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.primary + '15', borderColor: colors.primary + '33' }
      ]}
    >
      <Text style={styles.emoji}>{chaiScoreEmoji(chaiScore)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.score, { color: colors.primary }]}>{chaiScore}/100</Text>
        <Text style={[styles.label, { color: colors.text }]}>{chaiScoreLabel(chaiScore)}</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>Your Chai Score</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { height: `${chaiScore}%`, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: RADII.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.base
  },

  emoji: {
    fontSize: 36
  },

  score: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.heavy
  },

  label: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold
  },

  sub: {
    fontSize: TYPOGRAPHY.xs
  },

  track: {
    width: 8,
    height: 64,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },

  fill: {
    width: '100%',
    borderRadius: 4
  }
});
