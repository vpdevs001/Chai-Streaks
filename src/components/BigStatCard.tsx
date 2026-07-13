import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';

const { width } = Dimensions.get('window');

export default function BigStatCard({
  emoji,
  label,
  value,
  sub,
  color
}: {
  emoji: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.bigStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={styles.bigStatEmoji}>{emoji}</Text>
      <Text style={[styles.bigStatValue, { color }]}>{value}</Text>
      <Text style={[styles.bigStatLabel, { color: colors.textSecondary }]}>{label}</Text>
      {sub && <Text style={[styles.bigStatSub, { color: colors.textMuted }]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bigStat: {
    width: (width - SPACING.base * 2 - SPACING.sm) / 2,
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    alignItems: 'flex-start',
    gap: 3
  },

  bigStatEmoji: {
    fontSize: 28,
    marginBottom: 2
  },

  bigStatValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.heavy
  },

  bigStatLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium
  },

  bigStatSub: {
    fontSize: TYPOGRAPHY.xs
  }
});
