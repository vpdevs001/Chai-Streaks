import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SPACING, RADII, TYPOGRAPHY } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors, THEME_REGISTRY, LIGHT_THEMES, DARK_THEMES, type ThemeName } from '../../theme';
import type { AppTheme } from '../../db/preferences';

/** Miniature "app screen" preview rendered with the theme's own palette. */
function PalettePreview({ name }: { name: ThemeName }) {
  const t = Colors[name];
  return (
    <View style={[styles.preview, { backgroundColor: t.background, borderColor: t.border }]}>
      {/* mini app bar */}
      <View style={styles.previewTopRow}>
        <View style={[styles.previewDot, { backgroundColor: t.primary }]} />
        <View style={[styles.previewPill, { backgroundColor: t.border }]} />
      </View>
      {/* mini card */}
      <View style={[styles.previewCard, { backgroundColor: t.card, borderColor: t.borderSubtle }]}>
        <View style={[styles.previewLine, { backgroundColor: t.text, width: '62%' }]} />
        <View style={[styles.previewLine, { backgroundColor: t.textMuted, width: '42%' }]} />
        <View style={[styles.previewBarTrack, { backgroundColor: t.borderSubtle }]}>
          <View style={[styles.previewBarFill, { backgroundColor: t.primary }]} />
        </View>
      </View>
    </View>
  );
}

/** Split light/dark preview for the 'system' option. */
function SystemPreview() {
  const l = Colors.light;
  const d = Colors.dark;
  return (
    <View style={[styles.preview, styles.previewSplit, { borderColor: l.border }]}>
      <View style={[styles.previewHalf, { backgroundColor: l.background }]}>
        <View style={[styles.previewDot, { backgroundColor: l.primary }]} />
      </View>
      <View style={[styles.previewHalf, { backgroundColor: d.background }]}>
        <View style={[styles.previewDot, { backgroundColor: d.primary }]} />
      </View>
    </View>
  );
}

function ThemeCard({ value, wide = false }: { value: AppTheme; wide?: boolean }) {
  const { colors, preference, setPreference } = useTheme();
  const meta = THEME_REGISTRY[value];
  const active = preference === value;

  const handlePress = () => {
    if (!active) {
      Haptics.selectionAsync();
    }
    setPreference(value);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        wide && styles.cardWide,
        {
          backgroundColor: colors.card,
          borderColor: active ? colors.primary : colors.border,
          borderWidth: active ? 2 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }]
        }
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${meta.label} theme`}
      accessibilityState={{ selected: active }}
    >
      {value === 'system' ? <SystemPreview /> : <PalettePreview name={value as ThemeName} />}

      <View style={styles.cardFooter}>
        <Text style={styles.cardEmoji}>{meta.emoji}</Text>
        <Text
          style={[styles.cardLabel, { color: active ? colors.primary : colors.text }]}
          numberOfLines={1}
        >
          {meta.label}
        </Text>
        {active && (
          <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.checkBadgeText}>✓</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function ThemePicker() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>MATCH SYSTEM</Text>
      <ThemeCard value="system" wide />

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>LIGHT THEMES</Text>
      <View style={styles.grid}>
        {LIGHT_THEMES.map((name) => (
          <ThemeCard key={name} value={name} />
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DARK THEMES</Text>
      <View style={styles.grid}>
        {DARK_THEMES.map((name) => (
          <ThemeCard key={name} value={name} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.xs
  },

  sectionLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    marginLeft: 2
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm
  },

  card: {
    width: '31%',
    flexGrow: 1,
    borderRadius: RADII.lg,
    padding: SPACING.sm,
    gap: SPACING.sm
  },

  cardWide: {
    width: '100%'
  },

  // ── preview ────────────────────────────────────────────────────────────────
  preview: {
    height: 56,
    borderRadius: RADII.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    padding: 6,
    gap: 5,
    flexDirection: 'column'
  },

  previewSplit: {
    flexDirection: 'row',
    padding: 0,
    gap: 0
  },

  previewHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },

  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },

  previewPill: {
    height: 4,
    width: 22,
    borderRadius: 2
  },

  previewCard: {
    flex: 1,
    borderRadius: RADII.sm,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 5,
    gap: 3,
    justifyContent: 'center'
  },

  previewLine: {
    height: 3,
    borderRadius: 1.5
  },

  previewBarTrack: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
    overflow: 'hidden'
  },

  previewBarFill: {
    height: '100%',
    width: '55%',
    borderRadius: 1.5
  },

  // ── footer ─────────────────────────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },

  cardEmoji: {
    fontSize: 14
  },

  cardLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold
  },

  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },

  checkBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.heavy,
    lineHeight: 12
  }
});
