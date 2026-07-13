import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';

export default function StatCard({
  emoji,
  label,
  value,
  color,
  bg
}: {
  emoji: string;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    borderRadius: RADII.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 2
  },

  statEmoji: {
    fontSize: 22
  },

  statValue: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.heavy
  },

  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium
  }
});
