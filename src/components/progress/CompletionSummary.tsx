import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import type { DayBar } from '../../hooks/useStats';

function RateBar({
  label,
  rate,
  fillColor,
  pctColor
}: {
  label: string;
  rate: number;
  fillColor: string;
  pctColor: string;
}) {
  const { colors } = useTheme();
  return (
    <>
      <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.completionRow}>
        <View style={[styles.completionTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.completionFill,
              { width: `${Math.min(rate * 100, 100)}%`, backgroundColor: fillColor }
            ]}
          />
        </View>
        <Text style={[styles.completionPct, { color: pctColor }]}>{Math.round(rate * 100)}%</Text>
      </View>
    </>
  );
}

export default function CompletionSummary({ bars }: { bars: DayBar[] }) {
  const { colors } = useTheme();

  const totalPossible = bars.reduce((s, b) => s + b.total, 0);
  const totalDone = bars.reduce((s, b) => s + b.count, 0);
  const totalSkipped = bars.reduce((s, b) => s + b.skipped, 0);
  const totalMissed = Math.max(0, totalPossible - totalDone - totalSkipped);

  const completionRate = totalPossible > 0 ? totalDone / totalPossible : 0;
  const failureRate = totalPossible > 0 ? totalSkipped / totalPossible : 0;
  const missedRate = totalPossible > 0 ? totalMissed / totalPossible : 0;

  return (
    <View
      style={[styles.completionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.completionTitle, { color: colors.text }]}>Completion Breakdown</Text>

      <RateBar
        label="Completion Rate"
        rate={completionRate}
        fillColor={colors.success}
        pctColor={colors.success}
      />

      <RateBar
        label="Failure Rate"
        rate={failureRate}
        fillColor={colors.danger}
        pctColor={colors.danger}
      />

      <RateBar
        label="Missed Rate"
        rate={missedRate}
        fillColor={colors.textMuted}
        pctColor={colors.textMuted}
      />

      {/* Legend */}
      <View style={styles.completionLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Done: {totalDone}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Skipped: {totalSkipped}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
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

  barLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    marginBottom: -2
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
    gap: SPACING.lg,
    flexWrap: 'wrap'
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
