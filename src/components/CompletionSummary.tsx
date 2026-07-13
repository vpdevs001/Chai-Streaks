import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { DayBar } from '../hooks/useStats';

export default function CompletionSummary({ bars }: { bars: DayBar[] }) {
  const { colors } = useTheme();
  const totalPossible = bars.reduce((s, b) => s + b.total, 0);
  const totalDone = bars.reduce((s, b) => s + b.count, 0);
  const totalMissed = totalPossible - totalDone;
  const rate = totalPossible > 0 ? totalDone / totalPossible : 0;

  return (
    <View
      style={[styles.completionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.completionTitle, { color: colors.text }]}>Completion Breakdown</Text>
      <View style={styles.completionRow}>
        {/* Bar */}
        <View style={[styles.completionTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.completionFill,
              { width: `${rate * 100}%`, backgroundColor: colors.success }
            ]}
          />
        </View>
        <Text style={[styles.completionPct, { color: colors.primary }]}>
          {Math.round(rate * 100)}%
        </Text>
      </View>
      <View style={styles.completionLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Completed: {totalDone}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Missed: {totalMissed}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  completionCard: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md
  },

  completionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  },

  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },

  completionTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden'
  },

  completionFill: {
    height: '100%',
    borderRadius: 6
  },

  completionPct: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.heavy,
    minWidth: 48,
    textAlign: 'right'
  },

  completionLegend: {
    flexDirection: 'row',
    gap: SPACING.lg
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },

  legendText: {
    fontSize: TYPOGRAPHY.sm
  }
});
