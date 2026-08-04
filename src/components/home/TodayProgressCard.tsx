import { View, Text, StyleSheet } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import type { ThemeColors } from '../../theme';
import ProgressRing from './ProgressRing';

interface Props {
  colors: ThemeColors;
  completedCount: number;
  totalCount: number;
  completionRate: number;
}

export default function TodayProgressCard({
  colors,
  completedCount,
  totalCount,
  completionRate
}: Props) {
  const allDone = totalCount > 0 && completedCount === totalCount;
  const hint =
    totalCount === 0
      ? 'Add a habit below to get started'
      : allDone
        ? 'All done — chai time! ☕'
        : `${totalCount - completedCount} remaining`;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: allDone ? colors.primary + '14' : colors.card,
          borderColor: allDone ? colors.primary + '44' : colors.border
        }
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.text }]}>Today's Progress</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {completedCount} of {totalCount} habits done
        </Text>
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.barFill,
              { backgroundColor: colors.primary, width: `${completionRate * 100}%` }
            ]}
          />
        </View>
        <Text style={[styles.hint, { color: allDone ? colors.primary : colors.textMuted }]}>
          {hint}
        </Text>
      </View>
      <ProgressRing rate={completionRate} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADII.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
    gap: SPACING.md
  },

  left: {
    flex: 1,
    gap: SPACING.xs
  },

  title: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold
  },

  sub: {
    fontSize: TYPOGRAPHY.sm
  },

  barTrack: {
    height: 6,
    borderRadius: 3,
    marginVertical: SPACING.xs
  },

  barFill: {
    height: 6,
    borderRadius: 3
  },

  hint: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold
  }
});
