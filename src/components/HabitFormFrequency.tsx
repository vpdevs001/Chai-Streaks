import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import type { ThemeColors } from '../theme';
import type { FrequencyType } from '../db/types';
import Section from './Section';
import Label from './Label';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  colors: ThemeColors;
  color: string;
  frequency: FrequencyType;
  selectedDays: number[];
  targetCount: number;
  onFrequencyChange: (f: FrequencyType) => void;
  onToggleDay: (i: number) => void;
  onTargetCountChange: (n: number) => void;
}

export default function HabitFormFrequency({
  colors,
  color,
  frequency,
  selectedDays,
  targetCount,
  onFrequencyChange,
  onToggleDay,
  onTargetCountChange
}: Props) {
  return (
    <Section title="Frequency" colors={colors}>

      <View style={styles.freqRow}>
        {(['daily', 'weekly', 'custom'] as FrequencyType[]).map((f) => (
          <Pressable
            key={f}
            style={({ pressed }) => [
              styles.freqBtn,
              {
                backgroundColor: frequency === f ? color : colors.inputBg,
                borderColor: frequency === f ? color : colors.border,
                opacity: pressed ? 0.8 : 1
              }
            ]}
            onPress={() => onFrequencyChange(f)}
          >
            <Text
              style={[
                styles.freqBtnText,
                { color: frequency === f ? '#fff' : colors.textSecondary }
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {frequency === 'custom' && (
        <View style={styles.daysRow}>
          {DAYS.map((d, i) => (
            <Pressable
              key={d}
              style={({ pressed }) => [
                styles.dayBtn,
                {
                  backgroundColor: selectedDays.includes(i) ? color : colors.inputBg,
                  borderColor: selectedDays.includes(i) ? color : colors.border,
                  opacity: pressed ? 0.8 : 1
                }
              ]}
              onPress={() => onToggleDay(i)}
            >
              <Text
                style={[
                  styles.dayBtnText,
                  { color: selectedDays.includes(i) ? '#fff' : colors.textSecondary }
                ]}
              >
                {d}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Label label="Target Count (per period)" colors={colors} />
      <View style={styles.counterRow}>
        <Pressable
          style={({ pressed }) => [
            styles.counterBtn,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1
            }
          ]}
          onPress={() => onTargetCountChange(Math.max(1, targetCount - 1))}
        >
          <Text style={[styles.counterBtnText, { color: colors.text }]}>−</Text>
        </Pressable>
        <Text style={[styles.counterValue, { color: colors.text }]}>{targetCount}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.counterBtn,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1
            }
          ]}
          onPress={() => onTargetCountChange(targetCount + 1)}
        >
          <Text style={[styles.counterBtnText, { color: colors.text }]}>+</Text>
        </Pressable>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  freqRow: {
    flexDirection: 'row',
    gap: SPACING.sm
  },

  freqBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.lg,
    borderWidth: 1.5,
    alignItems: 'center'
  },

  freqBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },

  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },

  dayBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    borderWidth: 1.5
  },

  dayBtnText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold
  },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md
  },

  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  counterBtnText: {
    fontSize: 22,
    fontWeight: TYPOGRAPHY.bold,
    lineHeight: 28
  },

  counterValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.heavy,
    minWidth: 40,
    textAlign: 'center'
  }
});
