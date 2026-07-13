import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SPACING, RADII, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../theme';
import type { AppTheme } from '../db/preferences';

const OPTIONS: { label: string; value: AppTheme; emoji: string }[] = [
  { label: 'System', value: 'system', emoji: '⚙️' },
  { label: 'Light', value: 'light', emoji: '☀️' },
  { label: 'Dark', value: 'dark', emoji: '🌙' },
  { label: 'Forest L', value: 'forest_light', emoji: '🌲' },
  { label: 'Forest D', value: 'forest_dark', emoji: '🌳' },
  { label: 'Ocean L', value: 'ocean_light', emoji: '🌊' },
  { label: 'Ocean D', value: 'ocean_dark', emoji: '🐳' },
  { label: 'Lavender L', value: 'lavender_light', emoji: '🪻' },
  { label: 'Lavender D', value: 'lavender_dark', emoji: '🔮' },
  { label: 'Sunset L', value: 'sunset_light', emoji: '🌸' },
  { label: 'Sunset D', value: 'sunset_dark', emoji: '🌇' },
  { label: 'Midnight', value: 'midnight_sky', emoji: '🌌' },
  { label: 'Nord', value: 'nord', emoji: '❄️' }
];

export default function ThemePicker() {
  const { colors, preference, setPreference } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Select App Theme</Text>
      <View style={styles.grid}>
        {OPTIONS.map((opt) => {
          const active = preference === opt.value;

          let previewBg = '#fff';
          let previewPrimary = '#000';
          if (opt.value === 'system') {
            previewBg = colors.background;
            previewPrimary = colors.primary;
          } else {
            previewBg = Colors[opt.value].background;
            previewPrimary = Colors[opt.value].primary;
          }

          return (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderWidth: active ? 2 : 1
                },
                { opacity: pressed ? 0.8 : 1 }
              ]}
              onPress={() => setPreference(opt.value)}
            >
              <View style={styles.topRow}>
                <Text style={styles.emoji}>{opt.emoji}</Text>
                <View style={styles.dots}>
                  <View style={[styles.dot, { backgroundColor: previewBg }]} />
                  <View style={[styles.dot, { backgroundColor: previewPrimary }]} />
                </View>
              </View>
              <Text
                style={[styles.label, { color: active ? colors.primary : colors.text }]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xs
  },

  title: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },

  card: {
    width: '30%',
    padding: SPACING.sm,
    borderRadius: RADII.md,
    justifyContent: 'space-between',
    minHeight: 65
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },

  emoji: {
    fontSize: 18
  },

  dots: {
    flexDirection: 'row',
    gap: 3
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)'
  },

  label: {
    fontSize: TYPOGRAPHY.xs - 1,
    fontWeight: TYPOGRAPHY.bold,
    marginTop: 2
  }
});
