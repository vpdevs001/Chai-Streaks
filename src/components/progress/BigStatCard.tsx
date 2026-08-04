import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';

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
      <View style={[styles.chip, { backgroundColor: color + '1A' }]}>
        <Text style={styles.bigStatEmoji}>{emoji}</Text>
      </View>
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

  chip: {
    width: 46,
    height: 46,
    borderRadius: RADII.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2
  },

  bigStatEmoji: {
    fontSize: 24
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
