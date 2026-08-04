import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';

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
    <View style={[styles.statCard, { backgroundColor: bg, borderColor: colors.border }]}>
      <View style={[styles.chip, { backgroundColor: color + '1A' }]}>
        <Text style={styles.statEmoji}>{emoji}</Text>
      </View>
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
    gap: 3
  },

  chip: {
    width: 38,
    height: 38,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2
  },

  statEmoji: {
    fontSize: 19
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
