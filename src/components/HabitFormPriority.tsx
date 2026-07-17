import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { ThemeColors } from '../theme';
import type { HabitPriority } from '../db/types';
import Section from './Section';

const PRIORITIES: { value: HabitPriority; label: string; emoji: string }[] = [
  { value: 'low', label: 'Low', emoji: '🌱' },
  { value: 'medium', label: 'Medium', emoji: '🔶' },
  { value: 'high', label: 'High', emoji: '🔥' }
];

/** Maps priority → a themed accent color, independent of the habit's own color. */
export function priorityColor(priority: HabitPriority, colors: ThemeColors): string {
  if (priority === 'high') return colors.danger;
  if (priority === 'low') return colors.textMuted;
  return colors.warning;
}

interface Props {
  colors: ThemeColors;
  priority: HabitPriority;
  onChange: (p: HabitPriority) => void;
}

export default function HabitFormPriority({ colors, priority, onChange }: Props) {
  return (
    <Section title="Priority" colors={colors}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Higher-priority habits count for more in your Chai Score — both the boost from keeping them
        up, and the hit from missing them.
      </Text>
      <View style={styles.row}>
        {PRIORITIES.map(({ value, label, emoji }) => {
          const active = priority === value;
          const accent = priorityColor(value, colors);
          return (
            <Pressable
              key={value}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: active ? accent : colors.inputBg,
                  borderColor: active ? accent : colors.border,
                  opacity: pressed ? 0.8 : 1
                }
              ]}
              onPress={() => onChange(value)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={[styles.btnText, { color: active ? '#fff' : colors.textSecondary }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: TYPOGRAPHY.xs,
    marginBottom: SPACING.sm,
    lineHeight: 16
  },

  row: {
    flexDirection: 'row',
    gap: SPACING.sm
  },

  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.lg,
    borderWidth: 1.5
  },

  emoji: {
    fontSize: 14
  },

  btnText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  }
});
